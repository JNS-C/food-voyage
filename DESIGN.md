---
version: alpha
name: food-voyage-design
description: 크림 양피지 위에 놓인 항해일지를, 애플의 진열 방식으로 전시하는 인터페이스. 밝은 크림 타일과 딥 네이비 타일이 전면으로 교차하며 색 변화 자체가 섹션 구분선이 된다. 제목은 명조, 본문은 산세리프 17px. 인터랙션 색은 황동 하나뿐이고, 그림자는 음식 사진에만 허용된다. 재방문율은 별이 아니라 닻으로 표기한다.

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
  hero-serif:
    fontFamily: "Noto Serif KR, serif"
    fontSize: 57px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.5px
  section-serif:
    fontFamily: "Noto Serif KR, serif"
    fontSize: 41px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.4px
  card-title-serif:
    fontFamily: "Noto Serif KR, serif"
    fontSize: 21px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.2px
  quote-serif:
    fontFamily: "Noto Serif KR, serif"
    fontSize: 25px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: -0.2px
  quote-mark:
    fontFamily: "Noto Serif KR, serif"
    fontSize: 48px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: 0
  lead:
    fontFamily: "Apple SD Gothic Neo, Pretendard, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: -0.2px
  body:
    fontFamily: "Apple SD Gothic Neo, Pretendard, sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: -0.2px
  body-strong:
    fontFamily: "Apple SD Gothic Neo, Pretendard, sans-serif"
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.47
    letterSpacing: -0.2px
  button:
    fontFamily: "Apple SD Gothic Neo, Pretendard, sans-serif"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: -0.2px
  caption:
    fontFamily: "Apple SD Gothic Neo, Pretendard, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: -0.1px
  caption-strong:
    fontFamily: "Apple SD Gothic Neo, Pretendard, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: -0.1px
  ratio-number:
    fontFamily: "Apple SD Gothic Neo, Pretendard, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.0
    letterSpacing: 0
  nav-link:
    fontFamily: "Apple SD Gothic Neo, Pretendard, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.29
    letterSpacing: -0.1px
  fine-print:
    fontFamily: "Apple SD Gothic Neo, Pretendard, sans-serif"
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
    typography: "{typography.card-title-serif}"
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
    backgroundColor: transparent
    textColor: "{colors.on-dark}"
    typography: "{typography.quote-serif}"
  card-feature:
    backgroundColor: "{colors.canvas-cream}"
    textColor: "{colors.ink}"
    typography: "{typography.card-title-serif}"
    rounded: "{rounded.lg}"
    padding: 24px
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
- 제목은 명조(Noto Serif KR), 본문은 산세리프 17px. 기준은 **"읽는 글은 산세리프, 보여지는 글은 명조."**
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600&display=swap">
```

**CDN 경로에 버전 태그를 반드시 붙인다.** 태그 없이 `gh/orioncactus/pretendard/`로 쓰면 기본 브랜치를 가리키게 되어, 업스트림이 경로를 바꾸면 폰트가 통째로 빠진다. 위 `@v1.3.9`가 실제 존재하는 태그인지 브라우저에서 한 번 열어 확인하고, 없으면 최신 태그로 교체한다.

### 서체 역할

| 용도 | 서체 |
|---|---|
| 본문·버튼·라벨·입력창 | `Apple SD Gothic Neo` → `Pretendard` → `sans-serif` |
| 섹션 제목·히어로·카드 이름·인용문 | `Noto Serif KR` |

**Apple SD Gothic Neo는 웹폰트로 배포할 수 없다.** 애플이 산돌과 만든 시스템 탑재 폰트이므로 서버에 올리지 않는다. 폰트 스택 앞단에만 두어 애플 기기는 로컬 폰트를, 그 외 환경은 Pretendard 웹폰트를 쓰게 한다. Pretendard는 애초에 Apple SD Gothic Neo를 비애플 환경에서 재현하려고 만들어진 서체라 두 환경의 인상이 유지된다.

### 판단 기준

> **읽는 글은 산세리프, 보여지는 글은 명조.**

긴 리뷰 본문·버튼·라벨·입력창·메타 정보는 산세리프. 섹션 제목·히어로·카드 이름·한 줄 인용은 명조. 새 화면을 만들 때 이 한 줄로 판단한다.

### 크기 규칙

- 본문은 `{typography.body}` 17px다. 16px가 아니다. 애플 시스템의 읽기 속도를 정의하는 값이며 리뷰가 많이 보이는 서비스에 유리하다.
- **명조 텍스트는 산세리프보다 +1px 보정한다.** 같은 px에서 명조가 더 작아 보인다. 그래서 히어로가 56이 아니라 57px, 섹션 제목이 40이 아니라 41px이다.
- 자간은 한글 기준으로 완화한다. 애플의 -0.374px는 로마자 기준이며, 한글에 그대로 적용하면 답답해진다. 본문 `-0.2px`, 명조 제목 `-0.4 ~ -0.5px`.
- 굵기 사다리는 `400 / 600`만 쓴다. 500은 쓰지 않는다.

### 이탤릭 금지

**한글에는 이탤릭이 없다.** `font-style: italic`을 걸면 브라우저가 합성 오블리크를 만들어 세로획이 사선이 되고 명조의 부리·맺음이 뭉개진다. 인용문은 기울이지 않고 여는 따옴표로 구분한다.

---

## Components

### Buttons

**`button-primary`** — 주요 CTA. 배경 `{colors.accent}`, 텍스트 `{colors.on-accent}`, `{typography.button}`, `{rounded.pill}`, 패딩 13px × 26px. 누름 상태 `transform: scale(0.96)`. 크림·화이트 타일 위에서 사용한다.

**`button-on-dark`** — 딥 네이비 타일 위 주요 CTA. 배경 `{colors.accent-on-dark}`, 텍스트 `{colors.surface-deep-1}`. 기본 황동은 네이비 위에서 대비가 부족하므로 이 변형을 쓴다.

**`button-quiet`** — 보조 동작. 배경 없음, 텍스트 `{colors.accent}`. 테두리를 넣지 않는다.

### Inputs

**`search-neighborhood`** — 히어로의 동네 검색창. 배경 `{colors.canvas-white}`, `{rounded.pill}`, 높이 52px, 패딩 14px × 24px, 테두리 1px `{colors.hairline}`. 앞쪽에 16px 검색 글리프.

placeholder는 **동네 이름**이다. `정발산역`. 가게명이 아니다. 가게명 검색은 기존 맛집 앱의 문법이고, 동네 검색은 개척 컨셉을 강화한다. 이 구분은 장식이 아니라 서비스 정체성이다.

포커스 시 테두리가 `{colors.accent-focus}` 2px로 바뀐다.

### Cards

**`card-place`** — 맛집 카드. 배경 `{colors.canvas-white}`, 1px `{colors.hairline}` 테두리, `{rounded.lg}` 18px, 패딩 20px.

구성은 위에서부터 ① **4:3 사진** (`{rounded.md}` 12px, `{shadow.photo}`) → ② **가게명** `{typography.card-title-serif}` → ③ **동네 칩** `{component.chip-neighborhood}` → ④ **`{component.anchor-rating}`**.

**정보를 더 얹지 않는다.** 별점 평균·리뷰 수·가격대·영업시간을 넣는 순간 흔한 맛집 카드가 된다. 카드에 등장하는 숫자는 재방문 비율 하나뿐이어야 그것이 차별점으로 읽힌다.

모든 카드는 같은 4:3 종횡비를 지킨다. 비율이 흔들리면 그리드가 시끄러워진다.

호버: `transform: translateY(-2px)`, 테두리가 `{colors.hairline}` → `{colors.glyph-empty}`. **그림자를 더하지 않는다.**

**`card-place-mock`** — 8/14 랜딩 전용. 사진 자리에 4:3 색면을 둔다. 크림 계열 3단계(`#F4EFE6` / `#EAE1D2` / `#E3D8C6`)를 순환시키고 중앙에 가게명 이니셜을 `{typography.section-serif}`로 얹는다. 구조는 `{component.card-place}`와 동일해서 8/18에 색면만 `<img>`로 교체하면 된다.

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

