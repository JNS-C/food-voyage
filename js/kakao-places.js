/**
 * 카카오 로컬 검색 래퍼 (Maps JS SDK, services 라이브러리).
 *
 * 이 파일은 DOM을 모른다. 지역명·키워드·카테고리를 받아 앱 모델 배열을 돌려주는
 * 것까지가 전부다. 상태 표시·렌더는 search.js가 한다.
 *
 * IIFE로 감싼다. search.html에서 이 파일과 search.js가 같은 전역을 공유하므로
 * 내부 헬퍼(readKey·pickCategory 같은 흔한 이름)를 밖에 흘리면 언젠가 부딪힌다.
 * 밖으로 내보내는 것은 window.KakaoPlaces 하나뿐이다.
 */
(() => {
  'use strict';

  /** autoload=false로 받아 kakao.maps.load()로 직접 초기화한다. */
  const SDK_URL = '//dapi.kakao.com/v2/maps/sdk.js';

  /** size 15는 카카오 상한이다. 더 달라고 해도 15개만 온다. */
  const SIZE = 15;

  /**
   * 지역 크기별 반경·정렬.
   *
   * walk의 1500은 8/21 이전의 고정 반경 그대로다 — 동네 단위 검색 결과가
   * 변경 전후로 같아야 이 표가 맞게 붙었는지 확인할 수 있다.
   *
   * 정렬을 같이 바꾸는 게 핵심이다. size가 15로 막혀 있어서 반경만 넓히면
   * 아무 일도 안 일어난다. '서울특별시'를 20km 거리순으로 찾으면 시청 주변
   * 15곳만 온다 — 넓은 지역에서는 중심에서 가까운 것보다 질의에 맞는 것이 답이다.
   */
  const SCALE_RADIUS = { walk: 1500, wide: 5000, broad: 20000 };
  const SCALE_SORT = { walk: 'DISTANCE', wide: 'ACCURACY', broad: 'ACCURACY' };
  const DEFAULT_SCALE = 'walk';

  /** 카카오 상한. 넘겨 보내면 요청 자체가 거절된다. */
  const RADIUS_MAX = 20000;

  /** 제안 목록 상한. 드롭다운이 화면을 다 먹지 않을 만큼. */
  const SUGGEST_LIMIT = 8;

  /**
   * coordCache 소프트 상한. 자유 입력이 되면서 키가 사용자 텍스트가 됐다.
   * 고정 6개일 땐 없어도 됐지만 이제는 안 두면 무한정 자란다.
   */
  const COORD_CACHE_MAX = 100;

  /** category_group_code 형태(FD6·CE7…)인지. 아니면 키워드로 취급한다. */
  const GROUP_CODE = /^[A-Z]{2}\d$/;

  /** 주소 조각에서 동네로 읽을 만한 꼬리. 앞쪽이 우선순위가 높다. */
  const NEIGHBORHOOD_SUFFIX = [/(동|가)$/, /(로|길)$/];

  /** SDK는 한 번만 주입한다. 여러 번 검색해도 <script>는 하나다. */
  let sdkPromise = null;

  /** 지역명 → Promise<{x, y, scale}>. 같은 동네를 다시 고를 때 지오코딩을 반복하지 않는다. */
  const coordCache = new Map();

  /* ── 유틸 ───────────────────────────────────────────── */

  /**
   * code를 붙인 Error. search.js가 message를 파싱하지 않고 code로만 분기한다 —
   * 문구는 언제든 바뀔 수 있지만 code는 계약이다.
   */
  function fail(message, code) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  /**
   * config.js가 배포에서 누락되면 404가 나고, search.html의 onerror가
   * __kakaoConfigMissing을 세운다. 키가 빈 문자열일 때와 같은 취급이다.
   */
  function readKey() {
    if (window.__kakaoConfigMissing) return '';
    return typeof window.KAKAO_JS_KEY === 'string' ? window.KAKAO_JS_KEY.trim() : '';
  }

  /* ── SDK 주입 ───────────────────────────────────────── */

  function loadSdk() {
    if (sdkPromise) return sdkPromise;

    const key = readKey();
    if (!key) {
      // 이 실패는 캐시하지 않는다. 키를 채우고 새로고침하면 그때 다시 시도해야 한다.
      return Promise.reject(fail('카카오 JavaScript 키가 없습니다.', 'NO_KEY'));
    }

    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      // 키가 런타임 값이라 <script src>를 HTML에 박을 수 없다. 그래서 동적 주입이다.
      script.src = `${SDK_URL}?appkey=${encodeURIComponent(key)}&libraries=services&autoload=false`;
      script.async = true;

      script.onload = () => {
        // autoload=false이므로 스크립트 로드 완료가 초기화 완료는 아니다.
        // kakao.maps.load 콜백까지 기다려야 services가 준비된다.
        if (!window.kakao || !window.kakao.maps) {
          sdkPromise = null;
          reject(fail('카카오 SDK 초기화에 실패했습니다.', 'SDK_LOAD'));
          return;
        }
        window.kakao.maps.load(() => resolve(window.kakao));
      };

      script.onerror = () => {
        // 실패한 Promise를 캐시에 남기면 재시도가 영영 막힌다.
        // 도메인 미등록·네트워크 끊김 모두 여기로 온다.
        sdkPromise = null;
        reject(fail('카카오 SDK를 불러오지 못했습니다.', 'SDK_LOAD'));
      };

      document.head.appendChild(script);
    });

    return sdkPromise;
  }

  /* ── 지역 해석 ──────────────────────────────────────── */

  /**
   * 주소 항목이 얼마나 넓은 곳을 가리키는지 읽는다.
   *
   * 카카오 응답은 행정 단위를 depth로 준다. 3depth(동·가·리)까지 있으면 동네,
   * 2depth(구·시·군)까지면 그보다 넓고, 1depth(시·도)만 있으면 통째로 넓다.
   * 도로명주소가 붙어 있으면 지점을 특정한 것이니 동네로 본다.
   */
  function scaleOf(item) {
    if (!item) return DEFAULT_SCALE;

    const address = item.address || item;
    if (item.road_address) return 'walk';

    const type = String(item.address_type || '');
    if (type === 'ROAD' || type === 'ROAD_ADDR') return 'walk';

    if (String(address.region_3depth_name || '').trim()) return 'walk';
    if (String(address.region_2depth_name || '').trim()) return 'wide';
    if (String(address.region_1depth_name || '').trim()) return 'broad';
    return DEFAULT_SCALE;
  }

  /**
   * 조회 결과 하나를 제안 항목으로 옮긴다.
   *
   * detail은 장식이 아니라 구분 수단이다. '성수동'은 서울에도 있고 다른 시에도
   * 있어서, 두 번째 줄이 없으면 목록에서 어느 쪽인지 고를 수가 없다.
   */
  function toRegionHit(item, kind) {
    const isPlace = kind === 'place';
    const label = isPlace ? item.place_name : item.address_name;
    const detail = isPlace
      ? item.road_address_name || item.address_name || ''
      : (item.road_address && item.road_address.address_name) || '';

    const cleanLabel = String(label || '').trim();
    const cleanDetail = String(detail || '').trim();

    return {
      id: `${kind}:${item.id || cleanLabel}`,
      kind,
      label: cleanLabel,
      // 도로명은 label과 같은 문자열로 오는 일이 잦다('서울 성동구 연무장길').
      // 같은 줄을 두 번 쓰면 구분에 도움이 안 되고 행만 두 배로 높아진다.
      detail: cleanDetail === cleanLabel ? '' : cleanDetail,
      x: item.x,
      y: item.y,
      // 장소 검색으로 잡힌 통칭('정발산'·'연무장길')은 깊이 정보가 없다.
      // 그런 이름은 원래 동네 규모라 walk가 맞다.
      scale: isPlace ? 'walk' : scaleOf(item),
      code: isPlace ? String(item.category_group_code || '') : '',
    };
  }

  /**
   * 지역명 → 주소 후보들. 하드코딩한 좌표표를 두지 않는다 — 지역 목록이 바뀌어도
   * JS를 따라 고칠 필요가 없어야 한다.
   *
   * ZERO_RESULT든 ERROR든 구분하지 않고 빈 배열이다. 어느 쪽이든 다음 수단
   * (장소 검색)으로 넘어가는 게 유일한 대응이다.
   */
  function addressSearchAll(kakao, query) {
    return new Promise((resolve) => {
      new kakao.maps.services.Geocoder().addressSearch(query, (result, status) => {
        const ok = status === kakao.maps.services.Status.OK && Array.isArray(result);
        resolve(ok ? result.slice(0, SUGGEST_LIMIT).map((item) => toRegionHit(item, 'address')) : []);
      });
    });
  }

  /**
   * 주소로 못 찾는 지역명의 폴백. '정발산'·'연무장길'처럼 행정구역명이 아니라
   * 통칭인 동네는 addressSearch가 못 잡고 장소 검색이 잡는다.
   */
  function placeSearchAll(kakao, query) {
    return new Promise((resolve, reject) => {
      new kakao.maps.services.Places().keywordSearch(query, (data, status) => {
        const Status = kakao.maps.services.Status;
        if (status === Status.OK && Array.isArray(data)) {
          resolve(data.slice(0, SUGGEST_LIMIT).map((item) => toRegionHit(item, 'place')));
        } else if (status === Status.ZERO_RESULT) {
          resolve([]);
        } else {
          reject(fail('지역 좌표를 조회하지 못했습니다.', 'REGION_ERROR'));
        }
      });
    });
  }

  /** 캐시가 상한을 넘으면 가장 오래된 키부터 버린다. Map은 삽입 순서를 유지한다. */
  function trimCoordCache() {
    while (coordCache.size > COORD_CACHE_MAX) {
      coordCache.delete(coordCache.keys().next().value);
    }
  }

  /**
   * 지역명 하나를 중심점으로 확정한다. suggestRegions와 달리 **순차**다 —
   * 주소로 잡히면 장소 검색은 아예 보내지 않는다. 제출 때마다 병렬로 두 번
   * 던지면 드롭다운이 이미 해결해 둔 값을 위해 요청이 두 배가 된다.
   */
  function resolveRegionInfo(kakao, region) {
    if (coordCache.has(region)) return coordCache.get(region);

    // 값이 아니라 Promise를 캐시한다. 칩을 연타해 검색이 겹쳐도 지오코딩은 한 번이다.
    const pending = addressSearchAll(kakao, region)
      .then((hits) => (hits.length ? hits : placeSearchAll(kakao, region)))
      .then((hits) => {
        const hit = hits[0];
        if (!hit) throw fail(`'${region}' 위치를 찾지 못했습니다.`, 'REGION_NOT_FOUND');
        return { x: hit.x, y: hit.y, scale: hit.scale };
      })
      .catch((error) => {
        // 실패를 캐시에 남기면 같은 지역을 다시 쳐도 영영 안 된다.
        coordCache.delete(region);
        throw error;
      });

    coordCache.set(region, pending);
    trimCoordCache();
    return pending;
  }

  /**
   * 지역스러운 결과를 위로 올린다. 하드 필터를 쓰지 않는 이유가 있다 —
   * 음식점·카페를 잘라내면 '연무장길'처럼 카테고리에 걸려 색인된 통칭까지
   * 같이 죽는다. 순서만 바꾸고 목록에는 남긴다.
   */
  const REGIONISH_CODE = /^(SW8|AT4|PO3|CT1)$/;

  function suggestRank(hit) {
    if (hit.kind === 'address') return 0;
    if (!hit.code) return 1;
    if (REGIONISH_CODE.test(hit.code)) return 2;
    return 3;
  }

  /**
   * 장소 결과에 걸 상한. '강남구'를 치면 주소 1건이 정답이고 나머지 자리는
   * 카지노·타워 같은 랜드마크가 채운다 — 지역을 고르는 목록에서는 소음이다.
   * 반대로 '정발산'은 장소 쪽이 답일 수 있어서 0으로 막지는 않는다.
   */
  const SUGGEST_PLACE_LIMIT = 3;

  /**
   * 입력 중인 텍스트로 지역 후보를 모은다. 여기는 **병렬**이다 — 사용자가
   * 기다리는 중이고, 주소로 잡히는 이름인지 아닌지를 미리 알 수 없다.
   *
   * coordCache에는 쓰지 않는다. 그 캐시는 확정된 중심점 하나를 담는 자리고,
   * 여기서 나오는 건 아직 고르지 않은 후보 목록이다.
   *
   * @returns {Promise<Array<{id, kind, label, detail, x, y, scale}>>}
   */
  function suggestRegions(query) {
    const term = String(query || '').trim();
    if (!term) return Promise.resolve([]);

    return loadSdk().then((kakao) =>
      Promise.all([
        addressSearchAll(kakao, term),
        // 장소 검색이 실패해도 주소 결과는 살린다. 절반이라도 보여주는 게 낫다.
        placeSearchAll(kakao, term).catch(() => []),
      ]).then(([addresses, places]) => {
        const seen = new Set();
        const usable = (hit) => {
          if (!hit.label || !Number.isFinite(Number(hit.x))) return false;
          // 같은 지점을 주소와 장소가 각각 물고 오는 일이 흔하다.
          const key = `${Number(hit.x).toFixed(5)}|${Number(hit.y).toFixed(5)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        };

        // 주소를 먼저 흘려 seen을 채운다. 중복이면 장소 쪽이 떨어지는 게 맞다.
        const kept = addresses.filter(usable);
        const extra = places.filter(usable).sort((a, b) => suggestRank(a) - suggestRank(b));

        return [...kept, ...extra.slice(0, SUGGEST_PLACE_LIMIT)].slice(0, SUGGEST_LIMIT);
      })
    );
  }

  /* ── 정규화 ─────────────────────────────────────────── */

  /**
   * 주소에서 동네 조각 하나를 뽑는다.
   *
   * 지번주소를 도로명주소보다 먼저 본다. 카드의 칩에 들어갈 값은 '정발산동'이지
   * '중앙로1275번길'이 아니다 — 도로명주소만 보면 후자가 걸린다.
   * 둘 다 실패하면 호출자가 고른 지역명을 그대로 쓴다. 빈 칩보다 낫다.
   */
  function pickNeighborhood(place, fallback) {
    const tokens = `${place.address_name || ''} ${place.road_address_name || ''}`
      .split(' ')
      .map((token) => token.trim())
      .filter(Boolean);

    for (const suffix of NEIGHBORHOOD_SUFFIX) {
      const hit = tokens.find((token) => suffix.test(token));
      if (hit) return hit;
    }
    return fallback;
  }

  /**
   * '음식점 > 한식 > 육류,고기' → '한식'.
   * index 0('음식점')은 카드마다 똑같이 반복돼 정보가 없고, index 2는 너무 잘다.
   */
  function pickCategory(categoryName) {
    const parts = String(categoryName || '')
      .split('>')
      .map((part) => part.trim())
      .filter(Boolean);
    return parts[1] || parts[0] || '';
  }

  function normalize(place, fallbackRegion) {
    return {
      id: place.id,
      name: place.place_name,
      neighborhood: pickNeighborhood(place, fallbackRegion),
      category: pickCategory(place.category_name),
      address: place.road_address_name || place.address_name || '',
      x: place.x,
      y: place.y,
      url: place.place_url,
    };
  }

  /* ── 검색 ───────────────────────────────────────────── */

  /** 카카오의 콜백 API를 Promise로 감싼다. ZERO_RESULT는 실패가 아니라 빈 결과다. */
  function runSearch(kakao, method, query, options) {
    return new Promise((resolve, reject) => {
      const places = new kakao.maps.services.Places();
      places[method](query, (data, status) => {
        const Status = kakao.maps.services.Status;
        if (status === Status.OK) resolve(data || []);
        else if (status === Status.ZERO_RESULT) resolve([]);
        else reject(fail('가게 목록을 불러오지 못했습니다.', 'SEARCH_ERROR'));
      }, options);
    });
  }

  /**
   * 미리 받아둔 중심점을 검증한다.
   *
   * center는 localStorage(최근 검색)에서 올 수 있다. 같은 출처에서 누구나
   * 고쳐 쓸 수 있는 값이므로 믿지 않는다 — 좌표가 수가 아니면 통째로 버리고
   * 지오코딩부터 다시 하고, scale만 모르는 값이면 동네 규모로 떨어뜨린다.
   */
  function validCenter(center) {
    if (!center) return null;
    const x = Number(center.x);
    const y = Number(center.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    const scale = SCALE_RADIUS[center.scale] ? center.scale : DEFAULT_SCALE;
    return { x, y, scale };
  }

  /**
   * 지역 안에서 가게를 찾는다.
   *
   * @param {object} params
   * @param {string} params.region         지역 이름. 좌표의 기준이자 카드 칩의 폴백이다.
   * @param {object} [params.center]       {x, y, scale}. 드롭다운에서 고르거나 최근 검색에서
   *                                       왔다면 좌표를 이미 아는 것이므로 지오코딩을 건너뛴다.
   *                                       없으면(직접 타이핑·딥링크·JS 없는 GET) region으로 해석한다.
   * @param {string} [params.keyword]      검색어. 비어 있으면 카테고리만으로 찾는다.
   * @param {string} [params.categoryCode] FD6·CE7 같은 코드형만. 한식·일식 같은
   *                                       말형 카테고리는 호출자가 keyword에 합쳐 보낸다.
   * @returns {Promise<Array<{id, name, neighborhood, category, address, x, y, url}>>}
   */
  function searchPlaces({ region, center = null, keyword = '', categoryCode = '' } = {}) {
    const term = String(keyword || '').trim();
    const code = GROUP_CODE.test(categoryCode) ? categoryCode : '';
    const known = validCenter(center);

    return loadSdk()
      .then((kakao) =>
        (known ? Promise.resolve(known) : resolveRegionInfo(kakao, region)).then((coords) => ({
          kakao,
          coords,
        }))
      )
      .then(({ kakao, coords }) => {
        const scale = SCALE_RADIUS[coords.scale] ? coords.scale : DEFAULT_SCALE;
        const options = {
          x: coords.x,
          y: coords.y,
          radius: Math.min(SCALE_RADIUS[scale], RADIUS_MAX),
          size: SIZE,
          // 동네 규모에서는 정확도보다 거리다 — 멀리 있는 유명한 곳은 답이 아니다.
          // 그보다 넓어지면 반대가 된다. SCALE_SORT 주석 참조.
          sort: kakao.maps.services.SortBy[SCALE_SORT[scale]],
        };

        if (term) {
          // 코드가 있으면 같이 걸어 '파스타'가 카페까지 긁어 오는 걸 막는다.
          const withCode = code ? Object.assign({}, options, { category_group_code: code }) : options;
          return runSearch(kakao, 'keywordSearch', term, withCode);
        }

        // 키워드가 비었을 때만 categorySearch를 쓸 수 있다. 코드가 없으면
        // 음식점 전체(FD6)로 떨어뜨린다 — 빈 화면보다 그 지역 목록이 낫다.
        return runSearch(kakao, 'categorySearch', code || 'FD6', options);
      })
      .then((data) => data.map((place) => normalize(place, region)));
  }

  /**
   * 키가 준비돼 있는지만 동기로 답한다. SDK를 건드리지 않으므로 요청이 나가지 않는다.
   *
   * search.js가 페이지 로드 시점에 state-nokey를 띄우려면 검색을 돌려 보기 전에
   * 알아야 한다. 판정 로직을 저쪽에 복제하면 config.js의 규약이 두 군데로 갈린다.
   */
  function hasKey() {
    return readKey() !== '';
  }

  window.KakaoPlaces = { searchPlaces, suggestRegions, hasKey };
})();
