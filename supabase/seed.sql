-- food-voyage — 더미 데이터 시딩 (8/24)
--
-- 인기 랭킹·맞춤 추천을 만들려는데 쌓인 데이터가 없다. 더미 사용자 10명이
-- 가상 가게 30곳을 100번 담은 그림을 만든다.
--
-- SQL Editor(또는 MCP)에 전체를 붙여넣어 한 번 실행한다. 전 구간
-- on conflict do nothing 이라 두 번 돌려도 안전하다.
--
-- 더미 식별 규칙 — 이걸로 언제든 일괄 삭제할 수 있다:
--   사용자   이메일이 @seed.food-voyage.local 로 끝난다
--   uuid     00000000-0000-4000-a000-0000000000NN (결정적. 재실행해도 같은 사람)
--   가게     place_id가 seed- 로 시작한다. 카카오 장소 ID는 숫자 문자열이라
--            실제 가게와 절대 충돌하지 않는다 — 맞춤 추천의 "이미 담은 가게 제외"
--            로직이 더미 때문에 오작동할 일이 없다.
--
-- 상호는 전부 가상이다(mock-data.js의 원칙 그대로). 실존 가게에 가짜 담김 수를
-- 붙이지 않는다. 주소도 동 수준까지만 적고 lat/lng는 null로 둔다 — 실제 건물을
-- 짚지 않기 위해서다.


-- ── ① auth.users — 더미 사용자 10명 ─────────────────────
-- SQL Editor는 postgres 권한이라 auth 스키마에 넣을 수 있다.
-- GoTrue가 요구하는 것들:
--   · instance_id 는 단일 테넌트 고정값 0000…0000
--   · confirmation_token 등 4개 토큰 컬럼은 null이 아니라 빈 문자열이어야 한다.
--     null이면 로그인 시 "converting NULL to string" 스캔 에러가 난다.
--   · email_confirmed_at 을 채우면 Confirm email 설정과 무관하게 바로 로그인된다.
-- 비밀번호는 전원 voyage-seed-1234 — 검증할 때 이 계정으로 로그인해 본다.
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  ('00000000-0000-4000-a000-0000000000' || lpad(n::text, 2, '0'))::uuid,
  'authenticated', 'authenticated',
  format('seed%s@seed.food-voyage.local', lpad(n::text, 2, '0')),
  extensions.crypt('voyage-seed-1234', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object(
    'nickname', '항해자' || n,
    'home_area', (array['성수동','연남동','정발산동','서교동','역삼동'])[(n % 5) + 1]
  ),
  now(), now(),
  '', '', '', ''
from generate_series(1, 10) as n
on conflict (id) do nothing;

-- identities가 없으면 이메일 로그인과 대시보드 Users 화면이 어긋난다. 같이 넣는다.
insert into auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email,
                     'email_verified', true, 'phone_verified', false),
  now(), now(), now()
from auth.users u
where u.email like '%@seed.food-voyage.local'
on conflict (provider_id, provider) do nothing;


-- ── ② profiles ──────────────────────────────────────────
-- ensureProfile()이 실제 사용자에게 하는 일을 시딩이 대신 한다.
insert into public.profiles (id, nickname, home_area)
select id, raw_user_meta_data->>'nickname', raw_user_meta_data->>'home_area'
from auth.users
where email like '%@seed.food-voyage.local'
on conflict (id) do nothing;


