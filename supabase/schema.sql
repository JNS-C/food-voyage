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
  home_area  text,
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

-- 읽기는 공개다. PRD §2 시나리오 ③(읽기 공개)에서 방문자가 남의 항해일지를 보고,
-- DESIGN 의 quote-log 가 작성자를 표기한다 — 로그아웃 상태에서도 닉네임이 읽혀야 한다.
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

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
