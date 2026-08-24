/**
 * 검색 결과 지도 (search.html 전용).
 *
 * 이 파일은 검색을 모른다. meta(중심·반경)와 places 배열을 받아 그리고,
 * 핀 클릭을 onSelect 콜백으로 알리는 것까지가 전부다. 상태 전환·행 강조는
 * search.js가 한다.
 *
 * SDK는 js/kakao-places.js의 loadSdk를 같이 쓴다 — 두 번째 <script> 주입 없이
 * sdkPromise 캐시를 공유한다. 지도 코어(kakao.maps.Map)는 services 라이브러리와
 * 같은 SDK에 이미 들어 있다.
 *
 * 지도 생성은 lazy다. 컨테이너 크기가 0일 때 Map을 만들면 타일이 깨진 채로
 * 뜬다 — 모바일에서 지도 패널은 data-open 전까지 display:none이므로, 실제로
 * 보이는 순간에만 만든다. 모든 공개 함수는 미로드·미마운트에서 no-op이다.
 *
 * IIFE로 감싼다. 밖으로 내보내는 것은 window.FvSearchMap 하나뿐이다.
 */
(() => {
  'use strict';

  /** setBounds 여백(px). 핀이 모서리에 붙지 않을 만큼. */
  const FIT_PADDING = 48;

  let config = null;        // { containerId, onSelect }
  let kakaoRef = null;
  let map = null;
  let building = false;     // loadSdk 진행 중 재진입 가드

  let circle = null;
  let centerOverlay = null;
  let popover = null;
  let pins = [];            // { id, overlay, el, place, pos }

  let lastMeta = null;
  let lastPlaces = [];

  function container() {
    return config ? document.getElementById(config.containerId) : null;
  }

  /** display:none이면 0이다 — 그때 Map을 만들면 안 된다. */
  function isVisible(node) {
    return !!node && node.offsetWidth > 0 && node.offsetHeight > 0;
  }

  /** search.js의 표기와 같은 규칙. 페이지 간이 아니라 파일 간이지만, DOM 계약이
      아닌 순수 표기라 복제가 결합보다 싸다. */
  function fmtDistance(value) {
    const m = Number(value);
    if (!Number.isFinite(m)) return '';
    return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1).replace(/\.0$/, '')}km`;
  }

  /* ── 지도 생성 ──────────────────────────────────────── */

  function ensureMap() {
    if (map) return Promise.resolve(true);
    const box = container();
    if (!box || !isVisible(box)) return Promise.resolve(false);
    if (!window.KakaoPlaces || typeof window.KakaoPlaces.loadSdk !== 'function') {
      return Promise.resolve(false);
    }
    if (building) return Promise.resolve(false);

    building = true;
    return window.KakaoPlaces.loadSdk()
      .then((kakao) => {
        building = false;
        if (map) return true;
        kakaoRef = kakao;
        map = new kakao.maps.Map(box, {
          // 초기 중심은 곧 draw()의 setBounds가 덮는다. 아무 값이나 유효하면 된다.
          center: new kakao.maps.LatLng(37.5665, 126.978),
          level: 5,
        });
        // 핀 밖(빈 지도)을 누르면 팝오버만 닫는다. 행 선택 해제까지 번지게 하지
        // 않는다 — 지도를 끌다 잘못 닿는 일이 흔하다.
        kakao.maps.event.addListener(map, 'click', closePopover);
        return true;
      })
      .catch(() => {
        building = false;
        return false;
      });
  }

  /* ── 오버레이 ───────────────────────────────────────── */

  function closePopover() {
    if (popover) popover.setMap(null);
    popover = null;
  }

  function clearOverlays() {
    pins.forEach((pin) => pin.overlay.setMap(null));
    pins = [];
    if (circle) circle.setMap(null);
    circle = null;
    if (centerOverlay) centerOverlay.setMap(null);
    centerOverlay = null;
    closePopover();
  }

  function markSelected(id) {
    pins.forEach((pin) => {
      if (id && pin.id === id) pin.el.dataset.selected = 'true';
      else delete pin.el.dataset.selected;
    });
  }

  function buildPopover(place) {
    const box = document.createElement('div');
    box.className = 'map-popover';

    const name = document.createElement('p');
    name.className = 'map-popover-name';
    name.textContent = place.name;

    const meta = document.createElement('p');
    meta.className = 'map-popover-meta';
    meta.textContent = [place.category, fmtDistance(place.distance)].filter(Boolean).join(' · ');

    box.append(name, meta);

    // 담기는 여기 없다 — 핀 클릭이 어차피 목록의 행을 강조·스크롤하므로
    // 담기는 행에서 누른다. FvSaved의 위임 계약(#result-grid)을 안 건드린다.
    if (place.url) {
      const link = document.createElement('a');
      link.className = 'map-popover-link';
      link.href = place.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = '카카오맵에서 보기';
      box.appendChild(link);
    }
    return box;
  }

  function draw() {
    if (!map || !kakaoRef || !lastMeta) return;
    clearOverlays();
    const kakao = kakaoRef;

    const center = new kakao.maps.LatLng(lastMeta.y, lastMeta.x);

    // 검색 반경. 실제로 나간 반경(meta.radius)만 그린다 — 화면과 요청이 같은 말을 한다.
    circle = new kakao.maps.Circle({
      center,
      radius: lastMeta.radius,
      strokeWeight: 2,
      strokeColor: '#B86B32',
      strokeOpacity: 0.55,
      strokeStyle: 'shortdash',
      fillColor: '#B86B32',
      fillOpacity: 0.06,
    });
    circle.setMap(map);

    const dot = document.createElement('div');
    dot.className = 'map-center-dot';
    dot.setAttribute('aria-hidden', 'true');
    centerOverlay = new kakao.maps.CustomOverlay({ position: center, content: dot, zIndex: 2 });
    centerOverlay.setMap(map);

    const bounds = new kakao.maps.LatLngBounds();
    bounds.extend(center);

    lastPlaces.forEach((place, i) => {
      const x = Number(place.x);
      const y = Number(place.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;

      const pos = new kakao.maps.LatLng(y, x);
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'map-pin';
      el.textContent = String(i + 1);   // 핀 번호 = 목록 순서
      el.setAttribute('aria-label', `${i + 1}번 ${place.name}`);
      el.addEventListener('click', () => {
        select(place.id, { pan: false });
        if (config && typeof config.onSelect === 'function') config.onSelect(String(place.id));
      });

      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: el,
        zIndex: 3,
        // 핀 클릭이 지도 클릭(팝오버 닫기)으로 새지 않게 한다
        clickable: true,
      });
      overlay.setMap(map);
      pins.push({ id: String(place.id), overlay, el, place, pos });
      bounds.extend(pos);
    });

    map.relayout();
    map.setBounds(bounds, FIT_PADDING);
  }

  /* ── 공개 API ───────────────────────────────────────── */

  function mount(options) {
    config = options || null;
  }

  /**
   * 검색 결과 반영. 패널이 아직 안 보이면(모바일 지도 닫힘) 지도를 만들지 않고
   * 데이터만 보관한다 — 나중에 다시 update가 불리면 그때 만든다.
   */
  function update(meta, places) {
    lastMeta = meta || null;
    lastPlaces = Array.isArray(places) ? places : [];
    if (!lastMeta) {
      if (map) clearOverlays();
      return;
    }
    ensureMap().then((ok) => {
      if (ok) draw();
    });
  }

  /** 핀 강조 + 팝오버. pan:false면 지도를 움직이지 않는다(핀 클릭 자신). */
  function select(placeId, options) {
    const id = String(placeId || '');
    const pin = pins.find((entry) => entry.id === id);
    markSelected(pin ? id : null);
    closePopover();
    if (!pin || !map || !kakaoRef) return;

    if (!options || options.pan !== false) map.panTo(pin.pos);
    popover = new kakaoRef.maps.CustomOverlay({
      position: pin.pos,
      content: buildPopover(pin.place),
      yAnchor: 1.3,
      zIndex: 4,
      clickable: true,
    });
    popover.setMap(map);
  }

  /** 컨테이너 크기가 바뀐 뒤(토글 열기·lg 진입·리사이즈) 호출한다. */
  function relayout() {
    if (map) {
      map.relayout();
      return;
    }
    // 아직 안 만들어졌다면 — 이제 보이게 됐을 수 있다. 데이터가 있으면 그린다.
    if (lastMeta) {
      ensureMap().then((ok) => {
        if (ok) draw();
      });
    }
  }

  function clear() {
    lastMeta = null;
    lastPlaces = [];
    if (map) clearOverlays();
  }

  window.FvSearchMap = { mount, update, select, relayout, clear };
})();
