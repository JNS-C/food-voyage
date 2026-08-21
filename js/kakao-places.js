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

  /** 동네 검색이므로 반경은 걸어갈 만한 거리로 좁힌다. size 15는 카카오 상한. */
  const RADIUS = 1500;
  const SIZE = 15;

  /** category_group_code 형태(FD6·CE7…)인지. 아니면 키워드로 취급한다. */
  const GROUP_CODE = /^[A-Z]{2}\d$/;

  /** 주소 조각에서 동네로 읽을 만한 꼬리. 앞쪽이 우선순위가 높다. */
  const NEIGHBORHOOD_SUFFIX = [/(동|가)$/, /(로|길)$/];

  /** SDK는 한 번만 주입한다. 여러 번 검색해도 <script>는 하나다. */
  let sdkPromise = null;

  /** 지역명 → {x, y}. 같은 동네를 다시 고를 때 지오코딩을 반복하지 않는다. */
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

  /* ── 좌표 해석 ──────────────────────────────────────── */

  /**
   * 지역명 → 좌표. 하드코딩한 좌표표를 두지 않는다 — design이 select의 동네
   * 목록을 바꿔도 JS를 따라 고칠 필요가 없어야 한다.
   */
  function addressSearch(kakao, query) {
    return new Promise((resolve) => {
      new kakao.maps.services.Geocoder().addressSearch(query, (result, status) => {
        const ok = status === kakao.maps.services.Status.OK && result && result.length > 0;
        // ZERO_RESULT든 ERROR든 여기서는 구분하지 않는다. 어느 쪽이든 다음 수단
        // (장소 검색)으로 넘어가는 게 유일한 대응이다.
        resolve(ok ? { x: result[0].x, y: result[0].y } : null);
      });
    });
  }

  /**
   * 주소로 못 찾은 지역명의 폴백. '정발산'·'연무장길'처럼 행정구역명이 아니라
   * 통칭인 동네는 addressSearch가 못 잡고 장소 검색이 잡는다.
   */
  function placeSearchFirst(kakao, query) {
    return new Promise((resolve, reject) => {
      new kakao.maps.services.Places().keywordSearch(query, (data, status) => {
        const Status = kakao.maps.services.Status;
        if (status === Status.OK && data && data.length > 0) {
          resolve({ x: data[0].x, y: data[0].y });
        } else if (status === Status.ZERO_RESULT) {
          resolve(null);
        } else {
          reject(fail('지역 좌표를 조회하지 못했습니다.', 'REGION_ERROR'));
        }
      });
    });
  }

  function resolveCoords(kakao, region) {
    if (coordCache.has(region)) return coordCache.get(region);

    // 값이 아니라 Promise를 캐시한다. 칩을 연타해 검색이 겹쳐도 지오코딩은 한 번이다.
    const pending = addressSearch(kakao, region)
      .then((hit) => hit || placeSearchFirst(kakao, region))
      .then((hit) => {
        if (!hit) throw fail(`'${region}' 위치를 찾지 못했습니다.`, 'REGION_NOT_FOUND');
        return hit;
      })
      .catch((error) => {
        // 실패를 캐시에 남기면 같은 동네를 다시 골라도 영영 안 된다.
        coordCache.delete(region);
        throw error;
      });

    coordCache.set(region, pending);
    return pending;
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
   * 지역 안에서 가게를 찾는다.
   *
   * @param {object} params
   * @param {string} params.region        select에서 고른 동네 이름. 좌표의 기준이다.
   * @param {string} [params.keyword]     검색어. 비어 있으면 카테고리만으로 찾는다.
   * @param {string} [params.categoryCode] FD6·CE7 같은 코드형만. 한식·일식 같은
   *                                       말형 카테고리는 호출자가 keyword에 합쳐 보낸다.
   * @returns {Promise<Array<{id, name, neighborhood, category, address, x, y, url}>>}
   */
  function searchPlaces({ region, keyword = '', categoryCode = '' } = {}) {
    const term = String(keyword || '').trim();
    const code = GROUP_CODE.test(categoryCode) ? categoryCode : '';

    return loadSdk()
      .then((kakao) => resolveCoords(kakao, region).then((coords) => ({ kakao, coords })))
      .then(({ kakao, coords }) => {
        const options = {
          x: coords.x,
          y: coords.y,
          radius: RADIUS,
          size: SIZE,
          // 동네 검색이므로 정확도보다 거리다. 멀리 있는 유명한 곳은 답이 아니다.
          sort: kakao.maps.services.SortBy.DISTANCE,
        };

        if (term) {
          // 코드가 있으면 같이 걸어 '파스타'가 카페까지 긁어 오는 걸 막는다.
          const withCode = code ? Object.assign({}, options, { category_group_code: code }) : options;
          return runSearch(kakao, 'keywordSearch', term, withCode);
        }

        // 키워드가 비었을 때만 categorySearch를 쓸 수 있다. 코드가 없으면
        // 음식점 전체(FD6)로 떨어뜨린다 — 빈 화면보다 그 동네 목록이 낫다.
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

  window.KakaoPlaces = { searchPlaces, hasKey };
})();
