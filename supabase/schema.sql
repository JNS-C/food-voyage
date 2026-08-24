-- food-voyage — 8/24 인증·프로필 스키마
--
-- Supabase 대시보드 > SQL Editor 에 그대로 붙여넣어 한 번 실행한다.
-- 실행 전에 Authentication > Sign In / Providers > Email 에서
-- **Confirm email 을 꺼야 한다.** 기본 SMTP는 테스트용이고 시간당 2통 제한이라,
-- 켜 두면 발표 중에 계정 하나 더 만들 때 메일이 안 와서 막힌다.
-- 끄면 signUp()이 세션을 즉시 돌려주고, 그 세션이 있어야 auth.uid()가 잡혀
-- 아래 profiles_insert_own 정책을 클라이언트가 통과할 수 있다.


-- ── profiles ────────────────────────────────────────────
-- auth.users 는 Supabase 소유다. 앱이 읽고 쓰는 사용자 정보는 여기 둔다.
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   text not null check (char_length(nickname) between 1 and 20),
  home_area  text,
  created_at timestamptz not null default now()
);


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
--  ① Confirm email 을 껐으므로 signUp() 이 세션을 즉시 돌려준다. auth.uid() 가
--     잡히므로 profiles_insert_own 만으로 클라이언트 insert 가 통과한다.
--  ② 트리거가 실패하면 Supabase 는 'Database error saving new user' 라는
--     원인을 안 알려주는 문자열 하나만 돌려주고 회원가입 자체를 막는다.
--  ③ security definer + set search_path = '' 하드닝을 틀리게 쓸 여지가 없어진다.
--
-- 대신 js/auth.js 의 ensureProfile() 이 "세션은 있는데 profiles 행이 없으면
-- user_metadata 로 다시 만든다"는 자가복구 경로를 갖는다. 실패해도 로그인은
-- 살아 있고 원인이 콘솔에 남는다.


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
