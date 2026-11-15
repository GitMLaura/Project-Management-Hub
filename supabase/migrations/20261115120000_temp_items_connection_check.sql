-- TEMPORARY: only validates the Supabase connection and RLS (story H0.2.2).
-- This minimal `items` table will be replaced by the real scope schema in E1.
-- Do not build features on top of it.

create table public.items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);

-- RLS on: with no policy, nobody could read or write anything.
alter table public.items enable row level security;

-- "Automatically expose new tables" is OFF in this project, so table access
-- must be granted explicitly. SELECT only: no write privilege for anon or
-- authenticated (RLS policies cannot add what GRANT does not allow).
grant select on table public.items to anon, authenticated;

-- One policy: anyone (including a visitor without login) may READ.
-- There is no insert/update/delete policy, so the database refuses all writes.
create policy "temp_items_read_all"
  on public.items
  for select
  to anon, authenticated
  using (true);

-- One fictional row so the connection check has something to read.
insert into public.items (title) values ('Linha de teste de conexao (temporaria)');
