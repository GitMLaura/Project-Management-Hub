import { buildItemTree } from "@/lib/item-tree";
import { filterTasksByRange, parsePeriod, periodRange } from "@/lib/period";
import { buildStatusCsv } from "@/lib/status-export";
import { listItems } from "@/lib/supabase/items";
import { getProject } from "@/lib/supabase/projects";

// GET /projects/[id]/status/export?periodo=day|week|month  ->  CSV of the Status page
export async function GET(request: Request, ctx: RouteContext<"/projects/[id]/status/export">) {
  const { id } = await ctx.params;
  const period = parsePeriod(new URL(request.url).searchParams.get("periodo") ?? undefined);
  const today = new Date().toISOString().slice(0, 10);

  try {
    const project = await getProject(id);
    if (!project) return new Response("Projeto não encontrado.", { status: 404 });

    const items = (await listItems(id)).filter((item) => !item.archivedAt);
    const tree = filterTasksByRange(buildItemTree(items), periodRange(period, today));
    const csv = buildStatusCsv({
      tree,
      areaNames: Object.fromEntries(project.areas.map((area) => [area.id, area.name])),
      assigneeNames: Object.fromEntries(
        project.areas.flatMap((area) =>
          area.participants.map((participant) => [participant.id, participant.name]),
        ),
      ),
      today,
    });
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="status-${today}.csv"`,
      },
    });
  } catch {
    return new Response("Não foi possível gerar o arquivo agora. Tente novamente.", { status: 500 });
  }
}
