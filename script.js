/**
 * 8/14 랜딩 스크립트.
 *
 * 모든 텍스트는 textContent로 넣는다. innerHTML 문자열 조립을 하지 않는다 —
 * 8/18에 실제 리뷰 데이터가 들어와도 안전해야 한다.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * 검색은 더 이상 여기 없다. 히어로 폼(#hero-search-form)이 네이티브 GET으로
 * search.html로 이동하므로 가로챌 이유가 사라졌다.
 *
 * 로그인도 8/24에 빠졌다. #start-btn은 <a href="login.html">이 되었고,
 * 로그인 상태에 따른 문구와 토스트는 js/auth.js가 갖는다.
 *
 * mock 인기 맛집도 8/24에 빠졌다. 그 자리는 실데이터 TOP5(renderTop5)가 갖고,
 * showToast만 남았다 — js/auth.js가 window.showToast로 부른다.
 */

/* ── 유틸 ───────────────────────────────────────────── */

/** '2026-08-12' → '8월 12일' */
function formatDate(iso) {
  const [, month, day] = iso.split('-');
  return `${Number(month)}월 ${Number(day)}일`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** 닻 글리프 하나. 채움/빈 상태는 색 클래스로만 갈린다. */
function anchorGlyph(colorClass) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', `h-4 w-4 ${colorClass}`);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', '#icon-anchor');
  svg.appendChild(use);
  return svg;
}

/* ── anchor-rating ──────────────────────────────────── */

/**
 * 단일형 — 닻 1개 + 라벨. 항해일지 인용 카드에서만 쓴다.
 * once·maybe에는 아무것도 표시하지 않는다. 빈 닻을 두면 "평가가 나쁘다"로
 * 읽혀 3상태의 뉘앙스가 무너진다.
 */
function renderAnchorSingle(willRevisit) {
  if (willRevisit !== 'yes') return null;
  const wrap = el('p', 'mt-6 flex items-center gap-2 text-ratio font-semibold text-accent-on-dark');
  wrap.append(anchorGlyph('text-accent-on-dark'), el('span', null, '또 갈래요'));
  return wrap;
}

/* ── 렌더 ───────────────────────────────────────────── */

/**
 * 지금 인기 맛집 TOP5.
 *
 * 전체 사용자의 saved_places 집계는 RLS(본인 행만) 때문에 select로는 못 얻는다.
 * schema.sql의 get_top_places(security definer RPC)가 대신 세어 주고,
 * 응답에는 (가게 스냅샷, 담긴 횟수)만 있다 — user_id는 애초에 안 온다.
 * anon에도 execute가 열려 있어 비로그인 랜딩에서도 채워진다.
 */
async function renderTop5() {
  const list = document.getElementById('top5-list');
  const empty = document.getElementById('top5-empty');
  if (!list || !empty) return;

  // Supabase 설정이 비어 있어도 랜딩은 죽지 않는다. 빈 상태 문구로만 내려간다.
  if (!window.FvAuth || !window.FvAuth.isConfigured()) {
    empty.hidden = false;
    return;
  }

  const { data, error } = await window.FvAuth._client.rpc('get_top_places', { limit_count: 5 });
  if (error) {
    console.warn('[top5]', error.message);
    empty.hidden = false;
    return;
  }

  const rows = data || [];
  const tpl = document.getElementById('tpl-top5-item');
  list.textContent = '';
  rows.forEach((row, i) => {
    const item = tpl.content.cloneNode(true);
    item.querySelector('[data-item]')
      .setAttribute('aria-label', `${i + 1}위 ${row.place_name}, ${row.save_count}명이 담았어요`);
    item.querySelector('[data-field="rank"]').textContent = String(i + 1);
    item.querySelector('[data-field="name"]').textContent = row.place_name;
    item.querySelector('[data-field="category"]').textContent = row.category || '';
    item.querySelector('[data-field="neighborhood"]').textContent = row.neighborhood || '';
    item.querySelector('[data-field="count"]').textContent = `${row.save_count}명이 담았어요`;
    list.appendChild(item);
  });
  empty.hidden = rows.length > 0;
}

/* ── 나를 위한 추천 ─────────────────────────────────── */

