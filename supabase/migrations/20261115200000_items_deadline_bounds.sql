-- Story H1.2.2 (rules E2 and E3), enforced in the database as well as in the interface:
-- a child deadline cannot be after its parent deadline, and an epic deadline cannot be
-- after the project deadline. Replaces the function from 20261115180000_items_scope_hierarchy.sql
-- (the trigger keeps pointing to it, so nothing else changes).

create or replace function public.check_item_integrity()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_parent public.items;
  v_area_project uuid;
  v_assignee_project uuid;
  v_project_deadline date;
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
    select deadline into v_project_deadline
      from public.projects where id = new.project_id;
    if new.deadline > v_project_deadline then
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
  end if;

  return new;
end;
$$;
