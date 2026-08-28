-- food-voyage — 8/24 인증·프로필 스키마
--
-- Supabase 대시보드 > SQL Editor 에 그대로 붙여넣어 한 번 실행한다.
--
-- Confirm email(Authentication > Sign In / Providers > Email)은 켜도 되고 꺼도 된다.
-- 클라이언트가 두 경우를 다 다룬다. 갈리는 건 메일이 실제로 배달되느냐뿐이다.
--
--   켠다  → signUp() 이 세션 없이 돌아온다. login.js 가 "메일함을 확인해 주세요"
--           안내로 넘어가고, 사용자가 링크를 누르면 그때 세션이 생긴다.
--           **커스텀 SMTP 가 사실상 필수다.** Supabase 기본 메일러는 공식 문서상
--           best-effort · non-production 이고 시간당 2통이다. 발표 중에 계정을
--           하나 더 만들면 메일이 안 온다.
--   끈다  → signUp() 이 세션을 즉시 돌려준다. 외부 설정이 0이다.
--
-- 어느 쪽이든 프로필은 만들어진다. 아래 "트리거를 두지 않는 이유"를 볼 것.


-- ── profiles ────────────────────────────────────────────
-- auth.users 는 Supabase 소유다. 앱이 읽고 쓰는 사용자 정보는 여기 둔다.
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   text not null check (char_length(nickname) between 1 and 20),
  -- nickname 과 같은 이유로 상한을 둔다. 본인이 profiles_update_own 으로 임의
  -- 길이를 쓸 수 있는 자리라 "동 이름"이라는 전제를 스키마가 직접 지킨다.
  home_area  text constraint profiles_home_area_len
             check (home_area is null or char_length(home_area) <= 40),
  created_at timestamptz not null default now()
);


-- ── 테이블 권한 ─────────────────────────────────────────
-- GRANT 와 RLS 는 다른 층이다. GRANT 는 "이 역할이 이 **테이블**을 만질 수
-- 있는가", RLS 는 "그중 어느 **행**인가"를 정한다. 둘 다 있어야 한다.
--
-- 정책만 만들고 GRANT 를 빠뜨리면 PostgREST 가
--   42501 permission denied for table profiles
-- 로 막는다. 대시보드의 Policies 화면에는 정책 3개가 멀쩡히 보이기 때문에
-- 원인이 정책 쪽이 아니라는 걸 알아채기 어렵다.
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
-- delete 는 주지 않는다. 대응하는 정책이 없고, 지울 일이 생기면 그때 정한다.


-- ── RLS ─────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- 읽기도 본인 행만이다 (8/28에 좁혔다).
--
-- 원래는 using (true) 공개였다. PRD §2 시나리오 ③(읽기 공개)에서 방문자가 남의
-- 항해일지를 보고 DESIGN 의 quote-log 가 작성자를 표기하니, 로그아웃 상태에서도
-- 닉네임이 읽혀야 한다는 선반영이었다. 그런데 그 화면이 아직 없고, 지금 profiles 를
-- 읽는 코드는 js/auth.js 의 본인 조회 하나뿐이다.
--
-- 그 사이 anon 키는 config.js 로 공개되어 있으므로, 공개 읽기는
--   /rest/v1/profiles?select=*
-- 한 번에 전체 사용자 명부(uuid · 닉네임 · 생활권 · 가입시각)를 내주는 통로였다.
-- home_area 가 동 단위라 uuid 와 묶이면 약한 위치 정보가 된다.
--
-- 항해일지가 붙을 때 다시 연다. 그때도 using (true) 로 되돌리지 말고 id · nickname
-- 만 내보내는 뷰나 security definer 함수를 쓴다 — 필요한 건 작성자 표기이지
-- 명부 전체가 아니다.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- 쓰기는 본인 행만.
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ── 트리거를 두지 않는 이유 ─────────────────────────────
--
-- auth.users 에 handle_new_user() 트리거를 거는 게 흔한 패턴이지만 여기서는 안 쓴다.
--
--  ① 세션이 생기는 시점이면 auth.uid() 가 잡히므로 profiles_insert_own 만으로
--     클라이언트 insert 가 통과한다. Confirm email 을 껐으면 signUp() 직후가,
--     켰으면 인증 링크를 누르고 돌아온 직후가 그 시점이다.
--  ② 트리거가 실패하면 Supabase 는 'Database error saving new user' 라는
--     원인을 안 알려주는 문자열 하나만 돌려주고 회원가입 자체를 막는다.
--  ③ security definer + set search_path = '' 하드닝을 틀리게 쓸 여지가 없어진다.
--
-- 대신 js/auth.js 의 ensureProfile() 이 "세션은 있는데 profiles 행이 없으면
-- user_metadata 로 다시 만든다"는 자가복구 경로를 갖는다. 실패해도 로그인은
-- 살아 있고 원인이 콘솔에 남는다.
--
-- 이 경로가 Confirm email 을 켠 경우까지 덮는다. signUp 의 options.data 로 넣은
-- nickname · home_area 가 raw_user_meta_data 에 남아 인증을 건너서 도착하므로,
-- 링크를 누르고 처음 들어올 때 그 값으로 행이 만들어진다.


