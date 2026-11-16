import { markdownToPdf } from "@/lib/markdown-pdf";
import { buildItemTree } from "@/lib/item-tree";
import { buildRulesMarkdown, exportFileName, type ExportScope } from "@/lib/rules-export";
import { listItems } from "@/lib/supabase/items";
import { getProject } from "@/lib/supabase/projects";
import { listRules } from "@/lib/supabase/rules";

// GET /projects/[id]/rules/export?scope=project|epic|feature&item=<id>&format=md|pdf[&download=1]
export async function GET(request: Request, ctx: RouteContext<"/projects/[id]/rules/export">) {
  const { id } = await ctx.params;
  const params = new URL(request.url).searchParams;
  const scopeParam = params.get("scope") ?? "project";
  const itemId = params.get("item") ?? "";
  const format = params.get("format") === "pdf" ? "pdf" : "md";

  try {
    const project = await getProject(id);
    if (!project) return new Response("Projeto não encontrado.", { status: 404 });

    const tree = buildItemTree((await listItems(id)).filter((item) => !item.archivedAt));
    const epics = tree.map((epic) => ({
      id: epic.id,
      title: epic.title,
      features: epic.children.map((feature) => ({ id: feature.id, title: feature.title })),
    }));

    let scope: ExportScope = { kind: "project" };
    let label = project.name;
    if (scopeParam === "epic") {
      const epic = epics.find((candidate) => candidate.id === itemId);
      if (!epic) return new Response("Épico não encontrado.", { status: 404 });
      scope = { kind: "epic", epicId: epic.id };
      label = epic.title;
    } else if (scopeParam === "feature") {
      const feature = epics.flatMap((epic) => epic.features).find((candidate) => candidate.id === itemId);
      if (!feature) return new Response("Funcionalidade não encontrada.", { status: 404 });
      scope = { kind: "feature", featureId: feature.id };
      label = feature.title;
    }

    const markdown = buildRulesMarkdown({
      projectName: project.name,
      epics,
      rules: await listRules(id),
      scope,
    });

    if (format === "pdf") {
      // Same Markdown as the screen and the .md file. "download=1" saves; otherwise it opens in the browser.
      const disposition = params.get("download") === "1" ? "attachment" : "inline";
      return new Response(Buffer.from(markdownToPdf(markdown)), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${disposition}; filename="${exportFileName(label, "pdf")}"`,
        },
      });
    }
    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFileName(label, "md")}"`,
      },
    });
  } catch {
    return new Response("Não foi possível gerar o arquivo agora.", { status: 500 });
  }
}
