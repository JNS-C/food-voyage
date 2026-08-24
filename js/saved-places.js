/**
 * js/saved-places.js — 검색 결과의 "담기".
 *
 * 규율은 js/kakao-places.js · js/auth.js와 같다. IIFE 안에 전부 가두고
 * window.FvSaved 하나만 내보낸다. top-level에 let/const를 만들지 않는다 —
 * 같은 페이지에 오르는 js/search.js도 top-level 이름을 쓴다.
 *
 * js/search.js가 부르는 것은 두 개뿐이다.
 *   renderPlaces() 끝에서  FvSaved.remember(places)
 *   init()에서            FvSaved.mount({ gridId: 'result-grid' })
 * 이 파일이 없어도 검색은 그대로 동작한다. 그쪽이 존재를 확인하고 부른다.
 *
 * ⚠️ 카드 클릭 핸들러와 이 파일의 클릭 핸들러는 **같은 노드**(#result-grid)에
 *    붙는다. stopPropagation으로는 서로를 못 막는다. 그래서 js/search.js의
 *    cardFrom()이 [data-save]를 걸러내는 쪽으로 이미 해결되어 있다 —
 *    버튼의 data-save 속성 이름을 바꾸면 카드 토스트가 같이 뜬다.
 */
(() => {
  'use strict';

  /* ── 상수 ───────────────────────────────────────────── */

  const TABLE = 'saved_places';

  const LABEL_ON = '담김';
  const LABEL_OFF = '담기';

  const MSG_NEED_LOGIN = '로그인하면 담을 수 있어요';
  const MSG_FAIL_SAVE = '담지 못했습니다. 잠시 후 다시 시도해 주세요.';
  const MSG_FAIL_UNSAVE = '취소하지 못했습니다. 잠시 후 다시 시도해 주세요.';

  /** 토스트를 읽을 시간을 준 뒤 로그인 페이지로 보낸다. */
  const LOGIN_DELAY = 900;

  /* ── 상태 ───────────────────────────────────────────── */

  /**
   * place_id -> 정규화된 place.
   *
   * js/search.js는 렌더가 끝나면 place 객체를 전부 버린다. DOM에 남는 건
   * name·neighborhood·category뿐이라 x·y·address는 여기서만 얻을 수 있다.
   * remember()가 유일한 통로다.
   */
  let index = new Map();

  /**
   * 담긴 place_id들.
   *
   * 이건 사용자의 목록이지 화면의 상태가 아니다. 검색 결과가 0건이거나 에러여도
   * js/search.js는 renderPlaces([])를 부르는데, 그걸 "목록 비우기"로 읽으면 안 된다.
   */
  const saved = new Set();

  let uid = null;
  let gridId = null;
  let mounted = false;

  /* ── 토스트 ─────────────────────────────────────────── */

  /**
   * #toast 계약(textContent + data-visible + 3초)을 다시 구현한다.
   * js/search.js의 showSearchToast는 그쪽 IIFE 안에 갇혀 있어 부를 수 없다.
   * 이 저장소는 페이지 사이에서 DOM 계약만 공유하고 코드는 공유하지 않는다.
   *
   * 남는 한계: 두 모듈이 각자 3초 타이머를 돌리므로, 카드 토스트가 떠 있는 동안
   * 담기 토스트를 띄우면 먼저 걸린 타이머가 나중 것을 일찍 지운다. 성공에는
   * 토스트를 안 쓰기로 해서(버튼 문구가 이미 피드백이다) 겹칠 일이 거의 없다.
   */
  let toastTimer = null;
  function toast(message) {
    const node = document.getElementById('toast');
    if (!node) return;

    node.textContent = message;
    node.dataset.visible = 'true';

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      node.dataset.visible = 'false';
    }, 3000);
  }

  /* ── Supabase ───────────────────────────────────────── */

  /**
   * js/auth.js가 만든 클라이언트를 그대로 쓴다. 두 번째 클라이언트를 만들면
   * 세션이 갈린다. auth.js가 "8/25 데이터 작업에서 쓴다"고 적어 둔 자리다.
   */
  function client() {
    return window.FvAuth ? window.FvAuth._client : null;
  }

  /* ── 칠하기 ─────────────────────────────────────────── */

  function grid() {
    return gridId ? document.getElementById(gridId) : null;
  }

  /**
   * 노드를 캐시하지 않는다. 카드는 검색할 때마다 통째로 다시 만들어진다.
   *
   * 건드리는 것은 aria-pressed · textContent · aria-label 셋뿐이다
   * (search.html 주석의 계약). 클래스를 붙이지 않는다 — Tailwind가 Play CDN이라
   * 마크업에 없던 클래스는 조용히 스타일이 빠질 수 있다. 담김의 채움은
   * styles.css의 [data-save][aria-pressed="true"]가 갖는다.
   */
  function paintCard(card) {
    const btn = card.querySelector('[data-save]');
    if (!btn) return;

    const id = card.dataset.placeId;
    const place = index.get(id);
    const name = (place && place.name) || '';
    const on = saved.has(id);

    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? LABEL_ON : LABEL_OFF;

    // 카드 루트가 role="button"이라 안쪽 텍스트가 카드 이름으로 흡수된다.
    // 버튼에 이름을 직접 주지 않으면 "담기"가 어느 가게 것인지 사라진다.
    btn.setAttribute(
      'aria-label',
      on ? name + ' 담김. 다시 누르면 취소됩니다' : name + ' 담기'
    );
  }

  function paint() {
    const box = grid();
    if (!box) return;
    box.querySelectorAll('[data-place-id]').forEach(paintCard);
  }

  /* ── 담김 목록 읽기 ─────────────────────────────────── */

  /**
   * 지금 화면에 있는 가게들만 물어본다. 카카오가 한 번에 최대 15개를 주므로
   * in() 목록이 길어질 일이 없다.
   *
   * user_id 조건은 RLS가 이미 거르지만 그대로 둔다 — 쿼리만 봐도 의도가 읽힌다.
   */
  async function refresh() {
    const sb = client();
    const ids = [...index.keys()];

    if (!sb || !uid || ids.length === 0) {
      paint();
      return;
    }

    const { data, error } = await sb
      .from(TABLE)
      .select('place_id')
      .eq('user_id', uid)
      .in('place_id', ids);

    if (error) {
      // 담기를 못 읽는다고 검색 결과를 망치지 않는다. 버튼만 미담김으로 남는다.
      console.warn('[saved] 담김 목록을 읽지 못했습니다.', error.message);
      paint();
      return;
    }

    // 이번 화면의 id들만 갱신한다. 다른 검색에서 담아 둔 것은 건드리지 않는다.
    ids.forEach((id) => saved.delete(id));
    data.forEach((row) => saved.add(row.place_id));
    paint();
  }

  /* ── 담기 · 취소 ────────────────────────────────────── */

  function toRow(place) {
    // 카카오는 좌표를 문자열로 준다. x가 경도, y가 위도다.
    const lng = Number(place.x);
    const lat = Number(place.y);

    return {
      user_id: uid,
      place_id: place.id,
      place_name: place.name,
      category: place.category || null,
      address: place.address || null,
      neighborhood: place.neighborhood || null,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    };
  }

  async function toggle(card, btn) {
    const sb = client();
    const id = card.dataset.placeId;
    const place = index.get(id);
    if (!sb || !place) return;

    const wasOn = saved.has(id);

    // 낙관적으로 먼저 뒤집는다. 네트워크를 기다리는 동안 버튼이 죽어 보이면 안 된다.
    if (wasOn) saved.delete(id);
    else saved.add(id);
    paintCard(card);
    btn.disabled = true;

    // upsert를 쓰지 않는다. supabase-js의 upsert는 ON CONFLICT DO UPDATE로
    // 번역돼 UPDATE 권한을 요구하는데, 이 테이블에는 일부러 안 줬다 —
    // 고칠 값이 없어서다. 대신 중복(23505)을 성공으로 받아낸다. 더블클릭으로
    // 요청이 겹쳐도 결과는 "담김" 하나로 같다.
    const { error } = wasOn
      ? await sb.from(TABLE).delete().eq('user_id', uid).eq('place_id', id)
      : await sb.from(TABLE).insert(toRow(place));

    btn.disabled = false;

    if (error && error.code === '23505') {
      // 이미 담겨 있었다. 화면은 이미 담김이므로 아무것도 되돌리지 않는다.
      return;
    }

    if (error) {
      // 되돌린다. 화면이 서버보다 앞서 있으면 안 된다.
      if (wasOn) saved.add(id);
      else saved.delete(id);
      paintCard(card);
      console.warn('[saved]', error.message);
      toast(wasOn ? MSG_FAIL_UNSAVE : MSG_FAIL_SAVE);
    }
  }

  /* ── 로그인 유도 ────────────────────────────────────── */

  function goLogin() {
    toast(MSG_NEED_LOGIN);
    // 지금 보고 있는 검색 결과로 돌아오게 한다. login.js가 next를 읽는다.
    const back = location.pathname.split('/').pop() + location.search;
    setTimeout(() => {
      location.href = 'login.html?next=' + encodeURIComponent(back);
    }, LOGIN_DELAY);
  }

  /* ── 공개 API ───────────────────────────────────────── */

  /**
   * renderPlaces 직후에 불린다. 이번 화면의 정규화된 배열을 통째로 받는다.
   * @param {Array<{id, name, neighborhood, category, address, x, y, url}>} places
   */
  function remember(places) {
    index = new Map((places || []).map((place) => [String(place.id), place]));
    refresh();
  }

  /**
   * @param {object} config
   * @param {string} config.gridId 결과 그리드. 클릭을 여기에 위임한다.
   */
  function mount(config) {
    if (mounted) return;
    const id = config && config.gridId;
    const box = id ? document.getElementById(id) : null;
    if (!box) return;

    gridId = id;
    mounted = true;

    box.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-save]');
      if (!btn || !box.contains(btn)) return;

      const card = btn.closest('[data-place-id]');
      if (!card) return;

      if (!uid) {
        goLogin();
        return;
      }
      toggle(card, btn);
    });

    // 칠하기의 두 번째 트리거다. URL 파라미터로 들어오면 js/search.js가 세션
    // 복원보다 먼저 검색을 시작하므로, 첫 페인트는 로그아웃처럼 보인다.
    // onChange는 이미 해결됐으면 즉시 1회, 아니면 복원이 끝날 때 불러 준다.
    if (window.FvAuth) {
      window.FvAuth.onChange((snap) => {
        const next = snap.session ? snap.session.user.id : null;
        if (next === uid) return;

        uid = next;
        // 로그아웃했으면 화면의 담김 표시를 걷어낸다.
        if (!uid) saved.clear();
        refresh();
      });
    } else {
      console.warn('[saved] auth.js가 없습니다. 로그인 없이 담기는 동작하지 않습니다.');
    }
  }

  window.FvSaved = { remember, mount };
})();
