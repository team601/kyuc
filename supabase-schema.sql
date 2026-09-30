-- ─────────────────────────────────────────────────────────────
-- kyuc° — Supabase SQL Schema (Idempotent / Chạy nhiều lần không lỗi)
-- Chạy trong Supabase Dashboard > SQL Editor
-- ─────────────────────────────────────────────────────────────

-- 1. Profiles (tự động tạo khi user đăng ký)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  display_name text,
  avatar_url text,
  language_pref text default 'vi' check (language_pref in ('en', 'vi')),
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies for profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────

-- 2. Stories (câu chuyện)
create table if not exists public.stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  title text not null,
  question_en text,
  question_vi text,
  category text check (category in ('roots', 'traditions', 'life_lessons')),
  content_text text,
  audio_url text,
  image_url text,
  photo_caption text,
  language text default 'vi' check (language in ('en', 'vi')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Bổ sung cột nếu bảng stories đã tồn tại từ trước
alter table public.stories add column if not exists image_url text;
alter table public.stories add column if not exists photo_caption text;

alter table public.stories enable row level security;

-- Mỗi user chỉ thấy/sửa câu chuyện của mình
drop policy if exists "Users can CRUD own stories" on public.stories;
create policy "Users can CRUD own stories"
  on public.stories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────

-- 3. Family Members (chia sẻ)
create table if not exists public.family_members (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles on delete cascade not null,
  member_email text not null,
  role text,
  member_id uuid references public.profiles on delete set null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  invited_at timestamptz default now() not null,
  unique(owner_id, member_email)
);

alter table public.family_members add column if not exists role text;

alter table public.family_members enable row level security;

drop policy if exists "Users can manage own family invites" on public.family_members;
create policy "Users can manage own family invites"
  on public.family_members for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ─────────────────────────────────────────────────────────────

-- 4. Storage bucket for audio files (Private by default)
insert into storage.buckets (id, name, public) 
values ('audio', 'audio', false)
on conflict (id) do update set public = false;

-- Allow authenticated users to upload to their own folder
drop policy if exists "Authenticated users can upload audio" on storage.objects;
create policy "Authenticated users can upload audio"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'audio' and auth.uid()::text = (storage.foldername(name))[1]);

-- Audio files: readable by owner or if story is marked public
drop policy if exists "Audio files are publicly readable" on storage.objects;
drop policy if exists "Users can read own audio or public stories" on storage.objects;
create policy "Users can read own audio or public stories"
  on storage.objects for select
  using (
    bucket_id = 'audio' 
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1 from public.stories s 
        where s.audio_url like '%' || name 
        and s.is_public = true
      )
    )
  );

drop policy if exists "Users can delete own audio" on storage.objects;
create policy "Users can delete own audio"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'audio' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─────────────────────────────────────────────────────────────

-- 5. Storage bucket for story photos (Private by default)
insert into storage.buckets (id, name, public) 
values ('photos', 'photos', false)
on conflict (id) do update set public = false;

drop policy if exists "Authenticated users can upload photos" on storage.objects;
create policy "Authenticated users can upload photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Photos: readable by owner or if story is marked public
drop policy if exists "Photos are publicly readable" on storage.objects;
drop policy if exists "Users can read own photos or public stories" on storage.objects;
create policy "Users can read own photos or public stories"
  on storage.objects for select
  using (
    bucket_id = 'photos' 
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1 from public.stories s 
        where s.image_url like '%' || name 
        and s.is_public = true
      )
    )
  );

drop policy if exists "Users can delete own photos" on storage.objects;
create policy "Users can delete own photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─────────────────────────────────────────────────────────────

-- 6. Storage bucket for user avatars
insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Avatars are publicly readable" on storage.objects;
create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can update/delete own avatars" on storage.objects;
create policy "Users can update/delete own avatars"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─────────────────────────────────────────────────────────────

-- 7. Story columns for transcript & sharing
alter table public.stories add column if not exists audio_transcript text;
alter table public.stories add column if not exists is_public boolean default false;
alter table public.stories add column if not exists share_token uuid default gen_random_uuid();

-- Allow public viewing if is_public = true
drop policy if exists "Allow viewing public stories" on public.stories;
create policy "Allow viewing public stories"
  on public.stories for select
  using (is_public = true);

-- Allow invited family members to view family members table
drop policy if exists "Users can view family invites for their email or by owner" on public.family_members;
create policy "Users can view family invites for their email or by owner"
  on public.family_members for select
  using (
    auth.uid() = owner_id or 
    member_email = (auth.jwt() ->> 'email') or
    member_id = auth.uid()
  );

drop policy if exists "Invited members can update their invitation status" on public.family_members;
create policy "Invited members can update their invitation status"
  on public.family_members for update
  using (
    member_email = (auth.jwt() ->> 'email') or
    member_id = auth.uid()
  );

-- Allow family members to view each other's stories in the family circle
drop policy if exists "Family members can view each other's stories" on public.stories;
create policy "Family members can view each other's stories"
  on public.stories for select
  using (
    auth.uid() = user_id or
    is_public = true or
    exists (
      select 1 from public.family_members fm
      where fm.status = 'accepted'
      and (
        (fm.owner_id = auth.uid() and fm.member_id = stories.user_id) or
        (fm.owner_id = stories.user_id and (fm.member_id = auth.uid() or fm.member_email = (auth.jwt() ->> 'email')))
      )
    )
  );

