/**
 * 지역 입력 자동완성 콤보박스.
 *
 * search.js에 넣지 않고 파일을 나눈 이유는 랜딩(index.html)에 그대로 얹기
 * 위해서다. 이 파일은 검색이 무엇인지 모른다 — 지역 후보를 보여주고, 사용자가
 * 하나를 고르면 onCommit으로 넘기는 것까지가 전부다.
 *
 * 카카오도 직접 부르지 않는다. window.KakaoPlaces.suggestRegions만 쓴다.
 *
 * IIFE로 감싼다. search.html에서 이 파일과 search.js가 같은 전역을 공유하므로
 * 내부 헬퍼(byId 같은 흔한 이름)를 밖에 흘리면 언젠가 부딪힌다.
 */
(() => {
  'use strict';

  /** 이 글자 수부터 조회한다. 한 글자로는 후보가 너무 넓다. */
  const MIN_QUERY = 2;

  /** 타이핑이 멎기를 기다리는 시간. 글자마다 요청을 보내지 않기 위한 값이다. */
  const DEBOUNCE = 220;

  /** 질의 캐시 상한. 프리픽스를 오가며 지웠다 썼다 할 때 재요청을 막는다. */
  const QUERY_CACHE_MAX = 30;

  const RECENT_KEY = 'fv.recent-regions.v1';
  const RECENT_MAX = 8;

  /** 최근 검색에 담을 문자열 상한. 저장소가 이상해져도 렌더가 터지지 않게. */
  const LABEL_MAX = 60;

  /** 패널 높이 상한과 화면 가장자리 여백. */
  const PANEL_MAX_H = 320;
  const VIEWPORT_GAP = 16;

  /**
   * 패널 최소 폭. 지역 입력은 좁아도 되지만 패널까지 좁으면 '서울 성동구 성수동1가'가
   * 두 줄로 접혀서 목록이 읽히지 않는다. 입력보다 넓어져도 되는 자리다.
   */
  const PANEL_MIN_W = 260;

  /* ── 저장소 ─────────────────────────────────────────── */

  /**
   * localStorage를 못 쓰는 환경의 대체 저장소. Safari 프라이빗은 setItem이
   * 아니라 window.localStorage 접근 자체에서 던진다 — 그래서 읽기도 try로 감싼다.
   * 실패하면 최근 검색이 세션 한정으로 강등될 뿐, 페이지는 산다.
   */
  let memoryRecents = null;

  function storage() {
    try {
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  /**
   * 저장된 항목 하나를 검증한다. localStorage는 같은 출처면 누구나 고칠 수 있고,
   * 버전이 다른 옛 클라이언트가 써 둔 모양일 수도 있다. 읽을 때마다 확인한다.
   *
   * 좌표는 없어도 된다 — 직접 타이핑해서 검색한 지역은 label만 남는다.
   * 그 경우 다시 고를 때 지오코딩을 한 번 더 할 뿐이다.
   */
  function validRecent(entry) {
    if (!entry || typeof entry !== 'object') return null;
    const label = typeof entry.label === 'string' ? entry.label.trim() : '';
    if (!label || label.length > LABEL_MAX) return null;

    const detail = typeof entry.detail === 'string' ? entry.detail.slice(0, LABEL_MAX) : '';
    // null을 Number()에 넣으면 0이다 — 좌표 없음이 (0,0) 대서양 좌표로 굳는다.
    // null은 변환 전에 걸러서 "좌표 없음"으로 남긴다.
    const x = entry.x == null ? NaN : Number(entry.x);
    const y = entry.y == null ? NaN : Number(entry.y);
    let hasCoords = Number.isFinite(x) && Number.isFinite(y);
    // 과거 버전이 이미 (0,0)으로 굳혀 저장한 항목의 치유. 한국 서비스에서
    // (0,0)은 나올 수 없는 값이라 좌표 없음으로 되돌린다 — 라벨 지오코딩으로 살아난다.
    if (hasCoords && x === 0 && y === 0) hasCoords = false;

    return {
      id: `recent:${label}`,
      // 원 kind 중 station만 보존한다. 역이었다면 다시 골라도 역이다(800m 유지·
      // 목록에서 역 표시). 옛 저장 데이터(kind 없음)와 그 외는 'recent'로
      // 떨어진다 — 마이그레이션이 필요 없다.
      kind: entry.kind === 'station' ? 'station' : 'recent',
      label,
      detail,
      x: hasCoords ? x : null,
      y: hasCoords ? y : null,
      scale: typeof entry.scale === 'string' ? entry.scale : '',
    };
  }

  function readRecents() {
    if (memoryRecents) return memoryRecents.slice();

    const store = storage();
    if (!store) return [];

    try {
      const raw = JSON.parse(store.getItem(RECENT_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.map(validRecent).filter(Boolean).slice(0, RECENT_MAX);
    } catch (error) {
      // 깨진 값이면 조용히 빈 목록이다. 사용자가 고칠 수 있는 문제가 아니다.
      return [];
    }
  }

  function writeRecents(list) {
    const store = storage();
    if (!store) {
      memoryRecents = list;
      return;
    }
    try {
      store.setItem(RECENT_KEY, JSON.stringify(list));
    } catch (error) {
      // 용량 초과·저장 차단. 이번 세션만이라도 기억한다.
      memoryRecents = list;
    }
  }

  function rememberRecent(hit) {
    const entry = validRecent(hit);
    if (!entry) return;

    const rest = readRecents().filter((item) => item.label !== entry.label);
    writeRecents(
      [entry, ...rest].slice(0, RECENT_MAX).map((item) => ({
        label: item.label,
        detail: item.detail,
        x: item.x,
        y: item.y,
        scale: item.scale,
        // station만 저장한다. 'recent'를 저장하면 다음 읽기에서 의미가 없다.
        kind: item.kind === 'station' ? 'station' : '',
      }))
    );
  }

  function clearRecents() {
    memoryRecents = [];
    const store = storage();
    if (!store) return;
    try {
      store.removeItem(RECENT_KEY);
    } catch (error) {
      /* 지우지 못해도 메모리 쪽은 비었다 */
    }
  }

  /* ── 마운트 ─────────────────────────────────────────── */

  /**
   * @param {object} config
   * @param {string} config.inputId    지역 입력. role="combobox"가 여기 붙는다.
   * @param {string} config.panelId    <body> 직속 패널. 필터 바 안에 있으면 안 된다.
   * @param {string} config.listboxId  패널 안의 <ul role="listbox">.
   * @param {string} config.statusId   sr-only 라이브 리전. 절대 hidden이 되면 안 된다.
   * @param {string} config.templateId <template>. 행 마크업은 design 소유다.
   * @param {function} config.onCommit 사용자가 후보를 고르면 호출. hit 하나를 받는다.
   * @returns {{close: function, destroy: function, remember: function}|null}
   *          필수 노드가 없으면 null. 호출자는 그걸 '아직 마크업이 없다'로 읽어야지
   *          오류로 다루면 안 된다.
   */
  function mount(config) {
    const { inputId, panelId, listboxId, statusId, templateId, onCommit } = config || {};

    // 노드를 캐시하지 않는다. design이 search.html을 동시에 편집하는 중일 수 있고,
    // 마크업이 갈리는 순간에도 이 파일이 죽지 않아야 한다 (search.js와 같은 규율).
    const byId = (id) => (id ? document.getElementById(id) : null);
    const input = () => byId(inputId);
    const panel = () => byId(panelId);
    const listbox = () => byId(listboxId);
    const status = () => byId(statusId);

    if (!input() || !panel() || !listbox()) return null;

    let open = false;
    let items = [];
    let activeIndex = -1;
    let composing = false;
    let debounceTimer = null;
    let suggestToken = 0;
    let textBeforeNavigation = '';
    const queryCache = new Map();

    /* ── 라이브 리전 ──────────────────────────────────── */

    function announce(text) {
      const node = status();
      if (node) node.textContent = text;
    }

    /* ── 위치 ─────────────────────────────────────────── */

    /**
     * 패널은 position:fixed고 좌표를 JS가 잡는다. 필터 바는 640px 미만에서
     * 화면 하단 고정, 이상에서 상단 sticky라 방향이 갈린다 —
     * 브레이크포인트를 하드코딩하지 않고 남은 공간을 재서 정한다.
     *
     * 여기서 쓰는 style은 위치와 크기뿐이다. 색·테두리·그림자는 design의 CSS다.
     */
    function positionPanel() {
      const field = input();
      const box = panel();
      if (!field || !box) return;

      const rect = field.getBoundingClientRect();
      const view = window.visualViewport;

      // 소프트 키보드가 올라와도 innerHeight는 안 줄어든다(안드로이드 크롬).
      // visualViewport를 써야 패널이 키보드 뒤로 열리지 않는다.
      const viewTop = view ? view.offsetTop : 0;
      const viewHeight = view ? view.height : window.innerHeight;
      const viewBottom = viewTop + viewHeight;

      const spaceBelow = viewBottom - rect.bottom - VIEWPORT_GAP;
      const spaceAbove = rect.top - viewTop - VIEWPORT_GAP;
      const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;

      const room = Math.max(120, openUp ? spaceAbove : spaceBelow);

      // 입력보다 넓힐 수 있다. 다만 화면 밖으로는 못 나가므로 오른쪽이 모자라면
      // 왼쪽으로 당긴다 — 좁은 화면에서는 결국 화면 폭에 맞춰진다.
      const maxWidth = document.documentElement.clientWidth - VIEWPORT_GAP * 2;
      const width = Math.min(Math.max(rect.width, PANEL_MIN_W), maxWidth);
      const left = Math.min(rect.left, document.documentElement.clientWidth - VIEWPORT_GAP - width);

      box.style.left = `${Math.round(Math.max(VIEWPORT_GAP, left))}px`;
      box.style.width = `${Math.round(width)}px`;
      box.style.maxHeight = `${Math.round(Math.min(PANEL_MAX_H, room))}px`;

      if (openUp) {
        box.style.top = 'auto';
        box.style.bottom = `${Math.round(window.innerHeight - rect.top + 8)}px`;
      } else {
        box.style.bottom = 'auto';
        box.style.top = `${Math.round(rect.bottom + 8)}px`;
      }
    }

    const reposition = () => {
      if (open) positionPanel();
    };

    function bindViewport(on) {
      const method = on ? 'addEventListener' : 'removeEventListener';
      window[method]('resize', reposition, { passive: true });
      window[method]('scroll', reposition, { passive: true });
      window[method]('orientationchange', reposition, { passive: true });
      if (window.visualViewport) {
        window.visualViewport[method]('resize', reposition, { passive: true });
        window.visualViewport[method]('scroll', reposition, { passive: true });
      }
    }

    /* ── 렌더 ─────────────────────────────────────────── */

    function setActive(index) {
      activeIndex = index;
      const list = listbox();
      const field = input();
      if (!list || !field) return;

      const rows = [...list.children];
      rows.forEach((row, i) => {
        const on = i === index;
        row.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) {
          // behavior:'smooth'를 주지 않는다 — prefers-reduced-motion에서도
          // 스크롤이 튀지 않아야 하고, 목록 이동은 즉시가 맞다.
          row.scrollIntoView({ block: 'nearest' });
        }
      });

      const active = rows[index];
      if (active && active.id) field.setAttribute('aria-activedescendant', active.id);
      // 빈 문자열을 남기지 않고 속성 자체를 뗀다. 빈 값은 '없는 id를 가리킴'이 된다.
      else field.removeAttribute('aria-activedescendant');
    }

    /**
     * 행을 그린다. 템플릿을 복제하고 [data-field]에 textContent만 쓴다 —
     * 여기 들어오는 값은 카카오에서 온 남의 데이터이고, 목록은 키 입력마다
     * 다시 그려진다. innerHTML 문자열 조립을 하지 않는다.
     */
    function renderRows(list) {
      const box = listbox();
      const template = byId(templateId);
      if (!box) return;

      box.textContent = '';

      list.forEach((hit, index) => {
        let row;
        if (template && template.content && template.content.firstElementChild) {
          row = template.content.firstElementChild.cloneNode(true);
        } else {
          // 템플릿이 아직 없어도(design 편집 중) 목록은 동작해야 한다.
          row = document.createElement('li');
          row.setAttribute('role', 'option');
          const label = document.createElement('span');
          label.setAttribute('data-field', 'label');
          const detail = document.createElement('span');
          detail.setAttribute('data-field', 'detail');
          row.append(label, detail);
        }

        row.id = `${listboxId}-opt-${index}`;
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', 'false');
        row.dataset.index = String(index);
        // 역·최근 같은 종류 구분은 styles.css가 [data-kind]로 그린다. JS는 속성만 단다.
        row.dataset.kind = hit.kind || '';

        const labelNode = row.querySelector('[data-field="label"]');
        if (labelNode) labelNode.textContent = hit.label;

        const detailNode = row.querySelector('[data-field="detail"]');
        if (detailNode) {
          detailNode.textContent = hit.detail || '';
          detailNode.hidden = !hit.detail;
        }

        box.appendChild(row);
      });
    }

    /**
     * @param {Array} list  후보들
     * @param {string} note 목록이 비었을 때 보여줄 안내. 비어 있으면 패널을 닫는다.
     */
    function show(list, note) {
      const box = panel();
      const field = input();
      const emptyNote = box && box.querySelector('[data-region-note]');
      if (!box || !field) return;

      items = list;
      renderRows(list);

      const has = list.length > 0;
      const listNode = listbox();
      if (listNode) listNode.hidden = !has;
      if (emptyNote) {
        emptyNote.textContent = has ? '' : note || '';
        emptyNote.hidden = has;
      }

      if (!has && !note) {
        close();
        return;
      }

      if (!open) bindViewport(true);
      open = true;
      box.hidden = false;
      // 항목이 있을 때만 펼쳐진 것으로 알린다. 고를 게 없는데 expanded를 켜면
      // 스크린리더가 빈 목록으로 안내한다.
      field.setAttribute('aria-expanded', has ? 'true' : 'false');
      positionPanel();
      setActive(-1);
    }

    function close() {
      const box = panel();
      const field = input();
      if (open) bindViewport(false);
      open = false;
      items = [];
      activeIndex = -1;
      if (box) box.hidden = true;
      if (field) {
        field.setAttribute('aria-expanded', 'false');
        field.removeAttribute('aria-activedescendant');
      }
    }

    /* ── 질의 ─────────────────────────────────────────── */

    function recentPanel() {
      const list = readRecents();
      show(list, list.length ? '' : '최근 검색한 지역이 여기 쌓입니다.');
      announce(list.length ? `최근 검색 ${list.length}개` : '');
      syncClearButton(true);
    }

    /**
     * 지우기 버튼은 최근 검색을 보여줄 때만 나온다. 카카오 제안 목록 아래에
     * 걸려 있으면 그 목록을 지우는 버튼처럼 읽힌다.
     */
    function syncClearButton(showing) {
      const box = panel();
      const button = box && box.querySelector('[data-region-clear]');
      if (button) button.hidden = !showing || readRecents().length === 0;
    }

    function query(term) {
      const key = term.trim();
      if (key.length < MIN_QUERY) {
        recentPanel();
        return;
      }

      if (queryCache.has(key)) {
        const cached = queryCache.get(key);
        show(cached, '찾는 지역이 없습니다. 동·구·시 이름으로 써 보세요.');
        syncClearButton(false);
        announce(cached.length ? `제안 ${cached.length}개` : '결과가 없습니다');
        return;
      }

      if (!window.KakaoPlaces || !window.KakaoPlaces.suggestRegions) return;

      const token = (suggestToken += 1);
      announce('불러오는 중');

      window.KakaoPlaces.suggestRegions(key)
        .then((hits) => {
          // 카카오 콜백은 취소가 안 된다. 늦게 온 응답이 새 목록을 덮어쓰는 걸
          // 막는 방법은 토큰 비교뿐이다. 빠르게 치고 지우면 실제로 일어난다.
          if (token !== suggestToken) return;

          queryCache.set(key, hits);
          while (queryCache.size > QUERY_CACHE_MAX) {
            queryCache.delete(queryCache.keys().next().value);
          }

          show(hits, '찾는 지역이 없습니다. 동·구·시 이름으로 써 보세요.');
          syncClearButton(false);
          announce(hits.length ? `제안 ${hits.length}개` : '결과가 없습니다');
        })
        .catch(() => {
          if (token !== suggestToken) return;
          // 제안이 실패해도 검색 자체는 막지 않는다. 조용히 닫고 타이핑한 대로 두면
          // 제출 시 resolveRegionInfo가 다시 시도한다.
          close();
          announce('');
        });
    }

    function scheduleQuery() {
      window.clearTimeout(debounceTimer);
      const field = input();
      if (!field) return;
      const term = field.value;
      debounceTimer = window.setTimeout(() => query(term), DEBOUNCE);
    }

    /* ── 확정 ─────────────────────────────────────────── */

    function commit(hit) {
      const field = input();
      if (!field || !hit) return;

      field.value = hit.label;
      textBeforeNavigation = hit.label;
      close();
      rememberRecent(hit);
      queryCache.clear();

      if (typeof onCommit === 'function') {
        onCommit({
          label: hit.label,
          detail: hit.detail || '',
          x: hit.x,
          y: hit.y,
          scale: hit.scale || '',
          // 가산적 확장이다 — login.js의 onCommit은 인자를 안 보므로 무해하다.
          kind: hit.kind || '',
        });
      }
    }

    /* ── 이벤트 ───────────────────────────────────────── */

    function onCompositionStart() {
      composing = true;
    }

    function onCompositionEnd() {
      composing = false;
      // 조합이 끝난 시점에 딱 한 번 던진다.
      scheduleQuery();
    }

    function onInput(event) {
      // 한글은 자모마다 input이 뜬다. '성수동'이면 일곱 번이다.
      // 조합 중에는 넘기고 compositionend에서 한 번만 조회한다.
      if (composing || event.isComposing) return;
      scheduleQuery();
    }

    function move(delta) {
      if (!items.length) return;
      const next = activeIndex < 0
        ? (delta > 0 ? 0 : items.length - 1)
        : (activeIndex + delta + items.length) % items.length;
      const field = input();
      if (field && activeIndex < 0) textBeforeNavigation = field.value;
      setActive(next);
    }

    function onKeyDown(event) {
      const field = input();
      if (!field) return;

      // IME 후보를 확정하는 Enter가 keydown으로 온다(isComposing true / keyCode 229).
      // 그냥 흘려보내면 안 된다 — 항목 확정으로 받으면 반쯤 친 지역이 확정되고,
      // 막지 않으면 네이티브 제출이 일어나 반쯤 친 지역으로 검색이 나간다.
      // 조합을 끝내는 키였을 뿐이므로 둘 다 하지 않는다.
      if (composing || event.isComposing || event.keyCode === 229) {
        if (event.key === 'Enter') event.preventDefault();
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (!open) {
            if (field.value.trim().length >= MIN_QUERY) query(field.value);
            else recentPanel();
          } else {
            move(1);
          }
          break;

        case 'ArrowUp':
          event.preventDefault();
          if (!open) recentPanel();
          else move(-1);
          break;

        case 'Home':
          if (open && items.length) {
            event.preventDefault();
            setActive(0);
          }
          break;

        case 'End':
          if (open && items.length) {
            event.preventDefault();
            setActive(items.length - 1);
          }
          break;

        case 'Enter':
          // 활성 항목이 있을 때만 가로챈다. 없으면 막지 않고 네이티브 제출로
          // 넘긴다 — 막으면 타이핑한 텍스트로는 검색을 못 하게 된다.
          if (open && activeIndex >= 0 && items[activeIndex]) {
            event.preventDefault();
            commit(items[activeIndex]);
          }
          break;

        case 'Escape':
          if (open) {
            event.preventDefault();
            event.stopPropagation();
            if (activeIndex >= 0) field.value = textBeforeNavigation;
            close();
          }
          break;

        case 'Tab': {
          if (!open) break;

          // 패널 안의 "최근 검색 전체 지우기"는 포커스 가능한 버튼인데, 여기서
          // 무조건 닫으면 패널이 display:none이 되어 키보드로는 닿을 방법이
          // 아예 없었다(WCAG 2.1.1). 마우스 전용 기능이었다.
          //
          // 그냥 닫지 않고 넘기는 것만으로는 부족하다 — #region-panel은 문서 끝에
          // 있고 화면 위치만 JS가 계산해 얹으므로, 순차 Tab으로는 페이지를 거의
          // 다 지나야 닿는다. 보이는 순서와 맞도록 포커스를 직접 옮긴다.
          // 여기서 나가는 Tab은 onBlur가 받아 패널을 닫는다.
          const box = panel();
          const clearBtn = box && box.querySelector('[data-region-clear]');
          if (clearBtn && !clearBtn.hidden && !event.shiftKey && activeIndex < 0) {
            event.preventDefault();
            clearBtn.focus();
            break;
          }

          // 확정하지 않고 닫는다. 탐색은 선택이 아니다.
          close();
          break;
        }

        default:
          break;
      }
    }

    function onFocus() {
      const field = input();
      if (!field) return;
      textBeforeNavigation = field.value;
      if (field.value.trim().length >= MIN_QUERY) query(field.value);
      else recentPanel();
    }

    function onListPointerDown(event) {
      // click보다 blur가 먼저 오면 패널이 닫혀 선택이 사라진다.
      if (event.target.closest('[role="option"]')) event.preventDefault();
    }

    function onListClick(event) {
      const row = event.target.closest('[role="option"]');
      const box = listbox();
      if (!row || !box || !box.contains(row)) return;
      const hit = items[Number(row.dataset.index)];
      if (hit) commit(hit);
    }

    function onPanelClick(event) {
      if (!event.target.closest('[data-region-clear]')) return;
      clearRecents();
      queryCache.clear();
      recentPanel();
      const field = input();
      if (field) field.focus();
    }

    function onDocumentPointerDown(event) {
      if (!open) return;
      const field = input();
      const box = panel();
      if (field && field.contains(event.target)) return;
      if (box && box.contains(event.target)) return;
      close();
    }

    function onBlur(event) {
      const box = panel();
      // 패널 안으로 옮겨 가는 포커스는 닫을 이유가 아니다.
      if (box && event.relatedTarget && box.contains(event.relatedTarget)) return;
      close();
    }

    /* ── 배선 ─────────────────────────────────────────── */

    const field = input();
    const box = panel();
    const list = listbox();

    field.setAttribute('role', 'combobox');
    field.setAttribute('aria-expanded', 'false');
    field.setAttribute('aria-controls', listboxId);
    field.setAttribute('aria-autocomplete', 'list');
    field.setAttribute('aria-haspopup', 'listbox');
    field.setAttribute('autocomplete', 'off');
    field.setAttribute('autocapitalize', 'off');
    field.setAttribute('autocorrect', 'off');
    field.setAttribute('spellcheck', 'false');

    field.addEventListener('input', onInput);
    field.addEventListener('compositionstart', onCompositionStart);
    field.addEventListener('compositionend', onCompositionEnd);
    field.addEventListener('keydown', onKeyDown);
    field.addEventListener('focus', onFocus);
    field.addEventListener('blur', onBlur);
    list.addEventListener('pointerdown', onListPointerDown);
    list.addEventListener('click', onListClick);
    box.addEventListener('click', onPanelClick);
    document.addEventListener('pointerdown', onDocumentPointerDown);

    close();
    syncClearButton(false);

    return {
      close,

      /** 타이핑한 채로 검색이 성공했을 때 호출자가 최근 검색에 남긴다. */
      remember: rememberRecent,

      destroy() {
        window.clearTimeout(debounceTimer);
        bindViewport(false);
        field.removeEventListener('input', onInput);
        field.removeEventListener('compositionstart', onCompositionStart);
        field.removeEventListener('compositionend', onCompositionEnd);
        field.removeEventListener('keydown', onKeyDown);
        field.removeEventListener('focus', onFocus);
        field.removeEventListener('blur', onBlur);
        list.removeEventListener('pointerdown', onListPointerDown);
        list.removeEventListener('click', onListClick);
        box.removeEventListener('click', onPanelClick);
        document.removeEventListener('pointerdown', onDocumentPointerDown);
        close();
      },
    };
  }

  // recents는 읽기 전용 공개다. search.js의 "최근 거점" 칩이 저장소 로직을
  // 복제하지 않고 이걸 읽는다 — 쓰기(remember)는 계속 콤보박스만 한다.
  window.RegionCombobox = { mount, recents: readRecents };
})();