**`quote-log`** — 항해일지 인용. 텍스트 `{typography.quote-serif}`, 딥 네이비 타일 위에서는 `{colors.on-dark}`.

구성은 위에서부터 ① 여는 따옴표 → ② 인용 → ③ `{component.anchor-rating}` 단일형 → ④ 메타 줄이다.

메타 줄은 `작성자 · 가게명 · 동네 · 날짜` 순서로 `{typography.caption}`, `{colors.on-dark-muted}`. **작성자를 반드시 넣는다.** 이 서비스는 남의 항해일지를 읽을 수 있는 구조이고, 작성자 표기가 그 정책이 화면에 드러나는 유일한 지점이다. 작성자가 없으면 내 기록인지 남의 기록인지 알 수 없다.

메타는 네 항목까지다. 여기서 더 늘리지 않는다.

인용 앞에 **여는 따옴표만** `{typography.quote-mark}` 48px, `{colors.accent-on-dark}`로 크게 둔다. **닫는 따옴표는 넣지 않는다.** 양쪽 다 크게 하면 장식이 과해지면서 절제가 깨진다.

기울이지 않는다. 좌측 세로선도 쓰지 않는다. 따옴표 하나로 충분하다.

**`card-feature`** — 서비스 특징 카드. 배경 `{colors.canvas-cream}`, `{rounded.lg}` 18px, 패딩 24px, 테두리 없음.

