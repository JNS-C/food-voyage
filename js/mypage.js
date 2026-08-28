/**
 * js/mypage.js — mypage.html 전용 컨트롤러.
 *
 * js/login.js와 같은 성격이다. IIFE이고 아무것도 내보내지 않는다.
 * js/saved-places.js처럼 다른 파일이 이걸 불러 쓸 일이 없어서 window.FvMypage
 * 같은 걸 만들지 않는다.
 *
 * 마크업 계약 (mypage.html이 소유한다. ID만 고정이고 클래스는 자유다):
 *   #state-nokey · #state-loading · #state-error · #state-empty
 *   #result-grid
 *   #tpl-saved-card 의 [data-field] · [data-remove]
 *   #toast
 */
(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);

  /** js/saved-places.js의 TABLE과 같은 값이다. 스키마가 바뀌면 둘 다 본다. */
  const TABLE = 'saved_places';

  /* ── 토스트 ─────────────────────────────────────────── */

  /**
   * login.html의 #toast 계약과 같다 — textContent + data-visible + 3초.
   * 코드는 공유하지 않는다는 이 저장소의 관례를 따라 다시 짠다.
   */
  let toastTimer = null;
  function toast(message) {
    const node = byId('toast');
    if (!node) return;
    node.textContent = message;
    node.dataset.visible = 'true';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      node.dataset.visible = 'false';
    }, 3000);
  }

  /* ── 상태 블록 ──────────────────────────────────────── */

  const STATE_IDS = ['state-loading', 'state-error', 'state-empty'];

  /**
   * @param {string|null} name 'loading'|'error'|'empty' 중 하나. null이면
   *   전부 숨긴다(=목록 표시). 호출부는 접두사 없는 짧은 이름을 쓰고,
   *   여기서 'state-' + name으로 실제 ID와 맞춘다.
   */
  function setState(name) {
    STATE_IDS.forEach((id) => {
      const node = byId(id);
      if (node) node.hidden = id !== 'state-' + name;
    });
  }

  /* ── 날짜 포맷 ──────────────────────────────────────── */

  /**
   * script.js의 formatDate를 재사용하지 않는다. 그건 'YYYY-MM-DD'를 전제로
   * '-'로 쪼개는데, created_at은 '2026-08-24T06:50:05.106443+00:00' 같은
   * 전체 타임스탬프라 그대로 넣으면 day 자리에 시간이 섞여 NaN이 난다
   * (오프셋 안에도 '-'가 있다). script.js 자체도 이 페이지에 못 얹는다 —
   * top-level 선언이 다른 파일과 충돌할 수 있는 이 저장소의 관례 때문이다.
   *
   * 연도를 쓰지 않는다. 두 가지 이유가 겹친다.
   *   ① 표기 규약. script.js:24의 formatDate가 '8월 12일'이고 랜딩 항해일지가
   *      그 모양으로 나간다. 이 페이지만 '2026년'을 달면 같은 서비스에서 날짜가
   *      두 모양으로 보인다.
   *   ② 레이아웃. '2026년 '이 약 55px을 먹는데, 390px 뷰포트에서 메타 줄의
   *      가용폭은 176px뿐이다. 연도를 달면 222px이 되어 넘치고, 넘친 만큼이
   *      옆의 담기 취소(✕) 버튼 위로 흘러 탭을 가로챈다 — 카카오맵을 누르려던
   *      손가락이 삭제를 누른다. 실측 겹침 10~34px.
   */
  function formatSavedDate(iso) {
    const [, m, d] = (iso || '').slice(0, 10).split('-');
    return d ? `${Number(m)}월 ${Number(d)}일` : '';
  }

  /* ── 렌더 ───────────────────────────────────────────── */

  /**
   * search.js의 실제 관례를 그대로 따른다: 프래그먼트 전체를 복제하고
   * querySelector로 카드 루트를 찾은 뒤 프래그먼트째 append한다.
   */
  function renderRow(row, index) {
    const fragment = byId('tpl-saved-card').content.cloneNode(true);
    const card = fragment.querySelector('[data-card]');
    card.dataset.placeId = row.place_id;

    // 색면 3단계 순환 + 첫 글자 — 검색 결과 행과 같은 문법이다.
    const thumb = fragment.querySelector('[data-field="thumb"]');
    if (thumb) thumb.setAttribute('data-tone', String(index % 3));
    const initial = fragment.querySelector('[data-field="initial"]');
    if (initial) initial.textContent = Array.from(String(row.place_name || '').trim())[0] || '';

    fragment.querySelector('[data-field="name"]').textContent = row.place_name;
    fragment.querySelector('[data-field="address"]').textContent = row.address || '';
    fragment.querySelector('[data-field="category"]').textContent = row.category || '';
    fragment.querySelector('[data-field="date"]').textContent = formatSavedDate(row.created_at);

    // 검색 결과와 같은 카카오맵으로 통일했다(8/24). place_id가 카카오 장소
    // ID라서 place.map.kakao.com/{id}가 정확히 그 가게 페이지로 간다 —
    // 이름+주소 텍스트 검색(옛 구글맵 방식)처럼 엉뚱한 곳에 떨어질 일이 없다.
    // 단, 더미 시딩의 seed- 접두사 id는 카카오에 없는 가게라 링크를 걷는다.
    const maps = fragment.querySelector('[data-field="maps"]');
    const id = String(row.place_id || '');
    if (id && !id.startsWith('seed-')) {
      maps.href = 'https://place.map.kakao.com/' + encodeURIComponent(id);
      maps.setAttribute('aria-label', row.place_name + ' 카카오맵에서 보기');
    } else {
      maps.hidden = true;
    }
    return fragment;
  }

  function maybeShowEmpty() {
    const grid = byId('result-grid');
    if (grid && grid.children.length === 0) setState('empty');
  }

  /* ── 목록 조회 ──────────────────────────────────────── */

  /**
   * 의도적으로 user_id 필터를 걸지 않는다. RLS(saved_places_select_own)가
   * auth.uid()로 이미 행을 가른다. saved-places.js의 refresh()는 "가독성을
   * 위한 중복"으로 .eq('user_id', uid)를 남겨 두지만, 이 페이지는 그 관례를
   * 의도적으로 따르지 않는다 — 조건 없이 물어봐도 본인 것만 온다는 걸
   * 그대로 보여주는 쪽을 택했다.
   */
  async function load() {
    setState('loading');
    const sb = window.FvAuth.db;

    const { data, error } = await sb
      .from(TABLE)
      .select('place_id, place_name, category, address, neighborhood, lat, lng, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[mypage]', error.message);
      setState('error');
      return;
    }

    const grid = byId('result-grid');
    grid.textContent = '';
    (data || []).forEach((row, index) => grid.appendChild(renderRow(row, index)));

    setState(data && data.length ? null : 'empty');
  }

  /* ── 삭제 ───────────────────────────────────────────── */

  function mountGrid() {
    const grid = byId('result-grid');
    if (!grid) return;

    grid.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-remove]');
      if (!btn || !grid.contains(btn)) return;
      const card = btn.closest('[data-place-id]');
      if (card) removeRow(card);
    });
  }

  async function removeRow(card) {
    const sb = window.FvAuth.db;
    const session = window.FvAuth.getSession();
    if (!sb || !session) return;

    const id = card.dataset.placeId;
    const name = card.querySelector('[data-field="name"]');
    const label = name ? name.textContent.trim() : '';

    // 사라질 카드에 포커스가 있으면 갈 곳을 먼저 정한다. 그냥 remove()하면
    // 브라우저가 포커스를 body로 떨어뜨리고 되돌려주지 않아서, 키보드로 두 개를
    // 지우려면 매번 목록 처음부터 Tab을 다시 해야 했다.
    const hadFocus = card.contains(document.activeElement);
    const nextFocus = hadFocus
      ? card.nextElementSibling || card.previousElementSibling || byId('state-empty')
      : null;

    // 낙관적으로 먼저 지운다 — saved-places.js의 toggle()과 같은 태도다.
    card.remove();
    maybeShowEmpty();

    if (nextFocus) {
      const target = nextFocus.querySelector('[data-remove]') || nextFocus;
      // state-empty처럼 원래 포커스를 안 받는 요소로 옮길 때가 있다.
      if (!target.hasAttribute('tabindex') && !target.matches('a, button, input, select, textarea')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus();
    }

    // 성공에도 알린다. 카드가 소리 없이 사라지면 스크린리더 사용자는 눌린 건지
    // 아닌지 알 방법이 없다 — 검색 쪽 담기와 달리 여기는 버튼 문구가 남지 않는다.
    toast(label ? `${label}을(를) 담기 취소했습니다.` : '담기를 취소했습니다.');

    const { error } = await sb
      .from(TABLE)
      .delete()
      .eq('user_id', session.user.id)
      .eq('place_id', id);

    if (error) {
      // 카드를 그대로 되붙이지 않는다 — 삭제는 카드가 통째로 사라지는 동작이라
      // 정확한 자리에 되꽂는 것보다 목록을 다시 읽는 편이 간단하고 안전하다.
      console.warn('[mypage]', error.message);
      toast('삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      await load();
    }
  }

  /* ── 초기화 ─────────────────────────────────────────── */

  async function init() {
    const nokey = byId('state-nokey');
    if (!window.FvAuth || !window.FvAuth.isConfigured()) {
      if (nokey) nokey.hidden = false;
      return;
    }
    if (nokey) nokey.hidden = true;

    await window.FvAuth.ready();
    if (!window.FvAuth.getSession()) {
      location.replace('login.html?next=' + encodeURIComponent('mypage.html'));
      return;
    }

    mountGrid();

    // ready() 이후에 구독한다. onChange는 이미 해결된 상태면 구독 즉시 1회
    // 부르므로, 위의 첫 리다이렉트 판단과 중복 호출되지 않게 순서를 지킨다.
    window.FvAuth.onChange((snap) => {
      if (!snap.session) {
        location.replace('login.html?next=' + encodeURIComponent('mypage.html'));
      }
    });

    await load();
  }

  /**
   * init()이 던지면 화면이 state-loading에 그대로 멈춘다 — 사용자에게는 영원한
   * 로딩으로 보이고 다시 시도할 통로도 없다. 실패는 state-error로 떨어뜨린다.
   */
  function start() {
    Promise.resolve()
      .then(init)
      .catch((error) => {
        console.error('[mypage]', error);
        setState('error');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
