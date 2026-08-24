---
version: beta
name: food-voyage-design
description: 크림 양피지 위에 놓인 항해일지를, 애플의 진열 방식으로 전시하는 인터페이스. 밝은 크림 타일과 딥 네이비 타일이 전면으로 교차하며 색 변화 자체가 섹션 구분선이 된다. 서체는 Pretendard 하나이고 위계는 크기와 굵기로만 만든다. 인터랙션 색은 황동 하나뿐이고, 그림자는 음식 사진에만 허용된다. 재방문율은 별이 아니라 닻으로 표기한다.

colors:
  accent: "#B86B32"
  accent-focus: "#C97B3E"
  accent-on-dark: "#E0A85C"
  ink: "#1C1A17"
  ink-muted-72: "#4A453C"
  ink-muted-48: "#6B6459"
  on-dark: "#F4EFE6"
  on-dark-muted: "#B9B2A6"
  canvas-cream: "#F4EFE6"
  canvas-white: "#FFFFFF"
  surface-cream-deep: "#EAE1D2"
  surface-deep-1: "#0F1B2D"
  surface-deep-2: "#121F33"
  surface-deep-3: "#0D1826"
  hairline: "#E0D8C9"
  divider-soft: "#EFE8DB"
  glyph-empty: "#C9BFAD"
  on-accent: "#FFFFFF"

typography:
  hero-display:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 57px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.5px
  section-display:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 41px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.4px
  card-title:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 21px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.2px
  quote:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 25px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: -0.2px
  quote-mark:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: 0
  lead:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: -0.2px
  body:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: -0.2px
  body-strong:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.47
    letterSpacing: -0.2px
  button:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: -0.2px
  caption:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: -0.1px
  caption-strong:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: -0.1px
  ratio-number:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: 0
  nav-link:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.29
    letterSpacing: -0.1px
  wordmark:
    fontFamily: "Noto Serif KR, serif"
    fontSize: 21px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.2px
  fine-print:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: -0.1px

rounded:
  none: 0px
  sm: 8px
  md: 12px
  lg: 18px
  pill: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 17px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 80px

shadow:
  photo: "rgba(28, 26, 23, 0.18) 3px 5px 30px"

components:
  section-tile-cream:
    backgroundColor: "{colors.canvas-cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: 80px
  section-tile-white:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: 80px
  section-tile-deep:
    backgroundColor: "{colors.surface-deep-1}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.none}"
    padding: 80px
  section-tile-footer:
    backgroundColor: "{colors.surface-cream-deep}"
    textColor: "{colors.ink-muted-72}"
    rounded: "{rounded.none}"
    padding: 64px
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 13px 26px
  button-quiet:
    backgroundColor: transparent
    textColor: "{colors.accent}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 13px 26px
  button-on-dark:
    backgroundColor: "{colors.accent-on-dark}"
    textColor: "{colors.surface-deep-1}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: 13px 26px
  search-neighborhood:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: 14px 24px
    height: 52px
  card-place:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.ink}"
    typography: "{typography.card-title}"
    rounded: "{rounded.lg}"
    padding: 20px
  card-place-mock:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 20px
  anchor-rating:
    textColor: "{colors.accent}"
    typography: "{typography.ratio-number}"
  quote-log:
    backgroundColor: "{colors.surface-deep-2}"
    textColor: "{colors.on-dark}"
    typography: "{typography.quote}"
    rounded: "{rounded.lg}"
    padding: 24px
  card-feature:
    backgroundColor: "{colors.canvas-cream}"
    textColor: "{colors.ink}"
    typography: "{typography.card-title}"
    rounded: "{rounded.lg}"
    padding: 24px
  carousel-nav:
    backgroundColor: "{colors.surface-deep-2}"
    textColor: "{colors.accent-on-dark}"
    rounded: "{rounded.pill}"
    size: 44px
  badge-coming-soon:
    backgroundColor: "{colors.divider-soft}"
    textColor: "{colors.ink-muted-48}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 6px 12px
  toast:
    backgroundColor: "{colors.surface-deep-1}"
    textColor: "{colors.on-dark}"
    typography: "{typography.caption}"
    rounded: "{rounded.md}"
    padding: 14px 20px
  chip-neighborhood:
    backgroundColor: "{colors.divider-soft}"
    textColor: "{colors.ink-muted-72}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: 5px 11px
  # ── 기능 레이어 (Liquid Glass) ──
  # 재질 수치(blur·불투명도·하이라이트·그림자)는 LIQUID-GLASS.md §10.2에만 둔다.
  # 여기에 복제하지 않는다. 이 문서가 담당하는 것은 색과 역할이다.
  glass-toolbar:
    material: liquid-glass-regular
    fillTint: "{colors.surface-deep-1}"
    textColor: "{colors.on-dark}"
    textMuted: "{colors.on-dark-muted}"
    rounded: "{rounded.none}"
  filter-bar:
    material: liquid-glass-regular
    fillTint: "{colors.surface-deep-1}"
    textColor: "{colors.on-dark}"
    textMuted: "{colors.on-dark-muted}"
    prominentFill: "{colors.accent-on-dark}"
    prominentTextColor: "{colors.surface-deep-1}"
  card-place-search:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.ink}"
    typography: "{typography.card-title}"
    rounded: "{rounded.lg}"
    padding: 20px
  state-block:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.ink-muted-72}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: 56px 24px
---

## Overview

food-voyage는 **크림 양피지 위에 놓인 항해일지를 애플의 진열 방식으로 전시한다.**

두 레퍼런스가 서로 다른 축을 담당한다. **항해일지**는 색과 은유를 맡고, **애플 디자인 시스템**은 구조와 절제를 맡는다. 그래서 충돌하지 않는다.

페이지는 전면(full-bleed) 타일의 수직 적층이다. 타일 사이에 구분선을 넣지 않는다. **배경색이 밝음↔어두움으로 바뀌는 것 자체가 구분선**이다. 크림이 기본 캔버스이고, 딥 네이비는 히어로와 항해일지 섹션 두 곳에만 등장한다.

온도는 **"기록실 + 온기 한 스푼"**에 맞춰져 있다. 차가운 요소는 딥 네이비 타일 하나뿐이고, 크림 캔버스·먹색 본문·황동 액센트가 모두 난색이다. 네이비가 차갑게 남아 있는 것은 의도된 것이다. 음식 사진은 대부분 난색이라 한색 배경 위에서 가장 선명해지고, 황동 액센트도 네이비 위에서만 확실히 튄다. **네이비는 분위기가 아니라 음식과 액센트를 띄우는 무대다.**

밀도는 낮다. 각 섹션은 대략 한 뷰포트를 차지하고, 장식용 크롬이 없다. 테두리·그라디언트·장식 프레임을 쓰지 않는다. 그림자는 음식 사진 아래 단 하나만 존재한다.

**핵심 특징**

