-- ============================================================
-- IMPULSO · Esquema de base de datos (Supabase / PostgreSQL)
-- Ejecutar completo en: Supabase > SQL Editor > New query > Run
-- ============================================================

-- 1) ESTADO PERSONAL DE CADA USUARIO
--    (hábitos, tareas, bandeja, ajustes, tema: un documento JSON por usuario)
create table if not exists public.app_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;

drop policy if exists "app_state_own" on public.app_state;
create policy "app_state_own" on public.app_state
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 2) MENTORÍAS  (relación real entre DOS cuentas distintas)
create table if not exists public.mentorships (
  id            uuid primary key default gen_random_uuid(),
  inviter_id    uuid not null references auth.users(id) on delete cascade,
  inviter_email text not null,
  inviter_name  text,
  inviter_role  text not null check (inviter_role in ('mentor','mentee')),
  target_email  text not null,
  target_id     uuid references auth.users(id) on delete cascade,
  target_name   text,
  status        text not null default 'pending' check (status in ('pending','active')),
  created_at    timestamptz not null default now()
);
alter table public.mentorships enable row level security;

drop policy if exists "mentorships_select" on public.mentorships;
create policy "mentorships_select" on public.mentorships for select
  using (
    inviter_id = auth.uid()
    or target_id = auth.uid()
    or lower(target_email) = lower(auth.email())
  );

drop policy if exists "mentorships_insert" on public.mentorships;
create policy "mentorships_insert" on public.mentorships for insert
  with check (inviter_id = auth.uid());

drop policy if exists "mentorships_update" on public.mentorships;
create policy "mentorships_update" on public.mentorships for update
  using (
    inviter_id = auth.uid()
    or target_id = auth.uid()
    or lower(target_email) = lower(auth.email())
  );

drop policy if exists "mentorships_delete" on public.mentorships;
create policy "mentorships_delete" on public.mentorships for delete
  using (inviter_id = auth.uid() or target_id = auth.uid());

-- 3) TAREAS COMPARTIDAS  (asignadas por un mentor a su aprendiz)
create table if not exists public.shared_tasks (
  id             uuid primary key default gen_random_uuid(),
  mentorship_id  uuid not null references public.mentorships(id) on delete cascade,
  owner_id       uuid not null,        -- el aprendiz que realiza la tarea
  creator_id     uuid not null,        -- quien la creó (normalmente el mentor)
  creator_name   text,
  title          text not null,
  classification text,
  color          text,
  date           date,
  time           text,
  status         text default 'pendiente',
  done           boolean not null default false,
  grade          int,
  tag            text,
  feedback       text,
  created_at     timestamptz not null default now()
);
alter table public.shared_tasks enable row level security;

-- función auxiliar: ¿soy miembro (mentor o aprendiz) de esa mentoría?
-- security definer evita problemas de recursión con RLS.
create or replace function public.is_mentorship_member(m_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.mentorships m
    where m.id = m_id
      and (m.inviter_id = auth.uid() or m.target_id = auth.uid())
  );
$$;

drop policy if exists "shared_tasks_all" on public.shared_tasks;
create policy "shared_tasks_all" on public.shared_tasks
  for all
  using (public.is_mentorship_member(mentorship_id))
  with check (public.is_mentorship_member(mentorship_id));

-- 4) TIEMPO REAL  (para que los cambios aparezcan al instante en ambas cuentas)
do $$ begin
  alter publication supabase_realtime add table public.mentorships;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.shared_tasks;
exception when duplicate_object then null;
end $$;

-- Listo. Si todo corrió sin errores, el backend está preparado.