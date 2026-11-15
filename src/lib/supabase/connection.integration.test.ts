import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

// Integration test: talks to the real Supabase project with the public anon key.
// Skipped when the variables are missing, so `npm test` stays green without a database.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe.skipIf(!url || !anonKey)("Supabase connection (temporary items table)", () => {
  const supabase = createClient(url!, anonKey!);

  it("reads the seeded row with the anon key", async () => {
    const { data, error } = await supabase.from("items").select("id, title");
    expect(error).toBeNull();
    expect(data?.length).toBeGreaterThanOrEqual(1);
    expect(data?.some((row) => row.title.includes("teste de conexao"))).toBe(true);
  });

  it("refuses writes from the anon key", async () => {
    const { error } = await supabase
      .from("items")
      .insert({ title: "Não deve ser gravado" });
    expect(error).not.toBeNull();
  });
});
