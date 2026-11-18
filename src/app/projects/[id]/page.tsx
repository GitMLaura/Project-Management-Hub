import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { PageMessage } from "@/components/page-message";
import { PeriodFilter } from "@/components/period-filter";
import { StatusMetrics } from "@/components/status-hero";
import { AttentionList, StatusCard } from "@/components/status-cards";
import { buttonVariants } from "@/components/ui/button";
import { filterTasksByRange, parsePeriod, periodRange } from "@/lib/period";
import { buildItemTree } from "@/lib/item-tree";
import { buildStatusView } from "@/lib/status-view";
import { listItems } from "@/lib/supabase/items";
import { getProject } from "@/lib/supabase/projects";

export default async function ProjectStatusPage(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;
  const rawPeriod = (await props.searchParams).periodo;
  const period = parsePeriod(Array.isArray(rawPeriod) ? rawPeriod[0] : rawPeriod);

  let project;
  let items;
  try {
    project = await getProject(id);
    items = project ? await listItems(id) : [];
  } catch {
    return (
      <PageMessage
        title="Não foi possível carregar o projeto"
        text="Houve um problema ao falar com o banco de dados. Tente novamente em instantes."
        backHref="/"
        backLabel="Voltar para a página inicial"
      />
    );
  }
  if (!project) notFound();

  const today = new Date().toISOString().slice(0, 10);
  const tree = filterTasksByRange(
    buildItemTree(items.filter((item) => !item.archivedAt)),
    periodRange(period, today),
  );
  const areaNames = Object.fromEntries(project.areas.map((area) => [area.id, area.name]));
  const assigneeNames = Object.fromEntries(
    project.areas.flatMap((area) =>
      area.participants.map((participant) => [participant.id, participant.name]),
    ),
  );
  const view = buildStatusView({
    tree,
    areaIds: project.areas.map((area) => area.id),
    projectStart: project.startDate,
    projectDeadline: project.deadline,
    today,
  });
  const groups = tree.filter((node) => node.type === "group");
  const groupTitles = Object.fromEntries(groups.map((group) => [group.id, group.title]));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 p-6 md:p-10">
      <header className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold">
              {project.name} <span aria-hidden="true">🔥</span>
            </h1>
            <p className="text-muted-foreground">Acompanhe o progresso do seu projeto hoje</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PeriodFilter projectId={id} current={period} />
            <a
              href={`/projects/${id}/status/export?periodo=${period}`}
              className={buttonVariants({ size: "lg" })}
            >
              <Download aria-hidden="true" />
              Exportar
            </a>
          </div>
        </div>
        <StatusMetrics totals={view.totals} />
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-10">
          <section className="flex flex-1 flex-col gap-4" aria-labelledby="attention-title">
            <h2 id="attention-title" className="text-xl font-semibold">
              Precisa de atenção
            </h2>
            {view.attention.length === 0 ? (
              <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground">
                Nada atrasado ou bloqueado agora.
              </p>
            ) : (
              <AttentionList
                fill
                projectId={id}
                items={view.attention}
                areaNames={areaNames}
                assigneeNames={assigneeNames}
              />
            )}
          </section>
        </div>
        <div className="flex flex-col gap-10">
          {project.areas.length > 0 && (
            <section className="flex flex-col gap-4" aria-labelledby="areas-title">
              <h2 id="areas-title" className="text-xl font-semibold">
                Saúde por área
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {project.areas.map((area) => (
                  <StatusCard
                    key={area.id}
                    name={area.name}
                    counts={view.areaCounts[area.id]}
                    contextLabel="Atuando em"
                    contextValues={view.areaGroups[area.id].map((groupId) => groupTitles[groupId])}
                    contextTotal={groups.length}
                    contextAllLabel="Todos os grupos"
                  />
                ))}
              </div>
            </section>
          )}
        </div>

      </div>
    </main>
  );
}
