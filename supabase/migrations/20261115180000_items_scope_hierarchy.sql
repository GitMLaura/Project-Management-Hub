-- Story H1.2.1: the real scope table (epic > feature > story > task).
-- Replaces the TEMPORARY items table from the two earlier temp_items migrations.
-- Demo policy (PRD decision 4): RLS ON, open read/insert/update, NO delete.
-- Roles are enforced only in the interface; data integrity is enforced here.

-- 1) Remove the temporary table (its policies and grants go with it).
drop table if exists public.items;

-- 2) Real table.
create table public.items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id),
  parent_id uuid references public.items (id),
  type text not null check (type in ('epic', 'feature', 'story', 'task')),
  title text not null check (length(trim(title)) > 0),
  description text,
  area_id uuid not null references public.areas (id),
  assignee_id uuid not null references public.participants (id),
  start_date date,
  deadline date not null,
  status text not null default 'a_fazer'
    check (status in ('a_fazer', 'em_andamento', 'bloqueado', 'concluido')),
  is_critical boolean not null default false,
  story_persona text,
  story_action text,
  story_benefit text,
  acceptance_criteria text[] not null default '{}',
  created_at timestamptz not null default now(),
  -- Start date is required, except for tasks (PRD section 3).
  constraint items_start_required check (type = 'task' or start_date is not null),
  constraint items_deadline_after_start check (start_date is null or deadline >= start_date),
  -- A story always follows "As [persona], I want [action] so that [benefit]".
  constraint items_story_fields check (
    type <> 'story' or (
      length(trim(coalesce(story_persona, ''))) > 0
      and length(trim(coalesce(story_action, ''))) > 0
      and length(trim(coalesce(story_benefit, ''))) > 0
    )
  )
);

create index items_project_idx on public.items (project_id);
create index items_parent_idx on public.items (parent_id);

-- 3) Integrity rules (PRD rule E1): every item has the right parent, area and assignee.
create or replace function public.check_item_integrity()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_parent public.items;
  v_area_project uuid;
  v_assignee_project uuid;
begin
  select project_id into v_area_project from public.areas where id = new.area_id;
  if v_area_project is distinct from new.project_id then
    raise exception 'area does not belong to the project';
  end if;

  select project_id into v_assignee_project
    from public.participants where id = new.assignee_id;
  if v_assignee_project is distinct from new.project_id then
    raise exception 'assignee is not a participant of the project';
  end if;

  if new.type = 'epic' then
    if new.parent_id is not null then
      raise exception 'an epic cannot have a parent item';
    end if;
  else
    if new.parent_id is null then
      raise exception 'every item except an epic needs a parent';
    end if;
    select * into v_parent from public.items where id = new.parent_id;
    if not found or v_parent.project_id <> new.project_id then
      raise exception 'parent item not found in this project';
    end if;
    if (new.type, v_parent.type) not in (
      ('feature', 'epic'), ('story', 'feature'), ('task', 'story')
    ) then
      raise exception 'invalid parent type: % under %', new.type, v_parent.type;
    end if;
  end if;

  return new;
end;
$$;

create trigger items_check_integrity
  before insert or update on public.items
  for each row execute function public.check_item_integrity();

-- 4) Open demo access. No delete, no truncate.
alter table public.items enable row level security;

grant select, insert, update on table public.items to anon, authenticated;
revoke delete, truncate on table public.items from anon, authenticated;

create policy "items_select_open" on public.items
  for select to anon, authenticated using (true);
create policy "items_insert_open" on public.items
  for insert to anon, authenticated with check (true);
create policy "items_update_open" on public.items
  for update to anon, authenticated using (true) with check (true);