- 전면 타일 교차: 크림 ↔ 딥 네이비. 색 변화가 섹션 구분선이다.
- 인터랙션 색은 황동 `#B86B32` 하나. 두 번째 강조색은 존재하지 않는다.
- **서체는 Pretendard 하나다.** 위계는 서체를 바꿔서가 아니라 크기와 굵기(400/600)로만 만든다. 본문은 17px. 히어로 워드마크만 Noto Serif KR을 쓰는 유일한 예외다.
- 재방문율을 별이 아니라 **닻**으로 표기한다. 이 서비스의 시각적 서명이다. 집계값은 닻 5개 + 비율 숫자, 개인 기록 한 편은 닻 1개 + 라벨.
- **별점은 존재하지 않는다.** 평가는 재방문 3상태(`yes` / `once` / `maybe`)가 대신한다.
- 카드는 사진이 주인공(4:3), 정보는 이름·동네·닻 세 가지로 끝낸다.
- 그림자는 음식 사진에만. 카드·버튼·텍스트에는 없다.
- 누름 상태는 전역적으로 `transform: scale(0.96)`.

---

## Colors

### 액센트

- **황동** (`{colors.accent}` — #B86B32): 유일한 "누를 수 있음" 신호. 버튼, 링크, 닻 글리프, 여는 따옴표, 포커스 링이 모두 이 색이다. 두 번째 액센트를 도입하지 않는다.
- **황동 포커스** (`{colors.accent-focus}` — #C97B3E): 키보드 포커스 링 전용. `outline: 2px solid`.
- **밝은 황동** (`{colors.accent-on-dark}` — #E0A85C): 딥 네이비 타일 위에서만 사용한다. 기본 황동은 네이비 위에서 명도 대비가 부족하다.

### 캔버스

- **크림** (`{colors.canvas-cream}` — #F4EFE6): 기본 배경. 페이지의 기본 상태다.
- **화이트** (`{colors.canvas-white}` — #FFFFFF): 카드와 입력창 표면. 크림 위에 놓여 한 단계 떠 보이게 한다.
- **깊은 크림** (`{colors.surface-cream-deep}` — #EAE1D2): 푸터 전용. 크림보다 한 단계 어두워 페이지의 끝을 알린다.
- **딥 네이비** (`{colors.surface-deep-1}` — #0F1B2D): 어두운 타일. 히어로와 항해일지 섹션.
- `{colors.surface-deep-2}` (#121F33), `{colors.surface-deep-3}` (#0D1826): 어두운 타일이 연달아 놓일 때만 쓰는 미세 단차. 남용하지 않는다.

### 잉크

- **먹색** (`{colors.ink}` — #1C1A17): 본문. 무채색 검정이 아니라 갈색 기운이 도는 따뜻한 먹색이다. 종이에 스민 잉크를 의도한 것이며, 리뷰 글이 많이 보이는 서비스에서 이 온도 차이가 크게 작용한다.
- `{colors.ink-muted-72}` (#4A453C): 보조 설명, 푸터 링크.
- `{colors.ink-muted-48}` (#6B6459): 캡션, 메타 정보.
- **크림 온 다크** (`{colors.on-dark}` — #F4EFE6): 네이비 위 텍스트. 순백 대신 크림을 쓴다. 대비가 과하지 않고 종이 은유가 유지된다.

### 선과 여백

- `{colors.hairline}` (#E0D8C9): 카드 테두리 1px.
- `{colors.divider-soft}` (#EFE8DB): 칩·뱃지 배경.
- `{colors.glyph-empty}` (#C9BFAD): 채워지지 않은 닻.

---

## Typography

### 서체 로딩

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css">
```

**CDN 경로에 버전 태그를 반드시 붙인다.** 태그 없이 `gh/orioncactus/pretendard/`로 쓰면 기본 브랜치를 가리키게 되어, 업스트림이 경로를 바꾸면 폰트가 통째로 빠진다. 위 `@v1.3.9`가 실제 존재하는 태그인지 브라우저에서 한 번 열어 확인하고, 없으면 최신 태그로 교체한다.

### 서체는 하나다

```
Pretendard Variable → Pretendard → sans-serif
```

**모든 텍스트가 Pretendard다.** 제목·본문·버튼·인용문에 예외가 없다.

### 단 하나의 예외 — 워드마크

히어로의 `food-voyage` 로고만 `{typography.wordmark}` — Noto Serif KR 600을 쓴다.

로고는 읽는 글이 아니라 **표식**이다. 다른 서체를 쓰는 것이 오히려 로고임을 알린다. 라틴 문자뿐이라 `unicode-range` 덕에 한글 서브셋은 내려받지 않는다.

**Tailwind에서 이 서체의 키 이름은 `serif`가 아니라 `wordmark`다.** `font-serif`로 열어두면 제목이나 인용문에 다시 번진다. 이름으로 용도를 잠근다.

```html
<!-- 워드마크만 -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@600&display=swap">
```

`Apple SD Gothic Neo`를 스택 앞단에 두지 않는다. 애플 기기에서만 다른 서체가 나와 화면 인상이 갈리기 때문이다. 마지막 `sans-serif`는 CDN이 죽었을 때만 쓰이는 최후 수단이며, 정상 상태에서는 도달하지 않는다.

### 판단 기준

> **서체를 바꾸지 말고 크기와 굵기를 바꾼다.**

위계가 필요하면 px를 올리거나 400 → 600으로 간다. **본문 서체를 두 개로 늘리지 않는다.** 강조색이 황동 하나뿐인 것과 같은 이유다 — 축이 하나여야 그 축이 읽힌다. 워드마크는 위계가 아니라 표식이므로 이 규칙의 밖에 있다.

### 크기 규칙

- 본문은 `{typography.body}` 17px다. 16px가 아니다. 애플 시스템의 읽기 속도를 정의하는 값이며 리뷰가 많이 보이는 서비스에 유리하다.
- 히어로 57 / 섹션 41 / 카드 이름 21 / 인용 25px. 원래 명조의 시각 보정으로 잡힌 홀수값인데, 서체가 바뀐 뒤에도 그대로 쓴다. 1px을 되돌려 얻을 시각적 이득이 없고 토큰만 흔들린다.
- 자간은 한글 기준으로 완화한다. 애플의 -0.374px는 로마자 기준이며, 한글에 그대로 적용하면 답답해진다. 본문 `-0.2px`, 큰 제목 `-0.4 ~ -0.5px`.
- 굵기 사다리는 `400 / 600`만 쓴다. 500은 쓰지 않는다.

### 이탤릭 금지

**한글에는 이탤릭이 없다.** `font-style: italic`을 걸면 브라우저가 합성 오블리크를 만들어 세로획이 사선으로 눕고 글자가 뭉개진다. 인용문은 기울이지 않고 여는 따옴표로 구분한다.

---

## Components

### Buttons

**`button-primary`** — 주요 CTA. 배경 `{colors.accent}`, 텍스트 `{colors.on-accent}`, `{typography.button}`, `{rounded.pill}`, 패딩 13px × 26px. 누름 상태 `transform: scale(0.96)`. 크림·화이트 타일 위에서 사용한다.

**`button-on-dark`** — 딥 네이비 타일 위 주요 CTA. 배경 `{colors.accent-on-dark}`, 텍스트 `{colors.surface-deep-1}`. 기본 황동은 네이비 위에서 대비가 부족하므로 이 변형을 쓴다.

**`button-quiet`** — 보조 동작. 배경 없음, 텍스트 `{colors.accent}`. 테두리를 넣지 않는다.

#### 어느 버튼이 채움을 갖는가

**한 화면에서 채움(`{component.button-primary}` / `{component.button-on-dark}`)은 실제로 동작하는 액션이 갖는다. 아직 구현되지 않은 액션은 `{component.button-quiet}`로 내린다.**

히어로가 그 예다. `찾기`는 눌리면 진짜로 검색 페이지로 이동하므로 `{component.button-on-dark}` 채움을 갖고, `항해 시작하기`는 로그인이 8/24 예정이라 토스트만 띄우므로 텍스트 버튼이다. 문구의 무게로는 후자가 더 커 보이지만, 화면의 위계는 **문구의 야심이 아니라 눌렀을 때 일어나는 일**을 따른다.

`{component.badge-coming-soon}`에 황동을 쓰지 않는 것과 같은 규칙이다. 황동은 "누를 수 있음"의 유일한 신호이고, 아무 일도 일어나지 않는 것에 그 신호를 가장 강한 형태로 주면 신호가 오염된다.

**되돌리지 마라.** 로그인이 실제로 열리는 시점(8/24)에 `항해 시작하기`를 채움으로 올릴지 다시 판단한다 — 그때는 두 액션이 다 동작하므로 무엇이 더 중요한 액션인지로 갈리고, 이 규칙이 아니라 그 판단이 근거가 된다.

**8/24 판단: 올리지 않는다.** 로그인이 열렸으니 이제 규칙이 아니라 중요도로 갈리는데, 히어로에서 **그 자리에서 완결되는 액션은 검색**이고 로그인은 그다음 단계다. 황동 채움은 화면당 하나라는 제약도 그대로다. `항해 시작하기`는 `{component.button-quiet}`로 남되 `<button>`에서 `<a href="login.html">`이 되었다 — 이제 진짜로 어딘가로 가므로 링크가 맞고, JS가 죽어도 로그인 진입로가 살아 있다.

로그인한 사람에게는 문구가 `항해 이어가기`로 바뀌고 일지 작성 안내 토스트를 띄운다. 8/25에 작성 화면이 열리면 그때 다시 판단한다 — **그 시점에는 로그인한 사람의 히어로에서 가장 중요한 액션이 검색이 아닐 수 있다.**

### Inputs

**`search-neighborhood`** — 히어로의 동네 검색창. 배경 `{colors.canvas-white}`, `{rounded.pill}`, 높이 52px, 패딩 14px × 24px, 테두리 1px `{colors.hairline}`. 앞쪽에 16px 검색 글리프.

**동네는 자유 입력이고, 카카오가 해석하는 곳이면 어디든 값이 된다.** 8/21 이전에는 select에 박힌 6개였다 — 그 6개는 제품 판단이 아니라 `mock-data.js`의 카드 6장을 그대로 옮긴 목록이었고, PRD가 적어둔 생활권 목록(13개)조차 다 담지 못했다. 카카오 로컬이 전국을 해석하는데 UI가 그걸 6개로 묶어두고 있었다.

**개척 컨셉은 입력 방식이 아니라 순서에 담긴다.** 지역 칸이 먼저고 키워드 칸이 그다음이며, 지역은 여전히 "검색 중심점"이지 검색어가 아니다. 그 구조가 유지되는 한 자유 입력은 컨셉을 흐리지 않는다 — 오히려 6개 바깥의 동네에 사는 사람에게 이 서비스를 쓸 방법을 준다.

**가게명으로도 찾을 수 있다.** 이전 규칙은 키워드를 음식으로만 한정했지만, 지역을 좁혀 놓은 상태의 이름 검색은 "그 가게 어디였지"에 답하는 것이지 맛집 앱의 랭킹 문법이 아니다. placeholder는 두 축(음식·가게명)을 다 가르친다.

히어로 폼은 **JS 없이 동작하는 네이티브 GET 폼**이다. 제출하면 `search.html?region=<지역명>&q=<키워드>`로 이동한다. 스크립트가 죽어도 검색이 살아 있어야 한다.

**히어로 검색창에는 유리를 쓰지 않는다.** 네이비 단색 면 위에는 뒤로 지나갈 콘텐츠가 없어서, 유리를 놓으면 그냥 회색 반투명 사각형이 된다.

포커스 시 테두리가 `{colors.accent-focus}` 2px로 바뀐다.

### Forms

**8/24 로그인 폼이 이 프로젝트의 첫 입력 폼이다.** 원래 8/18 리뷰 작성 화면에서 정하기로 했던 규칙인데 그 화면이 만들어지지 않았으므로 여기서 정한다.

**`form-field`** — 라벨 + 입력 + (선택) 도움말의 한 덩어리. 라벨은 `{typography.caption}` `{colors.ink-muted-72}`, 입력 위 8px. 입력은 `{component.search-neighborhood}`와 같은 명세다 — 배경 `{colors.canvas-white}`, `{rounded.pill}`, 높이 52px, 1px `{colors.hairline}`. 도움말은 입력 아래 8px, `{typography.fine-print}` `{colors.ink-muted-48}`. 필드 사이 간격은 20px.

**유리 안쪽 컨트롤(`.lg-inner`)을 쓰지 않는다.** 그건 유리 표면 위에서만 성립하는 재질이고, 로그인 카드는 크림 면 위의 콘텐츠 레이어다.

**`form-error`** — 폼 하나에 하나만 둔다. `{typography.caption}` `{colors.accent}`, 제출 버튼 바로 위. 필드마다 붙이지 않는 이유는 이 폼의 실패가 대부분 필드 하나로 귀속되지 않기 때문이다 — "이메일 또는 비밀번호가 맞지 않습니다"는 두 칸의 문제다.

**에러 색으로 빨강을 만들지 않는다.** 두 번째 강조색을 만들지 않는다는 규칙이 여기서도 유효하다. 황동 하나로 "여기를 보라"를 표현하고, 무엇이 잘못됐는지는 문장이 말한다.

**메시지는 한국어 문장이다.** Supabase가 돌려주는 영어 원문을 화면에 그대로 올리지 않는다. 매핑은 `js/auth.js`의 `toKorean()`이 갖고, 모르는 것은 "잠시 후 다시 시도해 주세요."로 떨어뜨린다.

**브라우저 기본 검증을 끄지 않는다.** `required` · `type="email"` · `minlength`가 한국어로 먼저 걸러 주고, 그 뒤 남는 것만 서버가 판정한다. `novalidate`를 쓰면 그 무료 계층을 버리게 된다.

**모드 전환은 페이지 이동이 아니다.** 로그인과 회원가입은 한 페이지에서 `data-mode` 속성으로 갈린다. 회원가입 전용 블록은 `hidden` 속성으로만 여닫으므로 `display` 계열 유틸리티를 붙이지 않는다 — `{component.state-block}`과 같은 계약이다.

### Cards

**`card-place`** — 맛집 카드. 배경 `{colors.canvas-white}`, 1px `{colors.hairline}` 테두리, `{rounded.lg}` 18px, 패딩 20px.

구성은 위에서부터 ① **4:3 사진** (`{rounded.md}` 12px, `{shadow.photo}`) → ② **가게명** `{typography.card-title}` → ③ **동네 칩** `{component.chip-neighborhood}` → ④ **`{component.anchor-rating}`**.

**정보를 더 얹지 않는다.** 별점 평균·리뷰 수·가격대·영업시간을 넣는 순간 흔한 맛집 카드가 된다. 카드에 등장하는 숫자는 재방문 비율 하나뿐이어야 그것이 차별점으로 읽힌다.

모든 카드는 같은 4:3 종횡비를 지킨다. 비율이 흔들리면 그리드가 시끄러워진다.

호버: `transform: translateY(-2px)`, 테두리가 `{colors.hairline}` → `{colors.glyph-empty}`. **그림자를 더하지 않는다.**

**`card-place-mock`** — 8/14 랜딩 전용. 사진 자리에 4:3 색면을 둔다. 크림 계열 3단계(`#F4EFE6` / `#EAE1D2` / `#E3D8C6`)를 순환시키고 중앙에 가게명 이니셜을 `{typography.section-display}`로 얹는다. 구조는 `{component.card-place}`와 동일해서 8/18에 색면만 `<img>`로 교체하면 된다.

**색면에는 `{shadow.photo}`를 주지 않는다.** 그림자가 존재하는 이유는 사진 속 대상이 면 위에 놓여 있기 때문이다. 색면은 놓인 물체가 아니라 빈 자리 표시이므로 그림자를 받을 근거가 없다. 8/18에 진짜 사진이 들어올 때 함께 추가한다.

### Anchor Rating

**`anchor-rating`** — 이 시스템의 시각적 서명. 별점을 쓰지 않는다.

데이터는 3상태다 — `willRevisit: 'yes' | 'once' | 'maybe'`. 닻은 `yes`만 시각화한다.

**형태가 두 가지다. 집계값이냐 개인 기록이냐로 갈린다.**

**① 집계형 — 닻 5개 + 비율 숫자.** 여러 사람의 `yes` 비율을 표시한다. 인기 맛집 카드에서만 쓴다. 닻 5개를 나란히 두고 비율을 5단계로 반올림한 만큼 `{colors.accent}`로 채운다. 나머지는 `{colors.glyph-empty}` 아웃라인. 글리프 16px, 자간 4px. 오른쪽에 실제 비율을 `{typography.ratio-number}`로 병기한다.

```
⚓⚓⚓⚓⚓  또 갈래요 8/10
```

닻 5개는 스캔용이고 숫자가 근거다. 별점은 "내 만족도"지만 재방문율은 "다시 찾은 사람의 비율"이므로 숫자가 사라지면 의미가 손실된다.

**② 단일형 — 닻 1개 + 라벨.** 한 사람의 판정을 표시한다. 항해일지 인용 카드에서만 쓴다.

```
⚓ 또 갈래요
```

**개인 기록에 닻 5개를 쓰지 않는다.** 한 편의 일지는 한 사람의 기록이라 5단계로 나눌 모집단이 없다. 같은 기호가 두 섹션에서 다른 뜻이 되면 서명이 흐려진다. `once`·`maybe`인 기록에는 닻을 표시하지 않는다 — 빈 닻을 두면 "평가가 나쁘다"는 신호가 되어 3상태의 뉘앙스가 무너진다.

**은유 분담을 지킨다.** 깃발은 개척(처음 방문), 닻은 재방문(또 머묾)이다. 로드맵의 지도 개척 기능에서 깃발이 방문 표시로 쓰이므로, 재방문율에 깃발을 쓰지 않는다.

첫 등장 섹션 상단에 라벨을 한 번 붙인다 — `⚓ 다시 찾은 사람의 비율`. 낯선 기호는 한 번만 설명하면 된다.

### Quote

**`quote-log`** — 항해일지 인용. 텍스트 `{typography.quote}`, 딥 네이비 타일 위에서는 `{colors.on-dark}`.

**한 편씩 카드로 끊는다.** 배경 `{colors.surface-deep-2}`, `{rounded.lg}` 18px, 패딩 24px, 테두리 1px `{colors.on-dark}` 10%.

배경 없이 나란히 두면 어디까지가 한 편인지 읽히지 않는다. 맛집 카드가 크림 타일 위 화이트 카드이듯, 여기는 딥 네이비 타일 위 한 단계 밝은 면이다. `{colors.surface-deep-2}`가 "어두운 타일이 겹칠 때 쓰는 미세 단차"로 정의된 이유가 이것이다.

테두리에 새 색을 만들지 않는다. `{colors.hairline}`은 밝은 면 전용이므로, 네이비 위에서는 `{colors.on-dark}`의 투명도를 10%로 낮춰 쓴다.

구성은 위에서부터 ① 여는 따옴표 → ② 인용 → ③ `{component.anchor-rating}` 단일형 → ④ 메타 줄이다.

메타 줄은 `작성자 · 가게명 · 동네 · 날짜` 순서로 `{typography.caption}`, `{colors.on-dark-muted}`. **작성자를 반드시 넣는다.** 이 서비스는 남의 항해일지를 읽을 수 있는 구조이고, 작성자 표기가 그 정책이 화면에 드러나는 유일한 지점이다. 작성자가 없으면 내 기록인지 남의 기록인지 알 수 없다.

메타는 네 항목까지다. 여기서 더 늘리지 않는다.

인용 앞에 **여는 따옴표만** `{typography.quote-mark}` 48px, `{colors.accent-on-dark}`로 크게 둔다. **닫는 따옴표는 넣지 않는다.** 양쪽 다 크게 하면 장식이 과해지면서 절제가 깨진다.

기울이지 않는다. 좌측 세로선도 쓰지 않는다. 따옴표 하나로 충분하다.

**`card-feature`** — 서비스 특징 카드. 배경 `{colors.canvas-cream}`, `{rounded.lg}` 18px, 패딩 24px, 테두리 없음.

**`{component.section-tile-white}` 위에 놓이므로 배경이 반대로 뒤집힌다.** 맛집 카드는 크림 타일 위 화이트 카드였고, 특징 카드는 화이트 타일 위 크림 카드다. 같은 조합을 그대로 쓰면 흰 바탕에 흰 카드가 되어 형태가 사라진다.

구성은 제목 `{typography.card-title}` → 설명 `{typography.body}` → `{component.badge-coming-soon}`. 누를 수 없는 요소이므로 `<div>`로 두고 호버 반응을 넣지 않는다.

### Carousel Nav

**`carousel-nav`** — 가로 스크롤러를 한 장씩 넘기는 좌우 버튼. 44×44px 원형, 배경 `{colors.surface-deep-2}`, 글리프 `{colors.accent-on-dark}`, 테두리 1px `{colors.on-dark}` 10%. `{component.quote-log}` 카드와 같은 면·같은 테두리를 써서 한 벌로 읽히게 한다.

**터치 환경에는 표시하지 않는다.** 스와이프로 넘어가는데 버튼까지 두면 크롬만 늘어난다. 반대로 **포인터 환경에는 반드시 둔다** — 스크롤바를 숨겨 놓았으므로 버튼이 없으면 넘길 방법이 아예 없다.

섹션 제목 오른쪽 끝에 둔다. 카드 위에 겹쳐 올리지 않는다. 인용문을 가리는 순간 읽기가 방해된다.

**상태를 정직하게 표시한다.** 양 끝에 닿으면 해당 버튼을 `disabled`로 두고 투명도 30%로 낮춘다. 넘길 카드가 없으면(콘텐츠가 스크롤러에 다 들어오면) 버튼 묶음 자체를 감춘다. 눌러도 아무 일이 없는 버튼을 남겨 두지 않는다.

이동 폭은 **카드 실측 폭 + 간격**이다. 브레이크포인트마다 카드 폭이 달라지므로 상수로 박지 않는다.

### Badge & Toast

**`badge-coming-soon`** — 아직 없는 기능 표시. 배경 `{colors.divider-soft}`, 텍스트 `{colors.ink-muted-48}`, `{rounded.pill}`, 패딩 6px × 12px. 황동을 쓰지 않는다. 누를 수 없는 것에 인터랙션 색을 쓰면 신호가 오염된다.

**`toast`** — 미구현 기능 안내. 배경 `{colors.surface-deep-1}`, 텍스트 `{colors.on-dark}`, `{rounded.md}`, 패딩 14px × 20px. 화면 하단 중앙에서 위로 12px 올라오며 나타나고 3초 뒤 사라진다.

**표시 여부는 `data-visible` 속성 하나로 표현한다.** 두 페이지가 같은 계약을 쓴다 — `textContent`를 넣고 `data-visible="true"`, 3초 뒤 `"false"`.

`hidden`(=`display:none`)을 쓰지 않는 이유는 두 가지다. 트랜지션이 시작되지 않고, 무엇보다 **`aria-live` 영역이 숨겨져 있으면 텍스트 변경이 낭독되지 않는다.** `visibility:hidden`도 같은 이유로 안 된다. `opacity:0`은 접근성 트리에 남으므로 `role="status"`가 정상 동작한다.

`transform`은 CSS가 X·Y를 통째로 소유한다. 마크업에 가로 중앙 정렬 유틸리티를 남기면 ID 선택자가 이겨 정렬이 조용히 깨진다.

### 기능 레이어 — Liquid Glass

`LIQUID-GLASS.md`가 재질과 레이어링을, 이 문서가 색을 맡는다. 충돌하면 **색은 이 문서, 레이어링은 그 문서**가 이긴다. 유리의 수치(blur·불투명도·하이라이트·그림자·반경)는 `LIQUID-GLASS.md` §10.2에만 있고 여기에 복제하지 않는다.

**유리는 기능 레이어에만 쓴다.** 맛집 카드·항해일지 카드·특징 카드·검색 결과 카드는 콘텐츠 레이어이므로 지금처럼 불투명 화이트/크림/`{colors.surface-deep-2}` 면을 유지한다. "유리처럼 보이는 카드"는 Liquid Glass가 아니다.

**뒤로 지나갈 콘텐츠가 없으면 유리를 쓰지 않는다.** 단색 면 위의 유리는 그냥 회색 반투명 사각형이다. 히어로 검색창이 불투명 화이트로 남은 이유가 이것이다 — 네이비 단색 면 위에는 비칠 것이 없다.

한 화면에 동시에 보이는 유리 표면은 **2개**다. 모바일에서 동시 `backdrop-filter`를 2개 이하로 유지하기 위한 상한이기도 하다.

**`glass-toolbar`** — 상단 내비/워드마크 바. 두 페이지 공통이고 화면 상단에 고정된다. 전면 바이므로 라운드가 없다 — 전면 타일에 라운드를 주지 않는 것과 같은 이유다.

fill을 **딥 네이비(`{colors.surface-deep-1}`)로 틴트한다.** 크림 틴트도 그려 보고 정했다. 크림은 히어로 네이비 위에 정지해 있을 때 바가 회색 띠로 떠서, "뒤에 아무것도 없는 유리"의 전형적인 실패로 보인다. 네이비 틴트는 히어로에서 출발할 때 타일에 녹아 있다가 크림·화이트 타일이 아래로 지나가기 시작하면 그때 표면으로 떠오른다. **유리가 뒤에 있는 것에 반응한다는 사실 자체가 눈에 보인다.**

그래서 이 유리는 **네이비 면**이고, 위에 얹는 전경색은 `{colors.on-dark}` / `{colors.on-dark-muted}`, 액센트는 `{colors.accent-on-dark}`다. "딥 네이비 타일 위에서는 밝은 황동을 쓴다"는 기존 규칙이 그대로 적용된다. **새 색이 아니라 히어로가 쓰던 색이 기능 레이어로 이어진 것이다.**

이것이 "네이비는 히어로와 항해일지 섹션에만"이라는 규칙의 예외가 아닌 이유: 바는 타일이 아니라 그 위를 떠다니는 레이어이고, 반투명해서 아래 타일의 색을 계속 받는다. 네이비 타일 위에서는 사실상 보이지 않는다.

**`filter-bar`** — 검색 페이지의 지역·키워드·카테고리 묶음. 결과 그리드가 그 아래를 지나가므로 유리를 쓸 자격이 있다.

**역할은 그대로 두고 형태만 환경에 맞춰 바꾼다.** 모바일은 하단 툴바(`safe-area-inset` 포함), 넓은 폭에서는 상단 고정이다. 툴바 아이템은 기능으로 묶는다 — 검색(동네·키워드·찾기)과 카테고리 좁히기를 여백으로 분리한다. 같은 배경을 공유하는 그룹 안에서 텍스트 버튼과 아이콘 버튼을 섞지 않는다.

**유리 위에 유리를 올리지 않는다.** 안쪽 컨트롤(select·입력창·칩·찾기 버튼)은 반투명 fill과 vibrancy로만 처리한다. 주요 액션인 `찾기`와 선택된 카테고리 칩은 유리를 틴트하는 대신 **불투명 밝은 황동 fill**을 쓴다. 그래서 이 시스템에는 틴트된 유리 표면이 0개다.

**그림자는 유리에만 예외를 만든다.** "그림자는 음식 사진에만"이라는 규칙은 콘텐츠 레이어 이야기다. 기능 레이어는 떠 있다는 사실 자체가 정보라서 접지 그림자가 필요하다. 대신 검정이 아니라 먹색을 깔아 팔레트 안에 둔다.

### Search Results

**`card-place-search`** — 검색 결과 카드. `{component.card-place}`와 같은 구조·같은 면이지만 **닻 자리가 "아직 기록 없음"으로 바뀐다.**

구성은 ① 4:3 색면 → ② 가게명 → ③ 동네 칩 + 카테고리 → ④ `아직 기록 없음` `{typography.caption}` `{colors.ink-muted-48}`이다.

**별점·리뷰 수·가격대를 넣지 않는다.** 그리고 **실제 가게에 가짜 닻을 붙이지 않는다.** 카카오 로컬에는 사진도 재방문 데이터도 없다. 없는 것을 없다고 쓰는 편이 정직하고, 기록이 쌓이면 그 자리가 그대로 `{component.anchor-rating}`으로 바뀐다.

색면은 `{colors.canvas-cream}` / `{colors.surface-cream-deep}` / `#E3D8C6` 3단계를 순환하고 **그림자를 주지 않는다.**

**카드는 누를 수 있으므로 키보드 초점을 받아야 한다.** 루트에 `role="button"`과 `tabindex="0"`을 준다. `<button>`으로 감싸지 않는다 — `<button>`의 콘텐츠 모델은 phrasing content라 안에 `<h3>`를 넣으면 유효하지 않은 HTML이 된다. `role="button"`이면 스크린리더가 카드 안 텍스트를 이어 붙여 하나의 버튼으로 읽고, 카드가 하는 일이 하나뿐이라 그게 맞다.

**포커스 링은 색면이 아니라 카드 전체에 건다.** `:focus-visible`에 `{colors.accent-focus}` 2px 아웃라인, 오프셋 2px. `outline: none`만 주고 끝내지 않는다. 호버·누름은 `{component.card-place}`와 같다 — `translateY(-2px)` + 테두리 `{colors.glyph-empty}`, 누름 `scale(0.96)`. 그림자를 더하지 않는다.

`hover:` 유틸리티는 `(hover: hover)` 안에서만 적용되게 잠가 두었다(`tw-config.js`의 `hoverOnlyWhenSupported`). 잠그지 않으면 터치에서 탭한 뒤 호버 상태가 남는다.

**`state-block`** — 검색 페이지의 빈 상태·로딩·에러·키 없음 안내. 배경 `{colors.canvas-white}`, 1px `{colors.hairline}`, `{rounded.lg}`, 패딩 56 × 24px, 가운데 정렬. 제목 `{typography.card-title}` + 설명 `{typography.body}` `{colors.ink-muted-72}`.

**콘텐츠 레이어이므로 유리를 쓰지 않는다.** 그리고 이 블록들에 `display` 계열 유틸리티를 붙이지 않는다 — 표시 여부를 `hidden` 속성으로만 토글하므로, `display`가 한 번이라도 지정되면 숨겨야 할 블록이 남는다.

**`region-suggest`** — 지역 입력 아래(모바일에서는 위)로 열리는 자동완성 패널. 배경 `{colors.canvas-white}`, 1px `{colors.hairline}`, 반경은 `--lg-r-group`, 패딩 `--lg-pad`. 행은 최소 높이 44px에 두 줄 — 지역명 `{typography.body}` + 구분용 주소 `{typography.caption}` `{colors.ink-muted-48}`. "성수동"은 여러 시에 있어서 둘째 줄이 장식이 아니라 구분 수단이다.

**유리가 아니다.** 한 화면의 유리는 상단 바와 필터 바로 이미 2개를 다 썼고, 필터 바에서 열리는 패널을 유리로 만들면 유리 위 유리가 된다. 흰 면에 먹색 그림자(`--lg-shadow`)를 깔아 떠 있다는 것만 표현한다 — 기능 레이어의 그림자 예외가 여기에도 적용된다.

**패널은 `<body>` 직속이어야 한다.** `.lg`의 `contain: paint`가 필터 바 밖으로 나가는 자식을 잘라내고 `isolation: isolate`가 z-index를 가둔다. 필터 바 안에 넣으면 패널이 그냥 안 보이고, 에러는 나지 않는다.

**등장 애니메이션을 주지 않는다.** `hidden` 속성으로만 여닫는다. 닫힌 listbox는 접근성 트리에서 빠져야 하는데 `hidden`이 그 일을 하고, 대신 트랜지션이 안 걸린다. 겸사겸사 유리 조상 아래 `transform`이 `backdrop-filter`를 죽이는 함정도 피한다.

**활성 항목 강조는 `:hover`와 별도 규칙이다.** 키보드로 이동할 때는 hover가 생기지 않으므로 `[aria-selected="true"]`에 따로 건다. 고대비 설정에서는 배경 틴트만으로 구분이 사라지니 2px inset 링을 더한다.

### Footer

**`section-tile-footer`** — 배경 `{colors.surface-cream-deep}`, 텍스트 `{colors.ink-muted-72}`, 상하 패딩 64px. 링크는 `{typography.body}`에 행간 2.2로 넉넉히. 최하단 법적 문구는 `{typography.fine-print}`.

---

## Do's and Don'ts

### Do

- 섹션 구분은 배경색 교차로만 한다. 구분선·테두리를 긋지 않는다.
- 모든 "누를 수 있음" 신호는 `{colors.accent}` 황동 하나로 통일한다.
- 딥 네이비 타일 위에서는 `{colors.accent-on-dark}`로 바꿔 쓴다.
- 그림자는 음식 사진에만 준다 — `{shadow.photo}` 하나뿐이다.
- 누름 상태는 모든 버튼에서 `transform: scale(0.96)`.
- 위계는 크기와 굵기로만 만든다. 두 번째 서체를 도입하지 않는다.
- 카드의 사진 종횡비는 전부 4:3으로 고정한다.
- 크림을 기본 캔버스로 두고, 네이비는 히어로와 항해일지 섹션에만 쓴다.
- 유리는 기능 레이어(상단 바·필터 바)에만 쓴다. 뒤로 콘텐츠가 지나가는 자리에만.
- 유리의 fill은 딥 네이비로 틴트하고, 그 위 전경색은 `{colors.on-dark}` 계열과 `{colors.accent-on-dark}`를 쓴다.
- 접근성 설정(`prefers-reduced-transparency` · `prefers-reduced-motion` · `prefers-contrast`) 세 가지를 전부 구현한다.

### Don't

- 두 번째 강조색을 만들지 않는다.
- 카드·버튼·텍스트에 그림자를 넣지 않는다.
- 배경 그라디언트를 장식으로 쓰지 않는다. 분위기는 사진과 면이 만든다.
- 한글에 `font-style: italic`을 걸지 않는다.
- 전면 타일에 라운드를 주지 않는다. 타일은 화면 끝까지 닿는다.
- 카드에 별점·리뷰 수·가격대를 추가하지 않는다.
- 재방문율에 깃발이나 별을 쓰지 않는다.
- 개인 기록 한 편에 닻 5개를 쓰지 않는다. 집계값 전용이다.
- 색면 썸네일에 그림자를 주지 않는다.
- 화이트 타일 위에 화이트 카드를 놓지 않는다.
- CDN 경로를 버전 태그 없이 쓰지 않는다.
- 굵기 500을 쓰지 않는다. 400과 600만 존재한다.
- 라운드 문법을 섞지 않는다. 타일 0, 카드 18px, 사진 12px, 버튼과 검색창 pill.
- `{colors.accent-on-dark}`를 밝은 배경에서 쓰지 않는다. 네이비 전용이다.
- 콘텐츠 카드(맛집·항해일지·특징·검색 결과)에 유리를 쓰지 않는다.
- 유리 위에 유리를 올리지 않는다. 안쪽은 fill과 vibrancy로 처리한다.
- 유리 요소를 `transform`이 걸린 조상 안에 넣지 않는다. iOS Safari에서 `backdrop-filter`가 통째로 무력화된다.
- 누를 수 있는 요소를 마우스 전용으로 만들지 않는다. 클릭 핸들러가 붙으면 초점과 포커스 링도 함께 붙는다.
- 실제 가게에 가짜 닻(재방문율)을 붙이지 않는다. 기록이 없으면 없다고 쓴다.
- 뷰포트 높이에 `100vh`를 쓰지 않는다. 모바일 주소창이 접히면 흔들린다 — `100dvh`.

---

## Responsive Behavior

### 브레이크포인트

| 이름 | 폭 | 주요 변화 |
|---|---|---|
| 작은 모바일 | ≤ 419px | 카드 1열, 히어로 28px, 섹션 패딩 40px |
| 모바일 | 420–639px | 카드 1열, 히어로 34px, 섹션 패딩 48px |
| 태블릿 | 640–1023px | 카드 2열, 히어로 41px, 섹션 패딩 64px |
| 데스크탑 | 1024–1279px | 카드 3열, 히어로 48px |
| 넓은 데스크탑 | ≥ 1280px | 카드 3열, 히어로 57px, 콘텐츠 1200px 고정 |

### 터치 타겟

최소 44 × 44px. `{component.button-primary}`는 패딩 포함 약 44px 높이, `{component.search-neighborhood}`는 52px다.

### 접힘 규칙

- 카드 그리드: 3열 → 2열(1023px) → 1열(639px)
- 히어로 검색창: 데스크탑에서 버튼과 가로 배치, 모바일에서 세로 적층 후 전체 폭
- 최근 항해일지: 데스크탑·모바일 모두 가로 스크롤 유지. **모바일에서는 카드 폭이 스크롤러를 꽉 채워 한 번에 한 편만 보인다.** 옆 카드를 살짝 걸치게 두지 않는다 — 위 카드 그리드와 좌측 시작선이 어긋나고, 잘린 카드가 화면을 침범해 읽기를 방해한다.
- 가로 스크롤러를 타일 밖으로 흘리지 않는다. 섹션 컨테이너 안에 두어야 다른 섹션의 카드와 시작선이 맞는다.
- 가로 스크롤러에는 **`{component.carousel-nav}`를 반드시 짝지운다.** 640px 이상에서만 보이며, 그 아래는 스와이프가 대신한다.
- 섹션 패딩: 80px → 64px → 48px → 40px
- `{component.filter-bar}`: 640px 이상은 상단 고정, 그 아래는 하단 툴바. 하단일 때 `env(safe-area-inset-bottom)`을 더해 홈 인디케이터를 피하고, 결과 그리드 아래에 그만큼 여백을 둔다.
- 형태는 화면 폭보다 **입력 모델**로 먼저 갈린다. hover 반응은 `(hover: hover) and (pointer: fine)`으로 감싼다 — 감싸지 않으면 터치 기기에서 탭한 뒤 hover가 남는다.

### 이미지

- 카드 사진은 4:3 고정. 폭만 변한다.
- 히어로는 사진을 쓰지 않는다. 딥 네이비 면과 큰 제목으로 버틴다.
- 지연 로딩이 기본. 첫 화면은 즉시 로딩.

---

## Motion

### 스크롤 등장·퇴장

히어로를 제외한 각 타일의 **내용**이 뷰포트에 들어오면 아래에서 위로 28px 올라오며 나타나고, 벗어나면 다시 사라진다. 700ms `ease-out`, 양방향이다.

**타일 자체가 아니라 안쪽 컨테이너에 건다.** 배경까지 페이드하면 크림 body 위로 네이비 타일이 비쳐 색이 섞인다. 배경은 즉시 바뀌고 내용만 떠오른다.

**`.reveal` 클래스는 JS가 붙인다.** HTML에 미리 넣어 두면 스크립트가 죽었을 때 내용이 투명한 채로 남는다.

`prefers-reduced-motion: reduce`에서는 연출을 하지 않고 처음부터 보이게 둔다.

### 나머지 움직임

- 누름: `transform: scale(0.96)` — 모든 버튼 공통
- 카드 호버: `translateY(-2px)` + 테두리 색 변화. 그림자를 더하지 않는다
- 토스트: 하단 중앙에서 위로 12px, 3초 후 소멸

장식용 움직임을 추가하지 않는다. 패럴랙스·자동 캐러셀·무한 루프 애니메이션을 쓰지 않는다.

---

## Iteration Guide

1. 한 번에 하나의 컴포넌트만 다룬다. `{component.card-place}`처럼 키로 지칭한다.
2. 변형은 `-on-dark`, `-mock`처럼 별도 항목으로 둔다.
3. 값을 인라인 hex로 적지 않는다. 항상 토큰 참조를 쓴다.
4. 강조가 필요하면 크롬을 더하기 전에 **면을 바꾼다** (크림 → 네이비).
5. 서체는 Pretendard 하나다. 위계가 필요하면 크기나 굵기를 바꾼다. 워드마크만 예외이며 그 예외를 늘리지 않는다.
6. 그림자는 음식 사진에만. 예외를 만들지 않는다.
7. 새 색을 추가하고 싶어지면, 먼저 기존 6색으로 안 되는 이유를 적어본다.

---

## Known Gaps

- ~~폼 검증·에러 상태는 아직 정의하지 않았다.~~ **해소** — 8/18 리뷰 작성 화면이 만들어지지 않아 미뤄져 있다가, 8/24 로그인 폼에서 `{component.form-field}` · `{component.form-error}`로 정했다. 리뷰 작성 화면은 이 규칙을 따른다.
- 다크 모드 대응은 정의하지 않았다. 이 시스템은 이미 크림과 네이비를 함께 쓰므로 별도 다크 모드가 필요한지부터 판단해야 한다. **`prefers-color-scheme: dark`를 도입하지 않기로 한 것은 이 판단이 끝날 때까지의 결정이다.** `LIQUID-GLASS.md` §10.2의 dark 토큰 블록도 같은 이유로 넣지 않았다.
- 유리 위 vibrancy 램프가 `{colors.on-dark}` 계열 하나뿐이다. 유리가 항상 네이비 면이라 먹색 램프를 만들 근거가 없었다. 밝은 면 유리를 도입하게 되면 그때 `{colors.ink}` 기반 램프를 추가한다.
- 유리가 크림 위에 있을 때는 뒤 콘텐츠가 섞여 들어와 순수한 네이비가 아니라 **한 단계 밝은 청회색**으로 렌더된다. 대비는 충분하지만(크림 라벨 기준 8:1 근처) 브랜드 네이비와 같은 색으로 읽히지는 않는다. 이것이 의도한 인상인지 실기기에서 한 번 더 봐야 한다.
- 검색 결과가 비어 있는 상태에서는 필터 바 뒤로 지나갈 것이 없어 유리가 평평한 판으로 보인다. 결과가 차면 해소되지만, 빈 상태의 첫인상은 확인이 필요하다.
- 8/25 차트(도넛·워드클라우드)의 색 단계는 미정이다. 황동 하나로 3분할(또 갈 곳 / 한 번이면 충분 / 애매함)을 표현할지, 예외적으로 명도 단계를 쓸지 결정이 필요하다.
- ~~닻 글리프의 소스가 미정이다.~~ **해소** — 인라인 SVG `<symbol id="icon-anchor">`를 문서 상단에 한 번 정의하고 `<use>`로 재사용한다. 네트워크 의존성이 없고 `fill="currentColor"`라 채움·빈 상태를 색만으로 전환할 수 있다. 16px에서 읽히도록 링·가로대·갈고리만 남긴 단순형으로 그린다. 다만 **실제로 16px에서 읽히는지는 구현 후 검증이 필요하다.**
- 실제 음식 사진이 들어오는 8/18 이후, 크림 배경과 사진 채도의 궁합을 재확인해야 한다.

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| beta.3 | 2026-08-24 | **로그인 페이지 신설과 폼 규칙 정의.** `form-field`(라벨+입력+도움말)·`form-error`를 등록해 "폼 검증·에러 상태 미정" Known Gap을 해소했다 — 원래 8/18 리뷰 작성 화면에서 정하기로 했으나 그 화면이 만들어지지 않아 로그인 폼이 첫 입력 폼이 되었다. 에러 색으로 빨강을 만들지 않고 황동 하나를 유지한다. 로그인 카드는 유리가 아니다(한 화면의 유리는 상단 바 하나로 충분하고 뒤로 지나가는 콘텐츠가 없다). **`항해 시작하기` 채움 판단을 종결** — 올리지 않고 `button-quiet`로 두되 `<a href="login.html">`로 바꿨다. 헤더에 로그인 상태 슬롯(`auth-link`·`auth-name`·`auth-signout`)을 텍스트만으로 추가했고, 닉네임은 누를 수 없는 표시라 `--lg-label-2`로 한 단 내렸다. 세션 복원 전에는 셋 다 `hidden`이다. |
| beta.2 | 2026-08-21 | **지역을 select에서 자유 입력으로 되돌리고 자동완성을 붙였다.** beta의 "동네는 자유 입력이 아니라 select다"를 뒤집는다 — 그 6개는 제품 판단이 아니라 mock 카드 6장을 옮긴 목록이었고, 카카오가 전국을 해석하는데 UI가 6개로 묶어두고 있었다. 개척 컨셉은 입력 방식이 아니라 **지역이 먼저라는 순서**에 담기므로 자유 입력이 컨셉을 흐리지 않는다. 키워드의 가게명 금지도 해제 — 지역을 좁힌 뒤의 이름 검색은 랭킹 문법이 아니다. `region-suggest` 컴포넌트 신설(유리가 아닌 흰 패널, `<body>` 직속, 등장 애니메이션 없음). 반경을 1500m 고정에서 지역 크기에 따라 자동으로. |
| beta | 2026-08-20 | **Liquid Glass 기능 레이어 도입.** `glass-toolbar`(상단 내비 바)·`filter-bar`(검색 페이지 필터) 신설. 유리는 뒤로 콘텐츠가 지나가는 자리에만 쓰고, 콘텐츠 카드는 전부 불투명 면을 유지한다. 유리 fill을 딥 네이비로 틴트하고 전경색을 `on-dark` 램프로 통일했다 — 크림 틴트는 히어로 위에 정지해 있을 때 회색 띠로 떠서 폐기했다. **검색 페이지 신설** — `card-place-search`(닻 대신 "아직 기록 없음")·`state-block` 등록. 히어로 검색을 토스트에서 **네이티브 GET 폼**으로 교체(`search.html?region=&q=`), 동네를 자유 입력에서 select로. 토스트를 `data-visible` 계약으로 통일해 두 페이지가 같은 마크업을 쓴다. `card-place-search`에 `role="button"`·`tabindex="0"`·`:focus-visible` 링을 얹어 키보드로 조작 가능하게 했고, `hover:` 유틸리티를 `(hover: hover)` 안으로 잠갔다. 스타일을 `styles.css`로 분리하고 `prefers-reduced-transparency`·`prefers-reduced-motion`·`prefers-contrast`를 구현. 유리 수치는 `LIQUID-GLASS.md`에만 두고 이 문서에 복제하지 않는다. |
| alpha | 2026-08-14 | 최초 작성 |
| alpha.5 | 2026-08-14 | **`carousel-nav` 신설** — 가로 스크롤러의 좌우 넘김 버튼. 스크롤바를 숨긴 탓에 포인터 환경에서 항해일지를 넘길 방법이 없던 문제를 해결한다. 640px 이상에서만 노출하고, 양 끝에서 `disabled`, 넘길 것이 없으면 숨긴다. 이동 폭은 카드 실측값 + 간격. |
| alpha.4 | 2026-08-14 | 히어로 **워드마크만** Noto Serif KR 600으로 되돌리고 `{typography.wordmark}` 토큰 신설. Tailwind 키를 `serif`가 아니라 `wordmark`로 두어 로고 밖으로 번지지 않게 잠갔다. 모바일 항해일지 접힘 규칙 변경 — 카드 폭 85vw(옆 카드 살짝 보이기)를 **스크롤러 꽉 채우기**로. 85vw가 콘텐츠 폭보다 넓어 위 카드 그리드와 시작선이 어긋나고 옆 카드가 화면을 침범했다. 가로 스크롤러를 타일 밖으로 흘리지 않는다는 규칙도 추가. |
| alpha.3 | 2026-08-14 | **명조(Noto Serif KR)를 제거하고 서체를 Pretendard 하나로 통일.** Apple SD Gothic Neo도 스택에서 뺐다 — 기기마다 다른 서체가 나오면 인상이 갈린다. 타이포 토큰의 `-serif` 접미사를 `hero-display`·`section-display`·`card-title`·`quote`로 정리. 크기값(57/41/21/25)은 유지한다. `quote-log`를 투명 배경에서 **카드**로 변경 — `surface-deep-2` 면 + 18px 라운드 + 24px 패딩 + `on-dark` 10% 테두리. 일지끼리 경계가 없어 한 편의 범위가 읽히지 않는 문제를 해결한다. **Motion 절 신설** — 스크롤 등장·퇴장(양방향, 700ms)을 정의. 원래 8/19~20 예정이었으나 앞당겼다. |
| alpha.2 | 2026-08-14 | `anchor-rating`을 집계형(닻 5개)·단일형(닻 1개)으로 분리하고 3상태 데이터 모델 명시. `quote-log`에 작성자 표기 추가 (읽기 공개 정책의 시각적 근거). `card-feature` 컴포넌트 신설 — 화이트 타일 위 크림 카드. `card-place-mock` 색면에 그림자 금지 명시. 검색 placeholder를 `정발산역`으로 변경. Pretendard CDN 버전 태그 고정. Do's and Don'ts 5건 추가. Known Gaps에서 닻 글리프 항목 해소. |
