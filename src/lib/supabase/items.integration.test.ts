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
      type: "task",
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

  it("refuses a task whose deadline is after the project deadline", async () => {
    const { data: project } = await supabase
      .from("projects")
      .select("id, start_date, deadline")
      .limit(1)
      .maybeSingle();
    if (!project) return; // no project in the database yet: nothing to check against

    const { data: area } = await supabase
      .from("areas")
      .select("id")
      .eq("project_id", project.id)
      .limit(1)
      .maybeSingle();
    const { data: person } = await supabase
      .from("participants")
      .select("id")
      .eq("project_id", project.id)
      .limit(1)
      .maybeSingle();
    if (!area || !person) return;

    const { error } = await supabase.from("items").insert({
      project_id: project.id,
      type: "task",
      title: "Nao deve ser gravado",
      area_id: area.id,
      assignee_id: person.id,
      start_date: project.start_date,
      deadline: "2999-12-31",
    });
    expect(error?.message).toContain("after the project deadline");
  });

  it("refuses to archive or restore an item that does not exist", async () => {
    const archive = await supabase.rpc("archive_item", { p_id: NOBODY });
    expect(archive.error).not.toBeNull();
    const restore = await supabase.rpc("restore_item", { p_id: NOBODY });
    expect(restore.error).not.toBeNull();
  });

  it("refuses delete", async () => {
    const { error } = await supabase.from("items").delete().eq("id", NOBODY);
    expect(error).not.toBeNull();
  });
});
