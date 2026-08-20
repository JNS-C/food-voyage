/**
 * 검색 페이지 컨트롤러.
 *
 * 모든 텍스트는 textContent로 넣는다. innerHTML 문자열 조립을 하지 않는다 —
 * 여기 들어오는 값은 카카오에서 온 남의 데이터다 (script.js와 같은 방침).
 *
 * 이 파일은 동네 목록도 카테고리 목록도 갖고 있지 않다. DOM이 유일한 진실의
 * 원천이다. design이 search.html의 select·칩을 갈아엎어도 JS는 그대로여야 한다.
 *
 * IIFE로 감싼다. 톱레벨로 두면 toastTimer 같은 이름이 전역에 나가는데,
 * script.js도 톱레벨에 `let toastTimer`를 선언한다 — 두 파일이 한 페이지에
 * 올라오는 순간 SyntaxError로 페이지 전체가 죽는다.
 */
(() => {
  'use strict';

  /** 한 번에 하나만 보인다. 결과가 있을 땐 전부 hidden. */
  const STATE_IDS = ['state-idle', 'state-loading', 'state-empty', 'state-error', 'state-nokey'];

  /** 코드형 카테고리는 category_group_code로 보낸다. 나머지는 키워드에 합친다. */
  const CODE_CATEGORY = /^(FD6|CE7)$/;

  /** 색면 3단계 순환. 실제 색은 design이 [data-tone]으로 건다. */
  const TONE_COUNT = 3;

  const TOAST_DETAIL = '리뷰 상세는 준비 중입니다';

  /**
   * 검색이 겹칠 때 늦게 도착한 옛 응답이 새 결과를 덮어쓰는 걸 막는다.
   * 칩을 연타하면 실제로 일어난다.
   */
  let requestToken = 0;

  let toastTimer = null;

  /* ── DOM 조회 ───────────────────────────────────────── */

  /**
   * 노드를 캐시하지 않고 매번 조회한다. design이 search.html을 동시에 편집하는
   * 중이고, 마크업이 갈리는 순간에도 JS가 죽지 않아야 한다.
   */
  function byId(id) {
    return document.getElementById(id);
  }

  function regionValues() {
    const select = byId('region-select');
    return select ? [...select.options].map((option) => option.value).filter(Boolean) : [];
  }

  /**
   * URL 파라미터로 들어온 지역명을 검증한다. 목록에 없는 값이면 첫 동네로 떨어뜨린다 —
   * 남이 보낸 링크의 ?region=아무거나로 엉뚱한 좌표를 조회하지 않는다.
   */
  function resolveRegion(param) {
    const values = regionValues();
    if (values.length === 0) return '';
    return values.includes(param) ? param : values[0];
  }

  function chips() {
    return [...document.querySelectorAll('#category-chips [data-category]')];
  }

  function activeChip() {
    const all = chips();
    return all.find((chip) => chip.getAttribute('aria-pressed') === 'true') || all[0] || null;
  }

  function activeCategory() {
    const chip = activeChip();
    return chip ? chip.getAttribute('data-category') || '' : '';
  }

  /* ── 상태 ───────────────────────────────────────────── */

  /**
   * hidden 속성만 토글한다. 클래스도 style도 건드리지 않는다 —
   * 상태 블록의 생김새는 전부 design의 CSS다.
   *
   * @param {string|null} id 보일 상태 블록 id. null이면 전부 숨긴다(=결과 표시).
   */
  function setState(id) {
    STATE_IDS.forEach((stateId) => {
      const node = byId(stateId);
      if (node) node.hidden = stateId !== id;
    });
  }

  function setBusy(busy) {
    const grid = byId('result-grid');
    if (grid) grid.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  function setCount(text) {
    const count = byId('result-count');
    if (count) count.textContent = text;
  }

  /* ── 토스트 ─────────────────────────────────────────── */

  /**
   * script.js에도 showToast가 있지만 저쪽은 클래스를 토글하고 이쪽은 data-visible만
   * 쓴다. 구현이 다르니 이름도 나눴다 — 한 페이지에 둘 다 올라왔을 때 어느 쪽을
   * 부르는지 코드에서 바로 읽혀야 한다. 전역 충돌 자체는 이 파일을 감싼 IIFE가 막는다.
   *
   * hidden을 쓰면 트랜지션이 죽고, visibility를 쓰면 aria-live 낭독이 안 된다.
   * 그래서 여기서는 data-visible만 뒤집고 나머지는 CSS에 맡긴다.
   */
  function showSearchToast(message) {
    const toast = byId('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.dataset.visible = 'true';

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.dataset.visible = 'false';
    }, 3000);
  }

  /* ── 렌더 ───────────────────────────────────────────── */

  function setField(root, field, value) {
    const node = root.querySelector(`[data-field="${field}"]`);
    if (node) node.textContent = value;
  }

  /**
   * 가게명 첫 글자. Array.from으로 쪼갠다 — 이모지가 섞인 상호가 실제로 있고
   * charAt(0)은 그런 이름을 반 토막 낸다.
   */
  function firstGlyph(name) {
    return Array.from(String(name || '').trim())[0] || '';
  }

  function renderPlaces(places) {
    const grid = byId('result-grid');
    const template = byId('tpl-place-card');
    if (!grid || !template) return;

    grid.textContent = '';

    places.forEach((place, index) => {
      const fragment = template.content.cloneNode(true);

      // appendChild하면 fragment가 비므로 카드 루트는 미리 잡아 둔다.
      const card = fragment.querySelector('[data-card]');
      if (card) card.setAttribute('data-place-id', place.id);

      const thumb = fragment.querySelector('[data-field="thumb"]');
      if (thumb) thumb.setAttribute('data-tone', String(index % TONE_COUNT));

      setField(fragment, 'initial', firstGlyph(place.name));
      setField(fragment, 'name', place.name);
      setField(fragment, 'neighborhood', place.neighborhood);
      setField(fragment, 'category', place.category);

      grid.appendChild(fragment);
    });
  }

  /* ── URL 동기화 ─────────────────────────────────────── */

  /**
   * 새로고침·공유해도 같은 결과가 나와야 한다. 랜딩의 히어로 폼도 이 형태로 온다.
   * pushState가 아니라 replaceState다 — 칩을 다섯 번 누른 뒤 뒤로가기를 다섯 번
   * 눌러야 랜딩으로 돌아가는 건 함정이다.
   */
  function syncUrl(region, keyword, category) {
    const params = new URLSearchParams();
    if (region) params.set('region', region);
    if (keyword) params.set('q', keyword);
    if (category) params.set('cat', category);

    const query = params.toString();
    history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  }

  /* ── 검색 ───────────────────────────────────────────── */

  /**
   * 카카오에 보낼 검색어를 만든다.
   *
   * '한식'·'일식' 같은 말형 카테고리는 category_group_code가 없다. 코드로 못 보내니
   * 키워드에 합쳐 keywordSearch로 넘긴다. 키워드가 비어 있으면 카테고리 말 자체가
   * 검색어가 된다 — categorySearch에는 코드형만 도달한다.
   */
  function buildQuery(keyword, category) {
    if (!category || CODE_CATEGORY.test(category)) {
      return { keyword, categoryCode: category };
    }
    return { keyword: [keyword, category].filter(Boolean).join(' '), categoryCode: '' };
  }

  function runSearch() {
    const select = byId('region-select');
    const region = resolveRegion(select ? select.value : '');

    if (!region) {
      // select가 비어 있는 건 design이 마크업을 편집하는 중이라는 뜻이지 오류가 아니다.
      // 여기서 빨간 에러 화면을 띄우면 design이 자기 잘못인 줄 알고 되돌린다.
      console.warn('[search] #region-select에 선택 가능한 동네가 없습니다. 검색을 건너뜁니다.');
      setState('state-idle');
      return;
    }

    const input = byId('keyword-input');
    const keyword = input ? input.value.trim() : '';
    const category = activeCategory();

    syncUrl(region, keyword, category);

    if (!window.KakaoPlaces) {
      // kakao-places.js가 안 실려도 페이지 전체가 죽지는 않게 한다.
      // 키가 없는 것과는 다른 문제다 — 사용자가 config.js로 고칠 수 없다.
      setBusy(false);
      setState('state-error');
      console.error('[search] kakao-places.js가 로드되지 않았습니다.');
      return;
    }

    const token = (requestToken += 1);
    setState('state-loading');
    setBusy(true);
    setCount('');

    const query = buildQuery(keyword, category);

    window.KakaoPlaces.searchPlaces({
      region,
      keyword: query.keyword,
      categoryCode: query.categoryCode,
    })
      .then((places) => {
        if (token !== requestToken) return; // 이미 다음 검색이 시작됐다
        setBusy(false);

        if (places.length === 0) {
          renderPlaces([]);
          setCount('');
          setState('state-empty');
          return;
        }

        renderPlaces(places);
        setCount(`${region}에서 ${places.length}곳`);
        setState(null);
      })
      .catch((error) => {
        if (token !== requestToken) return;
        setBusy(false);
        renderPlaces([]);
        setCount('');
        // 키가 없는 건 사용자가 고칠 수 있는 설정 문제다. 일반 오류와 화면을 나눈다.
        setState(error && error.code === 'NO_KEY' ? 'state-nokey' : 'state-error');
        if (!error || error.code !== 'NO_KEY') console.error('[search]', error);
      });
  }

  /* ── 초기화 ─────────────────────────────────────────── */

  function bindForm() {
    const form = byId('search-form');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      runSearch();
    });
  }

  /** select 변경만으로 바로 검색한다. 동네를 바꿨는데 옛 동네 결과가 남아 있으면 거짓말이다. */
  function bindRegion() {
    const select = byId('region-select');
    if (!select) return;
    select.addEventListener('change', runSearch);
  }

  function setActiveCategory(value) {
    const all = chips();
    if (all.length === 0) return;
    const target = all.find((chip) => chip.getAttribute('data-category') === value) || all[0];
    all.forEach((chip) => chip.setAttribute('aria-pressed', chip === target ? 'true' : 'false'));
  }

  /**
   * 칩은 라디오처럼 동작한다. aria-pressed는 항상 하나만 true다.
   * 클릭은 필터 변경이므로 그 자리에서 다시 검색한다.
   */
  function bindChips() {
    const group = byId('category-chips');
    if (!group) return;

    group.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-category]');
      if (!chip || !group.contains(chip)) return;
      setActiveCategory(chip.getAttribute('data-category'));
      runSearch();
    });
  }

  /** 이벤트에서 카드 루트를 찾는다. 그리드 밖이면 무시한다. */
  function cardFrom(event, grid) {
    const card = event.target.closest('[data-place-id]');
    return card && grid.contains(card) ? card : null;
  }

  /**
   * 카드 조작은 그리드에 위임한다. 카드는 매 검색마다 새로 만들어지므로
   * 개별 바인딩은 그때마다 다시 걸어야 한다.
   *
   * 카드 루트는 <button>이 아니라 role="button"을 얹은 <article>이다(안에 <h3>가
   * 있어 버튼의 콘텐츠 모델을 위반한다). 그래서 키보드 활성화가 공짜로 안 따라온다 —
   * 여기서 직접 처리한다. role·tabindex는 design이 마크업에 넣으므로 JS로 붙이지 않는다.
   */
  function bindCards() {
    const grid = byId('result-grid');
    if (!grid) return;

    grid.addEventListener('click', (event) => {
      if (!cardFrom(event, grid)) return;
      // 상세 페이지는 이번 범위 밖이다. 카드가 죽어 있는 것처럼 보이지만 않으면 된다.
      showSearchToast(TOAST_DETAIL);
    });

    grid.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      // 길게 누르면 keydown이 연사된다. 토스트 타이머가 계속 리셋돼 안 사라진다.
      if (event.repeat) return;
      if (!cardFrom(event, grid)) return;

      // Space의 기본 동작은 페이지 스크롤이다. 카드에 포커스를 둔 채 누르면
      // 토스트가 뜨면서 화면이 한 번 튄다.
      event.preventDefault();
      showSearchToast(TOAST_DETAIL);
    });
  }

  /**
   * URL 파라미터를 폼에 되돌려 놓는다. 파라미터가 하나라도 있으면 그 링크는
   * '이 검색 결과'를 가리키는 것이므로 자동으로 검색한다.
   */
  function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const hasParams = params.has('region') || params.has('q') || params.has('cat');

    const select = byId('region-select');
    const region = resolveRegion(params.get('region') || '');
    if (select && region) select.value = region;

    const input = byId('keyword-input');
    if (input && params.has('q')) input.value = params.get('q') || '';

    // cat이 없어도 호출한다. 마크업에 aria-pressed가 하나도 없을 때 첫 칩을 켠다.
    setActiveCategory(params.get('cat') || activeCategory());

    return hasParams;
  }

  function init() {
    bindForm();
    bindRegion();
    bindChips();
    bindCards();

    // 파라미터가 없어도 폼 초기 상태(첫 칩 aria-pressed)는 맞춰 둔다.
    const hasParams = applyUrlParams();

    if (!window.KakaoPlaces) {
      // 스크립트 자체가 없는 건 사용자가 config.js로 고칠 수 있는 문제가 아니다.
      setState('state-error');
      console.error('[search] kakao-places.js가 로드되지 않았습니다.');
      return;
    }

    // 키가 없다는 건 config.js만 보면 아는 사실이다. 검색 버튼을 눌러야 알려주는 건
    // 늦고, 알아보려고 dapi.kakao.com에 요청을 보낼 이유도 없다.
    if (!window.KakaoPlaces.hasKey()) {
      setState('state-nokey');
      return;
    }

    if (hasParams) runSearch();
    else setState('state-idle');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
