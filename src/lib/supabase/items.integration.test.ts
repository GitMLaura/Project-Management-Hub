import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

// Integration test against the real Supabase project (public anon key only).
// Skipped without the variables. It never leaves data behind: writes are expected to
// be refused, because nothing can be deleted afterwards.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const NOBODY = "00000000-0000-0000-0000-000000000000";

describe.skipIf(!url || !anonKey)("Supabase items schema", () => {
  const supabase = createClient(url!, anonKey!);

  it("reads the items table with the anon key", async () => {
    const { error } = await supabase.from("items").select("id, type, title").limit(1);
    expect(error).toBeNull();
  });

  it("refuses an item that points to a project, area and assignee that do not exist", async () => {
    const { error } = await supabase.from("items").insert({
      project_id: NOBODY,
      type: "epic",
      title: "Nao deve ser gravado",
      area_id: NOBODY,
      assignee_id: NOBODY,
      start_date: "2026-01-01",
      deadline: "2026-12-31",
    });
    expect(error).not.toBeNull();
  });

  it("refuses an invalid item type", async () => {
    const { error } = await supabase.from("items").insert({
      project_id: NOBODY,
      type: "bug",
      title: "Nao deve ser gravado",
      area_id: NOBODY,
      assignee_id: NOBODY,
      deadline: "2026-12-31",
    });
    expect(error).not.toBeNull();
  });

  it("refuses delete", async () => {
    const { error } = await supabase.from("items").delete().eq("id", NOBODY);
    expect(error).not.toBeNull();
  });
});
