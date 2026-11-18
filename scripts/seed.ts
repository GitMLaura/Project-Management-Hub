// Loads the fictional "Projeto Hits" into Supabase (story H5.1.1).
// Run: npm run seed          (writes to the database in .env.local)
//      npm run seed -- --dry-run   (checks everything, writes nothing)
// Uses only the PUBLIC anon key, like the Hub itself. There is no service_role here.
// Dates are relative to the day it runs, so health colors change as time passes.
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AREAS, EPICS, FLOWS, PEOPLE, PROJECT, SCREENS } from "../seed/aurora";
import { RITUALS } from "../seed/rituals";
import { renderScreen } from "../seed/screens";
import { countSeed, validateSeed } from "../seed/validate";
import { parseFlowchart } from "../src/lib/flows";
import { analyzeImage } from "../src/lib/image-analysis";
import { parseTranscript } from "../src/lib/transcripts";

const dryRun = process.argv.includes("--dry-run");

function day(offset: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function must<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error || result.data === null) {
    throw new Error(`${what}: ${result.error?.message ?? "no data"}`);
  }
  return result.data;
}

function checkBeforeWriting() {
  const problems = validateSeed();
  for (const flow of FLOWS) {
    const parsed = parseFlowchart(flow.source);
    if (parsed.errors.length > 0) problems.push(`Flow ${flow.title}: ${parsed.errors.join(" ")}`);
  }
  for (const ritual of RITUALS) {
    parseTranscript(ritual.file, readFileSync(path.join(__dirname, "../seed/transcripts", ritual.file), "utf8"));
  }
  if (problems.length > 0) {
    console.error("Seed data has problems:\n- " + problems.join("\n- "));
    process.exit(1);
  }
}

