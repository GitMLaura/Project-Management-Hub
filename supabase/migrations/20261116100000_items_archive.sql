-- Story H1.2.3: archive instead of delete (rule E4).
-- Demo: the database refuses ANY delete, so items are only archived and can be restored.
-- Archiving an item also archives everything below it; restoring brings back exactly
-- the items that were archived together with it (same archived_at).

alter table public.items add column archived_at timestamptz;

create index items_archived_idx on public.items (project_id) where archived_at is not null;

-- A new or restored item cannot live under an archived parent.
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
    if new.deadline > (select deadline from public.projects where id = new.project_id) then
      raise exception 'epic deadline is after the project deadline';
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
    if new.deadline > v_parent.deadline then
      raise exception 'deadline is after the parent deadline';
    end if;
    if new.archived_at is null and v_parent.archived_at is not null then
      raise exception 'parent item is archived';
    end if;
  end if;

  return new;
end;
$$;

-- Archives the item and every active item below it.
create or replace function public.archive_item(p_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  if not exists (select 1 from public.items where id = p_id and archived_at is null) then
    raise exception 'item not found or already archived';
  end if;

  with recursive tree as (
    select id from public.items where id = p_id
    union all
    select i.id from public.items i join tree t on i.parent_id = t.id
  )
  update public.items set archived_at = v_now
  where id in (select id from tree) and archived_at is null;
end;
$$;

-- Restores the item and the items that were archived together with it.
create or replace function public.restore_item(p_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_archived_at timestamptz;
  v_level uuid[];
begin
  select archived_at into v_archived_at from public.items where id = p_id;
  if v_archived_at is null then
    raise exception 'item not found or not archived';
  end if;

  -- First the item itself (fails if its parent is still archived).
  update public.items set archived_at = null where id = p_id;

  -- Then its children, one level at a time, so each level sees its restored parent.
  v_level := array[p_id];
  loop
    with restored as (
      update public.items set archived_at = null
      where parent_id = any (v_level) and archived_at = v_archived_at
      returning id
    )
    select coalesce(array_agg(id), '{}') into v_level from restored;
    exit when array_length(v_level, 1) is null;
  end loop;
end;
$$;

revoke all on function public.archive_item(uuid) from public;
revoke all on function public.restore_item(uuid) from public;
grant execute on function public.archive_item(uuid) to anon, authenticated;
grant execute on function public.restore_item(uuid) to anon, authenticated;
