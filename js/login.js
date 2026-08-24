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
 */
(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);

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
      submit.disabled = true;
      submit.textContent = signup ? '가입하는 중…' : '로그인하는 중…';
    }

    const result = signup
      ? await window.FvAuth.signUp({ email, password, nickname, homeArea })
      : await window.FvAuth.signIn({ email, password });

    pending = false;
    if (submit) submit.disabled = false;

    if (!result.ok) {
      // setMode가 버튼 문구를 원래대로 돌려놓는다.
      setMode(signup ? 'signup' : 'signin');
      showError(result.error);
      return;
    }

    showToast(signup ? '가입이 끝났습니다' : '로그인되었습니다');
    // replace를 쓴다. 뒤로 가기로 로그인 폼에 되돌아오면 이상하다.
    setTimeout(() => location.replace('index.html'), 400);
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

    // ?mode=signup 으로 들어오면 회원가입으로 연다. 히어로의 #start-btn이나
    // 나중에 붙일 안내 링크가 이 파라미터를 쓸 수 있다.
    const wanted = new URLSearchParams(location.search).get('mode');
    setMode(wanted === 'signup' ? 'signup' : 'signin');

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
