/**
 * 8/14 랜딩 스크립트.
 *
 * 모든 텍스트는 textContent로 넣는다. innerHTML 문자열 조립을 하지 않는다 —
 * 8/18에 실제 리뷰 데이터가 들어와도 안전해야 한다.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/** card-place-mock 색면 3단계. 순환시킨다. */
const TONE_CLASSES = ['bg-cream', 'bg-cream-deep', 'bg-cream-deeper'];

const TOAST_MESSAGES = {
  search: '동네 검색은 8월 18일에 열립니다',
  login: '로그인은 8월 24일에 열립니다',
  detail: '리뷰 상세는 8월 18일에 열립니다',
};

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
 * 집계형 — 닻 5개 + 비율 숫자. 인기 맛집 카드에서만 쓴다.
 * 여러 사람의 yes 비율이므로 5단계로 반올림할 모집단이 있다.
 */
function renderAnchorRating(yes, total) {
  const wrap = el('div', 'mt-4 flex flex-wrap items-center gap-x-3 gap-y-2');

  const glyphs = el('div', 'flex gap-1'); // 자간 4px
  const filled = Math.round((yes / total) * 5);
  for (let i = 0; i < 5; i += 1) {
    glyphs.appendChild(anchorGlyph(i < filled ? 'text-accent' : 'text-glyph-empty'));
  }

  wrap.append(glyphs, el('span', 'text-ratio font-semibold text-accent', `또 갈래요 ${yes}/${total}`));
  return wrap;
}

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

function renderRestaurants() {
  const grid = document.getElementById('restaurant-grid');
  if (!grid) return;

  mockRestaurants.forEach((place) => {
    const card = el(
      'button',
      'press rounded-card border border-hairline bg-white p-5 text-left transition duration-200 ' +
        'hover:-translate-y-0.5 hover:border-glyph-empty ' +
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-focus'
    );
    card.type = 'button';
    card.setAttribute(
      'aria-label',
      `${place.name}, ${place.neighborhood}, 10명 중 ${Math.round((place.revisitYes / place.revisitTotal) * 10)}명이 또 갔어요`
    );

    // ① 4:3 색면 — 8/18에 이 자리를 <img>로 교체한다.
    //    색면은 놓인 물체가 아니라 빈 자리 표시이므로 그림자를 주지 않는다.
    const thumb = el('div', `flex aspect-[4/3] items-center justify-center rounded-photo ${TONE_CLASSES[place.tone]}`);
    const initial = el('span', 'text-section font-semibold text-ink-48', place.initial);
    initial.setAttribute('aria-hidden', 'true');
    thumb.appendChild(initial);

    // ② 가게명 → ③ 동네 칩 → ④ 재방문율. 여기서 더 얹지 않는다.
    const name = el('h3', 'mt-4 text-card-title font-semibold', place.name);
    const chip = el(
      'span',
      'mt-3 inline-block rounded-full bg-divider-soft px-[11px] py-[5px] text-caption text-ink-72',
      place.neighborhood
    );

    card.append(thumb, name, chip, renderAnchorRating(place.revisitYes, place.revisitTotal));
    card.addEventListener('click', () => showToast(TOAST_MESSAGES.detail));
    grid.appendChild(card);
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

/** 단일 인스턴스를 재사용한다. 연타하면 타이머만 리셋된다. */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove('opacity-0', 'translate-y-3');
  toast.classList.add('opacity-100', 'translate-y-0');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-3');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 3000);
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

function bindFakeActions() {
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      showToast(TOAST_MESSAGES.search);
    });
  }

  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => showToast(TOAST_MESSAGES.login));
  }
}

renderRestaurants();
renderLogs();
renderFeatures();
bindFakeActions();
initScrollReveal();
