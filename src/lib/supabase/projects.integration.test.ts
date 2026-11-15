import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

// Integration test against the real Supabase project (public anon key only).
// Skipped without the variables. It never leaves data behind: the only write it
// attempts is expected to fail and roll back, because nothing can be deleted afterwards.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ROLLBACK_NAME = "Teste de rollback (nao deve existir)";

describe.skipIf(!url || !anonKey)("Supabase projects schema", () => {
  const supabase = createClient(url!, anonKey!);

  it("reads the three tables with the anon key", async () => {
    for (const table of ["projects", "areas", "participants"] as const) {
      const { error } = await supabase.from(table).select("id").limit(1);
      expect(error, table).toBeNull();
    }
  });

  it("create_project fails on an unknown area and saves nothing", async () => {
    const { error } = await supabase.rpc("create_project", {
      p_name: ROLLBACK_NAME,
      p_objective: "x",
      p_start_date: "2026-01-01",
      p_deadline: "2026-12-31",
      p_areas: ["Design"],
      p_participants: [
        { name: "Ana", area: "Inexistente", is_owner: true, is_area_leader: false },
      ],
    });
    expect(error?.message).toContain("unknown area");

    const { data } = await supabase.from("projects").select("id").eq("name", ROLLBACK_NAME);
    expect(data).toEqual([]);
  });

  it("refuses delete on every project table", async () => {
    const nobody = "00000000-0000-0000-0000-000000000000";
    for (const table of ["projects", "areas", "participants"] as const) {
      const { error } = await supabase.from(table).delete().eq("id", nobody);
      expect(error, table).not.toBeNull();
    }
  });
});