-- ── RLS 가 진짜 막는지 확인하는 법 ──────────────────────
--
-- B 계정으로 로그인한 상태에서 DevTools 콘솔에:
--
--   await FvAuth._client.from('profiles')
--     .update({ nickname: '침입' }).eq('id', '<A의 uuid>').select();
--
-- error 는 null 이고 data 가 빈 배열로 온다. RLS 의 UPDATE 거부는 에러가 아니라
-- **0행**이다 — "에러가 안 났으니 통과했다"고 읽으면 안 된다.
-- Table Editor 에서 A 의 nickname 이 그대로인지 눈으로 확인한다.


-- ── 실행 직후 확인 ──────────────────────────────────────
-- 아래를 따로 한 번 돌려서 정책 3개가 붙었는지 본다.
--
--   select policyname, cmd from pg_policies
--   where schemaname = 'public' and tablename = 'profiles';
--
-- profiles_select_public(SELECT) · profiles_insert_own(INSERT) ·
-- profiles_update_own(UPDATE) 세 줄이 나와야 한다. 한 줄이라도 없으면
-- 가입은 되는데 프로필이 안 만들어지거나, 남의 행이 열린다.


-- ── 처음부터 다시 만들려면 ──────────────────────────────
-- 위를 두 번 실행하면 relation "profiles" already exists 로 멈춘다.
-- 갈아엎을 때만 아래를 먼저 돌린다.
--
--   drop table if exists public.profiles cascade;
--
-- **가입한 계정의 프로필이 전부 사라진다.** 정책은 테이블에 딸려 있으므로
-- 같이 지워진다. auth.users 는 남으므로 계정 자체를 지우려면
-- Authentication > Users 에서 직접 지운다 — 그래야 같은 이메일로 다시
-- 가입할 수 있다.


-- ════════════════════════════════════════════════════════
-- 담기 (8/24)
-- ════════════════════════════════════════════════════════
--
-- 테이블이 이미 있으면 아래를 다시 실행하지 않는다. 새로 만드는 경우가 아니라면
-- 이 블록만 따로 새 쿼리에 붙여넣어 한 번 돌린다.


-- ── saved_places ────────────────────────────────────────
-- 검색 결과에서 담은 가게. 카카오가 준 값을 담은 시점 그대로 박제한다.
-- 목록을 그릴 때 카카오를 다시 부르지 않아야 하고(8/25 대시보드),
-- 가게 정보가 나중에 바뀌어도 기록은 그때 그대로여야 한다.
create table public.saved_places (
  user_id      uuid not null references auth.users(id) on delete cascade,
  place_id     text not null,          -- 카카오 장소 ID. 숫자처럼 보이지만 문자열이다
  place_name   text not null,
  category     text,                   -- 예: '한식'
  address      text,                   -- 도로명 우선, 없으면 지번
  neighborhood text,                   -- 예: '성수동'. 8/25 동네별 집계의 축이다
  lat          double precision,       -- 카카오의 y
  lng          double precision,       -- 카카오의 x
  created_at   timestamptz not null default now(),

  -- 같은 사람이 같은 가게를 두 번 담을 수 없다.
  -- 대리키를 두지 않는다 — (누가, 어느 가게)가 이 행의 정체 그 자체이고,
  -- 담기 취소가 정확히 이 키로 삭제하는 동작이다.
  primary key (user_id, place_id),

  -- 네 텍스트 컬럼에 상한을 둔다. 이 값들은 담은 사람만 보는 게 아니라
  -- get_top_places 를 거쳐 **비로그인 랜딩 첫 화면**으로 나간다. 가입은 열려
  -- 있으므로 상한이 없으면 아무나 임의 길이 문자열을 랭킹 후보로 밀어 넣을 수 있다.
  constraint saved_places_text_len check (
    char_length(place_name) <= 100
    and (category is null or char_length(category) <= 100)
    and (address is null or char_length(address) <= 100)
    and (neighborhood is null or char_length(neighborhood) <= 100)
  )
);

-- place_id 단독 인덱스. PK 가 (user_id, place_id) 라 선행 컬럼이 user_id 이고,
-- get_save_counts 의 where place_id = any(...) 는 그 인덱스를 못 쓴다 —
-- 검색 페이지가 결과를 그릴 때마다 부르는 경로다(js/search.js).
create index if not exists saved_places_place_id_idx
  on public.saved_places (place_id);

