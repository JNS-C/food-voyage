/**
 * 가게 썸네일용 구글 사진 1장을 찾아 주는 서버 함수.
 *
 * 이 저장소의 첫 서버리스 함수다. PRD §4가 정한 규약(`api/*.js` → Vercel 함수)을
 * 처음 실체화한다. 존재 이유는 하나다 — GOOGLE_PLACES_KEY가 브라우저에 가면 안 된다
 * (PRD §8-8). config.js는 4개 HTML이 직접 로드하므로 거기 두는 값은 100% 노출된다.
 *
 * 배치 POST인 이유가 둘이다.
 *   ① 가게명 15개 + 주소를 쿼리스트링에 실으면 URL 길이가 위험하다.
 *   ② 응답에 단명 URI가 실린다. 중간 캐시에 남으면 만료된 URL을 되살린다 → no-store.
 * 덤으로 브라우저 왕복이 1회라 그리드가 한 번에 채워진다. 카드가 하나씩 튀어나오는
 * pop-in 캐스케이드는 발표 시연에서 산만하다.
 *
 * 응답의 null은 에러가 아니라 정상 결과다 — "사진 없음, 색면을 유지하라".
 * 매칭 실패·검증 탈락·사진 부재를 클라이언트가 구분할 이유가 없다. 셋 다 결과가 같다.
 */

'use strict';

/** 카카오가 한 번에 주는 최대치와 같다 (js/kakao-places.js의 페이지 크기). */
const MAX_PLACES = 15;

/** 가게명·주소 길이 상한. 검색어이지 문서가 아니다. */
const MAX_TEXT = 100;

/**
 * 구글 핀과 카카오 핀의 허용 오차(미터).
 *
 * 같은 가게라도 옥상 중심과 입구를 각각 찍어 수십 m가 벌어진다. 200m가 그걸
 * 흡수하면서 한 블록 옆 같은 이름 지점은 걸러낸다. 더 조이면 정당한 매칭이 떨어지고,
 * 더 풀면 같은 건물 다른 가게가 들어온다.
 */
const MAX_DISTANCE_M = 200;

/** 이름 유사도 하한(bigram Dice). 포함 관계가 아닐 때만 쓴다. */
const MIN_NAME_DICE = 0.5;

/**
 * 요청하는 사진 크기. 72 CSS px 박스의 2배(레티나)다.
 * 16:9 원본이 256×144로 스케일되고, object-fit: cover 후에도 충분하다. 10~20KB.
 */
const PHOTO_PX = 256;

/** 구글 한 곳당 동시 처리 수. 15곳이면 Vercel Hobby 10초 제한 안에 여유롭게 들어간다. */
const CONCURRENCY = 6;

/** 구글 호출 하나의 상한(ms). 느린 한 곳이 배치 전체를 timeout으로 끌고 가면 안 된다. */
const UPSTREAM_TIMEOUT_MS = 4000;

/**
 * FieldMask는 구글의 과금 SKU 등급을 결정한다. 이 4개에서 늘리지 않는다.
 *
 *   places.photos       목적 그 자체. 사진을 주는 최저 등급이 Text Search (Pro)다.
 *                       ID Only 등급은 사진을 안 준다 — Pro가 바닥이고 피할 수 없다.
 *   places.location     거리 검증용. 이미 Pro를 샀으므로 같은 등급 안에서 추가 비용 0.
 *   places.displayName  이름 검증용. 위와 같다.
 *   places.id           캐시 키.
 *
 * rating·userRatingCount·reviews·currentOpeningHours·editorialSummary·priceLevel을
 * 넣지 않는다. 전부 상위 등급으로 밀어 올리고, 카드에 표시하지도 않을 값이다.
 */
const FIELD_MASK = 'places.id,places.photos,places.location,places.displayName';

const SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

/**
 * 웜 인스턴스가 공짜로 재사용하는 조회 결과. kakaoId → { photoName } | null.
 * 기회주의적일 뿐이라 여기 없다고 해서 달라지는 건 없다 — 진짜 캐시는 클라이언트에 있다.
 * 콜드 스타트마다 비므로 상한만 걸어 두고 만료는 두지 않는다.
 */
const warmCache = new Map();
const WARM_MAX = 500;

/* ── 유틸 ─────────────────────────────────────────────── */

/** 두 좌표 사이 거리(미터). */
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** 공백·기호를 걷고 소문자로. 한글·영숫자만 남긴다. */
function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]/g, '');
}

/**
 * 꼬리의 지점 표기를 걷는다. '스타벅스성수역점' → '스타벅스'.
 * 다 깎아 먹으면 원본을 쓴다 — 상호 자체가 '점'으로 끝나는 경우가 있다.
 */
function stripBranch(value) {
  const cut = value.replace(/(본점|직영점|지점|[가-힣]{1,6}점)$/, '');
  return cut.length >= 2 ? cut : value;
}