const FORYOU_MAX = 6;

/** 로그인↔로그아웃이 빠르게 오갈 때 늦게 도착한 응답을 버린다 (search.js의 seq와 같은 태도). */
let forYouSeq = 0;

/** 'login' | 'empty' | 'error' | null(=결과 표시). hidden 속성만 토글한다. */
function setForYouState(name) {
  ['foryou-login', 'foryou-empty', 'foryou-error'].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.hidden = id !== `foryou-${name}`;
  });
}

/** rows에서 key 값의 최빈값을 고른다. 값이 하나도 없으면 value가 빈 문자열이다. */
function topFrequency(rows, key) {
  const counts = new Map();
  rows.forEach((row) => {
    const value = String(row[key] || '').trim();
    if (value) counts.set(value, (counts.get(value) || 0) + 1);
  });
  let best = '';
  let n = 0;
  counts.forEach((count, value) => {
    if (count > n) {
      best = value;
      n = count;
    }
  });
  return { value: best, count: n };
}

/**
 * 내 saves → 최다 카테고리 → 그 카테고리로 카카오 검색 → 이미 담은 가게 제외.
 *
 * 검색 지역은 생활권(profiles.home_area)을 먼저 쓰고, 없으면 내가 담은 가게들의
 * 최빈 동네로 대신한다. 카테고리는 코드가 아니라 키워드로 검색어에 합친다
 * (search.js buildQuery와 같은 이유 — 한식·일식 등에는 카카오 그룹 코드가 없다).
 */
async function loadForYou(snap) {
  const seq = ++forYouSeq;
  const grid = document.getElementById('foryou-grid');
  const reason = document.getElementById('foryou-reason');
  if (!grid) return;
  grid.textContent = '';

  // 내 saves만 필요하다. user_id 필터는 안 건다 — RLS가 거른다 (mypage.js와 같은 태도).
  const { data: saves, error } = await window.FvAuth._client
    .from('saved_places')
    .select('place_id, category, neighborhood');
  if (seq !== forYouSeq) return;
  if (error) {
    console.warn('[foryou]', error.message);
    setForYouState('error');
    return;
  }
  if (!saves || saves.length === 0) {
    setForYouState('empty');
    return;
  }

  const topCat = topFrequency(saves, 'category');
  const region = (snap.profile && snap.profile.home_area) || topFrequency(saves, 'neighborhood').value;
  if (!topCat.value || !region) {
    setForYouState('empty');
    return;
  }
  if (!window.KakaoPlaces || !window.KakaoPlaces.hasKey()) {
    setForYouState('error');
    return;
  }

  try {
    const places = await window.KakaoPlaces.searchPlaces({ region, keyword: topCat.value });
    if (seq !== forYouSeq) return;

    // 이미 담은 가게는 뺀다. 더미의 place_id는 seed- 접두사라 카카오 id(숫자
    // 문자열)와 겹칠 수 없다 — 제외 로직이 더미 때문에 오작동하지 않는다.
    const mine = new Set(saves.map((row) => String(row.place_id)));
    const fresh = places.filter((place) => !mine.has(String(place.id))).slice(0, FORYOU_MAX);
    if (fresh.length === 0) {
      setForYouState('empty');
      return;
    }

    setForYouState(null);
    if (reason) {
      reason.textContent = `${topCat.value}을(를) ${topCat.count}곳 담으셨네요 — ${region}의 다른 ${topCat.value}입니다.`;
    }

    const tpl = document.getElementById('tpl-foryou-card');
    fresh.forEach((place) => {
      const card = tpl.content.cloneNode(true);
      card.querySelector('[data-field="name"]').textContent = place.name;
      card.querySelector('[data-field="address"]').textContent = place.address || '';
      card.querySelector('[data-field="neighborhood"]').textContent = place.neighborhood || '';
      const link = card.querySelector('[data-field="link"]');
      if (place.url) link.href = place.url;
      else link.hidden = true;
      grid.appendChild(card);
    });
  } catch (err) {
    if (seq !== forYouSeq) return;
    // NO_KEY·REGION_NOT_FOUND·SEARCH_ERROR 전부 사용자에게는 한 문구다.
    console.warn('[foryou]', err);
    setForYouState('error');
  }
}

