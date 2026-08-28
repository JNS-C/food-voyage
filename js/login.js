/**
 * js/login.js — login.html 전용 컨트롤러.
 *
 * js/search.js와 같은 성격이다. IIFE이고 아무것도 내보내지 않는다.
 * 인증 자체는 window.FvAuth(js/auth.js)가 갖고, 이 파일은 폼과 화면만 다룬다.
 *
 * 마크업 계약 (login.html이 소유한다. ID만 고정이고 클래스는 자유다):
 *   #auth-card        data-mode="signin" | "signup"
 *   #auth-form        #auth-email · #auth-password · #auth-nickname · #region-input
 *   #auth-submit      #auth-error · #auth-current
 *   #auth-switch      로그인 <-> 회원가입 전환 버튼
 *   #auth-switch-hint 전환 버튼 앞의 안내 문구
 *   [data-signup-only] 회원가입에서만 보이는 블록들
 *   #state-nokey      Supabase 설정이 없을 때의 안내 (search.html과 같은 컴포넌트)
 *   #state-sent       인증 메일을 보낸 뒤의 안내 (#auth-sent-email · #auth-resend)
 */
(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);

  /**
   * 인증 링크가 실패했을 때 Supabase는 #error_description=... 을 달고 돌려보낸다.
   * supabase-js가 detectSessionInUrl로 해시를 지우기 전에 읽어 둔다 —
   * 이 파일은 js/auth.js 다음에 평가되지만 auth.js의 초기화는
   * DOMContentLoaded로 미뤄져 있어서 여기가 아직 먼저다.
   */
  const initialHash = location.hash || '';

  /* ── 토스트 ─────────────────────────────────────────── */

  /**
   * script.js · js/search.js와 같은 계약이다 — textContent + data-visible.
   * 세 번째 구현이지만 공유 유틸을 만들지 않는다. 이 저장소는 페이지 사이에서
   * DOM 계약만 공유하고 코드는 공유하지 않는다 (js/search.js 머리말).
   */
  let toastTimer = null;
  function showToast(message) {
    const toast = byId('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.dataset.visible = 'true';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.dataset.visible = 'false';
    }, 3000);
  }

  /* ── 에러 ───────────────────────────────────────────── */

  function showError(message) {
    const box = byId('auth-error');
    if (!box) return;
    box.textContent = message || '';
    box.hidden = !message;
  }

  /* ── 인증 메일 대기 ─────────────────────────────────── */

  // 재발송에 쓴다. 안내 화면에서는 입력칸이 이미 사라진 뒤다.
  let sentTo = '';

  function showSent(email) {
    sentTo = email;
    const card = byId('auth-card');
    const sent = byId('state-sent');
    const label = byId('auth-sent-email');
    if (label) label.textContent = email;
    if (card) card.hidden = true;
    if (sent) sent.hidden = false;
  }

  async function handleResend(event) {
    const btn = event.currentTarget;
    btn.disabled = true;
    const result = await window.FvAuth.resendConfirmation(sentTo);
    btn.disabled = false;
    // 기본 SMTP는 시간당 2통이라 여기서 rate limit을 자주 만난다.
    showToast(result.ok ? '인증 메일을 다시 보냈습니다' : result.error);
  }

  /* ── 로그인 후 돌아갈 자리 ──────────────────────────── */

  /**
   * ?next= 를 읽는다. 없거나 수상하면 홈으로 보낸다.
   *
   * 이 값은 URL에서 오므로 누구나 심을 수 있다. 절대 URL을 그대로 따라가면
   * 우리 로그인 화면을 거쳐 남의 사이트로 보내는 미끼가 된다(오픈 리다이렉트).
   * 그래서 화이트리스트가 아니라 모양을 강제한다 — 같은 폴더의 .html 하나와
   * 쿼리스트링까지만. '//evil.com'·'https://…'·'../'·'\\evil.com'이 전부 걸린다.
   */
  function nextTarget() {
    const raw = new URLSearchParams(location.search).get('next') || '';
    return /^[a-z0-9_-]+\.html(\?[^#]*)?$/i.test(raw) ? raw : 'index.html';
  }

  /* ── 모드 전환 ──────────────────────────────────────── */

  function currentMode() {
    const card = byId('auth-card');
    return card && card.dataset.mode === 'signup' ? 'signup' : 'signin';
  }

  function setMode(mode) {
    const card = byId('auth-card');
    if (!card) return;

    const signup = mode === 'signup';
    card.dataset.mode = signup ? 'signup' : 'signin';

    // display 유틸리티를 붙이지 않은 블록들이라 hidden 속성이 그대로 먹는다
    // (styles.css의 [hidden]{display:none!important}).
    document.querySelectorAll('[data-signup-only]').forEach((node) => {
      node.hidden = !signup;
    });

    const nickname = byId('auth-nickname');
    if (nickname) nickname.required = signup;

    const password = byId('auth-password');
    if (password) password.autocomplete = signup ? 'new-password' : 'current-password';

    const submit = byId('auth-submit');
    if (submit) submit.textContent = signup ? '가입하고 시작하기' : '로그인';

    const hint = byId('auth-switch-hint');
    if (hint) hint.textContent = signup ? '이미 계정이 있나요?' : '아직 계정이 없나요?';

    const shift = byId('auth-switch');
    if (shift) shift.textContent = signup ? '로그인' : '회원가입';

    const title = byId('auth-title');
    if (title) title.textContent = signup ? '항해 시작하기' : '로그인';

    showError('');
  }

  /* ── 제출 ───────────────────────────────────────────── */

  let pending = false;

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending) return;

    const email = (byId('auth-email').value || '').trim();
    const password = byId('auth-password').value || '';
    const signup = currentMode() === 'signup';
    const nicknameNode = byId('auth-nickname');
    const regionNode = byId('region-input');
    const nickname = signup && nicknameNode ? (nicknameNode.value || '').trim() : '';
    const homeArea = signup && regionNode ? (regionNode.value || '').trim() : '';

    if (signup && !nickname) {
      showError('닉네임을 입력해 주세요.');
      if (nicknameNode) nicknameNode.focus();
      return;
    }

    pending = true;
    showError('');
    const submit = byId('auth-submit');
    if (submit) {
      // disabled가 아니라 aria-disabled다. 포커스된 버튼이 disabled가 되면
      // 브라우저가 포커스를 body로 옮기고 되살려도 돌려주지 않는다 — 실패했을 때
      // #auth-error는 role="alert"로 낭독되지만, 정작 고쳐야 할 입력으로
      // 되돌아갈 방법이 없어진다. 이중 제출은 위의 pending 플래그가 막는다.
      submit.setAttribute('aria-disabled', 'true');
      submit.textContent = signup ? '가입하는 중…' : '로그인하는 중…';
    }

    const result = signup
      ? await window.FvAuth.signUp({ email, password, nickname, homeArea })
      : await window.FvAuth.signIn({ email, password });

    pending = false;
    if (submit) submit.removeAttribute('aria-disabled');

    if (!result.ok) {
      // setMode가 버튼 문구를 원래대로 돌려놓는다.
      setMode(signup ? 'signup' : 'signin');
      showError(result.error);
      return;
    }

    // Confirm email이 켜져 있으면 세션 없이 성공한다. 홈으로 보내면 안 된다 —
    // 아직 로그인 상태가 아니고, 사용자가 할 일이 남았다.
    if (result.needsConfirmation) {
      showSent(result.email || email);
      return;
    }

    showToast(signup ? '가입이 끝났습니다' : '로그인되었습니다');
    // replace를 쓴다. 뒤로 가기로 로그인 폼에 되돌아오면 이상하다.
    setTimeout(() => location.replace(nextTarget()), 400);
  }

  /* ── 지역 자동완성 ──────────────────────────────────── */

  /**
   * 검색 페이지가 쓰는 콤보박스를 그대로 재사용한다. 없으면 #region-input은
   * 평범한 텍스트 입력으로 남는다 — js/search.js가 같은 자리에서 하는 판단이다.
   */
  function mountRegion() {
    if (!window.RegionCombobox) {
      console.warn('[login] region-combobox.js가 없습니다. 지역 제안 없이 진행합니다.');
      return;
    }
    window.RegionCombobox.mount({
      inputId: 'region-input',
      panelId: 'region-panel',
      listboxId: 'region-listbox',
      statusId: 'region-status',
      templateId: 'tpl-region-option',
      onCommit: () => showError(''),
    });
  }

  /* ── 이미 로그인된 상태 ─────────────────────────────── */

  /**
   * 자동으로 홈에 돌려보내지 않는다. 발표에서 계정 A와 B를 갈아타야 하는데
   * 로그인 페이지가 튕겨내면 그 동선이 막힌다. 대신 지금 누구인지만 알려준다.
   */
  function renderCurrent(snap) {
    const note = byId('auth-current');
    if (!note) return;

    const nickname = (snap.profile && snap.profile.nickname) || '';
    if (!snap.session || !nickname) {
      note.textContent = '';
      note.hidden = true;
      return;
    }
    note.textContent = nickname + '님으로 로그인되어 있습니다. 다른 계정으로 로그인하면 전환됩니다.';
    note.hidden = false;
  }

  /* ── 인증 링크로 돌아왔을 때 ────────────────────────── */

  /**
   * supabase-js가 URL의 토큰을 세션으로 바꿔 놓았는지 보고 갈린다.
   * 링크가 만료됐거나 이미 쓴 링크면 세션 대신 #error_description이 온다.
   */
  async function handleConfirmReturn() {
    await window.FvAuth.ready();

    if (window.FvAuth.getSession()) {
      showToast('이메일 인증이 끝났습니다');
      setTimeout(() => location.replace(nextTarget()), 600);
      return;
    }

    const described = new URLSearchParams(initialHash.replace(/^#/, '')).get('error_description');
    if (described) console.warn('[login]', described);
    showError(
      described
        ? '인증 링크가 만료되었거나 이미 사용되었습니다. 다시 로그인해 주세요.'
        : '인증을 확인하지 못했습니다. 다시 로그인해 주세요.'
    );
  }

  /* ── 초기화 ─────────────────────────────────────────── */

  function init() {
    const form = byId('auth-form');
    const card = byId('auth-card');
    const nokey = byId('state-nokey');

    if (!window.FvAuth || !window.FvAuth.isConfigured()) {
      // 폼을 보여주고 눌리게 두면 "왜 안 되지"로 끝난다. 원인을 화면에 적는다.
      if (card) card.hidden = true;
      if (nokey) nokey.hidden = false;
      return;
    }
    if (nokey) nokey.hidden = true;

    const params = new URLSearchParams(location.search);

    // ?mode=signup 으로 들어오면 회원가입으로 연다. 히어로의 #start-btn이나
    // 나중에 붙일 안내 링크가 이 파라미터를 쓸 수 있다.
    setMode(params.get('mode') === 'signup' ? 'signup' : 'signin');

    const resend = byId('auth-resend');
    if (resend) resend.addEventListener('click', handleResend);

    // 인증 메일의 링크를 눌러 돌아온 자리다 (auth.js의 emailRedirectTo).
    if (params.has('confirmed')) handleConfirmReturn();

    if (form) form.addEventListener('submit', handleSubmit);

    const shift = byId('auth-switch');
    if (shift) {
      shift.addEventListener('click', () => {
        setMode(currentMode() === 'signup' ? 'signin' : 'signup');
        const email = byId('auth-email');
        if (email) email.focus();
      });
    }

    mountRegion();
    window.FvAuth.onChange(renderCurrent);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
