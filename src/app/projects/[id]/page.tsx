import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { PageMessage } from "@/components/page-message";
import { StatusHero } from "@/components/status-hero";
import { AttentionList, StatusCard } from "@/components/status-cards";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getActiveProfile } from "@/lib/active-profile";
import { buildHealthPanel } from "@/lib/health-panel";
import { canManageScope } from "@/lib/item-rules";
import { buildItemTree } from "@/lib/item-tree";
import { buildStatusView } from "@/lib/status-view";
import { listItems } from "@/lib/supabase/items";
import { getProject } from "@/lib/supabase/projects";

export default async function ProjectStatusPage(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;
  const profile = await getActiveProfile();

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
  const tree = buildItemTree(items.filter((item) => !item.archivedAt));
  const areaNames = Object.fromEntries(project.areas.map((area) => [area.id, area.name]));
  const assigneeNames = Object.fromEntries(
    project.areas.flatMap((area) =>
      area.participants.map((participant) => [participant.id, participant.name]),
    ),
  );
  const panel = buildHealthPanel({
    projectName: project.name,
    projectStart: project.startDate,
    projectDeadline: project.deadline,
    areas: project.areas.map((area) => ({ id: area.id, name: area.name })),
    tree,
    today,
  });
  const view = buildStatusView({
    tree,
    areaIds: project.areas.map((area) => area.id),
    projectStart: project.startDate,
    projectDeadline: project.deadline,
    today,
  });
  const epicTitles = Object.fromEntries(tree.map((epic) => [epic.id, epic.title]));
  const activeEpics = tree.filter((epic) => epic.status !== "concluido");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 p-6 md:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="text-4xl font-semibold">{project.name}</h1>
          <p className="text-muted-foreground">{project.objective}</p>
        </div>
        {canManageScope(profile) && (
          <Link href={`/projects/${id}/items/new`} className={buttonVariants({ size: "lg" })}>
            <Plus aria-hidden="true" />
            Novo item
          </Link>
        )}
      </header>

      <StatusHero health={panel.project.health} view={view} deadline={project.deadline} />

      {project.areas.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="areas-title">
          <h2 id="areas-title" className="text-xl font-semibold">
            Saúde por área
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {project.areas.map((area) => (
              <StatusCard
                key={area.id}
                name={area.name}
                counts={view.areaCounts[area.id]}
                contextLabel="Atuando em"
                contextValues={view.areaEpics[area.id].map((epicId) => epicTitles[epicId])}
                contextTotal={tree.length}
                contextAllLabel="Todos os épicos"
              />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4" aria-labelledby="epics-title">
        <h2 id="epics-title" className="text-xl font-semibold">
          Épicos em andamento
        </h2>
        {activeEpics.length === 0 ? (
          <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
            Este projeto ainda não tem épicos.{" "}
            {canManageScope(profile)
              ? "Comece adicionando um item."
              : "O Dono ou um Líder de área pode adicionar o primeiro."}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeEpics.map((epic) => (
              <StatusCard
                key={epic.id}
                name={epic.title}
                counts={view.epicCounts[epic.id]}
                contextLabel="Áreas"
                contextValues={view.epicAreas[epic.id].map((areaId) => areaNames[areaId] ?? "Sem área")}
                contextTotal={project.areas.length}
                contextAllLabel="Todas"
              />
            ))}
          </div>
        )}
      </section>

      {view.attention.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="attention-title">
          <h2 id="attention-title" className="text-xl font-semibold">
            Precisa de atenção
          </h2>
          <AttentionList
            projectId={id}
            items={view.attention}
            areaNames={areaNames}
            assigneeNames={assigneeNames}
          />
        </section>
      )}

      <section className="flex flex-col gap-4" aria-labelledby="people-title">
        <h2 id="people-title" className="text-xl font-semibold">
          Áreas e participantes
        </h2>
        <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-4">
          {project.areas.map((area) => (
            <div key={area.id} className="flex flex-col gap-2 border-t pt-4">
              <dt className="font-heading font-semibold">{area.name}</dt>
              {area.participants.length === 0 ? (
                <dd className="text-sm text-muted-foreground">Nenhum participante nesta área.</dd>
              ) : (
                area.participants.map((participant) => (
                  <dd key={participant.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span>{participant.name}</span>
                    {participant.isOwner && <Badge>Dono do projeto</Badge>}
                    {participant.isAreaLeader && <Badge variant="secondary">Líder da área</Badge>}
                  </dd>
                ))
              )}
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