-- 카카오의 x·y를 lng·lat으로 바꿔 저장한다. x가 경도, y가 위도라 이름 그대로
-- 두면 지도에 넣을 때 뒤집기 쉽다. 저장 시점에 한 번만 정리하고 그 뒤로는
-- 헷갈릴 여지를 없앤다. 카카오는 둘 다 문자열로 주므로 클라이언트가 Number()한다.


-- ── 테이블 권한 ─────────────────────────────────────────
-- GRANT는 "이 역할이 이 테이블을 만질 수 있는가", RLS는 "그중 어느 행인가"다.
-- 8/24에 profiles에서 이걸 빠뜨려 42501로 막혔다. 반복하지 않는다.
grant select, insert, delete on public.saved_places to authenticated;
-- anon에게는 아무것도 주지 않는다. 본인만 보는 목록이다.
-- update도 주지 않는다 — 고칠 값이 없다. 담거나 안 담거나 둘뿐이다.


-- ── RLS ─────────────────────────────────────────────────
alter table public.saved_places enable row level security;

-- profiles와 달리 공개 읽기가 없다. 담기는 "가보고 싶은 곳" 위시리스트라
-- 사적인 성격이 맞다. 나중에 공개로 열려면 select 정책의 using만 바꾸면 된다.
create policy "saved_places_select_own"
  on public.saved_places for select
  using (auth.uid() = user_id);

create policy "saved_places_insert_own"
  on public.saved_places for insert
  with check (auth.uid() = user_id);

create policy "saved_places_delete_own"
  on public.saved_places for delete
  using (auth.uid() = user_id);

-- update 정책은 만들지 않는다. GRANT도 안 줬으므로 두 층 모두에서 막힌다.


-- ── 실행 직후 확인 ──────────────────────────────────────
--   select policyname, cmd from pg_policies
--   where schemaname = 'public' and tablename = 'saved_places';
--
-- select_own(SELECT) · insert_own(INSERT) · delete_own(DELETE) 세 줄.


-- ════════════════════════════════════════════════════════
-- TRUNCATE 권한 회수 (8/24)
-- ════════════════════════════════════════════════════════
--
-- Supabase는 public 스키마에 테이블을 만들 때 anon·authenticated에게
-- TRUNCATE를 기본으로 함께 준다. profiles·saved_places 모두 그 상태였다.
--
-- TRUNCATE는 행 단위 명령이 아니라 테이블을 통째로 비우는 저수준 명령이라
-- RLS가 적용되지 않는다 — SELECT·INSERT·UPDATE·DELETE 정책은 전부 무의미해지고,
-- anon 키만 알면(브라우저 소스에 그대로 있다) 모든 사용자의 행을 한 번에
-- 지울 수 있다. REST API·supabase-js에는 TRUNCATE를 부르는 경로가 없어서
-- 검색·로그인 같은 정상 사용으로는 절대 발동하지 않는다 — 직접 SQL을 보내야
-- 실행된다. 그래서 당장 급한 구멍은 아니었지만 있어야 할 이유가 없었다.
--
-- SELECT·INSERT·UPDATE·DELETE는 건드리지 않는다. TRUNCATE만 뺀다.
--
-- 앞으로 public에 테이블을 새로 만들 때는 grant 문 옆에 이 줄도 같이 적는다.
-- 그때그때 발견해서 따로 고치지 않는다.
revoke truncate on public.profiles, public.saved_places from anon, authenticated;


-- ── 확인 ────────────────────────────────────────────────
--   select has_table_privilege('anon', 'public.saved_places', 'TRUNCATE'),
--          has_table_privilege('authenticated', 'public.saved_places', 'TRUNCATE'),
--          has_table_privilege('anon', 'public.profiles', 'TRUNCATE'),
--          has_table_privilege('authenticated', 'public.profiles', 'TRUNCATE');
--
-- 네 값 모두 false여야 한다.


-- ════════════════════════════════════════════════════════
-- 인기 랭킹 RPC (8/24)
-- ════════════════════════════════════════════════════════
--
-- 이 블록만 새 쿼리에 붙여넣어 한 번 돌린다. create or replace라 재실행해도 안전하다.
--
-- saved_places는 RLS로 본인 행만 열린다. "몇 명이 담았나"는 전체 집계가 필요하지만
-- RLS를 완화하지 않는다 — security definer 함수가 소유자 권한으로 집계하고,
-- 밖으로 내보내는 것은 (가게 스냅샷 대표값, 담긴 횟수)뿐이다.
-- user_id는 반환 시그니처에조차 없다.

