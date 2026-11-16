-- Story H3.1.1: business rules in Markdown, one per record, with a stable RN-### code.
-- Demo policy (PRD decision 4): RLS ON, open read/insert/update, NO delete.

create table public.business_rules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id),
  feature_id uuid not null references public.items (id),
  code integer not null,
  title text not null check (length(trim(title)) > 0),
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_rules_code_unique unique (project_id, code)
);

create index business_rules_feature_idx on public.business_rules (feature_id);

-- The code is assigned here (next number in the project) and can never change.
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
    if not found or v_feature.type <> 'feature' or v_feature.project_id <> new.project_id then
      raise exception 'a rule belongs to a feature of the same project';
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

create trigger business_rules_prepare
  before insert or update on public.business_rules
  for each row execute function public.prepare_business_rule();

alter table public.business_rules enable row level security;

grant select, insert, update on table public.business_rules to anon, authenticated;
revoke delete, truncate on table public.business_rules from anon, authenticated;

create policy "business_rules_select_open" on public.business_rules
  for select to anon, authenticated using (true);
create policy "business_rules_insert_open" on public.business_rules
  for insert to anon, authenticated with check (true);
create policy "business_rules_update_open" on public.business_rules
  for update to anon, authenticated using (true) with check (true);
