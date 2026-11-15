import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

// Integration test: talks to the real Supabase project with the public anon key.
// Skipped when the variables are missing, so `npm test` stays green without a database.
// Demo policies are open (read, insert, update) and nobody can delete.
// These tests never create rows: without delete they could not clean up after themselves.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe.skipIf(!url || !anonKey)("Supabase demo policies (temporary items table)", () => {
  const supabase = createClient(url!, anonKey!);

  it("reads the seeded row with the anon key", async () => {
    const { data, error } = await supabase.from("items").select("id, title");
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThanOrEqual(1);
    expect(data?.some((row) => row.title.includes("teste de conexao"))).toBe(true);
  });

  it("persists an update and then restores the original value", async () => {
    const { data: rows } = await supabase
      .from("items")
      .select("id, title")
      .ilike("title", "%teste de conexao%")
      .limit(1);
    const row = rows?.[0];
    expect(row).toBeDefined();
    const changedTitle = `${row!.title} [alterado]`;

    try {
      const { data, error } = await supabase
        .from("items")
        .update({ title: changedTitle })
        .eq("id", row!.id)
        .select("title");
      expect(error).toBeNull();
      expect(data?.[0]?.title).toBe(changedTitle);

      const reread = await supabase
        .from("items")
        .select("title")
        .eq("id", row!.id)
        .single();
      expect(reread.data?.title).toBe(changedTitle);
    } finally {
      await supabase.from("items").update({ title: row!.title }).eq("id", row!.id);
    }
  });

  it("refuses delete (no DELETE privilege)", async () => {
    // Nonexistent id on purpose: even if delete were allowed, no real row is touched.
    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", "00000000-0000-0000-0000-000000000000");
    expect(error).not.toBeNull();
  });
});