create or replace function public.get_top_places(limit_count integer default 5)
returns table (
  place_id     text,
  place_name   text,
  category     text,
  neighborhood text,
  save_count   bigint
)
language sql
stable                -- 읽기 전용이다. 데이터를 바꾸지 않는다.
security definer      -- 소유자로 실행 → saved_places의 RLS를 지나간다. 정책은 그대로다.
set search_path = ''  -- definer 하드닝(위 "트리거를 두지 않는 이유" ③의 그 규율).
as $$
  select
    sp.place_id,
    -- 같은 place_id라도 담은 시점의 카카오 스냅샷이라 사용자별로 값이 다를 수 있다.
    -- 최빈값(mode)으로 대표값 하나를 고른다. null은 집계에서 무시된다.
    mode() within group (order by sp.place_name)   as place_name,
    mode() within group (order by sp.category)     as category,
    mode() within group (order by sp.neighborhood) as neighborhood,
    count(*)                                       as save_count
  from public.saved_places sp
  group by sp.place_id
  -- 랭킹 진입 하한. 가입이 열려 있으므로 하한이 없으면 계정 하나가 임의의
  -- place_name을 담기만 해도 랜딩 첫 화면의 랭킹 후보가 된다. 시드 기준
  -- TOP5가 10·9·8·7·6이라 이 하한은 보이는 결과를 바꾸지 않는다.
  having count(*) >= 3
  -- 동률 처리: 담긴 횟수 → 더 최근에 담긴 가게 → place_id.
  -- 마지막 place_id는 새로고침마다 순서가 흔들리지 않게 하는 고정 축이다.
  order by count(*) desc, max(sp.created_at) desc, sp.place_id
  -- 호출자가 이상한 값을 넣어도 1~20으로 잘라낸다.
  limit least(greatest(coalesce(limit_count, 5), 1), 20);
$$;

-- 함수는 만들어지는 순간 public에 execute가 기본으로 열린다. 전부 걷고 다시 준다.
-- 랭킹은 랜딩 첫 화면 콘텐츠라 비로그인(anon)에게도 연다 — 개인 식별이 없는
-- 익명 집계이므로 열어도 되고, 열어야 랜딩이 로그인 없이 완성된다.
revoke all on function public.get_top_places(integer) from public;
grant execute on function public.get_top_places(integer) to anon, authenticated;


-- ── 실행 직후 확인 ──────────────────────────────────────
--   select * from public.get_top_places(5);
--     → 컬럼이 place_id·place_name·category·neighborhood·save_count 다섯뿐이어야 한다.
--       user_id가 보이면 잘못 만든 것이다.
--   select prosecdef, proconfig from pg_proc where proname = 'get_top_places';
--     → t, {search_path=}
--   select has_function_privilege('anon', 'public.get_top_places(integer)', 'execute');
--     → true


-- ════════════════════════════════════════════════════════
-- 담김 수 조회 RPC (8/24 — 인기순 정렬)
-- ════════════════════════════════════════════════════════
--
-- 이 블록만 새 쿼리에 붙여넣어 한 번 돌린다. create or replace라 재실행해도 안전하다.
--
-- 검색 결과(최대 15곳)의 place_id 배열을 받아 각 가게가 몇 번 담겼는지 돌려준다.
-- 검색 페이지가 이 수로 행 배지를 그리고 인기순 재정렬을 한다.
-- get_top_places와 같은 원칙이다: RLS는 그대로 두고 security definer가 집계만
-- 소유자 권한으로 하며, 반환에 user_id는 시그니처에조차 없다.

create or replace function public.get_save_counts(place_ids text[])
returns table (place_id text, save_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select sp.place_id, count(*)::bigint as save_count
  from public.saved_places sp
  -- 배열 상한 가드. 카카오 검색 상한이 15이니 50이면 충분하고,
  -- 임의로 긴 배열을 보내 집계를 두드리는 남용을 막는다.
  where sp.place_id = any(place_ids[1:50])
  group by sp.place_id;
$$;

-- 함수는 만들어지는 순간 public에 execute가 기본으로 열린다. 전부 걷고 다시 준다.
-- 배지는 비로그인 검색 화면에도 보여야 하므로 anon에게도 연다 — 익명 집계다.
revoke all on function public.get_save_counts(text[]) from public;
grant execute on function public.get_save_counts(text[]) to anon, authenticated;


-- ── 실행 직후 확인 ──────────────────────────────────────
--   select * from public.get_save_counts(array['seed-p01','seed-p05','no-such']);
--     → seed-p01 10 · seed-p05 6 두 행. 없는 id는 행이 없다(0이 아니라 부재).
--   select prosecdef, proconfig from pg_proc where proname = 'get_save_counts';
--     → t, {search_path=}
--   select has_function_privilege('anon', 'public.get_save_counts(text[])', 'execute');
--     → true
