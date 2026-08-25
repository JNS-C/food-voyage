/**
 * js/place-photos.js — 검색 결과 카드 썸네일에 구글 사진 1장.
 *
 * 규율은 js/saved-places.js·js/search-map.js와 같다. IIFE 안에 전부 가두고
 * window.FvPhotos 하나만 내보낸다. top-level에 let/const를 만들지 않는다 —
 * 같은 페이지에 오르는 js/search.js도 top-level 이름을 쓴다.
 *
 * js/search.js가 부르는 것은 하나뿐이다.
 *   renderPlaces() 끝에서  FvPhotos.fill(places)
 * 이 파일이 없어도 검색은 그대로 동작한다. 그쪽이 존재를 확인하고 부른다.
 *
 * ── 이 파일의 핵심 규칙 ──────────────────────────────────
 * 색면을 교체하지 않고 **덮는다.** 색면 div와 이니셜 span은 그대로 두고 그 위에
 * position:absolute <img>를 얹는다. 그리고
 *
 *     img.hidden = false 는 onload 안에서만 한다.
 *
 * 이 한 줄이 로딩 중·네트워크 실패·URI 만료·403·매칭 실패 다섯 경우를 전부
 * 자동으로 색면으로 떨어뜨린다. 스켈레톤도, 복구 로직도, "사진 없음" 분기도 없다.
 * DESIGN 443은 "색면만 <img>로 교체하면 된다"고 적었지만 교체가 아니라 덮기인
 * 이유가 이것이다.
 */
