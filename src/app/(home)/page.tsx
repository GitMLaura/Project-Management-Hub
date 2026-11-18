import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { FilterPill } from "@/components/filter-pill";
import { buttonVariants } from "@/components/ui/button";
import { getActiveProfile } from "@/lib/active-profile";
import { canCreateProject } from "@/lib/demo-profiles";
import { isLateTask, type HealthColor } from "@/lib/health";
import { buildHealthPanel } from "@/lib/health-panel";
import { filterHomeProjects, parseHealthFilter, projectsOfPerson } from "@/lib/home-filter";
import { buildHomeSnapshot, type ProjectStats } from "@/lib/home-snapshot";
import { buildItemTree } from "@/lib/item-tree";
import { calcProgress } from "@/lib/scope-view";
import { listItems } from "@/lib/supabase/items";
import { getProject, listProjects, type ProjectSummary } from "@/lib/supabase/projects";

type ProjectRowData = ProjectSummary & {
  health: HealthColor;
  stats: ProjectStats;
  percent: number;
  people: string[];
};

async function loadProjectRow(summary: ProjectSummary, today: string): Promise<ProjectRowData> {
  const [project, items] = await Promise.all([getProject(summary.id), listItems(summary.id)]);
  const tree = buildItemTree(items.filter((item) => !item.archivedAt));
  const panel = buildHealthPanel({
    projectName: summary.name,
    projectStart: summary.startDate,
    projectDeadline: summary.deadline,
    areas: (project?.areas ?? []).map((area) => ({ id: area.id, name: area.name })),
    tree,
    today,
  });
  const progress = tree.reduce(
    (sum, epic) => {
      const part = calcProgress(epic);
      return { done: sum.done + part.done, total: sum.total + part.total };
    },
    { done: 0, total: 0 },
  );
  const lateTasks = items.filter((item) => !item.archivedAt && isLateTask(item, today)).length;
  return {
    ...summary,
    health: panel.project.health.color,
    people: (project?.areas ?? []).flatMap((area) => area.participants.map((p) => p.name)),
    percent: progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100),
    stats: {
      health: panel.project.health.color,
      doneTasks: progress.done,
      totalTasks: progress.total,
      lateTasks,
    },
  };
}