async function main() {
  checkBeforeWriting();
  console.log("Seed data is consistent:", JSON.stringify(countSeed()));
  if (dryRun) {
    console.log("Dry run: nothing was written.");
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local.");
  const db: SupabaseClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // There is no delete in the demo, so never insert twice.
  const existing = must(await db.from("projects").select("id").eq("name", PROJECT.name), "check existing");
  if (existing.length > 0) {
    console.log(`"${PROJECT.name}" já existe (id ${existing[0].id}). Nada foi feito.`);
    return;
  }

  const projectId = must(
    await db.rpc("create_project", {
      p_name: PROJECT.name,
      p_objective: PROJECT.objective,
      p_start_date: day(PROJECT.start),
      p_deadline: day(PROJECT.due),
      p_areas: [...AREAS],
      p_participants: PEOPLE.map((person) => ({
        name: person.name,
        area: person.area,
        is_owner: Boolean(person.isOwner),
        is_area_leader: Boolean(person.isLeader),
      })),
    }),
    "create project",
  ) as string;
  console.log("Projeto criado:", projectId);

  try {
    const areaId = new Map(
      must(await db.from("areas").select("id, name").eq("project_id", projectId), "areas").map((row) => [row.name as string, row.id as string]),
    );
    const personId = new Map(
      must(await db.from("participants").select("id, name").eq("project_id", projectId), "participants").map((row) => [
        row.name as string,
        row.id as string,
      ]),
    );
    const area = (name: string) => areaId.get(name) as string;
    const person = (name: string) => personId.get(name) as string;

    // ---- Scope: groups (the seed's features) and their tasks. Epics and stories of the
    // seed data are not stored: the Hub has only tasks, gathered in groups. ----
    const featureId = new Map<string, string>();
    const insertItem = async (row: Record<string, unknown>, what: string) =>
      (must(await db.from("items").insert({ project_id: projectId, ...row }).select("id").single(), what) as { id: string }).id;

    let taskCount = 0;
    for (const epic of EPICS) {
      for (const feature of epic.features) {
        const id = await insertItem(
          {
            type: "group",
            group_label: "feature",
            parent_id: null,
            title: feature.title,
            description: feature.description,
          },
          `group ${feature.title}`,
        );
        featureId.set(feature.key, id);
        for (const story of feature.stories) {
          for (const t of story.tasks) {
            await insertItem(
              {
                type: "task",
                parent_id: id,
                title: t.title,
                area_id: area(t.area),
                assignee_id: person(t.assignee),
                start_date: null,
                deadline: day(t.due),
                status: t.status,
                is_critical: Boolean(t.critical),
              },
              `task ${t.title}`,
            );
            taskCount += 1;
          }
        }
      }
    }
    console.log(`Escopo criado: ${taskCount} tarefas.`);

    // ---- Business rules (codes RN-### come from the database, in this order) ----
    let ruleCount = 0;
    for (const epic of EPICS) {
      for (const feature of epic.features) {
        for (const rule of feature.rules) {
          must(
            await db
              .from("business_rules")
              .insert({ project_id: projectId, feature_id: featureId.get(feature.key), code: 0, title: rule.title, body: rule.body })
              .select("id")
              .single(),
            `rule ${rule.title}`,
          );
          ruleCount += 1;
        }
      }
    }
    console.log(`Regras de negócio: ${ruleCount}.`);

    // ---- Screens: drawn by code, uploaded to Storage ----
    const screenId = new Map<string, string>();
    for (const spec of SCREENS) {
      const bytes = renderScreen(spec);
      const analysis = analyzeImage(bytes);
      const storagePath = `${projectId}/seed-${spec.key}.png`;
      const uploaded = await db.storage.from("screens").upload(storagePath, bytes, { contentType: "image/png", upsert: false });
      if (uploaded.error) throw new Error(`upload ${spec.key}: ${uploaded.error.message}`);
      const row = must(
        await db
          .from("screens")
          .insert({
            project_id: projectId,
            feature_id: featureId.get(spec.featureKey),
            name: spec.name,
            storage_path: storagePath,
            sha256: analysis.sha256,
            phash: analysis.phash,
            width: analysis.width,
            height: analysis.height,
            size_bytes: bytes.length,
          })
          .select("id")
          .single(),
        `screen ${spec.key}`,
      ) as { id: string };
      screenId.set(spec.key, row.id);
    }
    console.log(`Telas: ${SCREENS.length}.`);

    // ---- Flows and step-to-screen links ----
    for (const flow of FLOWS) {
      const created = must(
        await db
          .from("flows")
          .insert({ project_id: projectId, feature_id: featureId.get(flow.featureKey), title: flow.title, source: flow.source })
          .select("id")
          .single(),
        `flow ${flow.title}`,
      ) as { id: string };
      for (const [stepId, screenKey] of Object.entries(flow.links)) {
        must(
          await db.from("flow_step_screens").insert({ flow_id: created.id, step_id: stepId, screen_id: screenId.get(screenKey) }).select("id").single(),
          `link ${flow.title} ${stepId}`,
        );
      }
    }
    console.log(`Fluxos: ${FLOWS.length}.`);

    // ---- Rituals, pre-generated summaries and pendings ----
    for (const ritual of RITUALS) {
      const transcript = parseTranscript(ritual.file, readFileSync(path.join(__dirname, "../seed/transcripts", ritual.file), "utf8"));
      const created = must(
        await db
          .from("rituals")
          .insert({ project_id: projectId, kind: ritual.kind, title: ritual.title, held_on: day(ritual.heldOn), transcript })
          .select("id")
          .single(),
        `ritual ${ritual.title}`,
      ) as { id: string };
      must(
        await db
          .from("ritual_participants")
          .insert(ritual.participants.map((name) => ({ ritual_id: created.id, participant_id: person(name) })))
          .select("id"),
        `participants of ${ritual.title}`,
      );
      for (const summary of ritual.summaries) {
        const approver = PEOPLE.find((p) => p.area === summary.area && p.isLeader)?.name ?? null;
        const row = must(
          await db
            .from("ritual_summaries")
            .insert({
              ritual_id: created.id,
              area_id: area(summary.area),
              key_points: summary.keyPoints,
              decisions: summary.decisions,
              risks: summary.risks,
              status: summary.status,
              is_pregenerated: true,
              approved_by: summary.status === "approved" ? approver : null,
              approved_at: summary.status === "approved" ? new Date().toISOString() : null,
            })
            .select("id")
            .single(),
          `summary ${ritual.title} / ${summary.area}`,
        ) as { id: string };
        if (summary.pendings.length > 0) {
          must(
            await db
              .from("ritual_pendings")
              .insert(summary.pendings.map((p) => ({ summary_id: row.id, description: p.description, suggested_assignee: p.assignee })))
              .select("id"),
            `pendings ${ritual.title} / ${summary.area}`,
          );
        }
      }
    }
    console.log(`Ritos: ${RITUALS.length}.`);
    console.log("Pronto. Abra o Hub e confira o Projeto Hits.");
  } catch (caught) {
    console.error(
      `\nErro no meio do seed. O projeto ${projectId} ficou criado pela metade (a demo não permite excluir).`,
      "Peça ajuda para limpar pelo painel do Supabase antes de rodar de novo.",
    );
    throw caught;
  }
}

main().catch((caught) => {
  console.error(caught instanceof Error ? caught.message : caught);
  process.exit(1);
});