function initForYou() {
  if (!window.FvAuth || !window.FvAuth.isConfigured()) {
    setForYouState('login');
    return;
  }
  window.FvAuth.onChange((snap) => {
    if (snap.session) {
      loadForYou(snap);
    } else {
      forYouSeq += 1; // 날아가고 있는 요청이 있다면 무효화한다
      const grid = document.getElementById('foryou-grid');
      if (grid) grid.textContent = '';
      const reason = document.getElementById('foryou-reason');
      if (reason) reason.textContent = '담아둔 가게를 보고 고릅니다.';
      setForYouState('login');
    }
  });
}

function renderLogs() {
  const scroller = document.getElementById('log-scroller');
  if (!scroller) return;

  const userById = new Map(mockUsers.map((user) => [user.id, user]));

  // 랜딩에는 yes인 일지만 노출한다.
  mockLogs
    .filter((log) => log.willRevisit === 'yes')
    .forEach((log) => {
      // 일지끼리 경계가 없으면 어디까지가 한 편인지 읽히지 않는다.
      // 맛집 카드가 크림 타일 위 화이트 카드이듯, 여기는 딥 네이비 타일 위
      // 한 단계 밝은 면(deep-2)을 쓴다. 어두운 타일이 겹칠 때 쓰라고 있는 미세 단차다.
      // 테두리는 새 색을 만들지 않고 on-dark를 10%로 낮춰 쓴다.
      const card = el(
        'article',
        // 모바일에서는 스크롤러 폭을 꽉 채운다. 85vw로 다음 카드를 살짝 보이게 하면
        // 위 카드 그리드와 폭이 어긋나고 좌우 카드가 화면을 침범한다.
        // 한 번에 한 편만 읽히도록 옆 카드는 스크롤러 밖으로 밀려 잘린다.
        'w-full shrink-0 snap-start rounded-card border border-on-dark/10 bg-deep-2 p-6 sm:w-[380px]'
      );

      // 여는 따옴표만 크게. 닫는 따옴표는 넣지 않는다.
      const mark = el('p', 'text-quote-mark font-semibold text-accent-on-dark', '“');
      mark.setAttribute('aria-hidden', 'true');

      // 기울이지 않는다. 한글에는 이탤릭이 없다.
      const quote = el('p', 'mt-2 text-quote text-on-dark', log.quote);

      const author = userById.get(log.userId);
      // 메타는 작성자 · 가게명 · 동네 · 날짜 4항목까지. 작성자를 반드시 넣는다 —
      // 남의 항해일지를 읽는 구조가 화면에 드러나는 유일한 지점이다.
      const meta = el(
        'p',
        'mt-3 text-caption text-on-dark-muted',
        [author ? author.name : '익명', log.restaurantName, log.neighborhood, formatDate(log.date)].join(' · ')
      );

      card.append(mark, quote);
      const anchor = renderAnchorSingle(log.willRevisit);
      if (anchor) card.appendChild(anchor);
      card.appendChild(meta);

      scroller.appendChild(card);
    });
}

function renderFeatures() {
  const grid = document.getElementById('feature-grid');
  if (!grid) return;

  mockFeatures.forEach((feature) => {
    // 화이트 타일 위에는 크림 카드를 놓는다. 흰 위에 흰 카드는 형태가 사라진다.
    // 누를 수 없는 요소이므로 <div>이고 호버 반응이 없다.
    const card = el('div', 'rounded-card bg-cream p-6');

    // 뱃지에 황동을 쓰지 않는다. 누를 수 없는 것에 인터랙션 색을 쓰면 신호가 오염된다.
    const badge = el(
      'span',
      'mt-4 inline-block rounded-full bg-divider-soft px-3 py-1.5 text-caption text-ink-48',
      `${formatDate(feature.releaseDate)} 공개 예정`
    );

    card.append(
      el('h3', 'text-card-title font-semibold', feature.title),
      el('p', 'mt-3 text-body text-ink-72', feature.description),
      badge
    );
    grid.appendChild(card);
  });
}

/* ── 토스트 ─────────────────────────────────────────── */

