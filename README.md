# food-voyage

내 동네를 한 곳씩 개척하고 기록하는 미식 항해일지. 별점이 아니라 **재방문율**로 줄을 세운다.

기획은 `PRD.md`, 디자인 값은 `DESIGN.md`, 유리 재질 수치는 `LIQUID-GLASS.md`가 갖는다. 세 문서가 각자 단일 출처다.

## 로컬에서 띄우기

빌드가 없다. 정적 파일을 8000번 포트로 서빙하면 된다 — `file://`로 열면 카카오 SDK가 origin을 확인하지 못해 검색이 죽는다.

```bash
python -m http.server 8000      # 파이썬이 있으면
npx --yes http-server -p 8000   # 없으면
```

`http://localhost:8000` — 카카오 JS 키의 도메인 허용목록에 이 주소가 등록되어 있다.

## Supabase 설정 (8/24 인증)

`config.js`의 `SUPABASE_URL`·`SUPABASE_ANON_KEY`가 비어 있으면 로그인 페이지가 폼 대신 안내 블록을 띄운다. 채우는 순서는 이렇다.

1. **프로젝트 생성** — Region은 `Northeast Asia (Seoul)`.
2. **SQL Editor에 `supabase/schema.sql`을 붙여넣고 실행.** `profiles` 테이블과 RLS 정책이 생긴다.
3. **Settings → API**에서 `Project URL`과 `anon`(또는 `publishable`) 키를 복사해 `config.js`에 넣는다.
   `service_role` 키는 절대 넣지 않는다 — RLS를 통째로 우회한다.
4. **이메일 인증을 쓸지 정한다.** 아래 절을 볼 것.

## 이메일 인증 (Confirm email)

**코드는 켜짐·꺼짐 둘 다 다룬다.** `Authentication → Sign In / Providers → Email`의 토글 하나로 갈리고, 어느 쪽이든 프로필은 만들어진다 — `signUp`이 닉네임·생활권을 `user_metadata`에 실어 보내고, 세션이 처음 생기는 순간 `ensureProfile()`이 그 값으로 행을 만든다.

| | 켰을 때 | 껐을 때 |
|---|---|---|
| `signUp()` 반환 | 세션 없음 → "메일함을 확인해 주세요" 안내 | 세션 즉시 → 홈으로 |
| 필요한 것 | **커스텀 SMTP** | 없음 |
| 프로필 생성 시점 | 링크를 누르고 돌아온 직후 | 가입 직후 |

### 8/24 결정: 켠다. 기본 SMTP로 시작한다

인증은 있어야 하는 기능이고, 기본 메일러의 한계는 **발송 횟수**이지 기능이 아니다. 발표 중에 계정을 새로 만들지만 않으면 걸릴 일이 없다.

다만 Supabase 문서가 못 박아 둔 조건을 알고 쓴다 — 기본 메일러는 best-effort이고 "non-production use cases" 전용, **시간당 2통**이며 커스텀 SMTP 없이는 못 늘린다.

**켜면 Redirect URLs를 등록해야 한다.** 인증 링크는 `login.html?confirmed=1`로 돌아온다 (`js/auth.js`의 `emailRedirectTo`가 `location.origin`을 쓴다).

- **Authentication → URL Configuration → Redirect URLs**에 `http://localhost:8000/**`와 배포 URL(`https://<프로젝트>.vercel.app/**`)을 넣는다.
- Site URL은 배포 URL로 맞춘다. 허용목록에 없는 주소로 돌아오면 전부 여기로 떨어진다.

등록을 빠뜨리면 인증 링크를 눌러도 엉뚱한 곳으로 가고, 화면에는 "인증 링크가 만료되었거나 이미 사용되었습니다"만 뜬다. 원인이 안 보이는 실패라 먼저 확인할 것.

### 비밀번호 정책

최소 길이는 **8자**다 (`Authentication → Sign In / Providers → Email`).

**대시보드를 바꾸면 `login.html`의 `minlength`도 같이 바꾼다.** 어긋나면 화면이 가르치는 규칙과 서버가 거절하는 규칙이 달라진다. 에러 문구 쪽은 손댈 필요 없다 — `js/auth.js`의 `toKorean()`이 Supabase 응답에 담긴 숫자를 읽는다.

