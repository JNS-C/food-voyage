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
  const STATE_IDS = [
    'state-idle',
    'state-loading',
    'state-empty',
    'state-noregion',
    'state-error',
    'state-nokey',
  ];

  /** 지역 입력 길이 상한. 검색어이지 문서가 아니다. */
  const REGION_MAX = 40;

  /** 코드형 카테고리는 category_group_code로 보낸다. 나머지는 키워드에 합친다. */
  const CODE_CATEGORY = /^(FD6|CE7)$/;

  /** 색면 3단계 순환. 실제 색은 design이 [data-tone]으로 건다. */
  const TONE_COUNT = 3;

  /** 반경 칩의 순환 목록(미터). 자동값이 목록 밖이면(구 5km·시 20km) 첫 항목부터 돈다. */
  const RADIUS_STEPS = [800, 1500, 3000];

  /**
   * 정렬 칩의 순환 목록. 거리·정확도는 카카오의 서버 정렬이고, 인기(POPULAR)는
   * 우리 데이터다 — 카카오에는 거리순으로 요청하고 받은 15곳을 담김 수로
   * 재정렬한다. 그래서 인기순은 "반경 내 인기 상위 15"가 아니라
   * "가까운 15곳의 인기순 재배열"이다(카카오 15건 상한).
   */
  const SORT_CYCLE = ['DISTANCE', 'ACCURACY', 'POPULAR'];

  /**
   * 검색이 겹칠 때 늦게 도착한 옛 응답이 새 결과를 덮어쓰는 걸 막는다.
   * 칩을 연타하면 실제로 일어난다.
   */
  let requestToken = 0;

  let toastTimer = null;

  /** 콤보박스 핸들. 마크업이 아직 없으면 null이다 — 오류가 아니다. */
  let combobox = null;

  /**
   * 드롭다운에서 고른 중심점. 있으면 지오코딩을 건너뛴다.
   *
   * 지역 텍스트가 바뀌는 순간 버려야 한다. 안 그러면 성수동을 고른 뒤 텍스트만
   * 강남구로 고쳤을 때 성수동 좌표로 찾아 놓고 '강남구에서 15곳'이라고 쓴다.
   */
  let pendingCenter = null;

  /**
   * 반경·정렬 오버라이드. null이면 scale 자동값(kakao-places의 SCALE_RADIUS/SORT)이다.
   * 메모리에만 산다 — 거점이 바뀌면 자동으로 리셋한다(runSearch 시작부).
   * 자동 반경은 규모별로 튜닝돼 있어서(역 800/동네 1500/구 5000), 강남구로
   * 옮겼는데 800m 오버라이드가 남으면 결과가 비는 이유를 알 수 없게 된다.
   */
  let userRadius = null;
  let userSort = null;

  /** 마지막 성공 검색의 확정값들. 요약 문구·칩 라벨·지도가 이걸 본다. */
  let lastMeta = null;
  let lastPlaces = [];
  let lastSearchedRegion = '';
  let selectedPlaceId = null;

  /* ── DOM 조회 ───────────────────────────────────────── */

  /**
   * 노드를 캐시하지 않고 매번 조회한다. design이 search.html을 동시에 편집하는
   * 중이고, 마크업이 갈리는 순간에도 JS가 죽지 않아야 한다.
   */
  function byId(id) {
    return document.getElementById(id);
  }

  /**
   * 지역 입력. region-input이 없으면 옛 region-select를 그대로 읽는다.
   *
   * 이 폴백이 호환 레이어다. design이 아직 새 마크업을 올리지 않은 브랜치에서도
   * 검색이 제안만 빠진 채 정상 동작한다. .value는 양쪽에서 똑같이 읽힌다.
   */
  function regionField() {
    return byId('region-input') || byId('region-select');
  }

  /**
   * 제어문자와 개행을 걷어낸다.
   *
   * 정규식 대신 코드포인트로 거른다 — 제어문자 범위를 정규식 리터럴에 쓰려면
   * 이스케이프가 필요하고, 그게 편집 과정에서 실제 제어 바이트로 굳으면
   * 소스 파일이 조용히 바이너리가 된다. 여기서 한 번 겪었다.
   */
  function stripControl(text) {
    let out = '';
    for (const ch of text) {
      const code = ch.codePointAt(0);
      if (code >= 32 && code !== 127) out += ch;
    }
    return out;
  }

  /**
   * 지역 문자열을 다듬는다. **검증이 아니라 정규화다.**
   *
   * 8/21 이전에는 select의 옵션 목록이 allowlist였다 — 남이 보낸 링크의
   * ?region=아무거나로 엉뚱한 좌표를 조회하지 않게 막았다. 지역이 자유 입력이
   * 된 이상 그 방어는 되돌릴 수 없다. '카카오가 해석할 수 있는 모든 지역'이
   * 요구사항이면 모양을 미리 알 수 없기 때문이다.
   *
   * 남는 위험은 쿼터와 카카오 로그 노이즈다. XSS는 아니다(모든 출력이
   * textContent 아니면 URLSearchParams다). 새로 생기는 위험은 최근 검색
   * 하나뿐이라, 자동 검색 경로에서는 최근 검색에 쓰지 않는다(applyUrlParams 참조).
   */
  function resolveRegion(param) {
    return stripControl(String(param || ''))
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, REGION_MAX);
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

  /* ── 결과 요약 · 반경/정렬 칩 ───────────────────────── */

  /** 800 → '800m', 1500 → '1.5km', 3000 → '3km' */
  function fmtRadius(meters) {
    const m = Number(meters);
    if (!Number.isFinite(m)) return '';
    return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1).replace(/\.0$/, '')}km`;
  }

  function fmtSort(sort) {
    if (sort === 'ACCURACY') return '정확도순';
    if (sort === 'POPULAR') return '인기순';
    return '거리순';
  }

  /**
   * "성수역 800m 안 · 가까운 15곳 · 거리순". 상한(15)은 카카오가 주는 최대치라
   * "가까운 N곳"이 정확한 말이다 — 정확도순에서는 "가까운"이 참말이 아니라 뺀다.
   */
  function setSummary(region, meta, count) {
    const node = byId('result-count');
    if (!node) return;
    node.textContent = '';
    const strong = document.createElement('strong');
    strong.className = 'font-semibold text-ink';
    strong.textContent = `${region} ${fmtRadius(meta.radius)} 안`;
    node.append(
      strong,
      document.createTextNode(
        // "가까운"은 거리순에서만 참말이다.
        meta.sort === 'DISTANCE' ? ` · 가까운 ${count}곳 · 거리순` : ` · ${count}곳 · ${fmtSort(meta.sort)}`
      )
    );

    // 지도 위 미러 — 지도만 보고 있어도 무엇의 결과인지 읽힌다.
    const mirror = byId('map-summary');
    if (mirror) {
      mirror.textContent = `${region} ${fmtRadius(meta.radius)} · ${count}곳`;
      mirror.hidden = false;
    }
  }

  /** 칩 라벨을 실효값으로 갱신한다. 자동 상태도 구체 값("800m")으로 보인다. */
  function syncResultControls(show) {
    const wrap = byId('result-controls');
    if (!wrap) return;
    wrap.hidden = !show || !lastMeta;
    if (wrap.hidden) return;

    const radiusChip = byId('radius-chip');
    if (radiusChip) {
      radiusChip.textContent = `반경 ${fmtRadius(lastMeta.radius)}`;
      radiusChip.setAttribute('aria-label', `반경 ${fmtRadius(lastMeta.radius)}. 누르면 다음 반경으로 다시 찾습니다`);
    }
    const sortChip = byId('sort-chip');
    if (sortChip) {
      sortChip.textContent = fmtSort(lastMeta.sort);
      sortChip.setAttribute('aria-label', `${fmtSort(lastMeta.sort)} 정렬. 누르면 정렬을 바꿔 다시 찾습니다`);
    }
  }

  function bindResultControls() {
    const radiusChip = byId('radius-chip');
    if (radiusChip) {
      radiusChip.addEventListener('click', () => {
        if (!lastMeta) return;
        // 실효 반경의 다음 항목으로. 자동값이 목록 밖(5km·20km)이면 첫 항목부터.
        const at = RADIUS_STEPS.indexOf(lastMeta.radius);
        userRadius = RADIUS_STEPS[(at + 1) % RADIUS_STEPS.length];
        runSearch({ record: false });
      });
    }
    const sortChip = byId('sort-chip');
    if (sortChip) {
      sortChip.addEventListener('click', () => {
        if (!lastMeta) return;
        // 표시 중인 정렬(lastMeta.sort — 인기순이면 'POPULAR')의 다음 항목으로.
        const at = SORT_CYCLE.indexOf(lastMeta.sort);
        userSort = SORT_CYCLE[(at + 1) % SORT_CYCLE.length];
        runSearch({ record: false });
      });
    }
  }

  /**
   * 검색 결과에 담김 수를 붙인다. 배지와 인기순 재정렬의 재료다.
   * get_save_counts는 get_top_places와 같은 익명 집계 RPC라 비로그인에서도 된다.
   * 실패해도 검색은 그대로 간다 — 반환 false로 알리고 배지만 빠진다.
   */
  function attachSaveCounts(places) {
    places.forEach((place) => {
      place.saveCount = 0;
    });
    if (places.length === 0 || !window.FvAuth || !window.FvAuth.isConfigured()) {
      return Promise.resolve(true);
    }
    return window.FvAuth._client
      .rpc('get_save_counts', { place_ids: places.map((place) => String(place.id)) })
      .then(({ data, error }) => {
        if (error) throw error;
        const counts = new Map((data || []).map((row) => [String(row.place_id), Number(row.save_count) || 0]));
        places.forEach((place) => {
          place.saveCount = counts.get(String(place.id)) || 0;
        });
        return true;
      })
      .catch((error) => {
        console.warn('[search] 담김 수를 불러오지 못했습니다.', error && error.message);
        return false;
      });
  }

  /* ── 거점 칩(통합 pill) ─────────────────────────────── */

  /**
   * 검색이 성공하면 region 입력이 확정 거점 칩([성수역 ×])으로 바뀐다.
   * input은 hidden으로 숨길 뿐 값은 유지한다 — GET 폴백(name=region)과
   * 콤보박스 mount가 무손상이고, 폼 제출도 그대로 값을 실어 보낸다.
   */
  function setAnchorChip(label) {
    const pill = byId('anchor-pill');
    const field = regionField();
    if (!pill || !field || field.tagName === 'SELECT') return;
    // 제안 패널이 열린 채 input이 숨겨지면 패널만 허공에 남는다. 확정과 함께 닫는다.
    if (combobox) combobox.close();
    const labelBtn = pill.querySelector('[data-anchor-edit]');
    if (labelBtn) {
      labelBtn.textContent = label;
      labelBtn.setAttribute('aria-label', `거점 ${label}. 누르면 바꿀 수 있습니다`);
    }
    field.hidden = true;
    pill.hidden = false;
  }

  /** 편집 모드 — 칩을 걷고 input으로 돌아간다. 값은 그대로라 이어서 고치면 된다. */
  function enterAnchorEdit() {
    const pill = byId('anchor-pill');
    const field = regionField();
    if (!pill || !field) return;
    pill.hidden = true;
    field.hidden = false;
    field.focus();
    if (typeof field.select === 'function') field.select();
    // pendingCenter는 그대로 둔다 — 텍스트가 실제로 바뀌는 순간
    // bindRegion의 input 리스너가 알아서 버린다.
  }

  /** 거점 해제 — 좌표·텍스트·URL의 region을 함께 비운다. */
  function clearAnchor() {
    const pill = byId('anchor-pill');
    const field = regionField();
    if (!pill || !field) return;
    pendingCenter = null;
    field.value = '';
    pill.hidden = true;
    field.hidden = false;
    field.focus();
    const input = byId('keyword-input');
    syncUrl('', input ? input.value.trim() : '', activeCategory());
  }

  function bindAnchorPill() {
    const pill = byId('anchor-pill');
    if (!pill) return;
    const editBtn = pill.querySelector('[data-anchor-edit]');
    if (editBtn) editBtn.addEventListener('click', enterAnchorEdit);
    const clearBtn = pill.querySelector('[data-anchor-clear]');
    if (clearBtn) clearBtn.addEventListener('click', clearAnchor);
  }

  /* ── 지도 연동 ──────────────────────────────────────── */

  function isWide() {
    return window.matchMedia('(min-width: 1024px)').matches;
  }

  function mapOpen() {
    const panel = byId('map-panel');
    return !!panel && panel.dataset.open === 'true';
  }

  function updateMap() {
    if (!window.FvSearchMap) return;
    // 안 보이는 상태(모바일·지도 닫힘)면 모듈이 데이터만 보관했다가
    // 열리는 순간(relayout) 그린다.
    window.FvSearchMap.update(lastMeta, lastPlaces);
  }

  /** 결과가 있고 모바일일 때만 토글을 보인다. lg에서는 CSS가 어차피 숨긴다. */
  function syncMapToggle() {
    const toggle = byId('map-toggle');
    if (!toggle) return;
    toggle.hidden = lastPlaces.length === 0;
  }

  /**
   * @param {boolean} open
   * @param {object} [options]
   * @param {boolean} [options.fromPop] popstate가 출발점이면 true — 히스토리를
   *        다시 건드리지 않는다(무한 루프 방지).
   *
   * 전체 화면 오버레이는 모바일에서 뒤로가기로 닫혀야 한다. 안 그러면 back이
   * 지도를 닫는 대신 페이지를 떠난다 — 열 때 히스토리에 한 칸을 쌓고,
   * popstate가 오면 닫는다. 버튼으로 닫을 때는 그 칸을 back()으로 걷어
   * 히스토리에 빈 칸이 남지 않게 한다.
   */
  function setMapOpen(open, options) {
    const fromPop = !!(options && options.fromPop);
    const panel = byId('map-panel');
    const toggle = byId('map-toggle');
    if (!panel) return;

    if (!open && !fromPop && history.state && history.state.fvMapOpen) {
      // 쌓아 둔 칸을 소비한다 — popstate 핸들러가 실제 닫기를 수행한다.
      history.back();
      return;
    }

    panel.dataset.open = open ? 'true' : 'false';
    if (toggle) {
      toggle.setAttribute('aria-pressed', open ? 'true' : 'false');
      toggle.textContent = open ? '목록으로' : '지도로 보기';
    }
    if (open) {
      if (!fromPop) history.pushState({ fvMapOpen: true }, '', window.location.href);
      if (window.FvSearchMap) window.FvSearchMap.relayout();
    }
  }

  function bindMapToggle() {
    const toggle = byId('map-toggle');
    if (toggle) toggle.addEventListener('click', () => setMapOpen(!mapOpen()));

    window.addEventListener('popstate', () => {
      if (mapOpen()) setMapOpen(false, { fromPop: true });
    });
  }

  /* ── 행 ↔ 핀 선택 연동 ──────────────────────────────── */

  /**
   * @param {string} id
   * @param {object} [options]
   * @param {string} [options.from] 'map'이면 핀 클릭이 출발점 — 지도는 이미
   *        자기 강조를 끝냈으므로 행 강조·스크롤만 한다.
   */
  function selectPlace(id, options) {
    const from = options && options.from;
    selectedPlaceId = id ? String(id) : null;

    const grid = byId('result-grid');
    if (grid) {
      grid.querySelectorAll('[data-place-id]').forEach((card) => {
        if (selectedPlaceId && card.dataset.placeId === selectedPlaceId) {
          card.dataset.selected = 'true';
          // smooth를 쓰지 않는다 — prefers-reduced-motion 관례.
          if (from === 'map') card.scrollIntoView({ block: 'nearest' });
        } else {
          delete card.dataset.selected;
        }
      });
    }

    if (from !== 'map' && selectedPlaceId && window.FvSearchMap) {
      window.FvSearchMap.select(selectedPlaceId, { pan: true });
    }
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

      // 순위 = 지도 핀 번호. 템플릿이 lg에서만 보이게 처리한다.
      setField(fragment, 'rank', String(index + 1));

      // 거리 뱃지. 좌표 기반 검색이면 카카오가 준다 — 없으면 뱃지째 숨긴다.
      const distanceNode = fragment.querySelector('[data-field="distance"]');
      if (distanceNode) {
        const label = fmtRadius(place.distance);
        distanceNode.textContent = label;
        distanceNode.hidden = !label;
      }

      // 담김 배지. 0명이면 숨긴다 — 빈 자랑은 소음이다.
      const saveBadge = fragment.querySelector('[data-field="savecount"]');
      if (saveBadge) {
        const saves = Number(place.saveCount) || 0;
        const num = saveBadge.querySelector('[data-savecount-num]');
        if (num) num.textContent = String(saves);
        saveBadge.hidden = saves === 0;
        saveBadge.setAttribute('aria-label', `${saves}명이 담았어요`);
      }

      // 카테고리가 비면 구분점(·)도 같이 걷는다.
      const sep = fragment.querySelector('[data-sep]');
      if (sep) sep.hidden = !place.category;

      // 명시적 외부 이동. 탭=선택, 링크=이동으로 분리한다.
      const mapLink = fragment.querySelector('[data-maplink]');
      if (mapLink) {
        if (place.url) {
          mapLink.href = place.url;
          mapLink.hidden = false;
          mapLink.setAttribute('aria-label', `${place.name} 카카오맵에서 보기`);
        } else {
          mapLink.hidden = true;
        }
      }

      grid.appendChild(fragment);
    });

    // 담기는 이 파일의 관심사가 아니다. 결과만 넘기고 나머지는 그쪽이 한다.
    // 파일이 없어도 검색은 그대로 동작해야 하므로 존재를 확인하고 부른다.
    if (window.FvSaved) window.FvSaved.remember(places);
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
    // state를 null로 덮지 않는다 — 지도 오버레이가 쌓아 둔 fvMapOpen 표식이
    // 지도 위에서 재검색할 때 지워지면 back이 지도를 닫지 못하게 된다.
    history.replaceState(history.state, '', query ? `?${query}` : window.location.pathname);
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

  /**
   * @param {object} [options]
   * @param {boolean} [options.record] 성공하면 최근 검색에 남길지. 자동 실행은 false다.
   */
  function runSearch(options) {
    const record = !options || options.record !== false;
    const field = regionField();

    if (!field) {
      // 필드 자체가 없는 건 design이 마크업을 편집하는 중이라는 뜻이지 오류가 아니다.
      // 여기서 빨간 에러 화면을 띄우면 design이 자기 잘못인 줄 알고 되돌린다.
      console.warn('[search] 지역 입력을 찾지 못했습니다. 검색을 건너뜁니다.');
      setState('state-idle');
      return;
    }

    const region = resolveRegion(field.value);

    if (!region) {
      // 필드는 있는데 값이 비었다. 이건 마크업 문제가 아니라 그냥 빈 폼 제출이다 —
      // 콘솔에 경고를 남길 일이 아니라 사용자에게 말할 일이다.
      showSearchToast('지역을 입력해 주세요');
      setState('state-idle');
      // URL에 옛 지역이 남아 있으면 화면과 링크가 다른 말을 한다. 같이 비운다.
      syncUrl('', '', '');
      field.focus();
      return;
    }

    const input = byId('keyword-input');
    const keyword = input ? input.value.trim() : '';
    const category = activeCategory();

    // 거점이 바뀌면 반경·정렬 오버라이드를 버린다 — 자동 반경은 규모별로
    // 튜닝돼 있어서, 남겨 두면 강남구에서 800m로 찾는 이유를 알 수 없게 된다.
    if (region !== lastSearchedRegion) {
      userRadius = null;
      userSort = null;
    }

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

    // 텍스트가 확정된 라벨과 어긋나면 pendingCenter는 이미 null이 돼 있다.
    // 여기서 한 번 더 확인하는 이유는 프로그램적으로 value를 바꾼 경로(applyUrlParams)가
    // input 이벤트를 발생시키지 않기 때문이다.
    const center = pendingCenter && pendingCenter.label === region ? pendingCenter : null;

    window.KakaoPlaces.searchPlaces({
      region,
      center,
      keyword: query.keyword,
      categoryCode: query.categoryCode,
      radius: userRadius,
      // 인기순은 카카오에 없는 정렬이다 — 요청은 거리순으로 보내고 받아서 재정렬한다.
      sort: userSort === 'POPULAR' ? 'DISTANCE' : userSort,
    })
      .then(({ places, meta }) => {
        if (token !== requestToken) return; // 이미 다음 검색이 시작됐다

        // 담김 수는 어느 정렬에서든 배지로 보여준다(8/24). 인기순의 재료이기도 하다.
        return attachSaveCounts(places).then((countsOk) => {
          if (token !== requestToken) return;
          setBusy(false);

          // 좌표를 몰라도 남긴다. 다음에 고를 때 지오코딩을 한 번 더 할 뿐이다.
          if (record && combobox) {
            combobox.remember(center || { label: region });
          }

          let list = places;
          let displaySort = meta.sort;
          if (userSort === 'POPULAR') {
            if (countsOk) {
              // 담김 수 → 거리 → id. 담김 0이 대부분인 구간은 거리순이 그대로 산다.
              list = places.slice().sort((a, b) =>
                (b.saveCount - a.saveCount)
                || ((Number.isFinite(a.distance) ? a.distance : Infinity)
                    - (Number.isFinite(b.distance) ? b.distance : Infinity))
                || String(a.id).localeCompare(String(b.id))
              );
              displaySort = 'POPULAR';
            } else {
              showSearchToast('인기 정보를 불러오지 못해 거리순으로 보여드립니다');
            }
          }

          lastMeta = Object.assign({}, meta, { sort: displaySort });
          lastPlaces = list;
          lastSearchedRegion = region;
          selectedPlaceId = null;

          // 검색이 성공했다 = 거점이 확정됐다. region 입력이 칩으로 바뀐다.
          setAnchorChip(region);
          // 0건이어도 칩은 남긴다 — "반경을 넓히거나"가 바로 실행 가능한 조언이 된다.
          syncResultControls(true);
          updateMap();
          syncMapToggle();

          if (list.length === 0) {
            renderPlaces([]);
            setCount('');
            setState('state-empty');
            return;
          }

          renderPlaces(list);
          setSummary(region, lastMeta, list.length);
          setState(null);
        });
      })
      .catch((error) => {
        if (token !== requestToken) return;
        setBusy(false);
        renderPlaces([]);
        setCount('');
        lastMeta = null;
        lastPlaces = [];
        selectedPlaceId = null;
        syncResultControls(false);
        syncMapToggle();
        if (window.FvSearchMap) window.FvSearchMap.clear();
        const mirror = byId('map-summary');
        if (mirror) mirror.hidden = true;
        // code로만 분기한다. message는 언제든 바뀌지만 code는 계약이다.
        //   NO_KEY           설정 문제. 사용자가 config.js로 고칠 수 있다.
        //   REGION_NOT_FOUND 오타. 지역이 자유 입력이 되면서 가장 흔해진 실패다.
        //                    네트워크 에러 화면으로 묶으면 오타를 네트워크 탓으로 돌린다.
        const code = (error && error.code) || '';
        if (code === 'NO_KEY') setState('state-nokey');
        else if (code === 'REGION_NOT_FOUND') setState('state-noregion');
        else {
          setState('state-error');
          console.error('[search]', error);
        }
      });
  }

  /* ── 내 주변 찾기 ───────────────────────────────────── */

  /**
   * 위치 획득 옵션. 맛집 검색에 GPS 정밀도는 과하다 — 셀·와이파이 수준이면
   * 충분하고 빠르다. maximumAge 5분: 방금 쓴 위치를 다시 묻지 않는다.
   */
  const GEO_OPTIONS = { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 };

  /** 중복 클릭 가드. disabled를 쓰지 않는다 — 포커스가 튕겨 나간다. */
  let locating = false;

  function setNearbyBusy(busy) {
    const button = byId('nearby-btn');
    if (!button) return;
    button.setAttribute('aria-busy', busy ? 'true' : 'false');
    // 라벨 자체가 상태를 말하게 한다. 별도 스피너 없이 낭독까지 해결된다.
    button.textContent = busy ? '위치 확인 중…' : '내 주변';
  }

  function geoErrorMessage(error) {
    const code = error && error.code;
    if (code === 1) return '위치 권한이 꺼져 있습니다. 브라우저 주소창의 위치 설정을 확인해 주세요';
    if (code === 3) return '위치 확인이 오래 걸립니다. 잠시 뒤 다시 시도해 주세요';
    return '현재 위치를 확인하지 못했습니다';
  }

  /**
   * 좌표·라벨을 폼에 넣고 검색한다. field.value와 pendingCenter.label을
   * 같은 문자열로 동시에 세팅해야 runSearch의 label 일치 검사를 통과한다.
   * 프로그램적 value 변경은 input 이벤트를 안 내므로 bindRegion의 무효화에도
   * 걸리지 않는다.
   *
   * record:false — GPS 유래 좌표·동네를 localStorage에 남기지 않는다.
   * 동 이름은 '고른 거점'이 아니라 '지금 서 있는 곳'이고, 다음 방문 때는
   * 이미 다른 곳일 수 있다.
   */
  function applyNearby(hit) {
    const field = regionField();
    if (!field) return;
    field.value = hit.label;
    pendingCenter = { label: hit.label, x: hit.x, y: hit.y, scale: hit.scale || 'walk' };
    runSearch({ record: false });
  }

  function runNearbySearch() {
    if (locating) return;
    if (!navigator.geolocation) {
      showSearchToast('이 브라우저에서는 위치를 쓸 수 없습니다');
      return;
    }
    if (!window.KakaoPlaces || !window.KakaoPlaces.reverseRegion) {
      setState('state-error');
      return;
    }

    locating = true;
    setNearbyBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const x = position.coords.longitude;
        const y = position.coords.latitude;
        window.KakaoPlaces.reverseRegion(x, y)
          // 동 이름을 못 얻어도 좌표는 있다. 라벨만 일반화하고 검색은 간다.
          .catch(() => ({ label: '내 주변', x, y, scale: 'walk' }))
          .then((hit) => {
            locating = false;
            setNearbyBusy(false);
            applyNearby(hit);
          });
      },
      (error) => {
        locating = false;
        setNearbyBusy(false);
        showSearchToast(geoErrorMessage(error));
      },
      GEO_OPTIONS
    );
  }

  function bindNearby() {
    const button = byId('nearby-btn');
    if (button) button.addEventListener('click', () => runNearbySearch());
  }

  /* ── 거점 빠른선택 ──────────────────────────────────── */

  /**
   * state-idle의 "최근 거점" 칩. 콤보박스의 최근 검색 저장소를 읽기만 한다 —
   * 쓰기는 콤보박스가 소유한다. 프리셋과 겹치는 라벨은 뺀다(같은 칩 두 개는 소음).
   */
  function renderRecentAnchors() {
    const root = byId('quick-anchors');
    if (!root || !window.RegionCombobox || typeof window.RegionCombobox.recents !== 'function') return;
    const wrap = root.querySelector('[data-anchor-recent]');
    const title = root.querySelector('[data-anchor-recent-title]');
    if (!wrap) return;

    const presetLabels = new Set(
      [...root.querySelectorAll('[data-anchor-presets] [data-region]')]
        .map((chip) => chip.dataset.region)
    );
    const recents = window.RegionCombobox.recents()
      .filter((hit) => !presetLabels.has(hit.label))
      .slice(0, 4);

    wrap.textContent = '';
    recents.forEach((hit) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'anchor-chip';
      chip.textContent = hit.label;
      if (hit.detail) chip.title = hit.detail;
      chip.dataset.region = hit.label;
      // 좌표를 아는 항목은 실어 둔다. 클릭 시 지오코딩을 건너뛴다.
      if (hit.x != null && hit.y != null) {
        chip.dataset.x = String(hit.x);
        chip.dataset.y = String(hit.y);
        chip.dataset.scale = hit.scale || '';
        chip.dataset.kind = hit.kind || '';
      }
      wrap.appendChild(chip);
    });

    const has = recents.length > 0;
    wrap.hidden = !has;
    if (title) title.hidden = !has;
  }

  function bindAnchors() {
    const root = byId('quick-anchors');
    if (!root) return;

    root.addEventListener('click', (event) => {
      const chip = event.target.closest('[data-region]');
      if (!chip || !root.contains(chip)) return;
      const field = regionField();
      if (!field) return;

      const label = chip.dataset.region || '';
      field.value = label;
      // 최근 거점 칩은 좌표를 이미 안다. 프리셋은 이름만 있고, resolveRegionInfo가
      // 역을 잡으면 scale 'station'(800m·거리순)이 알아서 붙는다 — 좌표 하드코딩 없음.
      pendingCenter = chip.dataset.x
        ? {
            label,
            x: Number(chip.dataset.x),
            y: Number(chip.dataset.y),
            scale: chip.dataset.scale || '',
            kind: chip.dataset.kind || '',
          }
        : null;
      // record:true — 명시적으로 고른 거점이니 최근 검색에 남긴다(콤보박스 선택과 같은 대우).
      runSearch();
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

  /**
   * select였을 땐 change 하나로 충분했다 — 고르는 순간이 곧 확정이었다.
   * 텍스트 입력에서 change는 blur마다 터지므로, 탭으로 빠져나갈 때마다 검색이
   * 나가게 된다. 입력에서는 아무것도 걸지 않는다 — 검색은 제출과 제안 선택으로만.
   *
   * SELECT 분기를 남겨 두는 이유는 호환 레이어다. 팀원이 아직 옛 마크업인
   * 브랜치에서 이 JS를 써도 동작이 그대로여야 한다.
   */
  function bindRegion() {
    const field = regionField();
    if (!field) return;

    if (field.tagName === 'SELECT') {
      field.addEventListener('change', () => runSearch());
      return;
    }

    // 텍스트가 확정된 라벨에서 벗어나면 좌표를 버린다. 이걸 안 하면 성수동을
    // 고른 뒤 강남구로 고쳐 검색했을 때 성수동 좌표로 찾고 '강남구에서 15곳'이라
    // 쓴다 — 결과가 틀렸다는 걸 화면 어디에서도 알 수 없는 형태의 버그다.
    field.addEventListener('input', () => {
      if (pendingCenter && pendingCenter.label !== field.value.trim()) pendingCenter = null;
    });
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
      // 칩만 바꾼 건 이미 한 검색을 좁히는 것이지 새 지역을 고른 게 아니다.
      // 최근 검색은 지역 목록이므로 여기서 또 쌓지 않는다.
      runSearch({ record: false });
    });
  }

  /**
   * 이벤트에서 카드 루트를 찾는다. 그리드 밖이면 무시한다.
   *
   * 담기 버튼(js/saved-places.js)은 카드 안에 있지만 카드 클릭이 아니다. 그 버튼과
   * 이 핸들러는 같은 그리드에 붙어 있어서 stopPropagation으로는 서로를 못 막는다
   * (같은 노드의 다른 리스너다). 그래서 여기서 걸러낸다 — click과 keydown이
   * 이 함수를 함께 쓰므로 한 군데만 막으면 된다.
   */
  function cardFrom(event, grid) {
    if (event.target.closest('[data-save]')) return null;
    // 카카오맵 링크는 링크대로 간다 — 선택으로 가로채지 않는다.
    if (event.target.closest('[data-maplink]')) return null;
    const card = event.target.closest('[data-place-id]');
    return card && grid.contains(card) ? card : null;
  }

  /**
   * 카드 조작은 그리드에 위임한다. 카드는 매 검색마다 새로 만들어지므로
   * 개별 바인딩은 그때마다 다시 걸어야 한다.
   *
   * 행 탭 = 지도 선택. PC는 핀 강조·이동·팝오버, 모바일(지도 닫힘)은 행 강조만이다.
   * 외부 이동은 행 안의 카카오맵 링크가 한다 — 탭을 통째로 외부 링크로 만들면
   * 실수 이탈이 잦고 선택 연동과 충돌한다.
   *
   * 카드 루트는 <button>이 아니라 role="button"을 얹은 <article>이다(안에 <h3>가
   * 있어 버튼의 콘텐츠 모델을 위반한다). 그래서 키보드 활성화가 공짜로 안 따라온다 —
   * 여기서 직접 처리한다. role·tabindex는 design이 마크업에 넣으므로 JS로 붙이지 않는다.
   */
  function bindCards() {
    const grid = byId('result-grid');
    if (!grid) return;

    grid.addEventListener('click', (event) => {
      const card = cardFrom(event, grid);
      if (!card) return;
      selectPlace(card.dataset.placeId, { from: 'list' });
    });

    grid.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.repeat) return;
      const card = cardFrom(event, grid);
      if (!card) return;

      // Space의 기본 동작은 페이지 스크롤이다. 카드에 포커스를 둔 채 누르면
      // 선택되면서 화면이 한 번 튄다.
      event.preventDefault();
      selectPlace(card.dataset.placeId, { from: 'list' });
    });
  }

  /**
   * URL 파라미터를 폼에 되돌려 놓는다. 파라미터가 하나라도 있으면 그 링크는
   * '이 검색 결과'를 가리키는 것이므로 자동으로 검색한다.
   */
  function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const hasParams = params.has('region') || params.has('q') || params.has('cat');

    const field = regionField();
    const region = resolveRegion(params.get('region') || '');
    if (field && region) field.value = region;

    // 딥링크는 좌표를 모른다. 항상 새로 해석한다.
    pendingCenter = null;

    const input = byId('keyword-input');
    if (input && params.has('q')) input.value = params.get('q') || '';

    // cat이 없어도 호출한다. 마크업에 aria-pressed가 하나도 없을 때 첫 칩을 켠다.
    setActiveCategory(params.get('cat') || activeCategory());

    // nearby=1은 랜딩의 '내 주변에서 찾기' 링크다. 값은 init이 소비한다.
    return { hasParams, nearby: params.get('nearby') === '1' };
  }

  /**
   * 콤보박스를 붙인다. 실패해도(스크립트 미로드·마크업 미착) 검색은 그대로 간다 —
   * 자동완성은 편의지 기반이 아니다. window.KakaoPlaces를 다루는 방식과 같다.
   */
  function mountCombobox() {
    if (!window.RegionCombobox) {
      console.warn('[search] region-combobox.js가 없습니다. 지역 제안 없이 진행합니다.');
      return null;
    }

    return window.RegionCombobox.mount({
      inputId: 'region-input',
      panelId: 'region-panel',
      listboxId: 'region-listbox',
      statusId: 'region-status',
      templateId: 'tpl-region-option',
      onCommit: (hit) => {
        pendingCenter = hit;
        // 고른 항목은 콤보박스가 이미 최근 검색에 남겼다. 여기서 또 쌓지 않는다.
        runSearch({ record: false });
      },
    });
  }

  function init() {
    bindForm();
    bindRegion();
    bindChips();
    bindCards();
    bindNearby();
    bindAnchors();
    bindResultControls();
    bindAnchorPill();
    bindMapToggle();

    // 지도 모듈. 없어도 검색은 완전 동작한다 — FvSaved와 같은 optional 태도.
    if (window.FvSearchMap) {
      window.FvSearchMap.mount({
        containerId: 'map-canvas',
        onSelect: (id) => selectPlace(id, { from: 'map' }),
      });

      // lg 진입(지도 컬럼이 나타남)과 리사이즈 뒤에는 타일 레이아웃을 다시 잡아야 한다.
      const wide = window.matchMedia('(min-width: 1024px)');
      const onWideChange = () => {
        if (wide.matches) window.FvSearchMap.relayout();
      };
      if (typeof wide.addEventListener === 'function') wide.addEventListener('change', onWideChange);

      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => window.FvSearchMap.relayout(), 200);
      });
    }

    // 담기 버튼의 클릭 위임과 담김 목록 선반영. 없으면 카드에 담기 버튼이
    // 그려져 있어도 눌리지 않을 뿐, 검색은 영향을 받지 않는다.
    if (window.FvSaved) window.FvSaved.mount({ gridId: 'result-grid' });
    else console.warn('[search] saved-places.js가 없습니다. 담기 없이 진행합니다.');

    combobox = mountCombobox();
    if (window.RegionCombobox && !combobox) {
      // 마크업이 아직 안 왔다는 뜻이다. design 편집 중일 수 있으므로 오류로 다루지 않는다.
      console.warn('[search] 지역 제안 마크업(#region-panel)이 없습니다. 평범한 입력으로 동작합니다.');
    }

    renderRecentAnchors();

    // 파라미터가 없어도 폼 초기 상태(첫 칩 aria-pressed)는 맞춰 둔다.
    const { hasParams, nearby } = applyUrlParams();

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

    if (nearby) {
      // 딥링크에 nearby가 남으면 새로고침마다 권한 프롬프트가 다시 뜬다.
      // 시작 전에 지운다 — 성공 경로는 runSearch의 syncUrl이 어차피 덮지만,
      // 거부·실패 경로에는 syncUrl이 없다.
      history.replaceState(null, '', window.location.pathname);
      // 진입 즉시 실행이지만 프롬프트가 낯설지 않다 — 사용자가 직전 페이지에서
      // '내 주변에서 찾기'를 눌러 온 직후라 의도 맥락이 살아 있다.
      runNearbySearch();
      return;
    }

    // 자동 실행은 최근 검색에 남기지 않는다. 남기면 남이 보낸 링크 하나로
    // 임의 문자열을 상대방 저장소에 심고 이후 방문마다 다시 그리게 할 수 있다.
    if (hasParams) runSearch({ record: false });
    else setState('state-idle');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