**`{component.section-tile-white}` 위에 놓이므로 배경이 반대로 뒤집힌다.** 맛집 카드는 크림 타일 위 화이트 카드였고, 특징 카드는 화이트 타일 위 크림 카드다. 같은 조합을 그대로 쓰면 흰 바탕에 흰 카드가 되어 형태가 사라진다.

구성은 제목 `{typography.card-title-serif}` → 설명 `{typography.body}` → `{component.badge-coming-soon}`. 누를 수 없는 요소이므로 `<div>`로 두고 호버 반응을 넣지 않는다.

### Badge & Toast

**`badge-coming-soon`** — 아직 없는 기능 표시. 배경 `{colors.divider-soft}`, 텍스트 `{colors.ink-muted-48}`, `{rounded.pill}`, 패딩 6px × 12px. 황동을 쓰지 않는다. 누를 수 없는 것에 인터랙션 색을 쓰면 신호가 오염된다.

**`toast`** — 미구현 기능 안내. 배경 `{colors.surface-deep-1}`, 텍스트 `{colors.on-dark}`, `{rounded.md}`, 패딩 14px × 20px. 화면 하단 중앙에서 위로 12px 올라오며 나타나고 3초 뒤 사라진다.

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
- 명조 텍스트는 산세리프보다 +1px 크게 잡는다.
- 카드의 사진 종횡비는 전부 4:3으로 고정한다.
- 크림을 기본 캔버스로 두고, 네이비는 히어로와 항해일지 섹션에만 쓴다.

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

---

## Responsive Behavior

### 브레이크포인트

| 이름 | 폭 | 주요 변화 |
|---|---|---|
| 작은 모바일 | ≤ 419px | 카드 1열, 히어로 명조 28px, 섹션 패딩 40px |
| 모바일 | 420–639px | 카드 1열, 히어로 34px, 섹션 패딩 48px |
| 태블릿 | 640–1023px | 카드 2열, 히어로 41px, 섹션 패딩 64px |
| 데스크탑 | 1024–1279px | 카드 3열, 히어로 48px |
| 넓은 데스크탑 | ≥ 1280px | 카드 3열, 히어로 57px, 콘텐츠 1200px 고정 |