유출 비밀번호 대조(HaveIBeenPwned)는 **Pro 플랜 기능**이라 켜지 않았다. 무료 플랜에서는 토글이 잠겨 있다.

### 배달 테스트 (오늘 해야 한다)

기본 메일러는 스팸으로 분류되기 쉽다. 다른 Supabase 프로젝트가 같은 발신 도메인의 평판을 깎아 놓기 때문이다. **실제로 도착하는지 15분 안에 판가름 난다.**

1. 로컬에서 본인 주소로 가입해 본다.
2. 받은편지함 → 없으면 **스팸함** → 프로모션 탭까지 확인한다.
3. 링크를 눌러 `index.html`로 돌아오고 헤더가 닉네임으로 바뀌는지 본다.

안 오거나 스팸으로 가면 **Resend**(무료 월 3,000통)나 **Brevo**(일 300통)를 붙인다. 코드는 그대로다 — SMTP는 대시보드 설정이다.

### 발표용 계정 두 개

`PRD.md` §6-3의 사용자 A(일산)·B(성수)는 **Gmail + 주소**로 만든다.

```
내주소+ilsan@gmail.com     → 준서 · 일산
내주소+seongsu@gmail.com   → 수민 · 성수
```

Supabase는 이 둘을 서로 다른 사용자로 보고, 메일은 한 받은편지함으로 온다.

> **함정: 시간당 2통이 계정 2개로 정확히 소진된다.** A와 B를 연달아 만들면 그 시간의 예산을 다 쓴다. 그 직후 발표에서 가입을 한 번 더 시연하면 메일이 오지 않는다.
>
> **두 계정은 발표 전날까지 만들어 둔다.** 발표에서 가입 흐름을 보여줄 거라면 계정 생성과 **1시간 이상** 간격을 두거나, 세 번째 주소(`내주소+demo@gmail.com`)를 미리 정해 두고 그때 쓴다.

인증을 끈 채로 갈 거라면 위의 Redirect URLs·배달 테스트는 전부 건너뛰어도 된다. 이메일+비밀번호 로그인에는 리디렉션이 없다.

## Supabase MCP

`.mcp.json`에 Supabase MCP 서버가 등록되어 있다. 붙이면 Claude가 스키마를 직접 실행하고, `auth.users`를 조회하고, 보안 점검(`get_advisors`)을 돌릴 수 있다.

`project_ref`로 이 프로젝트 하나에만 묶여 있고, **파일에 비밀은 없다** — 인증은 각자 브라우저 OAuth로 한다. 처음 쓸 때 `/mcp`에서 supabase 항목을 인증하면 된다.

## 키를 커밋하는 이유

`config.js`는 **커밋한다.** 카카오 JavaScript 키와 Supabase anon 키는 둘 다 브라우저가 받아가는 값이라 숨길 수단이 없다 — 빌드로 주입해도 배포본에 그대로 실린다. 실제 방어는 다른 층이 한다.

| 키 | 방어 |
|---|---|
| 카카오 JS 키 | Kakao Developers의 JavaScript SDK 도메인 허용목록 |
| Supabase anon 키 | Row Level Security |

진짜 비밀(Gemini 키, `service_role` 키)은 여기 두지 않는다. Vercel 환경변수에 넣고 서버 함수를 거친다 (PRD §4).

## 구조

```
index.html    랜딩 (5개 섹션)
search.html   맛집 찾기 (카카오 로컬)
login.html    로그인 · 회원가입
config.js     브라우저에 노출되는 공개 키들
styles.css    Liquid Glass 공유 스타일
tw-config.js  Tailwind 디자인 토큰
script.js     랜딩 컨트롤러
mock-data.js  가짜 데이터 (mock 접두사)
js/
  auth.js            window.FvAuth — Supabase 인증, 세 페이지 공유
  kakao-places.js    window.KakaoPlaces
  region-combobox.js window.RegionCombobox
  search.js          검색 페이지 컨트롤러
  login.js           로그인 페이지 컨트롤러
supabase/
  schema.sql    profiles 테이블 + RLS. 대시보드에 붙여넣는다
```

`js/`의 파일들은 IIFE 안에 갇혀 있고 `window.X` 하나만 내보낸다. `script.js`와 `js/search.js`는 top-level 이름을 쓰므로 **한 페이지에 같이 올리면 안 된다**.
