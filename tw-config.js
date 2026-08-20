/**
 * Tailwind 토큰 — index.html과 search.html이 공유한다.
 *
 * DESIGN.md의 토큰을 여기 한 번만 등록한다.
 * 마크업에는 인라인 hex를 쓰지 않는다 (DESIGN Iteration Guide 3).
 *
 * Liquid Glass의 재질 수치(blur·하이라이트·그림자)는 여기에 두지 않는다.
 * 그건 styles.css의 CSS 커스텀 프로퍼티 몫이다 — Tailwind 유틸리티만으로는
 * 4개 서브레이어를 재현할 수 없다 (LIQUID-GLASS.md §10.11).
 */
tailwind.config = {
  // hover: 유틸리티를 (hover: hover) 안으로 감싼다.
  // 감싸지 않으면 터치 기기에서 탭한 뒤 hover 상태가 그대로 남는다(sticky hover) —
  // 결과 카드처럼 탭이 곧 액션인 요소에서 특히 티가 난다. LIQUID-GLASS.md §11.1.
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        accent: '#B86B32',
        'accent-focus': '#C97B3E',
        'accent-on-dark': '#E0A85C',
        ink: '#1C1A17',
        'ink-72': '#4A453C',
        'ink-48': '#6B6459',
        'on-dark': '#F4EFE6',
        'on-dark-muted': '#B9B2A6',
        cream: '#F4EFE6',
        'cream-deep': '#EAE1D2',
        'cream-deeper': '#E3D8C6', // card-place-mock 색면 3단계
        deep: '#0F1B2D',
        'deep-2': '#121F33',
        'deep-3': '#0D1826',
        hairline: '#E0D8C9',
        'divider-soft': '#EFE8DB',
        'glyph-empty': '#C9BFAD',
      },
      fontFamily: {
        // 서체는 Pretendard 하나다. 마지막 sans-serif는 CDN이 죽었을 때만 쓰인다.
        // 기기마다 다른 서체가 나오지 않도록 Apple SD Gothic Neo·system-ui를 두지 않는다.
        sans: ['Pretendard Variable', 'Pretendard', 'sans-serif'],
        // 워드마크 전용 예외. `serif`가 아니라 `wordmark`로 이름 붙인 이유는
        // 로고 밖으로 새어나가지 않게 하기 위해서다. 본문에 쓰지 않는다.
        wordmark: ['Noto Serif KR', 'serif'],
      },
      fontSize: {
        // 명조 시절의 +1px 보정값을 그대로 유지한다 (57/41/21/25).
        // 크기 체계를 흔들 만한 시각적 이득이 없다.
        'hero-1': ['28px', { lineHeight: '1.25', letterSpacing: '-0.5px' }],
        'hero-2': ['34px', { lineHeight: '1.25', letterSpacing: '-0.5px' }],
        'hero-3': ['41px', { lineHeight: '1.25', letterSpacing: '-0.5px' }],
        'hero-4': ['48px', { lineHeight: '1.25', letterSpacing: '-0.5px' }],
        hero: ['57px', { lineHeight: '1.25', letterSpacing: '-0.5px' }],
        section: ['41px', { lineHeight: '1.3', letterSpacing: '-0.4px' }],
        'card-title': ['21px', { lineHeight: '1.4', letterSpacing: '-0.2px' }],
        quote: ['25px', { lineHeight: '1.7', letterSpacing: '-0.2px' }],
        'quote-mark': ['48px', { lineHeight: '1', letterSpacing: '0' }],
        lead: ['24px', { lineHeight: '1.5', letterSpacing: '-0.2px' }],
        body: ['17px', { lineHeight: '1.47', letterSpacing: '-0.2px' }],
        btn: ['17px', { lineHeight: '1', letterSpacing: '-0.2px' }],
        caption: ['14px', { lineHeight: '1.5', letterSpacing: '-0.1px' }],
        ratio: ['14px', { lineHeight: '1', letterSpacing: '0' }],
        nav: ['14px', { lineHeight: '1.29', letterSpacing: '-0.1px' }],
        fine: ['12px', { lineHeight: '1.4', letterSpacing: '-0.1px' }],
      },
      borderRadius: {
        // 라운드 문법을 섞지 않는다. 타일 0, 카드 18, 사진 12, 버튼·검색창 pill
        card: '18px',
        photo: '12px',
        md: '12px',
      },
      boxShadow: {
        // 그림자는 음식 사진에만. 8/18에 실사진이 들어올 때 쓴다
        photo: 'rgba(28, 26, 23, 0.18) 3px 5px 30px',
      },
      screens: {
        // 640·1024·1280은 Tailwind 기본 sm·lg·xl과 이미 일치한다
        xs: '420px',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
};
