import { markdownToPdf } from "@/lib/markdown-pdf";
import { buildRulesMarkdown, exportFileName, type ExportScope } from "@/lib/rules-export";
import { listItems } from "@/lib/supabase/items";
import { getProject } from "@/lib/supabase/projects";
import { listRules } from "@/lib/supabase/rules";

// GET /projects/[id]/rules/export?scope=project|group&item=<id>&format=md|pdf[&download=1]
export async function GET(request: Request, ctx: RouteContext<"/projects/[id]/rules/export">) {
  const { id } = await ctx.params;
  const params = new URL(request.url).searchParams;
  const scopeParam = params.get("scope") ?? "project";
  const itemId = params.get("item") ?? "";
  const format = params.get("format") === "pdf" ? "pdf" : "md";

  try {
    const project = await getProject(id);
    if (!project) return new Response("Projeto não encontrado.", { status: 404 });

    const groups = (await listItems(id))
      .filter((item) => item.type === "group" && !item.archivedAt)
      .map((group) => ({ id: group.id, title: group.title }));

    let scope: ExportScope = { kind: "project" };
    let label = project.name;
    if (scopeParam === "group") {
      const group = groups.find((candidate) => candidate.id === itemId);
      if (!group) return new Response("Grupo não encontrado.", { status: 404 });
      scope = { kind: "group", groupId: group.id };
      label = group.title;
    }

    const markdown = buildRulesMarkdown({
      projectName: project.name,
      groups,
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
