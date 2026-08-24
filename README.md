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
2. **Authentication → Sign In / Providers → Email → `Confirm email` 끄기 → Save.**
   기본 SMTP는 테스트용이고 시간당 2통 제한이다. 켜 두면 계정을 하나 더 만들 때 메일이 안 와서 막힌다. 끄면 `signUp()`이 세션을 즉시 돌려주고, 그 세션이 있어야 `auth.uid()`가 잡혀 RLS insert 정책을 통과한다.
3. **SQL Editor에 `supabase/schema.sql`을 붙여넣고 실행.** `profiles` 테이블과 RLS 정책이 생긴다.
4. **Settings → API**에서 `Project URL`과 `anon`(또는 `publishable`) 키를 복사해 `config.js`에 넣는다.
   `service_role` 키는 절대 넣지 않는다 — RLS를 통째로 우회한다.

Site URL·redirect allowlist는 지금 건드리지 않아도 된다. 이메일+비밀번호에는 리디렉션이 없다. 구글 OAuth를 붙이는 날 등록한다.

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