const HEALTH_LABEL: Record<HealthColor, string> = { green: "No prazo", yellow: "Atenção", red: "Risco" };
const HEALTH_DOT: Record<HealthColor, string> = {
  green: "bg-green-600",
  yellow: "bg-yellow-500",
  red: "bg-red-600",
};
const HEALTH_ORDER: Record<HealthColor, number> = { red: 0, yellow: 1, green: 2 };

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SnapshotCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl bg-card p-6">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className={`font-heading text-5xl font-semibold tracking-tight ${tone ?? ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ProjectCard({ project }: { project: ProjectRowData }) {
  const pending = project.stats.totalTasks - project.stats.doneTasks;
  const shown = project.people.slice(0, 3);
  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex flex-col gap-5 rounded-3xl bg-card p-5 outline-none transition-colors hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
            aria-hidden="true"
          >
            {initials(project.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{project.name}</p>
            <p className="truncate text-sm text-muted-foreground">{project.objective}</p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-2 text-sm">
          <span aria-hidden="true" className={`size-2 rounded-full ${HEALTH_DOT[project.health]}`} />
          {HEALTH_LABEL[project.health]}
        </span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <dl className="flex gap-6 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">pendências</dt>
            <dd className="text-lg font-medium">{pending}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">entregue</dt>
            <dd className="text-lg font-medium">{project.percent}%</dd>
          </div>
        </dl>
        <ul className="flex -space-x-2" aria-label={`${project.people.length} pessoas no projeto`}>
          {shown.map((name) => (
            <li
              key={name}
              title={name}
              className="flex size-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium"
            >
              {initials(name)}
            </li>
          ))}
          {project.people.length > shown.length && (
            <li className="flex size-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs text-muted-foreground">
              +{project.people.length - shown.length}
            </li>
          )}
        </ul>
      </div>
    </Link>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home(props: PageProps<"/">) {
  const profile = await getActiveProfile();
  const params = await props.searchParams;
  const status = parseHealthFilter(first(params.status));
  const person = first(params.person);
  const query = first(params.q)?.trim() ?? "";
  const today = new Date().toISOString().slice(0, 10);

  let mine: ProjectRowData[] = [];
  let loadFailed = false;
  try {
    const projects = await listProjects();
    const rows = await Promise.all(projects.map((project) => loadProjectRow(project, today)));
    mine = projectsOfPerson(rows, profile.name);
  } catch {
    loadFailed = true;
  }
  const snapshot = buildHomeSnapshot(mine.map((row) => row.stats));
  const canCreate = canCreateProject(profile);
  const shown = filterHomeProjects(mine, { status, person, query }).sort(
    (a, b) => HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health],
  );
  const peopleOptions = [...new Set(mine.flatMap((row) => row.people))].sort();
  const filtered = Boolean(status || person || query);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 p-6 md:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold">Resumo</h1>
          <p className="text-muted-foreground">
            Os projetos de que você participa: quantos estão no prazo e onde há alerta.
          </p>
        </div>
        {canCreate && (
          <Link href="/projects/new" className={buttonVariants({ size: "lg" })}>
            <Plus aria-hidden="true" />
            Novo projeto
          </Link>
        )}
      </header>

      {loadFailed ? (
        <p role="alert" className="text-destructive">
          Não foi possível carregar os projetos. Recarregue a página para tentar de novo.
        </p>
      ) : mine.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-3xl bg-card p-6">
          <p className="font-medium">Você ainda não participa de nenhum projeto.</p>
          <p className="text-sm text-muted-foreground">
            {canCreate
              ? "Clique em “Novo projeto” para começar."
              : "Peça ao Dono do projeto para incluir você, ou troque de perfil pelo avatar no topo."}
          </p>
        </div>
      ) : (
        <>
          <section aria-label="Visão rápida" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SnapshotCard
              title="Projetos"
              value={String(snapshot.projects)}
              detail={`${snapshot.doneTasks} de ${snapshot.totalTasks} tarefas concluídas`}
              tone="text-primary"
            />
            <SnapshotCard
              title="No prazo"
              value={`${snapshot.projects === 0 ? 0 : Math.round((snapshot.healthy / snapshot.projects) * 100)}%`}
              detail={`${snapshot.healthy} de ${snapshot.projects}`}
            />
            <SnapshotCard
              title="Alerta amarelo"
              value={`${snapshot.projects === 0 ? 0 : Math.round((snapshot.yellow / snapshot.projects) * 100)}%`}
              detail={`${snapshot.yellow} de ${snapshot.projects}`}
            />
            <SnapshotCard
              title="Alerta vermelho"
              value={`${snapshot.projects === 0 ? 0 : Math.round((snapshot.red / snapshot.projects) * 100)}%`}
              detail={`${snapshot.red} de ${snapshot.projects}`}
            />
          </section>

          <section className="flex flex-col gap-4" aria-labelledby="projects-title">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="projects-title" className="text-xl font-semibold">
                  Projetos
                </h2>
                <p className="text-sm text-muted-foreground">
                  Filtre por status ou por quem está alocado. Quem pede mais atenção aparece primeiro.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Filtros">
                <Suspense fallback={<div className="h-11 w-64" aria-hidden="true" />}>
                  <FilterPill
                    param="status"
                    label="Status"
                    icon="status"
                    options={(["green", "yellow", "red"] as const).map((value) => ({
                      value,
                      label: HEALTH_LABEL[value],
                    }))}
                    current={status}
                  />
                  <FilterPill
                    param="person"
                    label="Pessoa"
                    icon="person"
                    options={peopleOptions.map((name) => ({ value: name, label: name }))}
                    current={person}
                  />
                </Suspense>
                <form action="/" className="flex h-11 items-center gap-2 rounded-full bg-card px-4">
                  <Search className="size-4 text-muted-foreground" aria-hidden="true" />
                  <input
                    type="search"
                    name="q"
                    defaultValue={query}
                    placeholder="Buscar projeto"
                    aria-label="Buscar projeto"
                    className="w-40 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  {status && <input type="hidden" name="status" value={status} />}
                  {person && <input type="hidden" name="person" value={person} />}
                </form>
                {filtered && (
                  <Link
                    href="/"
                    className="rounded-full px-3 py-2 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Limpar filtros
                  </Link>
                )}
              </div>
            </div>
            {shown.length === 0 ? (
              <p className="rounded-3xl bg-card p-6 text-sm text-muted-foreground">
                Nenhum projeto com esses filtros.
              </p>
            ) : (
              <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {shown.map((project) => (
                  <li key={project.id} className="contents">
                    <ProjectCard project={project} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
