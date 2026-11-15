-- Story H1.1.1: project, areas and participants.
-- Demo policy (PRD decision 4): RLS ON, open read/insert/update, NO delete.
-- Roles (owner, area leader, participant) are enforced only in the interface.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  objective text not null check (length(trim(objective)) > 0),
  start_date date not null default current_date,
  deadline date not null,
  created_at timestamptz not null default now(),
  constraint projects_deadline_after_start check (deadline >= start_date)
);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id),
  area_id uuid not null references public.areas (id),
  name text not null check (length(trim(name)) > 0),
  is_owner boolean not null default false,
  is_area_leader boolean not null default false,
  created_at timestamptz not null default now(),
  unique (project_id, name)
);

-- At most one owner per project and one leader per area (PRD section 2).
create unique index participants_one_owner_per_project
  on public.participants (project_id) where is_owner;
create unique index participants_one_leader_per_area
  on public.participants (area_id) where is_area_leader;

alter table public.projects enable row level security;
alter table public.areas enable row level security;
alter table public.participants enable row level security;

-- "Automatically expose new tables" is OFF: grant explicitly. No delete, no truncate.
grant select, insert, update on table public.projects to anon, authenticated;
grant select, insert, update on table public.areas to anon, authenticated;
grant select, insert, update on table public.participants to anon, authenticated;
revoke delete, truncate on table public.projects from anon, authenticated;
revoke delete, truncate on table public.areas from anon, authenticated;
revoke delete, truncate on table public.participants from anon, authenticated;

create policy "projects_select_open" on public.projects
  for select to anon, authenticated using (true);
create policy "projects_insert_open" on public.projects
  for insert to anon, authenticated with check (true);
create policy "projects_update_open" on public.projects
  for update to anon, authenticated using (true) with check (true);

create policy "areas_select_open" on public.areas
  for select to anon, authenticated using (true);
create policy "areas_insert_open" on public.areas
  for insert to anon, authenticated with check (true);
create policy "areas_update_open" on public.areas
  for update to anon, authenticated using (true) with check (true);

create policy "participants_select_open" on public.participants
  for select to anon, authenticated using (true);
create policy "participants_insert_open" on public.participants
  for insert to anon, authenticated with check (true);
create policy "participants_update_open" on public.participants
  for update to anon, authenticated using (true) with check (true);

-- Creates a project with its areas and participants in ONE transaction:
-- if anything fails, nothing is saved (there is no delete to clean up a half-made project).
create or replace function public.create_project(
  p_name text,
  p_objective text,
  p_start_date date,
  p_deadline date,
  p_areas jsonb,
  p_participants jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_project_id uuid;
  v_area_name text;
  v_participant jsonb;
  v_area_id uuid;
begin
  insert into public.projects (name, objective, start_date, deadline)
  values (p_name, p_objective, p_start_date, p_deadline)
  returning id into v_project_id;

  for v_area_name in select jsonb_array_elements_text(p_areas) loop
    insert into public.areas (project_id, name) values (v_project_id, v_area_name);
  end loop;

  for v_participant in select * from jsonb_array_elements(p_participants) loop
    select id into v_area_id
      from public.areas
      where project_id = v_project_id and name = v_participant ->> 'area';
    if v_area_id is null then
      raise exception 'unknown area: %', v_participant ->> 'area';
    end if;

    insert into public.participants (project_id, area_id, name, is_owner, is_area_leader)
    values (
      v_project_id,
      v_area_id,
      v_participant ->> 'name',
      coalesce((v_participant ->> 'is_owner')::boolean, false),
      coalesce((v_participant ->> 'is_area_leader')::boolean, false)
    );
  end loop;

  return v_project_id;
end;
$$;

revoke all on function public.create_project(text, text, date, date, jsonb, jsonb) from public;
grant execute on function public.create_project(text, text, date, date, jsonb, jsonb)
  to anon, authenticated;