let toastTimer = null;

/**
 * 단일 인스턴스를 재사용한다. 연타하면 타이머만 리셋된다.
 *
 * 표시 여부를 data-visible 하나로 표현한다. 두 페이지가 같은 계약을 쓰고
 * (js/search.js도 동일), 실제 스타일은 styles.css의 #toast가 소유한다.
 *
 * hidden(=display:none)은 트랜지션을 시작시키지 않고, visibility:hidden은
 * aria-live 영역의 낭독을 막는다. opacity:0은 접근성 트리에 남으므로
 * role="status"가 정상 동작한다.
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.dataset.visible = 'true';

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.dataset.visible = 'false';
  }, 3000);
}

/* ── 항해일지 넘기기 ────────────────────────────────── */

/**
 * 가로 스크롤러는 터치에서는 스와이프로 넘어가지만 마우스 환경에는 조작 수단이
 * 없다. 스크롤바를 숨겨 뒀으니 더더욱 그렇다. 좌우 버튼으로 한 장씩 넘긴다.
 *
 * 이동 폭은 카드 실측값 + 간격이다. 브레이크포인트마다 카드 폭이 달라지므로
 * 상수로 박지 않는다.
 */
function initLogControls() {
  const scroller = document.getElementById('log-scroller');
  const controls = document.getElementById('log-controls');
  const prev = document.getElementById('log-prev');
  const next = document.getElementById('log-next');
  if (!scroller || !controls || !prev || !next) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function step() {
    const card = scroller.firstElementChild;
    if (!card) return scroller.clientWidth;
    const gap = parseFloat(getComputedStyle(scroller).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  }

  function scrollByCard(direction) {
    scroller.scrollBy({
      left: step() * direction,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }

  /** 끝에 닿으면 버튼을 죽인다. 넘길 게 없으면 버튼 자체를 숨긴다. */
  function syncControls() {
    const overflow = scroller.scrollWidth - scroller.clientWidth;
    controls.style.display = overflow > 1 ? '' : 'none';
    prev.disabled = scroller.scrollLeft <= 1;
    next.disabled = scroller.scrollLeft >= overflow - 1;
  }

  prev.addEventListener('click', () => scrollByCard(-1));
  next.addEventListener('click', () => scrollByCard(1));
  scroller.addEventListener('scroll', syncControls, { passive: true });
  window.addEventListener('resize', syncControls);
  syncControls();
}

/* ── 스크롤 등장·퇴장 ───────────────────────────────── */

/**
 * 히어로를 제외한 각 타일의 내용에 .reveal을 붙이고 뷰포트 진입 여부에 따라 토글한다.
 * 양방향이다 — 내려가면 나타나고 다시 올라가면 사라진다.
 *
 * 타일(section) 자체가 아니라 안쪽 컨테이너에 건다. 배경까지 페이드하면
 * 크림 body 위로 네이비 타일이 비쳐 색이 섞인다.
 *
 * .reveal을 HTML이 아니라 여기서 붙이는 이유: 스크립트가 죽었을 때
 * 내용이 투명한 채로 남으면 안 된다.
 */
function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  const targets = [
    ...document.querySelectorAll('section:not(:first-of-type) > div'),
    ...document.querySelectorAll('footer > div'),
  ];
  if (targets.length === 0) return;

  targets.forEach((node) => node.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    },
    { threshold: 0, rootMargin: '0px 0px -12% 0px' }
  );

  targets.forEach((node) => observer.observe(node));
}

/* ── 초기화 ─────────────────────────────────────────── */

/**
 * 히어로 검색 폼은 여기서 손대지 않는다. action="search.html" method="get"으로
 * 그대로 이동해야 하고, JS가 죽어도 동작해야 한다. preventDefault를 걸면
 * 이동이 막힌다.
 *
 * #start-btn도 같은 이유로 여기 없다. 8/24에 <a href="login.html">이 되면서
 * 바인딩 없이도 동작하게 되었고, 로그인 상태에 따른 처리는 js/auth.js가 맡는다.
 */

renderTop5();
initForYou();
renderLogs();
renderFeatures();
initLogControls();
initScrollReveal();
