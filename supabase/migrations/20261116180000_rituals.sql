-- Stories H4.x: rituals (meetings), transcripts, summaries per area and pendings.
-- Demo policy (PRD decision 4): RLS ON, open read/insert/update, NO delete.

create table public.rituals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id),
  kind text not null check (kind in ('daily', 'weekly', 'planning', 'review', 'retro')),
  title text not null check (length(trim(title)) > 0),
  held_on date not null,
  transcript text not null check (length(trim(transcript)) > 0),
  created_at timestamptz not null default now()
);
create index rituals_project_idx on public.rituals (project_id);

create table public.ritual_participants (
  id uuid primary key default gen_random_uuid(),
  ritual_id uuid not null references public.rituals (id),
  participant_id uuid not null references public.participants (id),
  constraint ritual_participants_unique unique (ritual_id, participant_id)
);
create index ritual_participants_ritual_idx on public.ritual_participants (ritual_id);

-- One summary per ritual and area. It is born as a draft (PRD section 6).
create table public.ritual_summaries (
  id uuid primary key default gen_random_uuid(),
  ritual_id uuid not null references public.rituals (id),
  area_id uuid not null references public.areas (id),
  key_points text[] not null default '{}',
  decisions text[] not null default '{}',
  risks text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'approved')),
  is_pregenerated boolean not null default true,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ritual_summaries_unique unique (ritual_id, area_id)
);
create index ritual_summaries_ritual_idx on public.ritual_summaries (ritual_id);

-- A pending found in a summary. task_id is filled when it becomes a task (H4.3.1).
create table public.ritual_pendings (
  id uuid primary key default gen_random_uuid(),
  summary_id uuid not null references public.ritual_summaries (id),
  description text not null check (length(trim(description)) > 0),
  suggested_assignee text,
  task_id uuid references public.items (id),
  created_at timestamptz not null default now()
);
create index ritual_pendings_summary_idx on public.ritual_pendings (summary_id);

alter table public.rituals enable row level security;
alter table public.ritual_participants enable row level security;
alter table public.ritual_summaries enable row level security;
alter table public.ritual_pendings enable row level security;

grant select, insert, update on table public.rituals to anon, authenticated;
grant select, insert, update on table public.ritual_participants to anon, authenticated;
grant select, insert, update on table public.ritual_summaries to anon, authenticated;
grant select, insert, update on table public.ritual_pendings to anon, authenticated;
revoke delete, truncate on table public.rituals from anon, authenticated;
revoke delete, truncate on table public.ritual_participants from anon, authenticated;
revoke delete, truncate on table public.ritual_summaries from anon, authenticated;
revoke delete, truncate on table public.ritual_pendings from anon, authenticated;

create policy "rituals_select_open" on public.rituals for select to anon, authenticated using (true);
create policy "rituals_insert_open" on public.rituals for insert to anon, authenticated with check (true);
create policy "rituals_update_open" on public.rituals for update to anon, authenticated using (true) with check (true);

create policy "ritual_participants_select_open" on public.ritual_participants for select to anon, authenticated using (true);
create policy "ritual_participants_insert_open" on public.ritual_participants for insert to anon, authenticated with check (true);
create policy "ritual_participants_update_open" on public.ritual_participants for update to anon, authenticated using (true) with check (true);

create policy "ritual_summaries_select_open" on public.ritual_summaries for select to anon, authenticated using (true);
create policy "ritual_summaries_insert_open" on public.ritual_summaries for insert to anon, authenticated with check (true);
create policy "ritual_summaries_update_open" on public.ritual_summaries for update to anon, authenticated using (true) with check (true);

create policy "ritual_pendings_select_open" on public.ritual_pendings for select to anon, authenticated using (true);
create policy "ritual_pendings_insert_open" on public.ritual_pendings for insert to anon, authenticated with check (true);
create policy "ritual_pendings_update_open" on public.ritual_pendings for update to anon, authenticated using (true) with check (true);
