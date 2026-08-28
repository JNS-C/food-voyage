# food-voyage

한 곳씩 개척하고 기록하는 미식 항해일지. 별점이 아니라 **재방문율**로 줄을 세운다.

기획은 `PRD.md`, 디자인 값은 `DESIGN.md`, 유리 재질 수치는 `LIQUID-GLASS.md`가 갖는다. 세 문서가 각자 단일 출처다.

## 로컬에서 띄우기

빌드가 없다. 정적 파일을 8000번 포트로 서빙하면 된다 — `file://`로 열면 카카오 SDK가 origin을 확인하지 못해 검색이 죽는다.

```bash
python -m http.server 8000      # 파이썬이 있으면
npx --yes http-server -p 8000   # 없으면
```

`http://localhost:8000` — 카카오 JS 키의 도메인 허용목록에 이 주소가 등록되어 있다.

### 서버 함수까지 돌리려면 (구글 사진)

위 두 명령에는 서버리스 런타임이 없어서 `/api/place-photo`가 404를 낸다. **그래도 나머지는 전부 그대로 동작한다** — 썸네일이 색면으로 남을 뿐이다. 사진까지 보려면 Vercel의 로컬 런타임을 쓴다.

```bash
npx vercel link                              # 한 번만
npx vercel env pull .env.development.local   # GOOGLE_PLACES_KEY를 받아 온다
npx vercel dev --listen 8000
```

> **`--listen 8000`을 빠뜨리지 말 것.** `vercel dev`의 기본 포트는 3000인데, 8000번만 카카오 JS 키 허용목록과 Supabase Redirect URLs에 등록되어 있다. 3000으로 뜨면 카카오가 401을 뱉어 **사진 이전에 검색 자체가 죽는다.**

## Supabase 설정 (8/24 인증)

`config.js`의 `SUPABASE_URL`·`SUPABASE_ANON_KEY`가 비어 있으면 로그인 페이지가 폼 대신 안내 블록을 띄운다. 채우는 순서는 이렇다.

1. **프로젝트 생성** — Region은 `Northeast Asia (Seoul)`.
2. **SQL Editor에 `supabase/schema.sql`을 붙여넣고 실행.** `profiles`·`saved_places` 테이블과 RLS 정책이 생긴다. 두 번째 이후로 다시 붙여넣을 때는 이미 있는 테이블의 `create table`이 `relation already exists`로 멈추니, 새로 추가된 블록만 새 쿼리로 돌린다.
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

- **Authentication → URL Configuration → Redirect URLs**에 `http://localhost:8000/**`와 `https://food-voyage-puce.vercel.app/**`를 넣는다.
- Site URL은 `https://food-voyage-puce.vercel.app`로 맞춘다. 허용목록에 없는 주소로 돌아오면 전부 여기로 떨어진다.

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

진짜 비밀(Gemini 키, **`GOOGLE_PLACES_KEY`**, `service_role` 키)은 여기 두지 않는다. Vercel 환경변수에 넣고 서버 함수를 거친다 (PRD §4).

## 구조

```
index.html    랜딩 (5개 섹션)
search.html   맛집 찾기 (카카오 로컬)
login.html    로그인 · 회원가입
mypage.html   담은 곳
config.js     브라우저에 노출되는 공개 키들
styles.css    Liquid Glass 공유 스타일
tw-config.js  Tailwind 디자인 토큰
script.js     랜딩 컨트롤러
mock-data.js  가짜 데이터 (mock 접두사)
vercel.json   보안 헤더. CSP는 아직 Report-Only다
manifest.webmanifest · favicon.svg · icons/   PWA·브랜드 마크
js/
  auth.js            window.FvAuth — Supabase 인증, 네 페이지 공유
  kakao-places.js    window.KakaoPlaces
  region-combobox.js window.RegionCombobox
  saved-places.js    window.FvSaved — 검색 결과 담기, search.html 전용
  place-photos.js    window.FvPhotos — 카드 썸네일 구글 사진, search.html 전용
  search-map.js      window.FvSearchMap — 결과 지도, search.html 전용
  search.js          검색 페이지 컨트롤러
  login.js           로그인 페이지 컨트롤러
  mypage.js          담은 곳 페이지 컨트롤러
api/
  place-photo.js  구글 Places 사진 조회. 키를 숨기는 것이 존재 이유다
supabase/
  schema.sql    profiles·saved_places 테이블 + RLS. 대시보드에 붙여넣는다
  seed.sql      더미 사용자 10명 · 가상 가게 30곳. 비밀번호는 실행 시점에 넘긴다
.github/workflows/
  keep-alive.yml  3일마다 Supabase를 깨운다
```