-- ── ③ saved_places — 100건 ──────────────────────────────
-- PK가 (user_id, place_id)라 한 가게의 최대 담김 = 사용자 수(10)다.
-- 랭킹이 또렷하게 갈리도록 담김 수를 기울여 놓는다:
--   TOP5    10·9·8·7·6건 = 40건 (동률 없음)
--   꼬리    4건×5곳 + 3건×8곳 + 2건×4곳 + 1건×8곳 = 60건
--   합계    30곳 · 100건
-- want=N이면 rn 1~N번 사용자가 담는다. 랜덤이 없어서 재실행해도 같은 그림이다.
with users as (
  select id, row_number() over (order by email) as rn
  from auth.users
  where email like '%@seed.food-voyage.local'
),
places(place_id, place_name, category, neighborhood, address, want) as (values
  -- TOP5 (10·9·8·7·6)
  ('seed-p01', '소금항로',     '한식', '성수동',   '서울 성동구 성수동',       10),
  ('seed-p02', '면발등대',     '일식', '연남동',   '서울 마포구 연남동',        9),
  ('seed-p03', '뭍과바다',     '양식', '서교동',   '서울 마포구 서교동',        8),
  ('seed-p04', '구름만두선',   '중식', '정발산동', '고양시 일산동구 정발산동',  7),
  ('seed-p05', '닻내린커피',   '카페', '성수동',   '서울 성동구 성수동',        6),
  -- 4건 × 5곳
  ('seed-p06', '종이배김밥',   '분식', '역삼동',   '서울 강남구 역삼동',        4),
  ('seed-p07', '아침항구',     '한식', '연남동',   '서울 마포구 연남동',        4),
  ('seed-p08', '초승달스시',   '일식', '서교동',   '서울 마포구 서교동',        4),
  ('seed-p09', '뱃길파스타',   '양식', '성수동',   '서울 성동구 성수동',        4),
  ('seed-p10', '등불짜장',     '중식', '마두동',   '고양시 일산동구 마두동',    4),
  -- 3건 × 8곳
  ('seed-p11', '물안개찻집',   '카페', '정발산동', '고양시 일산동구 정발산동',  3),
  ('seed-p12', '노을떡볶이',   '분식', '성수동',   '서울 성동구 성수동',        3),
  ('seed-p13', '키잡이국밥',   '한식', '역삼동',   '서울 강남구 역삼동',        3),
  ('seed-p14', '잔물결우동',   '일식', '연남동',   '서울 마포구 연남동',        3),
  ('seed-p15', '항해사피자',   '양식', '마두동',   '고양시 일산동구 마두동',    3),
  ('seed-p16', '별자리딤섬',   '중식', '서교동',   '서울 마포구 서교동',        3),
  ('seed-p17', '모래톱빵집',   '카페', '성수동',   '서울 성동구 성수동',        3),
  ('seed-p18', '갑판순대',     '분식', '정발산동', '고양시 일산동구 정발산동',  3),
  -- 2건 × 4곳
  ('seed-p19', '남풍식당',     '한식', '서교동',   '서울 마포구 서교동',        2),
  ('seed-p20', '물비늘초밥',   '일식', '역삼동',   '서울 강남구 역삼동',        2),
  ('seed-p21', '흰돛스테이크', '양식', '연남동',   '서울 마포구 연남동',        2),
  ('seed-p22', '안개숲마라',   '중식', '성수동',   '서울 성동구 성수동',        2),
  -- 1건 × 8곳
  ('seed-p23', '낮별다방',     '카페', '마두동',   '고양시 일산동구 마두동',    1),
  ('seed-p24', '골목항해라면', '분식', '연남동',   '서울 마포구 연남동',        1),
  ('seed-p25', '온기한상',     '한식', '정발산동', '고양시 일산동구 정발산동',  1),
  ('seed-p26', '조각달라멘',   '일식', '성수동',   '서울 성동구 성수동',        1),
  ('seed-p27', '바람결리조또', '양식', '역삼동',   '서울 강남구 역삼동',        1),
  ('seed-p28', '청동냄비',     '중식', '연남동',   '서울 마포구 연남동',        1),
  ('seed-p29', '밀물브루잉',   '카페', '서교동',   '서울 마포구 서교동',        1),
  ('seed-p30', '첫항해토스트', '분식', '마두동',   '고양시 일산동구 마두동',    1)
)
insert into public.saved_places
  (user_id, place_id, place_name, category, address, neighborhood, lat, lng, created_at)
select
  u.id, p.place_id, p.place_name, p.category, p.address, p.neighborhood,
  null, null,
  -- 담은 시점을 흩뿌린다. 랜덤 없이 결정적이라 재실행해도 같은 그림이다.
  now() - (u.rn * interval '7 hours') - (p.want * interval '1 day')
from places p
join users u on u.rn <= p.want
on conflict (user_id, place_id) do nothing;


-- ── 실행 직후 확인 ──────────────────────────────────────
--   select count(*) from public.saved_places where place_id like 'seed-%';
--     → 100
--   select * from public.get_top_places(5);
--     → 소금항로 10 · 면발등대 9 · 뭍과바다 8 · 구름만두선 7 · 닻내린커피 6


-- ── 더미를 전부 걷어내려면 ──────────────────────────────
-- 실제 사용자가 seed- 가게를 담았을 수는 없지만(카카오 검색에 안 나온다),
-- 순서는 saved_places 먼저가 안전하다. profiles·identities와 더미 사용자의
-- saved_places는 FK on delete cascade로 같이 지워진다.
--
--   delete from public.saved_places where place_id like 'seed-%';
--   delete from auth.users where email like '%@seed.food-voyage.local';
