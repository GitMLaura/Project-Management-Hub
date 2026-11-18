-- Logic change: the scope is now only TASKS, optionally gathered in GROUPS.
-- A group is a named set of tasks, labelled "Funcionalidade" or "Épico" by whoever creates it.
-- Replaces the old hierarchy epic > feature > story > task.
--
-- What happens to the data already in the table:
--   * features become groups (label "Funcionalidade", no parent);
--   * tasks that were under a story move up to the story's feature (now a group);
--   * epics and stories are removed (nothing else points to them);
--   * the story columns are dropped.
-- Flows, rules and screens keep pointing at the same rows (they pointed at features).

alter table public.items disable trigger user;

-- 1) Move tasks from their story to the story's feature.
update public.items task
   set parent_id = story.parent_id
  from public.items story
 where task.type = 'task' and task.parent_id = story.id and story.type = 'story';

-- 2) Features lose their epic; epics and stories go away.
update public.items set parent_id = null where type = 'feature';
delete from public.items where type in ('epic', 'story');

-- 3) New shape of the table.
alter table public.items drop constraint if exists items_story_fields;
alter table public.items drop constraint if exists items_type_check;
alter table public.items drop constraint if exists items_start_required;

alter table public.items add column group_label text;
update public.items set type = 'group', group_label = 'feature' where type = 'feature';

alter table public.items drop column story_persona;
alter table public.items drop column story_action;
alter table public.items drop column story_benefit;
alter table public.items drop column acceptance_criteria;

-- A group has no area, owner or deadline of its own: only its tasks do.
alter table public.items alter column area_id drop not null;
alter table public.items alter column assignee_id drop not null;
alter table public.items alter column deadline drop not null;

alter table public.items add constraint items_type_check check (type in ('group', 'task'));
alter table public.items add constraint items_group_label_check check (
  (type = 'group' and group_label in ('epic', 'feature'))
  or (type = 'task' and group_label is null)
);
alter table public.items add constraint items_task_fields check (
  type = 'group' or (area_id is not null and assignee_id is not null and deadline is not null)
);

alter table public.items enable trigger user;

-- 4) Integrity: a group has no parent; a task is loose or inside a group of the same project,
--    its area and owner belong to the project, and it ends by the project deadline.
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
  if new.type = 'group' then
    if new.parent_id is not null then
      raise exception 'a group cannot have a parent item';
    end if;
    return new;
  end if;

  select project_id into v_area_project from public.areas where id = new.area_id;
  if v_area_project is distinct from new.project_id then
    raise exception 'area does not belong to the project';
  end if;

  select project_id into v_assignee_project
    from public.participants where id = new.assignee_id;
  if v_assignee_project is distinct from new.project_id then
    raise exception 'assignee is not a participant of the project';
  end if;

  if new.deadline > (select deadline from public.projects where id = new.project_id) then
    raise exception 'task deadline is after the project deadline';
  end if;

  if new.parent_id is not null then
    select * into v_parent from public.items where id = new.parent_id;
    if not found or v_parent.project_id <> new.project_id then
      raise exception 'parent item not found in this project';
    end if;
    if v_parent.type <> 'group' then
      raise exception 'a task can only be inside a group';
    end if;
    if new.archived_at is null and v_parent.archived_at is not null then
      raise exception 'parent item is archived';
    end if;
  end if;

  return new;
end;
$$;

-- 5) Flows, rules and screens belong to a group (before: to a feature).
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
  if not found or v_feature.type <> 'group' or v_feature.project_id <> new.project_id then
    raise exception 'must belong to a group of the same project';
  end if;
  if tg_op = 'UPDATE' and tg_table_name = 'flows' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.prepare_business_rule()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_feature public.items;
begin
  if tg_op = 'INSERT' then
    select * into v_feature from public.items where id = new.feature_id;
    if not found or v_feature.type <> 'group' or v_feature.project_id <> new.project_id then
      raise exception 'a rule belongs to a group of the same project';
    end if;
    -- One writer at a time per project, so two rules never get the same code.
    perform pg_advisory_xact_lock(hashtext(new.project_id::text));
    select coalesce(max(code), 0) + 1 into new.code
      from public.business_rules where project_id = new.project_id;
  else
    new.code := old.code;
    new.project_id := old.project_id;
    new.feature_id := old.feature_id;
    new.created_at := old.created_at;
    new.updated_at := now();
  end if;
  return new;
end;
$$;
