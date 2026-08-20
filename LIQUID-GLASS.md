# Liquid Glass Design Guide

> **버전** v1.1 — 반응형·크로스 플랫폼 레이어(§11) 추가
> **출처** Apple 공식 문서 4종
> - Technology Overviews — [Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass)
> - Technology Overviews — [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)
> - SwiftUI — [Applying Liquid Glass to custom views](https://developer.apple.com/documentation/swiftui/applying-liquid-glass-to-custom-views)
> - HIG — [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
>
> **수치의 신뢰 등급**
> Apple은 blur 반경·불투명도·코너 반경 같은 구체 수치를 공개하지 않는다. 이 문서에서
> - 🟩 **규범(Normative)** — Apple 문서에 명시된 규칙. 어기면 "Liquid Glass가 아님".
> - 🟨 **계측 근사(Calibrated)** — 실제 iOS/macOS 렌더링을 눈으로 맞춘 값. 프로젝트에서 조정 가능.
>
> 🟨 값은 **이 문서에서만 정의**하고 다른 문서(PRD 등)에 복제하지 않는다.

---

## 1. 이 재질이 무엇인지

Liquid Glass는 **유리의 광학적 성질(반사·굴절·투과)에 유동성을 결합한 동적 재질**이다. 정적인 블러 텍스처가 아니라, 뒤에 있는 것과 사용자의 입력에 실시간으로 반응하는 재질이다.

핵심 목적은 딱 하나다. **아래 콘텐츠에 집중을 돌려주는 것.** 🟩

이 문장이 이 문서의 모든 규칙의 상위 규칙이다. 어떤 결정이 콘텐츠보다 크롬(chrome)을 눈에 띄게 만든다면, 그 결정은 틀렸다.

### 1.1 두 종류의 재질을 구분하라 🟩

Apple 플랫폼에는 재질이 두 종류 있고, 역할이 완전히 다르다.

| | Liquid Glass | Standard Materials |
|---|---|---|
| 역할 | 컨트롤·내비게이션을 위한 **기능 레이어** | 콘텐츠 레이어 **내부**의 시각적 구분 |
| 위치 | 콘텐츠 위에 떠 있음 | 콘텐츠와 같은 평면 |
| 예 | 탭바, 사이드바, 툴바, 시트, 팝오버, 메뉴 | 앱 배경, 카드 배경, 그룹 구분 |
| 웹 대응 | 아래 §10의 `.lg-*` | 반투명 fill + 약한 blur, 또는 불투명 surface |

**혼동하지 말 것**: "유리처럼 보이는 카드"는 Liquid Glass가 아니다. 그건 standard material이다.

---

## 2. 레이어 모델 — 가장 중요한 구조 규칙

```
┌──────────────────────────────────────────┐
│  기능 레이어 (Liquid Glass)               │  ← 탭바 / 툴바 / 사이드바 / FAB / 시트
│  · 떠 있음, 고정됨                        │
│  · 아래 콘텐츠가 비쳐 지나감              │
├──────────────────────────────────────────┤
│  콘텐츠 레이어 (Standard Materials)       │  ← 리스트 / 카드 / 테이블 / 이미지 / 텍스트
│  · 스크롤됨                               │
│  · 불투명하거나 표준 재질                 │
└──────────────────────────────────────────┘
```

### 2.1 콘텐츠 레이어에 Liquid Glass를 쓰지 않는다 🟩

리스트, 테이블, 카드, 미디어에는 쓰지 않는다. 콘텐츠 레이어에 유리를 넣으면 위계가 무너지고 불필요한 복잡성만 생긴다.

**단 하나의 예외**: 슬라이더 knob, 토글 같은 **일시적 인터랙티브 요소**. 이들은 콘텐츠 레이어에 있지만, 사용자가 **활성화하는 순간에만** Liquid Glass 외형을 띠어 상호작용성을 강조한다. 손을 떼면 돌아온다.

### 2.2 유리 위에 유리를 올리지 않는다 (Glass on Glass 금지) 🟩

유리 요소를 겹쳐 쌓으면 인터페이스가 순식간에 지저분해지고 위계가 읽히지 않는다.
유리 위에 올라가는 요소는 **fill / 투명도 / vibrancy**로 처리해서, 그 자체가 재질의 일부인 얇은 오버레이처럼 느껴지게 한다.

```
❌  [glass toolbar] > [glass button]
✅  [glass toolbar] > [rgba fill button + vibrant label]
```

### 2.3 커스텀 배경을 걷어낸다 🟩

내비게이션·컨트롤 요소에 직접 넣은 커스텀 배경·이펙트는 시스템이 제공하는 Liquid Glass나 scroll edge effect와 충돌한다. **제거하고 시스템에 맡기는 것이 기본값.**
웹에서도 동일하게 적용: 툴바에 브랜드 그라디언트를 깔지 말고, 콘텐츠 레이어에서 색을 올려 비치게 하라.

### 2.4 Scroll Edge Effect 🟩

콘텐츠가 컨트롤 아래로 스크롤될 때, 컨트롤의 가독성과 대비를 유지하기 위해 **아래를 지나가는 콘텐츠를 흐리게 처리**하는 효과. 시스템 바는 기본 적용된다.
커스텀 바를 만든다면 이 효과를 반드시 직접 구현해야 한다. (웹 구현 §10.6)

### 2.5 남용 금지 🟩

커스텀 컨트롤에 Liquid Glass를 적용할 때는 **아껴서** 쓴다. 여러 커스텀 컨트롤에 남발하면 콘텐츠에서 주의를 빼앗아 경험이 나빠진다.
**앱에서 가장 중요한 기능 요소로 제한한다.**

> 실무 기준: 한 화면에 동시에 보이는 유리 표면은 **최대 2~3개**. 🟨

---

## 3. 변형 — Regular와 Clear

Liquid Glass에는 두 변형이 있고, **절대 섞지 않는다.** 🟩 각자 고유한 특성과 사용처가 있다.

### 3.1 Regular (기본값)

가장 범용적이고 대부분의 경우 이것을 쓴다. 모든 적응형 시각 효과를 포함하며, 어떤 콘텐츠 위에서든, 어떤 크기에서든 가독성을 보장한다.

**적응 동작** 🟩
- 밝은 콘텐츠 위 → 유리가 **밝아지고**, 전경(텍스트·아이콘)이 **어두워진다**
- 어두운 콘텐츠 위 → 정반대
- 텍스트 위에 놓이면 대비와 반투명도를 조정하고 그림자를 키워 가독성을 지킨다

### 3.2 Clear

영구적으로 투명한 변형. **적응 동작이 없다.** 따라서 가독성을 스스로 확보할 수 없다.

Clear는 다음 조건을 **모두** 만족할 때만 쓴다 🟩
1. 미디어가 풍부한(media-rich) 콘텐츠 위에 놓이는 요소일 것 — 예: 동영상 플레이어 컨트롤
2. 콘텐츠 레이어에 **디밍 레이어를 추가해도** 경험이 손상되지 않을 것
3. 디밍 레이어를 실제로 넣을 것 (Clear + 디밍은 세트다)

### 3.3 선택 규칙

```
미디어 위 컨트롤 + 디밍 허용?  →  Clear
그 외 전부                    →  Regular
같은 화면에서 둘을 섞는가?     →  하지 마라
```

---

## 4. 재질의 해부 — 무엇을 그려야 "애플처럼" 보이는가

Liquid Glass 표면 하나는 **4개의 서브레이어**가 겹쳐 만들어진다. 이 중 하나라도 빠지면 "그냥 블러"가 된다.

```
   ┌─ ④ 콘텐츠 / Vibrancy  ── 라벨·아이콘. 배경에 따라 밝기 반전
   │  ┌─ ③ 하이라이트(Specular) ── 엣지의 밝은 림. 광원 방향 암시
   │  │  ┌─ ② 재질(Material) ── backdrop blur + 반투명 + 틴트 + 렌징
   │  │  │  ┌─ ① 그림자(Shadow) ── 떠 있음을 만드는 접지 그림자
```

### 4.1 ② 재질 — 렌징(Lensing)이 핵심 🟩

**기존 frosted blur와 Liquid Glass를 가르는 결정적 차이가 이것이다.**

- 기존 블러(iOS 7–18): 표면 **전체**가 균일하게 흐림
- Liquid Glass: 굴절이 **엣지에 집중**된다. 가장자리에서 배경이 휘어지고 압축되어 렌즈처럼 보이고, 중앙은 상대적으로 맑다

렌징이 없으면 아무리 blur 값을 만져도 iOS 26처럼 보이지 않는다. 웹 구현은 §10.3.

### 4.2 ③ 하이라이트

엣지를 따라 도는 얇고 밝은 림. 균일한 1px 보더가 아니라 **광원 방향에 따라 밝기가 변하는 그라디언트 림**이다. 기기 기울임(iOS)이나 포인터 이동에 따라 미세하게 움직인다.

### 4.3 ① 그림자

떠 있는 레이어라는 사실을 만드는 요소. 짙은 한 겹이 아니라 **가까운 접지 그림자 + 먼 확산 그림자**의 2겹 이상. Regular 변형은 텍스트 위에 놓일 때 그림자를 키워 가독성을 확보한다.

### 4.4 ④ Vibrancy 🟩

재질 위의 텍스트·아이콘·구분선은 **고정 색이 아니라 vibrant 색**을 쓴다. 시스템 정의 vibrant 색을 쓰면 어떤 맥락에서도 너무 어둡거나 밝거나 채도가 튀거나 대비가 낮아지는 문제가 없다.

vibrancy 위계 (iOS/iPadOS 기준) 🟩
| 레벨 | 용도 | 대비 |
|---|---|---|
| label | 기본 텍스트 | 최고 |
| secondaryLabel | 부제·설명 | 중 |
| tertiaryLabel | 비활성 요소 | 낮음 |
| quaternaryLabel | 최소 강조 | 최저 |

⚠️ **quaternary는 thin / ultraThin 재질 위에 쓰지 않는다.** 대비가 너무 낮아진다. 🟩

### 4.5 Standard Materials 두께 선택 기준 🟩

콘텐츠 레이어에서 쓰는 표준 재질은 **"보이는 색"이 아니라 "의미"로 고른다.** 시스템 설정에 따라 외형이 바뀌기 때문이다.

| 두께 | 특성 | 언제 |
|---|---|---|
| ultraThin ↔ thin | 더 투명 | 뒤 콘텐츠를 상기시켜 맥락 유지가 중요할 때 |
| regular | 중간 | 기본 오버레이 |
| thick ↔ ultraThick | 더 불투명 | 작은 글자·미세한 요소의 대비가 중요할 때 |

---

## 5. 형태 — 동심(Concentric) 규칙

### 5.1 하드웨어에서 시작한다 🟩

기기 하드웨어의 곡률이 창, 시트, 팝오버, 컨트롤의 곡률·크기·형태를 결정한다. 그래서 컨트롤이 더 둥글어졌고, 창과 디스플레이의 모서리에 자연스럽게 안긴다.

### 5.2 동심 공식 🟨

중첩된 두 요소의 곡률은 동심(concentric)이어야 한다.

```
R_outer = R_inner + gap
```

예: 컨테이너 padding 12px, 내부 버튼 radius 12px → 컨테이너 radius 24px

**❌ 틀린 예**: 컨테이너 radius 16, 내부 버튼 radius 16, padding 12 → 두 곡률이 평행하지 않아 모서리가 어긋나 보인다.

### 5.3 기본 형태 🟩

- 작은 컨트롤·버튼: **Capsule** (완전한 반원 끝단)이 기본
- 큰 요소: Capsule이 어색한 크기라면 rounded rect. 단 **continuous corner(스퀘어클)** 사용
- 아이콘 마스킹: iOS/iPadOS/macOS는 rounded rect, watchOS는 원형

### 5.4 반경 토큰 🟨

| 토큰 | 값 | 용도 |
|---|---|---|
| `--lg-r-capsule` | `999px` | 버튼, 필, 탭 아이템 |
| `--lg-r-control` | `14px` | 소형 컨트롤 |
| `--lg-r-group` | `22px` | 툴바 그룹, 세그먼트 |
| `--lg-r-card` | `26px` | 팝오버, 메뉴 |
| `--lg-r-sheet` | `38px` | 시트 (iOS 26에서 크게 증가) |
| `--lg-r-window` | `28px` | 윈도우 |

### 5.5 크기 🟩

- 최소 터치 타깃 **44pt** (coarse pointer)
- 포인터 환경(fine pointer)의 최소 클릭 타깃 **28px**, 권장 32px 🟨
- 컨트롤에 **extra-large 사이즈** 옵션이 추가됨 — 라벨과 액센트를 위한 여유 공간
- 표준 spacing metric을 오버라이드하지 말 것. 컨트롤이 붐비거나 겹치지 않게 할 것

---

## 6. 색과 틴트

### 6.1 색은 절제한다 🟩

컨트롤과 내비게이션에서 색 사용에 신중할 것. 가독성을 유지하고, 콘텐츠의 색이 유리를 통해 배어 나오게 해야 한다.

색을 쓴다면:
- 시스템 컬러를 쓰거나
- **light / dark 변형 + 각 변형별 increased contrast 옵션**을 정의한 커스텀 컬러를 쓴다 🟩

즉 브랜드 컬러 하나는 최소 **4개 값**(light, light-hc, dark, dark-hc)으로 정의되어야 한다.

### 6.2 틴트 = prominence 신호 🟩

틴트는 장식이 아니라 **중요도 신호**다.
- 화면당 틴트된 유리 요소는 **1개** (주요 액션)
- 나머지는 무채색 유리

### 6.3 텍스트는 유리에 직접 얹지 않는다

가능하면 라벨/아이콘은 vibrancy를 통해 렌더링하고, 긴 본문 텍스트를 유리 위에 두지 않는다. 본문은 콘텐츠 레이어의 몫이다.

---

## 7. 모션과 인터랙션

Liquid Glass는 **정적인 재질이 아니다.** 움직임이 절반이다.

### 7.1 반응 (Interactive) 🟩

터치·포인터에 실시간 반응한다. 커스텀 요소에는 SwiftUI의 `.interactive()`에 해당하는 반응을 직접 구현해야 한다.

🟨 반응 명세
| 상태 | 변화 | 적용 환경 |
|---|---|---|
| hover | 하이라이트 밝기 +15%, 그림자 약간 확장 | **fine pointer 전용** |
| pointer track | 하이라이트가 커서 위치를 따라 이동 | **fine pointer 전용** |
| press | scale `0.97`, 틴트 강도 ↑, 하이라이트가 눌린 방향으로 이동 | 공통 |
| release | 스프링으로 복귀 (오버슈트 살짝) | 공통 |

⚠️ hover 상태를 미디어 쿼리로 감싸지 않으면 터치 기기에서 **탭 후에도 hover가 남는다**(sticky hover). §11.1 참조.

### 7.2 모프 (Morph) 🟩

버튼이 메뉴·팝오버로 **유동적으로 변형**된다. 페이드 인/아웃이 아니라 형태가 이어진다.
- 두 형태가 서로의 spacing 안에 있을 때 → matched geometry 방식 (형태가 이어짐)
- 멀리 떨어져 있을 때 → materialize 방식 (재질이 생겨남)

**두 방식만 쓰고 앱 전체에서 일관되게 유지한다.** 🟩

### 7.3 병합 (Merge / Union) 🟩

가까이 놓인 유리 요소들의 형태가 **서로 녹아 합쳐진다**. 컨테이너의 spacing 값이 클수록 더 일찍 합쳐진다.

설계 시사점:
- 합쳐지길 원하지 않는 요소들은 spacing보다 **멀리** 배치
- 정지 상태에서 합쳐져 보인다면 요소가 서로 너무 가깝다는 신호

### 7.4 후퇴 (Recede) 🟩

- 탭바는 스크롤 시 축소되어 콘텐츠를 부각시킬 수 있다 (`onScrollDown` / `onScrollUp` 선택)
- half sheet가 전체 높이로 확장되면 **더 불투명해져서** 작업에 집중을 모은다

### 7.5 모션 토큰 🟨

```css
--lg-ease-standard: cubic-bezier(0.32, 0.72, 0, 1);   /* Apple 특유의 감속 */
--lg-ease-spring:   cubic-bezier(0.34, 1.4, 0.64, 1); /* 오버슈트 */
--lg-dur-press:     140ms;
--lg-dur-morph:     420ms;
--lg-dur-merge:     520ms;
```

---

## 8. 컴포넌트별 규칙

### 8.1 내비게이션 🟩

- **명확한 내비게이션 위계를 세운다.** 콘텐츠와 내비게이션을 분명히 분리해 별도 기능 레이어를 만든다. 이것이 그 어느 때보다 중요해졌다
- 탭바는 맥락에 따라 **사이드바로 적응**시킬 수 있다
- 사이드바/인스펙터 옆 콘텐츠의 safe area를 점검해, 아래 콘텐츠가 적절히 비쳐 나오는지 확인
- **Background Extension Effect**: 사이드바/인스펙터 아래로 배경이 이어지는 인상을 만든다. 실제로 콘텐츠를 밑에 깔지 않고, 인접 콘텐츠를 미러링하고 블러를 적용해 사이드바 가독성을 유지한다. 제품 상세의 히어로 이미지 같은 edge-to-edge 경험에 적합

### 8.2 툴바 🟩

- 툴바 아이템을 **기능으로 그룹핑**한다. 비슷한 액션끼리, 같은 영역에 영향을 주는 것끼리 묶는다

```
❌  [ Undo  Redo  Markup  More ]        ← 하나의 배경에 전부
✅  [ Undo  Redo ]   [ Markup  More ]   ← 기능별 2그룹
```

- 그룹 사이는 **fixed spacer**로 분리
- 공통 액션은 텍스트 대신 **표준 아이콘**으로. 단 **같은 배경을 공유하는 아이템끼리 텍스트와 아이콘을 섞지 않는다**
- 모든 아이콘에 **접근성 레이블을 반드시 지정**한다. 화면에 무엇을 표시하든 상관없이
- 아이템을 숨길 때는 아이템 안의 뷰가 아니라 **아이템 자체**를 숨긴다 (빈 툴바 아이템이 보인다면 이 실수)

### 8.3 버튼 🟩

커스텀 유리 효과를 만들지 말고 표준 버튼 스타일을 쓴다.

| 스타일 | 용도 |
|---|---|
| glass | 일반 유리 버튼 |
| glassProminent | 강조(틴트) 버튼 — 화면당 1개 |
| clearGlass / prominentClearGlass | 미디어 위 (Clear 변형) |

### 8.4 시트·팝오버·액션시트 🟩

- 시트: 코너 반경 증가. **half sheet은 화면 가장자리에서 inset**되어 아래 콘텐츠가 옆으로 비쳐 나온다. 전체 높이로 확장되면 더 불투명해진다
- 시트 **안쪽**: 둥글어진 모서리에 콘텐츠·컨트롤이 너무 붙지 않았는지 점검
- 시트 **바깥쪽**: inset된 시트와 화면 가장자리 사이로 비치는 콘텐츠가 의도대로인지 점검
- 팝오버에 커스텀 visual effect 배경을 넣었다면 **제거**한다
- 액션시트는 화면 하단이 아니라 **액션을 시작한 요소에서 발생**한다. source view/item을 반드시 지정. 액션시트가 떠 있는 동안에도 인터페이스의 다른 부분과 상호작용할 수 있다

### 8.5 리스트·테이블·폼 🟩

콘텐츠 레이어다. **유리를 쓰지 않는다.**

- 행 높이와 패딩이 커졌다 — 콘텐츠에 숨 쉴 공간
- 섹션 코너 반경이 커져 시스템 전반의 컨트롤 곡률과 맞춰졌다
- **섹션 헤더가 전체 대문자에서 Title Case로 바뀌었다.** 대문자 강제 렌더링이 사라졌으므로 텍스트 자체를 Title Case로 수정해야 한다
  - 한글에는 직접 대응이 없지만, 영문 헤더를 쓰고 있다면 `ALL CAPS` → `Title Case`로 바꿀 것

### 8.6 검색 🟩

- **iOS**: 화면 **하단** 툴바. 탭하면 키보드와 함께 위로 슬라이드 — 이 동작이 시스템과 일관되는지 테스트
- **iPad**: 툴바 **우측 상단**
- 탭바에 검색이 있다면 **semantic search tab**을 쓴다. 시스템이 검색 탭을 자동으로 분리해 **trailing 끝**에 배치한다

### 8.7 윈도우 🟩

- 컨트롤과 내비게이션을 담기 위해 코너가 더 둥글어졌다
- iPadOS는 **연속적 리사이즈**를 지원한다. 프리셋 크기 전환이 아니라 최소 크기까지 유동적으로 줄어든다
- **임의 크기를 지원하라.** 사용자가 원하는 폭·높이로 조절할 수 있게 하고 콘텐츠를 그에 맞게 조정
- split view를 쓰면 모든 크기에서 콘텐츠가 유동적으로 리플로우된다
- safe area와 layout guide를 지정해야 시스템이 윈도우 컨트롤과 타이틀바를 콘텐츠에 맞춰 조정할 수 있다

### 8.8 앱 아이콘 🟩

- 아이콘은 **레이어**로 구성된다. 시스템이 반사·굴절·그림자·블러·하이라이트를 자동 적용
- 디자인 시 **마스킹·블러·이펙트를 직접 그려 넣지 말 것.** 시스템에 맡긴다
- 단색으로 채워진, **반투명하게 겹치는 도형**들로 단순화된 설계를 고려. 외곽선 기반 대신 채움 기반
- 지원하는 모든 플랫폼에서 시각적으로 일관되고 광학적으로 균형 잡히게
- 요소를 **중앙에 유지**해 마스킹 시 잘리지 않게. 불규칙한 형태의 아이콘에는 시스템이 배경을 제공
- 변형: **default(light) / dark / clear / tinted** — iOS, iPadOS, macOS 모두 지원
- Icon Composer로 레이어를 조합하고 시스템 이펙트가 적용된 결과를 미리보기

---

## 9. 접근성 — 선택이 아니라 필수 🟩

반투명과 유동적 모프 애니메이션은 Liquid Glass의 핵심이지만, **사용자의 필요에 맞춰 적응해야 한다.**

- 사용자는 기기 설정에서 Liquid Glass의 외형을 선택할 수 있다
- 접근성 설정으로 **투명도 감소 / 모션 감소 / 대비 증가**를 켤 수 있고, 이 설정은 특정 효과를 제거하거나 변형한다
- 표준 컴포넌트는 자동 대응한다. **커스텀 요소·색·애니메이션은 반드시 각 설정 조합에서 직접 테스트해야 한다**

### 웹 대응 매핑

| Apple 설정 | CSS 미디어 쿼리 | 대응 |
|---|---|---|
| Reduce Transparency | `prefers-reduced-transparency: reduce` | backdrop-filter 제거, 불투명 배경으로 대체 |
| Reduce Motion | `prefers-reduced-motion: reduce` | morph/merge → opacity 전환, 스프링 제거 |
| Increase Contrast | `prefers-contrast: more` | 라벨 대비 강화, 보더 불투명도 ↑, 틴트 채도 ↑ |
| Dark Mode | `prefers-color-scheme: dark` | 유리 fill/하이라이트 반전 |

**투명도를 끈 상태에서도 UI가 완전히 동작하고 아름다워야 한다.** 유리는 진행 강화(progressive enhancement)이지 기반이 아니다.

---

## 10. 웹 구현

### 10.1 3단계 대응 전략

| 티어 | 조건 | 렌더링 |
|---|---|---|
| **T3 — Full** | Chromium 계열, `backdrop-filter: url()` 지원 | 렌징 + 블러 + 하이라이트 + 그림자 |
| **T2 — Standard** | `backdrop-filter` 지원 (Safari/Firefox 포함) | 블러 + 엣지 인셋 섀도로 렌징 근사 |
| **T1 — Fallback** | 미지원 / reduced-transparency | 불투명 surface + 보더 + 그림자 |

⚠️ **`backdrop-filter: url(#filter)`는 Chromium에서만 동작한다.** Safari·iOS Safari 미지원.
아이러니하게도 iOS Safari에서는 진짜 렌징을 만들 수 없다. T2가 실질적 기준선이라고 보고 설계하라.

### 10.2 토큰 🟨

```css
:root {
  /* ── 형태 ── */
  --lg-r-capsule: 999px;
  --lg-r-control: 14px;
  --lg-r-group:   22px;
  --lg-r-card:    26px;
  --lg-r-sheet:   38px;
  --lg-r-window:  28px;

  /* ── 밀도 (입력 모델에 따라 §11.5에서 재정의) ── */
  --lg-target:  44px;
  --lg-row:     52px;
  --lg-pad:     16px;

  /* ── 재질: Regular / Light ── */
  --lg-blur:        20px;
  --lg-saturate:    180%;
  --lg-brightness:  1.06;
  --lg-fill:        rgba(255, 255, 255, 0.32);
  --lg-fill-strong: rgba(255, 255, 255, 0.55);   /* 시트 확장 시 */

  /* ── 하이라이트 (specular) ── */
  --lg-hl-top:    rgba(255, 255, 255, 0.62);
  --lg-hl-bottom: rgba(255, 255, 255, 0.18);
  --lg-hl-ring:   rgba(255, 255, 255, 0.32);

  /* ── 그림자 ── */
  --lg-shadow:
    0 1px 2px rgba(0, 0, 0, 0.07),
    0 4px 10px rgba(0, 0, 0, 0.06),
    0 14px 34px rgba(0, 0, 0, 0.12);

  /* ── vibrancy (유리 위 전경색) ── */
  --lg-label:     rgba(0, 0, 0, 0.92);
  --lg-label-2:   rgba(0, 0, 0, 0.62);
  --lg-label-3:   rgba(0, 0, 0, 0.36);
  --lg-separator: rgba(0, 0, 0, 0.12);

  /* ── 틴트 (prominent) ── */
  --lg-tint:      rgba(0, 122, 255, 0.72);
  --lg-tint-hc:   rgba(0, 96, 214, 0.92);

  /* ── 모션 ── */
  --lg-ease-standard: cubic-bezier(0.32, 0.72, 0, 1);
  --lg-ease-spring:   cubic-bezier(0.34, 1.4, 0.64, 1);
  --lg-dur-press: 140ms;
  --lg-dur-morph: 420ms;
  --lg-dur-merge: 520ms;
}

@media (prefers-color-scheme: dark) {
  :root {
    --lg-brightness:  0.92;
    --lg-fill:        rgba(22, 22, 24, 0.46);
    --lg-fill-strong: rgba(22, 22, 24, 0.72);
    --lg-hl-top:      rgba(255, 255, 255, 0.24);
    --lg-hl-bottom:   rgba(255, 255, 255, 0.06);
    --lg-hl-ring:     rgba(255, 255, 255, 0.14);
    --lg-shadow:
      0 1px 2px rgba(0, 0, 0, 0.4),
      0 4px 10px rgba(0, 0, 0, 0.3),
      0 14px 34px rgba(0, 0, 0, 0.45);
    --lg-label:     rgba(255, 255, 255, 0.94);
    --lg-label-2:   rgba(255, 255, 255, 0.64);
    --lg-label-3:   rgba(255, 255, 255, 0.38);
    --lg-separator: rgba(255, 255, 255, 0.14);
  }
}
```

### 10.3 베이스 재질

```css
.lg {
  position: relative;
  isolation: isolate;
  border-radius: var(--lg-r-capsule);
  color: var(--lg-label);

  background: var(--lg-fill);
  -webkit-backdrop-filter:
    blur(var(--lg-blur))
    saturate(var(--lg-saturate))
    brightness(var(--lg-brightness));
  backdrop-filter:
    blur(var(--lg-blur))
    saturate(var(--lg-saturate))
    brightness(var(--lg-brightness));

  box-shadow:
    /* ① 접지 + 확산 그림자 */
    var(--lg-shadow),
    /* ③ 상단 스펙큘러 */
    inset 0  1px 0 var(--lg-hl-top),
    /* ③ 하단 반사 */
    inset 0 -1px 0 var(--lg-hl-bottom),
    /* ③ 엣지 링 */
    inset 0 0 0 0.5px var(--lg-hl-ring),
    /* ② 렌징 근사 — 엣지에서 배경이 압축되는 느낌 */
    inset 0 0 12px -4px rgba(255, 255, 255, 0.30);

  transition:
    transform  var(--lg-dur-press) var(--lg-ease-standard),
    box-shadow var(--lg-dur-press) var(--lg-ease-standard),
    background var(--lg-dur-press) var(--lg-ease-standard);
}
```

**엣지 하이라이트를 각도 있게** (평면 1px 링보다 훨씬 애플에 가까움):

```css
.lg::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    145deg,
    rgba(255,255,255,0.85) 0%,
    rgba(255,255,255,0.15) 32%,
    rgba(255,255,255,0.05) 58%,
    rgba(255,255,255,0.55) 100%
  );
  /* 보더 영역만 남기는 마스크 */
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
  z-index: 1;
}
```

### 10.4 렌징 (T3 · Chromium 전용)

엣지에만 굴절이 걸리도록, **가운데는 중립 회색(변위 0), 가장자리로 갈수록 R/G 채널이 벗어나는** 변위 맵을 만든다.

```html
<svg width="0" height="0" aria-hidden="true" style="position:absolute">
  <filter id="lg-lens" x="0%" y="0%" width="100%" height="100%"
          color-interpolation-filters="sRGB">
    <feImage
      href="data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' width='240' height='120'>\
<defs>\
<linearGradient id='x' x1='0' y1='0' x2='1' y2='0'>\
<stop offset='0' stop-color='%23000'/><stop offset='1' stop-color='%23f00'/>\
</linearGradient>\
<linearGradient id='y' x1='0' y1='0' x2='0' y2='1'>\
<stop offset='0' stop-color='%23000'/><stop offset='1' stop-color='%230f0'/>\
</linearGradient>\
</defs>\
<rect width='240' height='120' fill='%23808080'/>\
<rect width='240' height='120' fill='url(%23x)' style='mix-blend-mode:screen'/>\
<rect width='240' height='120' fill='url(%23y)' style='mix-blend-mode:screen'/>\
<rect x='14' y='14' width='212' height='92' rx='46' fill='%23808080'\
 style='filter:blur(12px)'/>\
</svg>"
      result="map" />
    <feDisplacementMap
      in="SourceGraphic" in2="map"
      scale="52" xChannelSelector="R" yChannelSelector="G" />
  </filter>
</svg>
```

```css
@supports (backdrop-filter: url(#lg-lens)) {
  .lg--lens {
    backdrop-filter:
      url(#lg-lens)
      blur(var(--lg-blur))
      saturate(var(--lg-saturate))
      brightness(var(--lg-brightness));
  }
}
```

튜닝 포인트
- `scale` — 굴절 강도. 작은 컨트롤 30~50, 큰 표면 60~90
- 안쪽 `rect`의 `blur` — 클수록 굴절 띠가 넓고 부드러워진다
- 안쪽 `rect`의 `rx` — 요소의 border-radius와 맞출 것
- 맵의 `width`/`height` — 요소 크기와 대략 맞출수록 왜곡이 자연스럽다

### 10.5 Clear 변형 + 디밍

```css
.lg-clear {
  background: rgba(255, 255, 255, 0.06);
  -webkit-backdrop-filter: blur(4px) saturate(120%);
          backdrop-filter: blur(4px) saturate(120%);
  color: #fff;
  box-shadow:
    0 2px 12px rgba(0, 0, 0, 0.35),
    inset 0 0 0 0.5px rgba(255, 255, 255, 0.22);
}

/* Clear는 반드시 디밍 레이어와 세트 */
.lg-clear-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.45) 0%,
    rgba(0, 0, 0, 0) 45%
  );
  pointer-events: none;
}
```

### 10.6 Scroll Edge Effect

콘텐츠가 커스텀 바 아래를 지날 때 가독성을 지키는 그라디언트 블러 마스크.

```css
.lg-scroll-edge {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  height: 120px;
  pointer-events: none;
  z-index: 5;
  -webkit-backdrop-filter: blur(12px);
          backdrop-filter: blur(12px);
  -webkit-mask-image: linear-gradient(to top, #000 30%, transparent 100%);
          mask-image: linear-gradient(to top, #000 30%, transparent 100%);
}
```

### 10.7 인터랙션

```css
.lg-interactive { cursor: pointer; }

.lg-interactive:hover {
  --lg-hl-top: rgba(255, 255, 255, 0.78);
  box-shadow:
    var(--lg-shadow),
    inset 0  1px 0 var(--lg-hl-top),
    inset 0 -1px 0 var(--lg-hl-bottom),
    inset 0 0 0 0.5px var(--lg-hl-ring),
    inset 0 0 16px -4px rgba(255, 255, 255, 0.4);
}

.lg-interactive:active {
  transform: scale(0.97);
  background: var(--lg-fill-strong);
}

.lg-interactive:focus-visible {
  outline: 2px solid var(--lg-tint);
  outline-offset: 3px;
}

/* prominent = 틴트. 화면당 1개 */
.lg-prominent {
  background: var(--lg-tint);
  color: #fff;
}
```

### 10.8 유리 위의 요소 (Glass on Glass 회피)

```css
/* 유리 툴바 안의 버튼 — 유리를 또 쓰지 않는다 */
.lg-inner {
  background: rgba(255, 255, 255, 0.14);
  color: var(--lg-label);
  border-radius: var(--lg-r-capsule);
  backdrop-filter: none;   /* ← 중요 */
  box-shadow: none;
}
.lg-inner:active { background: rgba(255, 255, 255, 0.24); }
```

### 10.9 접근성 오버라이드

```css
@media (prefers-reduced-transparency: reduce) {
  .lg, .lg-clear {
    -webkit-backdrop-filter: none !important;
            backdrop-filter: none !important;
    background: Canvas;
    box-shadow: 0 1px 3px rgba(0,0,0,.2), inset 0 0 0 1px var(--lg-separator);
  }
  .lg::before { display: none; }
}

@media (prefers-contrast: more) {
  :root {
    --lg-fill:      rgba(255, 255, 255, 0.72);
    --lg-hl-ring:   rgba(0, 0, 0, 0.34);
    --lg-label:     #000;
    --lg-tint:      var(--lg-tint-hc);
    --lg-separator: rgba(0, 0, 0, 0.42);
  }
}

@media (prefers-reduced-motion: reduce) {
  .lg, .lg-interactive {
    transition-duration: 0.01ms !important;
  }
  .lg-interactive:active { transform: none; }
}
```

### 10.10 성능

Liquid Glass 컨테이너를 너무 많이 만들거나, 컨테이너 밖에서 효과를 남발하면 성능이 떨어진다. 동시에 화면에 보이는 효과의 수를 제한할 것. 🟩

웹에서 🟨:

| | 모바일 | 데스크톱 |
|---|---|---|
| 동시 `backdrop-filter` | **2개 이하** | **4개 이하** |
| blur 최대값 | 24px | 32px |
| 렌징(T3) | 사용 불가 | 가능 |
| 애니메이션 중 blur 값 변경 | **금지** | 지양 |

- 그 외 공통:
- 인접한 유리 요소는 **하나의 컨테이너**로 합치고 내부는 `.lg-inner`로 처리 (SwiftUI의 `GlassEffectContainer`에 대응하는 발상)
- 유리 표면에 `contain: paint;` 지정
- 스크롤 중 리페인트를 줄이려면 유리 레이어는 `position: fixed` + `transform: translateZ(0)`
- `will-change: backdrop-filter`는 남용하지 말 것 (메모리 폭증)

### 10.11 Tailwind 매핑 (CDN 사용 시)

```html
<script>
  tailwind.config = {
    theme: {
      extend: {
        borderRadius: {
          'lg-control': '14px',
          'lg-group':   '22px',
          'lg-card':    '26px',
          'lg-sheet':   '38px',
        },
        backdropBlur: { 'lg': '20px' },
        transitionTimingFunction: {
          'lg': 'cubic-bezier(0.32, 0.72, 0, 1)',
        },
      },
    },
  };
</script>
```

Tailwind 유틸리티만으로는 4개 서브레이어를 재현할 수 없다. **`.lg` 클래스는 순수 CSS로 정의하고 Tailwind는 레이아웃에만 쓰는** 하이브리드가 현실적이다.

---

## 11. 반응형 · 크로스 플랫폼

Liquid Glass는 원래 **하나의 재질을 여러 플랫폼에 걸쳐 통일**하려는 시도다. 따라서 "모바일용 스타일 / PC용 스타일"을 따로 만드는 게 아니라, **같은 재질이 입력 모델·표면 크기·성능 예산에 따라 적응**하는 구조여야 한다.

### 11.1 입력 모델이 브레이크포인트보다 먼저다

화면 폭이 아니라 **포인터의 종류**로 분기한다. 1024px 폭의 터치 태블릿과 1024px 폭의 데스크톱 창은 완전히 다른 대응이 필요하다.

```css
/* 포인터 환경 — hover 진행 강화 */
@media (hover: hover) and (pointer: fine) {
  :root { --lg-target: 28px; --lg-row: 34px; --lg-pad: 10px; }

  .lg-interactive:hover {
    --lg-hl-top: rgba(255, 255, 255, 0.78);
  }
}

/* 터치 환경 — hover 전면 제거 */
@media (hover: none) and (pointer: coarse) {
  :root { --lg-target: 44px; --lg-row: 52px; --lg-pad: 16px; }

  .lg-interactive:hover { /* 아무것도 하지 않음 */ }
  .lg-interactive:active { transform: scale(0.96); }  /* press를 더 강하게 */
}
```

**원칙**: hover는 진행 강화(progressive enhancement)일 뿐이다. hover에서만 드러나는 정보나 액션을 두지 않는다. 터치 노트북 같은 하이브리드 기기에서 둘 다 참일 수 있다.

### 11.2 형태 적응 매핑

같은 역할이 환경에 따라 다른 형태를 갖는다. **역할은 유지하고 형태만 바꾼다.** 🟩

| 역할 | 터치 / 좁은 폭 | 포인터 / 넓은 폭 |
|---|---|---|
| 최상위 내비게이션 | 탭바 (하단, 유리, 스크롤 시 축소) | 사이드바 (좌측, 유리, 접힘 가능) |
| 보조 작업 | 시트 (하단에서, inset, `--lg-r-sheet`) | 모달·팝오버 (중앙 또는 앵커, `--lg-r-card`) |
| 컨텍스트 액션 | 액션시트 (소스 요소에서 발생) | 컨텍스트 메뉴 (커서 위치) |
| 검색 | 하단 툴바 | 상단 trailing 툴바 |
| 상세 진입 | 풀스크린 push | split view + inspector |
| 주요 액션 | 플로팅 유리 버튼 | 툴바 버튼 그룹 |

주의: **시트→모달 전환 시 코너 반경도 함께 바뀐다.** 모바일 시트의 38px을 데스크톱 모달에 그대로 쓰면 과하게 둥글어 보인다. 동심 규칙(§5.2)은 양쪽 모두에서 유지한다.

### 11.3 재질 스케일

블러와 렌징은 **절대값이 아니라 표면 크기 대비 상대적으로** 읽힌다. 폭 360px 탭바의 blur 20px과 폭 1440px 툴바의 blur 20px은 전혀 다르게 보인다. 큰 표면일수록 블러가 커야 같은 "두께"로 읽힌다.

```css
:root { --lg-blur: 18px; }

@media (min-width:  768px) { :root { --lg-blur: 22px; } }
@media (min-width: 1280px) { :root { --lg-blur: 26px; } }
@media (min-width: 1920px) { :root { --lg-blur: 30px; } }
```

렌징의 `scale`도 마찬가지다 (§10.4). 요소 폭이 두 배면 scale도 대략 1.5배 필요하다. 🟨

### 11.4 브레이크포인트 (Apple size class 대응) 🟨

| 이름 | 폭 | Apple 대응 | 지배적 형태 |
|---|---|---|---|
| compact | `< 600px` | Compact width | 탭바, 시트, 단일 컬럼 |
| medium | `600–1023px` | Regular (iPad portrait) | 사이드바 오버레이, 2컬럼 |
| regular | `≥ 1024px` | Regular (iPad landscape / Mac) | 상시 사이드바 + inspector |

### 11.5 밀도

같은 컴포넌트라도 행 높이와 패딩이 다르다. §11.1의 `--lg-target` / `--lg-row` / `--lg-pad` 토큰으로 제어하고, 컴포넌트에서는 하드코딩하지 않는다.

```css
.lg-row {
  min-height: var(--lg-row);
  padding-inline: var(--lg-pad);
}
```

⚠️ **밀도를 바꿔도 곡률은 동심을 유지해야 한다.** padding이 16→10으로 줄면 컨테이너 radius도 6만큼 줄여야 한다.

### 11.6 뷰포트와 Safe Area

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
/* 하단 유리 바 — 홈 인디케이터 회피 */
.lg-tabbar {
  padding-bottom: calc(var(--lg-pad) + env(safe-area-inset-bottom, 0px));
}

/* 노치·다이나믹 아일랜드 회피 */
.lg-topbar {
  padding-top: calc(var(--lg-pad) + env(safe-area-inset-top, 0px));
}

/* 주소창 show/hide로 100vh가 흔들린다 → dvh */
.lg-sheet--full { height: 100dvh; }
```

### 11.7 iOS Safari 실전 제약 ⚠️

**이 절이 모바일 웹에서 유리가 "안 먹는" 이유의 대부분이다.**

1. **조상 체인에 `transform` / `filter` / `will-change` / `perspective`가 있으면 `backdrop-filter`가 무력화된다.**
   Framer Motion, GSAP, Tailwind의 `hover:scale-*`, 애니메이션 래퍼 등이 전부 원인이 된다.
   → 유리 요소는 **transform이 걸리지 않는 조상 아래**에 두거나, 유리 레이어를 DOM 상 형제로 분리한다.

2. **`-webkit-backdrop-filter` 프리픽스 필수.** iOS Safari는 아직 프리픽스 없는 버전을 완전히 지원하지 않는 경로가 있다.

3. **`position: fixed` + `backdrop-filter` 조합은 스크롤 중 깜빡임이 있다.**
   `transform: translateZ(0)`로 완화되지만, 이는 1번 문제를 유발하므로 **유리 요소 자신이 아니라 그 부모에만** 적용하고 반드시 실기기에서 확인한다. 트레이드오프이지 해법이 아니다.

4. **`backdrop-filter: url()` 미지원.** 모바일 웹은 사실상 **T2 티어 고정**이다(§10.1).
   → 렌징에 의존하는 디자인을 만들면 모바일에서 무너진다. **T2 상태를 기준으로 디자인하고, T3는 데스크톱 보너스로 취급한다.**

5. **`overflow: hidden` 컨테이너 안의 유리는 배경을 못 읽는 경우가 있다.** 스크롤 컨테이너와 유리 레이어를 겹치지 말 것.

### 11.8 데스크톱 웹의 구조적 한계

macOS 네이티브에는 **behind-window blending**(창 뒤 바탕화면·다른 창이 비침)과 **within-window blending** 두 모드가 있다. 🟩
웹은 브라우저 뷰포트 밖을 볼 수 없으므로 **within-window만 가능하다.**

여기서 나오는 실무 결론 하나:

> **유리 뒤에 실제 콘텐츠가 없으면 유리는 아무것도 아니다.**

단색 배경 위에 놓인 유리 툴바는 그냥 회색 반투명 사각형이다. 데스크톱 레이아웃에서 유리를 쓰려면 **아래에 스크롤되는 콘텐츠나 이미지가 반드시 지나가도록** 설계해야 한다. 이것이 §8.1의 background extension effect가 존재하는 이유이기도 하다.

### 11.9 환경별 티어 정리

| | 모바일 Safari | 모바일 Chrome | 데스크톱 Safari | 데스크톱 Chrome/Edge |
|---|---|---|---|---|
| 티어 | T2 | T2~T3 | T2 | **T3** |
| 렌징 | ✗ | △ | ✗ | ✓ |
| 하이라이트·그림자 | ✓ | ✓ | ✓ | ✓ |
| 성능 여유 | 낮음 | 낮음 | 중 | 높음 |

**설계 기준선은 좌측 열(T2)이다.** 우측 열에서만 성립하는 디자인은 만들지 않는다.

---

## 12. 안티패턴 체크리스트

```
[ ] 콘텐츠 카드/리스트에 유리를 썼다                      → 표준 재질로 교체
[ ] 유리 위에 유리를 올렸다                               → 안쪽은 fill + vibrancy
[ ] 한 화면에 유리 표면이 4개 이상이다                    → 통합
[ ] Regular와 Clear를 섞어 썼다                           → 하나만
[ ] Clear를 쓰면서 디밍 레이어가 없다                     → 디밍 추가
[ ] 유리 위에 본문 텍스트를 길게 올렸다                   → 콘텐츠 레이어로 이동
[ ] 툴바에 브랜드 그라디언트를 깔았다                     → 제거, 시스템에 맡김
[ ] 틴트된 유리 요소가 2개 이상이다                       → 1개로
[ ] 곡률이 동심이 아니다 (R_out ≠ R_in + gap)             → 재계산
[ ] 렌징 없이 blur만 썼다                                 → §10.3~10.4
[ ] 하이라이트가 균일한 1px 보더다                        → 그라디언트 림으로
[ ] 그림자가 한 겹이다                                    → 2겹 이상
[ ] reduce-transparency에서 테스트하지 않았다             → 필수
[ ] 툴바 아이템을 기능이 아니라 모양으로 묶었다           → 재그룹핑
[ ] 아이콘에 접근성 레이블이 없다                         → 전부 추가
[ ] 같은 그룹 안에 텍스트 버튼과 아이콘 버튼이 섞였다     → 통일
[ ] 앱 아이콘에 블러/그림자를 직접 그려 넣었다            → 레이어만 제공
[ ] 영문 섹션 헤더가 ALL CAPS다                           → Title Case

── 크로스 플랫폼 ──
[ ] hover 상태를 미디어 쿼리로 감싸지 않았다              → §11.1
[ ] hover에서만 보이는 액션이 있다                        → 터치 대안 제공
[ ] 데스크톱에서도 시트 반경 38px을 그대로 썼다           → --lg-r-card로
[ ] 모든 뷰포트에서 blur가 동일하다                       → §11.3
[ ] 유리 요소의 조상에 transform이 걸려 있다              → 모바일에서 무력화됨
[ ] 하단 유리 바에 safe-area-inset이 없다                 → 홈 인디케이터에 가림
[ ] 100vh를 썼다                                          → 100dvh
[ ] 렌징이 있어야만 성립하는 디자인이다                   → T2 기준으로 재설계
[ ] 유리 뒤에 지나가는 콘텐츠가 없다                      → 유리를 쓸 자리가 아님
```

---

## 13. 검수 체크리스트

**구조**
- [ ] 기능 레이어와 콘텐츠 레이어가 명확히 분리되는가
- [ ] 유리 아래로 콘텐츠가 실제로 지나가며 비치는가 (그냥 배경 위에 떠 있는 게 아니라)
- [ ] 스크롤 시 컨트롤 아래 콘텐츠의 가독성이 유지되는가

**재질**
- [ ] 엣지에 굴절/렌징 느낌이 있는가 (균일 블러가 아닌가)
- [ ] 밝은 배경 / 어두운 배경 위에서 각각 확인했는가
- [ ] 하이라이트가 광원 방향을 암시하는가

**형태**
- [ ] 중첩 요소의 곡률이 동심인가
- [ ] 터치 타깃이 44pt 이상인가

**모션**
- [ ] press 반응이 있는가
- [ ] 가까운 유리 요소들이 의도대로 합쳐지거나 떨어져 있는가

**접근성** (4개 설정 조합 전부)
- [ ] reduce transparency
- [ ] reduce motion
- [ ] increase contrast
- [ ] dark mode

**환경 교차 검증** (§11.9)
- [ ] iOS Safari 실기기 — 유리가 실제로 배경을 읽는가 (조상 transform 확인)
- [ ] Android Chrome
- [ ] 데스크톱 Chrome — 렌징 포함
- [ ] 데스크톱 Safari — 렌징 없이도 성립하는가
- [ ] 터치 기기에서 hover 잔상이 없는가
- [ ] 창을 compact 폭까지 줄였을 때 형태가 적응하는가 (§11.2)

**성능**
- [ ] 스크롤 60fps 유지
- [ ] 저사양 기기 확인
- [ ] 모바일 동시 `backdrop-filter` 2개 이하

---

## 부록 A. 플랫폼 API 매핑

| 개념 | SwiftUI | UIKit | AppKit | Web (이 문서) |
|---|---|---|---|---|
| 유리 적용 | `.glassEffect(_:in:)` | `UIGlassEffect` | `NSGlassEffectView` | `.lg` |
| 유리 버튼 | `.buttonStyle(.glass)` | `Configuration.glass()` | `BezelStyle.glass` | `.lg.lg-interactive` |
| 강조 버튼 | `.glassProminent` | `.prominentGlass()` | — | `.lg-prominent` |
| Clear | `.clearGlass()` 계열 | `.clearGlass()` | — | `.lg-clear` |
| 효과 묶기 | `GlassEffectContainer` | — | — | 부모 `.lg` + 자식 `.lg-inner` |
| 형태 병합 | `.glassEffectUnion(id:namespace:)` | — | — | 단일 `.lg` 컨테이너 |
| 모프 전환 | `.glassEffectID(_:in:)` | — | — | FLIP / View Transitions API |
| 스크롤 엣지 | `.safeAreaBar(...)` | `UIScrollEdgeElementContainerInteraction` | — | `.lg-scroll-edge` |
| 동심 형태 | `ConcentricRectangle` | `UICornerConfiguration` | — | `R_out = R_in + gap` |
| 배경 확장 | `.backgroundExtensionEffect()` | `UIBackgroundExtensionView` | `NSBackgroundExtensionView` | 미러 + blur 수동 구현 |
| 탭바 축소 | `.tabBarMinimizeBehavior(.onScrollDown)` | `tabBarMinimizeBehavior` | — | scroll 이벤트 + transform |
| 검색 탭 | `Tab(role: .search)` | `UISearchTab` | — | trailing 배치 수동 |

## 부록 B. 네이티브 마이그레이션 순서 🟩

1. 최신 Xcode로 빌드해 변화를 눈으로 확인
2. 내비게이션/컨트롤의 **커스텀 배경 제거**
3. 하드코딩된 레이아웃 metric 제거 (컨트롤 크기·형태가 자동 갱신되도록)
4. 툴바 아이템 그룹핑 재정의
5. 시트/팝오버의 커스텀 visual effect 제거
6. 리스트/폼 → grouped form style, 섹션 헤더 Title Case
7. 검색을 플랫폼 컨벤션에 맞게 재배치
8. 앱 아이콘을 레이어로 재제작 → Icon Composer
9. 접근성 설정 조합 전수 테스트
10. 성능 프로파일링

> 기존 외형을 유지한 채 최신 SDK로 출시해야 한다면 `UIDesignRequiresCompatibility` 키를 Info에 추가할 수 있다. **임시 방편이며 영구 해법이 아니다.**

---

## 부록 C. 웹에 옮길 때 반드시 인지할 한계

| 항목 | 네이티브 | 웹 |
|---|---|---|
| 렌징(엣지 굴절) | 시스템 기본 | Chromium만, SVG 변위 맵 수동 구현 |
| 기울임 반응 하이라이트 | 자이로 연동 | 포인터 위치로 근사, 모바일은 사실상 불가 |
| 형태 병합/모프 | `GlassEffectContainer` 자동 | 수동. `filter: blur + contrast` goo 기법으로 근사 |
| 적응형 대비 | 배경 밝기 자동 감지 | `backdrop-filter: brightness/contrast`로 부분 근사 |
| 성능 | GPU 최적화 | `backdrop-filter` 개수에 매우 민감 |

**결론**: 웹에서 100% 재현은 불가능하다. 우선순위는
**① 레이어 구조 → ② 형태·곡률 → ③ 하이라이트·그림자 → ④ 모션 → ⑤ 렌징**
순이다. ①②③만 정확히 지켜도 "애플 같다"는 인상의 대부분이 나온다. ⑤에 시간을 먼저 쓰면 순서가 거꾸로다.
