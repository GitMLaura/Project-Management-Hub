-- TEMPORARY (demo only). Companion of 20261115120000_temp_items_connection_check.sql.
-- Decision: portfolio prototype, no real users. Visitors may read, create and update.
-- Nobody may delete: there is no DELETE grant and no DELETE policy.
-- Remove together with the temporary items table when the real E1 schema arrives.

-- Table privileges (needed because "Automatically expose new tables" is OFF).
grant insert, update on table public.items to anon, authenticated;

-- Make sure delete stays impossible.
revoke delete, truncate on table public.items from anon, authenticated;

-- Open policies for the demo (roles are enforced only in the interface).
create policy "temp_items_insert_open"
  on public.items
  for insert
  to anon, authenticated
  with check (true);

create policy "temp_items_update_open"
  on public.items
  for update
  to anon, authenticated
  using (true)
  with check (true);
