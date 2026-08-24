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
   */
  function formatSavedDate(iso) {
    const [y, m, d] = (iso || '').slice(0, 10).split('-');
    return d ? `${Number(y)}년 ${Number(m)}월 ${Number(d)}일` : '';
  }

  /* ── 렌더 ───────────────────────────────────────────── */

  /**
   * search.js의 실제 관례를 그대로 따른다: 프래그먼트 전체를 복제하고
   * querySelector로 카드 루트를 찾은 뒤 프래그먼트째 append한다.
   */
  function renderRow(row) {
    const fragment = byId('tpl-saved-card').content.cloneNode(true);
    const card = fragment.querySelector('[data-card]');
    card.dataset.placeId = row.place_id;

    fragment.querySelector('[data-field="name"]').textContent = row.place_name;
    fragment.querySelector('[data-field="address"]').textContent = row.address || '';
    fragment.querySelector('[data-field="category"]').textContent = row.category || '';
    fragment.querySelector('[data-field="date"]').textContent = formatSavedDate(row.created_at);

    // 좌표만 넘기면 Google Maps가 이름 없는 핀 하나만 찍는다. 가게 이름 +
    // 주소를 텍스트로 넘기면 검색창에 직접 친 것처럼 실제 장소 정보 카드
    // (이름·사진·리뷰)로 연결된다. place_id로 정확히 짚는 방법(query_place_id)도
    // 있지만 그건 Google Place ID가 필요한데 우리가 가진 건 카카오 ID뿐이라
    // 별도 API 연동이 필요해진다 — 오늘 범위 밖이다.
    const maps = fragment.querySelector('[data-field="maps"]');
    const mapsQuery = [row.place_name, row.address].filter(Boolean).join(' ');
    if (mapsQuery) {
      maps.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mapsQuery);
    } else {
      // place_name은 NOT NULL이라 사실상 항상 참이지만, 방어적으로 남겨 둔다.
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
    const sb = window.FvAuth._client;

    const { data, error } = await sb
      .from('saved_places')
      .select('place_id, place_name, category, address, neighborhood, lat, lng, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[mypage]', error.message);
      setState('error');
      return;
    }

    const grid = byId('result-grid');
    grid.textContent = '';
    (data || []).forEach((row) => grid.appendChild(renderRow(row)));

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
      if (card) removeRow(card, btn);
    });
  }

  async function removeRow(card, btn) {
    const sb = window.FvAuth._client;
    const session = window.FvAuth.getSession();
    if (!sb || !session) return;

    const id = card.dataset.placeId;
    btn.disabled = true;
    // 낙관적으로 먼저 지운다 — saved-places.js의 toggle()과 같은 태도다.
    card.remove();
    maybeShowEmpty();

    const { error } = await sb
      .from('saved_places')
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
