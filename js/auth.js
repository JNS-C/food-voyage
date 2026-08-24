/**
 * js/auth.js — Supabase 인증. 세 페이지가 공유한다.
 *
 * 규율은 js/kakao-places.js · js/region-combobox.js와 같다.
 * IIFE 안에 전부 가두고 window.FvAuth 하나만 내보낸다. top-level에 let/const를
 * 만들지 않는다 — script.js와 js/search.js가 같은 이름을 top-level에 두고 있어서
 * (js/search.js 머리말) 한 페이지에 같이 오르면 SyntaxError가 난다.
 *
 * 이 파일은 화면을 그리지 않는다. 딱 두 가지 예외가 헤더의 로그인 슬롯과
 * 히어로의 #start-btn인데, 둘 다 페이지마다 똑같이 있는 계약이라 여기서 맡는다.
 * 로그인 페이지의 폼은 js/login.js가 갖는다.
 *
 * 에러는 던지지 않는다. 항상 {ok, error}를 돌려주고 error는 한국어 문장이다.
 * 호출부가 try/catch 없이 화면에 그대로 뿌릴 수 있어야 한다.
 */
(() => {
  'use strict';

  /* ── 상수 ───────────────────────────────────────────── */

  /**
   * region-combobox.js의 'fv.recent-regions.v1'과 같은 규칙이다.
   * supabase-js 기본값(sb-<ref>-auth-token)을 쓰지 않는 이유는, 저장소를 열었을 때
   * 이 앱이 쓴 것들이 한 접두사로 모여 보이게 하려는 것뿐이다.
   */
  const STORAGE_KEY = 'fv.auth.v1';

  const NO_CONFIG = 'Supabase 설정이 없습니다. config.js를 확인해 주세요.';

  /** 일지 작성은 8/25다. 그날 이 상수를 지우고 실제 이동으로 바꾼다. */
  const WRITE_TOAST = '일지 작성은 8월 25일에 열립니다';

  /* ── 상태 ───────────────────────────────────────────── */

  let sb = null;
  let readyPromise = null;
  const listeners = new Set();
  const state = { session: null, profile: null, resolved: false };

  /* ── 설정 ───────────────────────────────────────────── */

  function readUrl() {
    return typeof window.SUPABASE_URL === 'string' ? window.SUPABASE_URL.trim() : '';
  }

  function readAnonKey() {
    return typeof window.SUPABASE_ANON_KEY === 'string' ? window.SUPABASE_ANON_KEY.trim() : '';
  }

  /**
   * 키가 없는 것도, SDK가 안 실린 것도 "아직 설정 전"으로 같이 다룬다.
   * kakao-places.js의 #state-nokey와 같은 태도다 — 예외를 던지지 않고,
   * 원인을 화면에서 읽을 수 있게 login.js가 안내 블록을 띄운다.
   */
  function isConfigured() {
    if (window.__configMissing || window.__supabaseSdkMissing) return false;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return false;
    return Boolean(readUrl() && readAnonKey());
  }

  /**
   * UMD 빌드는 window.supabase를 만든다. 여기서 받는 클라이언트를 절대
   * supabase라는 이름에 담지 않는다 — 전역을 가려서 다음 호출이 죽는다.
   */
  function client() {
    if (sb) return sb;
    if (!isConfigured()) return null;

    sb = window.supabase.createClient(readUrl(), readAnonKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // 인증 메일의 링크는 #access_token=... 을 달고 돌아온다. 끄면 그 세션을
        // 주워 담지 못해 인증을 마쳐도 로그아웃 상태로 보인다.
        // Confirm email이 꺼져 있어도 켜 두는 게 안전하다 — URL에 토큰이 없으면
        // 아무 일도 하지 않는다. 나중에 붙일 구글 OAuth도 이 플래그를 쓴다.
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY,
      },
    });
    return sb;
  }

  /* ── 구독 ───────────────────────────────────────────── */

  function snapshot() {
    return { session: state.session, profile: state.profile };
  }

  function emit() {
    const snap = snapshot();
    listeners.forEach((cb) => {
      try {
        cb(snap);
      } catch (err) {
        // 구독자 하나가 죽어도 나머지는 갱신되어야 한다.
        console.warn('[auth] 구독자에서 예외가 났습니다.', err);
      }
    });
  }

  function userId(session) {
    return session && session.user ? session.user.id : null;
  }

  /* ── 프로필 ─────────────────────────────────────────── */

  function fallbackNickname(user) {
    const email = (user && user.email) || '';
    const local = email.split('@')[0] || '항해자';
    return local.slice(0, 20);
  }

  /**
   * 세션은 있는데 profiles 행이 없을 때 user_metadata로 다시 만든다.
   *
   * 트리거(handle_new_user)를 두지 않은 대가로 여기가 복구 지점이다. 트리거가
   * 실패하면 Supabase는 'Database error saving new user' 한 줄만 주고 가입 자체를
   * 막지만, 이 경로는 실패해도 로그인은 살아 있고 원인이 콘솔에 남는다.
   */
  async function ensureProfile(user, fields) {
    const c = client();
    if (!c || !user) return null;

    const meta = user.user_metadata || {};
    const row = {
      id: user.id,
      nickname: (fields && fields.nickname) || meta.nickname || fallbackNickname(user),
      home_area: (fields && fields.home_area) || meta.home_area || null,
    };

    const { data, error } = await c
      .from('profiles')
      .upsert(row, { onConflict: 'id' })
      .select('id, nickname, home_area')
      .maybeSingle();

    if (error) {
      console.warn('[auth] 프로필을 만들지 못했습니다.', error.message);
      return null;
    }
    return data;
  }

  async function loadProfile(session) {
    const c = client();
    if (!c || !session) return null;

    const { data, error } = await c
      .from('profiles')
      .select('id, nickname, home_area')
      .eq('id', session.user.id)
      .maybeSingle();

    if (error) {
      console.warn('[auth] 프로필을 읽지 못했습니다.', error.message);
      return null;
    }
    if (data) return data;

    // 행이 없다. 가입 직후 insert가 끊겼거나, 나중에 붙일 소셜 로그인으로 들어온
    // 첫 방문이다. 둘 다 메타데이터로 복구된다.
    return ensureProfile(session.user, null);
  }

  /* ── 초기화 ─────────────────────────────────────────── */

  /**
   * 세션 복원은 비동기다. 그동안 헤더는 아무것도 그리지 않는다 —
   * 틀린 상태를 잠깐 보여주는 게 빈칸보다 나쁘다.
   */
  function ready() {
    if (readyPromise) return readyPromise;

    readyPromise = (async () => {
      const c = client();
      if (!c) {
        state.resolved = true;
        emit();
        return;
      }

      const { data } = await c.auth.getSession();
      state.session = (data && data.session) || null;
      state.profile = await loadProfile(state.session);
      state.resolved = true;
      emit();

      c.auth.onAuthStateChange(async (event, session) => {
        const next = session || null;
        const changedUser = userId(state.session) !== userId(next);
        state.session = next;
        // TOKEN_REFRESHED는 같은 사람이다. 프로필을 다시 읽을 이유가 없다.
        if (changedUser) state.profile = await loadProfile(next);
        emit();
      });
    })();

    return readyPromise;
  }

  /* ── 에러 문구 ──────────────────────────────────────── */

  /**
   * 영어 원문이 화면에 새어나오면 안 된다. 아는 것만 바꾸고 나머지는
   * 기본 문장으로 떨어뜨린다. 원문은 콘솔에 남겨 디버깅 경로를 끊지 않는다.
   */
  function toKorean(error) {
    const raw = (error && error.message) || '';
    if (raw) console.warn('[auth]', raw);

    const has = (needle) => raw.toLowerCase().includes(needle.toLowerCase());

    if (has('Invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않습니다.';
    if (has('already registered') || has('already been registered')) return '이미 가입된 이메일입니다.';
    // 숫자를 박아 두지 않는다. Supabase가 'Password should be at least 8 characters'
    // 처럼 실제 설정값을 담아 주므로 그걸 읽는다 — 대시보드에서 길이를 바꿔도
    // 문구가 저절로 따라간다. (login.html의 minlength는 따로 맞춰야 한다.)
    if (has('Password should be at least')) {
      const n = (raw.match(/(\d+)/) || [])[1];
      return '비밀번호는 ' + (n || 8) + '자 이상이어야 합니다.';
    }
    // 문자 종류 요구(숫자·대소문자·기호)를 켠 경우.
    if (has('Password should contain')) {
      return '비밀번호에 영문 대소문자·숫자·기호를 섞어 주세요.';
    }
    if (has('Unable to validate email') || has('invalid format')) return '이메일 형식을 확인해 주세요.';
    if (has('Email not confirmed')) return '아직 이메일 인증이 끝나지 않았습니다. 메일함의 링크를 눌러 주세요.';
    if (has('For security purposes') || has('rate limit') || has('Too many')) return '잠시 후 다시 시도해 주세요.';
    if (has('Database error saving new user')) return '프로필 생성에 실패했습니다. profiles 테이블과 RLS 정책을 확인해 주세요.';
    if (has('Failed to fetch') || has('NetworkError') || has('network')) return '네트워크 연결을 확인해 주세요.';

    return '잠시 후 다시 시도해 주세요.';
  }

  /* ── 동작 ───────────────────────────────────────────── */

  async function signUp(input) {
    const { email, password, nickname, homeArea } = input || {};
    const c = client();
    if (!c) return { ok: false, error: NO_CONFIG };

    const { data, error } = await c.auth.signUp({
      email,
      password,
      options: {
        // 메타데이터는 profiles 행의 원본이다. 행이 없으면 여기서 복구한다.
        data: { nickname: nickname || null, home_area: homeArea || null },
        // 인증 링크를 눌렀을 때 돌아올 자리. location.origin이라 localhost와
        // 배포 URL이 자동으로 갈린다. 단, 두 주소 모두 Supabase 대시보드의
        // Authentication > URL Configuration > Redirect URLs에 등록되어 있어야
        // 한다. 없으면 Site URL로 떨어진다.
        emailRedirectTo: location.origin + '/login.html?confirmed=1',
      },
    });
    if (error) return { ok: false, error: toKorean(error) };

    // Confirm email이 켜져 있으면 세션 없이 돌아온다. 에러가 아니라 정상 경로다.
    //
    // 프로필은 지금 만들 수 없다 — auth.uid()가 없어서 profiles_insert_own을
    // 통과하지 못한다. 대신 nickname·home_area가 options.data로 user_metadata에
    // 실려 있으므로, 인증을 마치고 처음 들어올 때 ensureProfile()이 그걸로 행을
    // 만든다. 트리거를 두지 않아도 되는 이유가 여기서도 그대로 유지된다.
    //
    // 이미 가입된 이메일이어도 Supabase는 같은 모양으로 응답한다(identities가 빈
    // 배열이다). 그걸 구분해서 알려주지 않는다 — 가입 여부를 캐낼 수 있게 된다.
    if (!data.session) {
      return { ok: true, needsConfirmation: true, email };
    }

    state.session = data.session;
    state.profile = await ensureProfile(data.user, {
      nickname: nickname || null,
      home_area: homeArea || null,
    });
    state.resolved = true;
    emit();
    return { ok: true };
  }

  /**
   * 인증 메일 재발송. 기본 SMTP는 시간당 2통 제한이라 여기서 rate limit을
   * 자주 만난다 — toKorean이 "잠시 후 다시 시도해 주세요."로 받아낸다.
   */
  async function resendConfirmation(email) {
    const c = client();
    if (!c) return { ok: false, error: NO_CONFIG };
    if (!email) return { ok: false, error: '이메일을 입력해 주세요.' };

    const { error } = await c.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: location.origin + '/login.html?confirmed=1' },
    });
    if (error) return { ok: false, error: toKorean(error) };
    return { ok: true };
  }

  async function signIn(input) {
    const { email, password } = input || {};
    const c = client();
    if (!c) return { ok: false, error: NO_CONFIG };

    const { data, error } = await c.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: toKorean(error) };

    state.session = data.session || null;
    state.profile = await loadProfile(state.session);
    state.resolved = true;
    emit();
    return { ok: true };
  }

  async function signOut() {
    const c = client();
    if (!c) return { ok: false, error: NO_CONFIG };

    const { error } = await c.auth.signOut();
    if (error) return { ok: false, error: toKorean(error) };

    state.session = null;
    state.profile = null;
    emit();
    return { ok: true };
  }

  /* ── 헤더 · 히어로 ──────────────────────────────────── */

  /**
   * 노드를 캐시하지 않는다. design이 마크업을 동시에 편집하는 중일 수 있고,
   * 갈리는 순간에도 이 파일이 죽으면 안 된다 (region-combobox.js와 같은 규율).
   *
   * 클래스를 새로 만들지 않는다. Tailwind가 Play CDN이라 마크업에 없던 클래스를
   * JS로 붙이면 조용히 스타일이 빠질 수 있다. 상태는 hidden 속성과 textContent로만
   * 표현한다 — styles.css의 [hidden]{display:none!important}가 유틸리티를 이긴다.
   */
  function renderNav(snap) {
    const link = document.getElementById('auth-link');
    const name = document.getElementById('auth-name');
    const out = document.getElementById('auth-signout');
    if (!link && !name && !out) return;

    const signedIn = Boolean(snap.session);
    const nickname = (snap.profile && snap.profile.nickname) || '';

    if (link) link.hidden = signedIn;
    if (name) {
      name.textContent = signedIn && nickname ? nickname + '님' : '';
      name.hidden = !(signedIn && nickname);
    }
    if (out) out.hidden = !signedIn;
  }

  /**
   * 히어로의 #start-btn은 <a href="login.html">이다. JS가 죽어도 로그인 진입로가
   * 살아 있어야 해서 링크로 둔다 (script.js가 히어로 폼에 대해 지키는 규율과 같다).
   * 로그인한 사람에게만 클릭을 가로챈다.
   */
  function renderStart(snap) {
    const start = document.getElementById('start-btn');
    if (!start) return;

    const signedIn = Boolean(snap.session);
    start.textContent = signedIn ? '항해 이어가기' : '항해 시작하기';
    start.dataset.authAction = signedIn ? 'write' : 'login';
  }

  function bindOnce(node, handler) {
    if (!node || node.dataset.authBound === 'true') return;
    node.dataset.authBound = 'true';
    node.addEventListener('click', handler);
  }

  function toast(message) {
    // showToast는 script.js의 top-level 함수 선언이라 window에 올라온다.
    // 그 파일이 없는 페이지에서는 조용히 넘어간다.
    if (typeof window.showToast === 'function') window.showToast(message);
  }

  function mountNav() {
    bindOnce(document.getElementById('auth-signout'), async (event) => {
      const btn = event.currentTarget;
      btn.disabled = true;
      const result = await signOut();
      btn.disabled = false;
      if (!result.ok) toast(result.error);
    });

    bindOnce(document.getElementById('start-btn'), (event) => {
      // 로그아웃 상태면 평범한 링크다. 가로채지 않는다.
      if (event.currentTarget.dataset.authAction !== 'write') return;
      event.preventDefault();
      toast(WRITE_TOAST);
    });

    onChange((snap) => {
      renderNav(snap);
      renderStart(snap);
    });
  }

  /* ── 공개 API ───────────────────────────────────────── */

  function onChange(cb) {
    if (typeof cb !== 'function') return () => {};
    listeners.add(cb);
    if (state.resolved) cb(snapshot());
    else ready();
    return () => listeners.delete(cb);
  }

  window.FvAuth = {
    isConfigured,
    ready,
    onChange,
    mountNav,
    getSession: () => state.session,
    getProfile: () => state.profile,
    signUp,
    signIn,
    signOut,
    resendConfirmation,

    // 내부용. RLS 검증(콘솔에서 직접 쿼리)과 8/25 데이터 작업에서 쓴다.
    get _client() {
      return client();
    },
  };

  /* ── 자동 마운트 ────────────────────────────────────── */

  // 헤더 슬롯은 페이지마다 똑같이 있는 계약이다. 페이지가 따로 호출하게 하지 않고
  // 여기서 알아서 붙인다. 마크업이 없는 페이지에서는 renderNav가 조용히 반환한다.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountNav, { once: true });
  } else {
    mountNav();
  }
})();