(() => {
  'use strict';

  /* ── 상수 ───────────────────────────────────────────── */

  const ENDPOINT = '/api/place-photo';

  /**
   * 앞 몇 행까지 사진을 채울지.
   *
   * 9행 이후는 모바일에서 스크롤해야 닿는 자리다. 이 상수 하나가 구글 Pro SKU
   * 지출을 절반으로 만든다. IntersectionObserver로 바꾸면 할당량은 더 아끼지만
   * 발표 중 스크롤할 때 사진이 하나씩 튀어나온다 — 그 이음매는 fill() 안에 있고
   * 시그니처는 바뀌지 않는다.
   */
  const PHOTO_LIMIT = 8;

  /** localStorage 키 접두사. 버전을 붙여 옛 모양과 섞이지 않게 한다. */
  const STORE_PREFIX = 'fv.gplace.v1.';

  /**
   * L1 수명.
   *
   * 구글 약관은 place ID를 무기한, 그 외 콘텐츠를 30일까지 캐시하도록 허용한다.
   * 우리가 저장하는 건 안정적인 photoName이지 단명하는 photoUri가 아니다 —
   * photoUri를 저장하면 만료된 URL로 깨진 이미지를 그린다.
   * 실패는 더 짧게 둔다. 없던 사진이 나중에 올라올 수 있다.
   */
  const TTL_HIT = 30 * 24 * 60 * 60 * 1000;
  const TTL_MISS = 7 * 24 * 60 * 60 * 1000;

  /** L1 항목 상한. 넘으면 오래된 것부터 버린다 (kakao-places.js의 coordCache와 같다). */
  const STORE_MAX = 200;

  /* ── 상태 ───────────────────────────────────────────── */

  /**
   * L0 — 페이지 수명의 인메모리 캐시. kakaoId → { url, attribution } | null.
   *
   * 이 파일에서 가장 값어치 있는 자료구조다. 칩을 누를 때마다 js/search.js가
   * runSearch를 다시 돌리고 같은 15곳이 다시 렌더된다. L0가 없으면 칩을 누를
   * 때마다 구글 청구서가 새로 발생한다.
   *
   * url만이 아니라 저작자까지 담는 이유: 재렌더에서 title이 비면 표시 의무가
   * 첫 렌더에서만 지켜진다. 준수는 조건부일 수 없다.
   */
  const memo = new Map();

  /**
   * localStorage를 못 쓰는 환경(Safari 프라이빗 등)의 폴백.
   * js/region-combobox.js가 쓰는 관용구를 그대로 따른다.
   */
  const memoryStore = new Map();
  let storeUsable = null;

  /**
   * 렌더 토큰. renderPlaces()는 칩을 누를 때마다 그리드를 파괴한다.
   * 응답이 늦게 도착했을 때 이미 지나간 검색의 사진을 새 그리드에 칠하면 안 된다.
   */
  let renderToken = 0;

  /** 폴백 경고는 페이지당 한 번만. 콘솔이 시끄러우면 진짜 장애를 못 본다. */
  let warned = false;

  /* ── 저장소 ─────────────────────────────────────────── */

  /**
   * localStorage 가용성은 한 번만 확인한다. 프라이빗 모드에서는 setItem이 던진다 —
   * getItem만 확인해서는 못 잡는다.
   */
  function store() {
    if (storeUsable === null) {
      try {
        const probe = `${STORE_PREFIX}probe`;
        window.localStorage.setItem(probe, '1');
        window.localStorage.removeItem(probe);
        storeUsable = true;
      } catch (error) {
        storeUsable = false;
      }
    }
    return storeUsable ? window.localStorage : null;
  }

  function readEntry(id) {
    const box = store();
    try {
      const raw = box ? box.getItem(STORE_PREFIX + id) : memoryStore.get(id);
      if (!raw) return null;
      const entry = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!entry || typeof entry !== 'object') return null;

      const ttl = entry.miss ? TTL_MISS : TTL_HIT;
      if (!Number.isFinite(entry.ts) || Date.now() - entry.ts > ttl) {
        dropEntry(id);
        return null;
      }
      return entry;
    } catch (error) {
      // 남이 고쳐 놨거나 옛 버전이 써 둔 모양이다. 읽을 때마다 확인하고 버린다.
      dropEntry(id);
      return null;
    }
  }

  function writeEntry(id, entry) {
    const value = { ...entry, ts: Date.now() };
    const box = store();
    if (!box) {
      memoryStore.set(id, value);
      return;
    }
    try {
      box.setItem(STORE_PREFIX + id, JSON.stringify(value));
    } catch (error) {
      // 용량이 찼다. 오래된 것부터 걷고 한 번만 다시 시도한다.
      evict();
      try {
        box.setItem(STORE_PREFIX + id, JSON.stringify(value));
      } catch (retryError) {
        memoryStore.set(id, value);
      }
    }
  }

  function dropEntry(id) {
    memoryStore.delete(id);
    const box = store();
    if (!box) return;
    try {
      box.removeItem(STORE_PREFIX + id);
    } catch (error) {
      /* 지우지 못해도 TTL이 결국 걷는다. */
    }
  }

  /** 상한을 넘으면 오래된 것부터 버린다. */
  function evict() {
    const box = store();
    if (!box) return;
    try {
      const rows = [];
      for (let i = 0; i < box.length; i += 1) {
        const key = box.key(i);
        if (!key || key.indexOf(STORE_PREFIX) !== 0) continue;
        let ts = 0;
        try {
          ts = Number(JSON.parse(box.getItem(key)).ts) || 0;
        } catch (error) {
          ts = 0; // 못 읽는 항목은 가장 먼저 버린다.
        }
        rows.push({ key, ts });
      }
      if (rows.length <= STORE_MAX) return;
      rows.sort((a, b) => a.ts - b.ts);
      rows.slice(0, rows.length - STORE_MAX).forEach((row) => box.removeItem(row.key));
    } catch (error) {
      /* 청소는 최선 노력이다. 실패해도 기능은 돈다. */
    }
  }

  /* ── DOM ────────────────────────────────────────────── */

  /**
   * 적용 시점에 노드를 새로 조회한다. fetch 전에 잡아 둔 노드는 그리드가
   * 파괴돼도 무해하지만(detached), 새 조회는 같은 place id가 다른 검색에
   * 다시 나타나는 경우까지 맞게 처리한다.
   */
  function thumbFor(id) {
    const grid = document.getElementById('result-grid');
    if (!grid) return null;
    // id는 카카오가 준 남의 값이다. 선택자에 이어 붙이기 전에 이스케이프한다.
    const safe = window.CSS && window.CSS.escape ? window.CSS.escape(id) : null;
    if (!safe) return null;
    return grid.querySelector(`[data-place-id="${safe}"] [data-field="thumb"]`);
  }

  /**
   * 사진을 실제로 건다.
   *
   * hidden을 벗기는 것은 onload 안에서만이다. 낙관적으로 미리 벗기면 로딩 중과
   * 실패에 빈 사각형이 남는다 — 이 파일의 단 하나뿐인 규칙이다.
   */
  function paint(id, url, attribution, token) {
    if (token !== renderToken) return;

    const thumb = thumbFor(id);
    if (!thumb) return;
    const img = thumb.querySelector('[data-field="photo"]');
    if (!img) return;

    img.onload = () => {
      if (token !== renderToken) return;
      img.hidden = false;
      thumb.setAttribute('data-has-photo', 'true');
      // 구글은 사진에 저작자 표시를 요구한다. 72px 썸네일에는 표기 공간이 없어
      // 최소 준수로 title에 싣는다. 표시 UI는 상세 화면이 생길 때 함께 해결한다.
      if (attribution) thumb.setAttribute('title', `사진: ${attribution}`);
    };

    img.onerror = () => {
      img.hidden = true;
      img.removeAttribute('src');
      thumb.removeAttribute('data-has-photo');
      // URL이 상했다. L0·L1 둘 다에서 버려야 다음 검색에서 다시 찾는다.
      memo.delete(id);
      dropEntry(id);
    };

    img.src = url;
  }

  /* ── 요청 ───────────────────────────────────────────── */

  function warnOnce(message) {
    if (warned) return;
    warned = true;
    console.warn(`[photos] ${message} 색면 썸네일로 진행합니다.`);
  }

  /**
   * 배치 한 번. 실패는 전부 "사진 없음"과 같게 다룬다 — 404(정적 서버에 /api가
   * 없음), non-2xx, JSON 파싱 실패, 네트워크 에러가 전부 한 경로다.
   *
   * 이건 개발 편의가 아니다. GOOGLE_PLACES_KEY가 안 걸렸을 때, 할당량이 소진됐을 때,
   * 결제가 끊겼을 때 배포본에서 도는 바로 그 경로다.
   */
  async function request(payload, token) {
    let data;
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ places: payload }),
      });
      if (!response.ok) {
        warnOnce(`사진 서버가 ${response.status}를 냈습니다.`);
        return;
      }
      data = await response.json();
    } catch (error) {
      warnOnce('사진 서버에 닿지 못했습니다.');
      return;
    }

    const photos = data && data.photos;
    if (!photos || typeof photos !== 'object') return;

    payload.forEach((item) => {
      const hit = photos[item.id];
      if (hit && hit.url) {
        // photoName 캐시로 searchText를 건너뛴 응답에는 저작자가 비어 있다.
        // 그때는 지난번에 저장해 둔 값을 쓴다 — 표시 의무가 첫 방문에서만
        // 지켜지면 준수가 아니다.
        const credit = hit.attribution || item.attribution || '';
        memo.set(item.id, { url: hit.url, attribution: credit });
        if (hit.photoName) writeEntry(item.id, { photoName: hit.photoName, attribution: credit });
        paint(item.id, hit.url, credit, token);
      } else {
        // 실패도 캐시한다. 안 하면 사진 없는 가게를 칩 누를 때마다 다시 조회한다.
        memo.set(item.id, null);
        writeEntry(item.id, { miss: true });
      }
    });
  }

  /* ── 공개 API ───────────────────────────────────────── */

  /**
   * renderPlaces()가 방금 그린 결과에 사진을 채운다.
   *
   * 호출될 때마다 토큰이 올라간다. 이전 검색의 늦은 응답은 여기서 죽는다.
   */
  function fill(places) {
    const token = (renderToken += 1);
    if (!Array.isArray(places) || places.length === 0) return;

    const payload = [];

    places.slice(0, PHOTO_LIMIT).forEach((place) => {
      const id = place && place.id != null ? String(place.id) : '';
      if (!id) return;

      // L0 — 이번 페이지에서 이미 답을 안다. 요청도, 기다림도 없다.
      if (memo.has(id)) {
        const hit = memo.get(id);
        if (hit) paint(id, hit.url, hit.attribution, token);
        return;
      }

      const entry = readEntry(id);
      if (entry && entry.miss) {
        memo.set(id, null);
        return;
      }

      payload.push({
        id,
        name: place.name || '',
        address: place.address || '',
        x: place.x,
        y: place.y,
        // L1 — photoName이 있으면 서버가 searchText(Pro SKU)를 건너뛴다.
        // 그래도 name·좌표를 같이 보낸다: 캐시가 상했을 때 서버가 그 자리에서
        // 다시 찾아 새 photoName을 돌려주게 하기 위해서다.
        photoName: (entry && entry.photoName) || '',
        // 서버로 가는 값이 아니라 응답을 받을 때 되쓰는 값이다. 서버는 무시한다.
        attribution: (entry && entry.attribution) || '',
      });
    });

    if (payload.length === 0) return;
    request(payload, token);
  }

  window.FvPhotos = { fill };
})();