/** bigram 사전. 중복 bigram도 세므로 Map이다. */
function bigrams(value) {
  const out = new Map();
  for (let i = 0; i < value.length - 1; i += 1) {
    const gram = value.slice(i, i + 2);
    out.set(gram, (out.get(gram) || 0) + 1);
  }
  return out;
}

/** bigram Dice 계수. 0~1. */
function dice(a, b) {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const left = bigrams(a);
  const right = bigrams(b);
  let shared = 0;
  let total = 0;
  left.forEach((count, gram) => {
    total += count;
    shared += Math.min(count, right.get(gram) || 0);
  });
  right.forEach((count) => {
    total += count;
  });
  return total ? (2 * shared) / total : 0;
}

/**
 * 이름 관문. 거리 관문과 AND로 묶인다.
 *
 * 거리만 보면 같은 건물 다른 식당이 통과한다 — 가장 흔하고 가장 창피한 실패다.
 * 이름만 보면 맞는 브랜드의 틀린 지점이 통과한다. 그래서 둘 다 필요하다.
 */
function nameMatches(kakaoName, googleName) {
  const a = normalizeName(kakaoName);
  const b = normalizeName(googleName);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;

  const ca = stripBranch(a);
  const cb = stripBranch(b);
  if (ca.includes(cb) || cb.includes(ca)) return true;

  return dice(ca, cb) >= MIN_NAME_DICE;
}

