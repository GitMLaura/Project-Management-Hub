-- Stories H3.2.1 and H3.3.x: flows (Mermaid), screens (images) and the links between them.
-- Demo policy (PRD decision 4): RLS ON, open read/insert/update, NO delete.

-- 1) Flows: one Mermaid flowchart per record, belonging to a feature.
create table public.flows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id),
  feature_id uuid not null references public.items (id),
  title text not null check (length(trim(title)) > 0),
  source text not null check (length(trim(source)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index flows_project_idx on public.flows (project_id);
create index flows_feature_idx on public.flows (feature_id);

-- 2) Screens: image metadata. The file itself lives in Storage (bucket "screens").
create table public.screens (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id),
  feature_id uuid not null references public.items (id),
  name text not null check (length(trim(name)) > 0),
  storage_path text not null,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  phash text not null check (phash ~ '^[0-9a-f]{16}$'),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  size_bytes integer not null check (size_bytes > 0),
  is_reference boolean not null default false,
  created_at timestamptz not null default now()
);
create index screens_project_idx on public.screens (project_id);
create index screens_feature_idx on public.screens (feature_id);

-- 3) A flow step (a node id in the Mermaid text) can point to one screen.
create table public.flow_step_screens (
  id uuid primary key default gen_random_uuid(),
  flow_id uuid not null references public.flows (id),
  step_id text not null check (length(trim(step_id)) > 0),
  screen_id uuid references public.screens (id),
  constraint flow_step_screens_unique unique (flow_id, step_id)
);
create index flow_step_screens_screen_idx on public.flow_step_screens (screen_id);

-- Integrity: flows and screens belong to a feature of the same project.
create or replace function public.check_spec_feature()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_feature public.items;
begin
  if tg_op = 'UPDATE' then
    new.project_id := old.project_id;
    new.feature_id := old.feature_id;
    new.created_at := old.created_at;
  end if;
  select * into v_feature from public.items where id = new.feature_id;
  if not found or v_feature.type <> 'feature' or v_feature.project_id <> new.project_id then
    raise exception 'must belong to a feature of the same project';
  end if;
  if tg_op = 'UPDATE' and tg_table_name = 'flows' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger flows_check_feature
  before insert or update on public.flows
  for each row execute function public.check_spec_feature();
create trigger screens_check_feature
  before insert or update on public.screens
  for each row execute function public.check_spec_feature();

-- A step link only joins a flow and a screen of the same project.
create or replace function public.check_flow_step_screen()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_flow_project uuid;
  v_screen_project uuid;
begin
  select project_id into v_flow_project from public.flows where id = new.flow_id;
  if new.screen_id is not null then
    select project_id into v_screen_project from public.screens where id = new.screen_id;
    if v_screen_project is distinct from v_flow_project then
      raise exception 'screen and flow must be in the same project';
    end if;
  end if;
  if tg_op = 'UPDATE' then
    new.flow_id := old.flow_id;
    new.step_id := old.step_id;
  end if;
  return new;
end;
$$;

create trigger flow_step_screens_check
  before insert or update on public.flow_step_screens
  for each row execute function public.check_flow_step_screen();

-- Open demo access. No delete, no truncate.
alter table public.flows enable row level security;
alter table public.screens enable row level security;
alter table public.flow_step_screens enable row level security;

grant select, insert, update on table public.flows to anon, authenticated;
grant select, insert, update on table public.screens to anon, authenticated;
grant select, insert, update on table public.flow_step_screens to anon, authenticated;
revoke delete, truncate on table public.flows from anon, authenticated;
revoke delete, truncate on table public.screens from anon, authenticated;
revoke delete, truncate on table public.flow_step_screens from anon, authenticated;

create policy "flows_select_open" on public.flows for select to anon, authenticated using (true);
create policy "flows_insert_open" on public.flows for insert to anon, authenticated with check (true);
create policy "flows_update_open" on public.flows for update to anon, authenticated using (true) with check (true);

create policy "screens_select_open" on public.screens for select to anon, authenticated using (true);
create policy "screens_insert_open" on public.screens for insert to anon, authenticated with check (true);
create policy "screens_update_open" on public.screens for update to anon, authenticated using (true) with check (true);

create policy "flow_step_screens_select_open" on public.flow_step_screens for select to anon, authenticated using (true);
create policy "flow_step_screens_insert_open" on public.flow_step_screens for insert to anon, authenticated with check (true);
create policy "flow_step_screens_update_open" on public.flow_step_screens for update to anon, authenticated using (true) with check (true);