`window.FvAuth.db`가 이 앱의 유일한 Supabase 클라이언트다. 두 번째를 만들면 세션이 갈린다.

`js/`의 파일들은 IIFE 안에 갇혀 있고 `window.X` 하나만 내보낸다. `script.js`와 `js/search.js`는 top-level 이름을 쓰므로 **한 페이지에 같이 올리면 안 된다**.

## 담기

검색 결과 카드의 `담기` 버튼이 `saved_places`에 (user_id, place_id) 한 행으로 저장된다. 같은 사람이 같은 가게를 두 번 담을 수 없고(기본키), 본인 것만 읽고 쓴다(RLS). `js/saved-places.js`가 `window.FvAuth`의 로그인 상태를 구독해서 칠하므로, 로그인 안 한 채 누르면 안내 후 `login.html?next=`로 보내고 로그인하면 같은 검색 결과로 돌아온다.

담기·취소는 `upsert`가 아니라 `insert` + 중복키(23505) 처리를 쓴다. `saved_places`에는 `update` 권한을 주지 않았는데(고칠 값이 없어서다) `upsert`는 내부적으로 `ON CONFLICT DO UPDATE`라 그 권한을 요구한다.

## 카드 썸네일 사진

카카오 로컬에는 사진이 없어서 검색 결과 썸네일은 색면(크림 3단계 + 가게명 이니셜)이었다. 이제 그 위에 **구글 Places 사진 1장을 덮는다.**

**교체가 아니라 덮기다.** 색면과 이니셜은 그대로 두고 `<img>`를 절대 위치로 올리며, `hidden`을 벗기는 것은 `img.onload` 안에서만이다. 그래서 로딩 중·매칭 실패·URI 만료·403·`/api` 부재 다섯 경우가 **전부 자동으로 색면으로 떨어진다.** 스켈레톤도 "사진 없음" 분기도 없고, `state-*` 블록도 건드리지 않는다 — 사진 없음은 설계된 상태지 실패가 아니다.

**엉뚱한 가게 사진이 붙느니 사진이 없는 편이 낫다.** `api/place-photo.js`가 두 관문을 AND로 통과시킨다.

| 관문 | 기준 | 막는 것 |
|---|---|---|
| 거리 | 카카오 좌표에서 200m 이내 | 한 블록 옆 같은 이름 지점 |
| 이름 | 포함 관계 또는 bigram Dice ≥ 0.5 | 같은 건물 다른 가게 |

거리만 보면 같은 건물 다른 식당이 통과하고, 이름만 보면 맞는 브랜드의 틀린 지점이 통과한다. 그래서 둘 다 필요하다.

**키는 서버 밖으로 안 나간다.** 함수가 `places:searchText`로 장소를 찾고, 사진은 `…/media?skipHttpRedirect=true`로 **서명된 URL만** 받아 넘긴다. 그 URL에는 API 키가 없어서 브라우저에 그대로 줄 수 있고, 이미지 바이트는 구글 CDN에서 직접 받는다 — 우리 인프라를 지나는 이미지 바이트가 0이다.

**과금은 FieldMask가 정한다.** `places.id,places.photos,places.location,places.displayName` 넷에서 늘리지 않는다. `rating`·`reviews`를 넣는 순간 상위 SKU로 올라가는데, 카드에 표시하지도 않을 값이다 (PRD §6-2가 카드의 숫자를 재방문율 하나로 제한한다).

호출 수는 세 겹으로 막는다.

- **앞 8행만** 채운다 (`PHOTO_LIMIT`). 9행 이후는 스크롤해야 닿는 자리다
- **L0** 인메모리 캐시 — 칩을 누를 때마다 같은 15곳이 다시 렌더되는데, 이게 없으면 칩마다 청구서가 새로 생긴다
- **L1** `localStorage` 30일 — `photoName`을 캐시해 재방문 시 `searchText`(비싼 쪽)를 통째로 건너뛴다. 단명하는 `photoUri`는 저장하지 않는다. 실패도 7일 캐시한다

> **미해결 부채: 저작자 표시.** 구글은 사진에 `authorAttributions` 표시를 요구하는데 72px 썸네일에는 공간이 없다. 지금은 최소 준수로 썸네일 컨테이너의 `title`에 싣는다. 상세 화면이 생길 때 제대로 해결한다.