/** 동시 실행 수를 묶은 map. 한 항목이 던져도 배치는 살아남는다 — 그 자리만 null이다. */
async function mapLimit(items, limit, task) {
  const out = new Array(items.length).fill(null);
  let cursor = 0;

  const worker = async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      try {
        out[index] = await task(items[index]);
      } catch (error) {
        out[index] = null;
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return out;
}

/** timeout이 붙은 fetch. 느린 한 곳이 배치 전체를 끌고 가지 못하게 한다. */
async function fetchJson(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ── 입력 검증 ────────────────────────────────────────── */

/** 문자열 하나를 다듬는다. 길이 상한을 넘으면 자른다 — 거절이 아니라 절단이다. */
function clean(value) {
  return String(value == null ? '' : value).trim().slice(0, MAX_TEXT);
}

/** 'places/{id}/photos/{ref}' 모양인지 본다. 남의 문자열을 URL에 이어 붙이기 전에. */
function validPhotoName(value) {
  return /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(value);
}

/**
 * 요청 한 건을 검증한다. 카카오 x는 경도, y는 위도다
 * (js/kakao-places.js의 정규화와 같은 규약).
 *
 * photoName이 실려 오면 클라이언트가 지난번 조회 결과를 캐시해 둔 것이다. 그때는
 * searchText(Pro SKU)를 통째로 건너뛰고 싼 media 호출만 한다 — 이게 L1 캐시의
 * 존재 이유다. 그래도 name·좌표를 함께 받는다: 캐시가 상해서 media가 실패하면
 * 그 자리에서 다시 찾아야 하기 때문이다.
 */
function toQuery(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = clean(raw.id);
  if (!id) return null;

  const photoName = clean(raw.photoName);
  const cached = validPhotoName(photoName) ? photoName : '';

  const name = clean(raw.name);
  const lng = Number(raw.x);
  const lat = Number(raw.y);
  const hasCoords =
    Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  // 새로 찾으려면 이름과 좌표가 둘 다 있어야 한다 — locationBias도 거리 검증도 못 한다.
  const searchable = Boolean(name) && hasCoords;
  if (!searchable && !cached) return null;

  return {
    id,
    name,
    address: clean(raw.address),
    lat: hasCoords ? lat : null,
    lng: hasCoords ? lng : null,
    searchable,
    cached,
  };
}

/**
 * 교차 출처 호출을 막는다. 브라우저가 아닌 호출(curl 등)은 여기서 막지 않는다 —
 * 진짜 방어는 GCP의 API 제한과 할당량 상한이고, 이건 남용을 성가시게 만드는 층이다.
 */
function sameOrigin(req) {
  const source = req.headers.origin || req.headers.referer;
  if (!source) return true;
  try {
    return new URL(source).host === req.headers.host;
  } catch (error) {
    return false;
  }
}

/* ── 구글 호출 ────────────────────────────────────────── */

/**
 * 장소를 찾아 사진 이름을 얻는다. 검증에 떨어지면 null이다.
 *
 * locationRestriction이 아니라 locationBias를 쓴다 — Text Search의 restriction은
 * 사각형만 받고, 하드 제한은 구글 핀이 살짝 밖에 찍힌 정당한 매칭까지 떨군다.
 * bias로 유도하고 거리 관문으로 강제한다.
 */
async function findPhoto(query, key) {
  const body = {
    // 가게명 단독으로는 체인점이 엉뚱한 지점을 물어 온다. 도로명 주소가 1차 방어선이다.
    textQuery: query.address ? `${query.name} ${query.address}` : query.name,
    maxResultCount: 1,
    languageCode: 'ko',
    regionCode: 'KR',
    locationBias: {
      circle: {
        center: { latitude: query.lat, longitude: query.lng },
        radius: MAX_DISTANCE_M,
      },
    },
  };

  const data = await fetchJson(SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  const place = data && Array.isArray(data.places) ? data.places[0] : null;
  if (!place) return null;

  // ① 거리 관문
  const loc = place.location;
  if (!loc || !Number.isFinite(loc.latitude) || !Number.isFinite(loc.longitude)) return null;
  if (distanceMeters(query.lat, query.lng, loc.latitude, loc.longitude) > MAX_DISTANCE_M) {
    return null;
  }

  // ② 이름 관문
  const googleName = place.displayName && place.displayName.text;
  if (!nameMatches(query.name, googleName)) return null;

  // ③ 사진이 없으면 여기서 끝이다. 없는 것을 없다고 쓴다 (DESIGN).
  const photo = Array.isArray(place.photos) ? place.photos[0] : null;
  if (!photo || !photo.name) return null;

  const attributions = Array.isArray(photo.authorAttributions) ? photo.authorAttributions : [];
  return {
    photoName: photo.name,
    attribution: (attributions[0] && attributions[0].displayName) || '',
  };
}

/**
 * 사진 이름 → 실제 이미지 URL.
 *
 * skipHttpRedirect=true가 이 설계의 핵심이다. 302 대신 { name, photoUri } JSON을
 * 주는데, 그 photoUri는 서명된 URL이고 API 키를 담고 있지 않다. 그래서 브라우저에
 * 그대로 넘길 수 있고, 이미지 바이트는 구글 CDN에서 직접 받는다 — 우리 인프라를
 * 지나는 이미지 바이트가 0이다.
 */
async function resolvePhotoUrl(photoName, key) {
  const url =
    `https://places.googleapis.com/v1/${photoName}/media` +
    `?maxHeightPx=${PHOTO_PX}&maxWidthPx=${PHOTO_PX}&skipHttpRedirect=true&key=${encodeURIComponent(key)}`;

  const data = await fetchJson(url, { method: 'GET' });
  return (data && data.photoUri) || null;
}

/* ── 핸들러 ───────────────────────────────────────────── */

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ code: 'METHOD_NOT_ALLOWED' });
  }

  if (!sameOrigin(req)) {
    return res.status(403).json({ code: 'FORBIDDEN' });
  }

  const key = process.env.GOOGLE_PLACES_KEY;
  if (!key) {
    // 클라이언트는 어차피 전부 "사진 없음"으로 다룬다. code는 Network 탭이
    // 스스로 설명하게 만드는 장치다 — 로컬에서 원인을 못 찾는 실패를 없앤다.
    return res.status(500).json({ code: 'NO_KEY' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      return res.status(400).json({ code: 'BAD_REQUEST' });
    }
  }

  const raw = body && Array.isArray(body.places) ? body.places : null;
  if (!raw) return res.status(400).json({ code: 'BAD_REQUEST' });

  const queries = raw.slice(0, MAX_PLACES).map(toQuery).filter(Boolean);

  // 단명 URI가 실린다. 중간 캐시에 남으면 만료된 URL을 되살린다.
  res.setHeader('Cache-Control', 'no-store');

  if (queries.length === 0) return res.status(200).json({ photos: {} });

  const results = await mapLimit(queries, CONCURRENCY, async (query) => {
    // ① 클라이언트가 캐시해 온 photoName이 있으면 그것부터 쓴다. searchText를
    //    건너뛰므로 Pro SKU 한 건을 통째로 아낀다.
    if (query.cached) {
      const url = await resolvePhotoUrl(query.cached, key);
      if (url) return { url, photoName: query.cached, attribution: '' };
      // 캐시가 상했다. 아래로 떨어져 다시 찾는다 — 클라이언트가 새 photoName으로 갱신한다.
    }

    if (!query.searchable) return null;

    // ② 웜 인스턴스가 이미 찾아 둔 게 있으면 재사용한다. 기회주의적일 뿐이다.
    let found;
    if (warmCache.has(query.id)) {
      found = warmCache.get(query.id);
    } else {
      found = await findPhoto(query, key);
      if (warmCache.size >= WARM_MAX) {
        // Map은 삽입 순서를 유지한다. 가장 오래된 키부터 버린다
        // (js/kakao-places.js의 coordCache와 같은 관용구).
        warmCache.delete(warmCache.keys().next().value);
      }
      warmCache.set(query.id, found);
    }
    if (!found) return null;

    const url = await resolvePhotoUrl(found.photoName, key);
    if (!url) return null;

    return { url, photoName: found.photoName, attribution: found.attribution };
  });

  // 키는 항상 카카오 id다. 클라이언트가 인덱스로 대응시킬 필요가 없다.
  const photos = {};
  queries.forEach((query, index) => {
    photos[query.id] = results[index] || null;
  });

  return res.status(200).json({ photos });
};