### 터치 타겟

최소 44 × 44px. `{component.button-primary}`는 패딩 포함 약 44px 높이, `{component.search-neighborhood}`는 52px다.

### 접힘 규칙

- 카드 그리드: 3열 → 2열(1023px) → 1열(639px)
- 히어로 검색창: 데스크탑에서 버튼과 가로 배치, 모바일에서 세로 적층 후 전체 폭
- 최근 항해일지: 데스크탑·모바일 모두 가로 스크롤 유지. 모바일에서 카드 폭 85vw로 다음 카드가 살짝 보이게 한다.
- 섹션 패딩: 80px → 64px → 48px → 40px

### 이미지

- 카드 사진은 4:3 고정. 폭만 변한다.
- 히어로는 사진을 쓰지 않는다. 딥 네이비 면과 명조 제목으로 버틴다.
- 지연 로딩이 기본. 첫 화면은 즉시 로딩.

---

## Iteration Guide

1. 한 번에 하나의 컴포넌트만 다룬다. `{component.card-place}`처럼 키로 지칭한다.
2. 변형은 `-on-dark`, `-mock`처럼 별도 항목으로 둔다.
3. 값을 인라인 hex로 적지 않는다. 항상 토큰 참조를 쓴다.
4. 강조가 필요하면 크롬을 더하기 전에 **면을 바꾼다** (크림 → 네이비).
5. 명조는 제목·카드 이름·인용문에서만. 이 경계를 넘지 않는다.
6. 그림자는 음식 사진에만. 예외를 만들지 않는다.
7. 새 색을 추가하고 싶어지면, 먼저 기존 6색으로 안 되는 이유를 적어본다.

---

## Known Gaps

- 폼 검증·에러 상태는 아직 정의하지 않았다. 8/18 리뷰 작성 화면에서 정한다.
- 다크 모드 대응은 정의하지 않았다. 이 시스템은 이미 크림과 네이비를 함께 쓰므로 별도 다크 모드가 필요한지부터 판단해야 한다.
- 8/25 차트(도넛·워드클라우드)의 색 단계는 미정이다. 황동 하나로 3분할(또 갈 곳 / 한 번이면 충분 / 애매함)을 표현할지, 예외적으로 명도 단계를 쓸지 결정이 필요하다.
- ~~닻 글리프의 소스가 미정이다.~~ **해소** — 인라인 SVG `<symbol id="icon-anchor">`를 문서 상단에 한 번 정의하고 `<use>`로 재사용한다. 네트워크 의존성이 없고 `fill="currentColor"`라 채움·빈 상태를 색만으로 전환할 수 있다. 16px에서 읽히도록 링·가로대·갈고리만 남긴 단순형으로 그린다. 다만 **실제로 16px에서 읽히는지는 구현 후 검증이 필요하다.**
- 실제 음식 사진이 들어오는 8/18 이후, 크림 배경과 사진 채도의 궁합을 재확인해야 한다.

---

## 변경 이력

| 버전 | 날짜 | 내용 |
|---|---|---|
| alpha | 2026-08-14 | 최초 작성 |
| alpha.2 | 2026-08-14 | `anchor-rating`을 집계형(닻 5개)·단일형(닻 1개)으로 분리하고 3상태 데이터 모델 명시. `quote-log`에 작성자 표기 추가 (읽기 공개 정책의 시각적 근거). `card-feature` 컴포넌트 신설 — 화이트 타일 위 크림 카드. `card-place-mock` 색면에 그림자 금지 명시. 검색 placeholder를 `정발산역`으로 변경. Pretendard CDN 버전 태그 고정. Do's and Don'ts 5건 추가. Known Gaps에서 닻 글리프 항목 해소. |
