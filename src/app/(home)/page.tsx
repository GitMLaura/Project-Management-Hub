import Link from "next/link";
import { HealthBadge } from "@/components/health-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveProfile } from "@/lib/active-profile";
import { canCreateProject } from "@/lib/demo-profiles";
import { formatDate } from "@/lib/format";
import { isLateTask, type HealthColor } from "@/lib/health";
import { buildHealthPanel } from "@/lib/health-panel";
import { buildHomeSnapshot, type ProjectStats } from "@/lib/home-snapshot";
import { buildItemTree } from "@/lib/item-tree";
import { calcProgress } from "@/lib/scope-view";
import { listItems } from "@/lib/supabase/items";
import { getProject, listProjects, type ProjectSummary } from "@/lib/supabase/projects";

type ProjectRowData = ProjectSummary & {
  stats: ProjectStats;
  healthLabel: "Verde" | "Amarelo" | "Vermelho";
  percent: number;
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
    healthLabel: panel.project.health.label,
    percent: progress.total === 0 ? 0 : Math.round((progress.done / progress.total) * 100),
    stats: {
      health: panel.project.health.color,
      doneTasks: progress.done,
      totalTasks: progress.total,
      lateTasks,
    },
  };
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sparkle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#c9c3d6" />
          <stop offset="1" stopColor="#8f86a8" />
        </linearGradient>
      </defs>
      <path
        d="M50 2 C54 34 66 46 98 50 C66 54 54 66 50 98 C46 66 34 54 2 50 C34 46 46 34 50 2 Z"
        fill="url(#sparkle)"
      />
    </svg>
  );
}

function SnapshotCard({
  title,
  hint,
  value,
  detail,
  accent,
}: {
  title: string;
  hint: string;
  value: string;
  detail: string;
  accent?: string;
}) {
  return (
    <Card size="sm" className="gap-2">
      <CardContent className="flex flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        <p className={`text-xs ${accent ?? "text-muted-foreground"}`}>{detail}</p>
      </CardContent>
    </Card>
  );
}

const HEALTH_ORDER: Record<HealthColor, number> = { red: 0, yellow: 1, green: 2 };

export default async function Home() {
  const profile = await getActiveProfile();
  const today = new Date().toISOString().slice(0, 10);

  let rows: ProjectRowData[] = [];
  let loadFailed = false;
  try {
    const projects = await listProjects();
    rows = await Promise.all(projects.map((project) => loadProjectRow(project, today)));
  } catch {
    loadFailed = true;
  }
  const snapshot = buildHomeSnapshot(rows.map((row) => row.stats));
  const canCreate = canCreateProject(profile);
  const sorted = [...rows].sort(
    (a, b) => HEALTH_ORDER[a.stats.health] - HEALTH_ORDER[b.stats.health],
  );

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-violet-100 via-fuchsia-50 to-white p-8 dark:from-violet-950 dark:via-fuchsia-950 dark:to-background">
        <Sparkle className="absolute -right-4 -top-2 size-40 opacity-90 sm:right-8 sm:size-52" />
        <div className="relative flex max-w-xl flex-col gap-4">
          <p className="text-sm text-muted-foreground">Bem-vinda de volta, {profile.name}</p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Acompanhe o que importa em <span className="text-primary">cada projeto</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Você está vendo o Hub como <strong>{profile.roleLabel}</strong> (área {profile.area}).
            Troque de perfil pela foto no canto superior direito. Dados 100% fictícios.
          </p>
          {canCreate && (
            <div>
              <Link href="/projects/new" className={buttonVariants({ size: "lg" })}>
                Novo projeto
              </Link>
            </div>
          )}
        </div>
      </section>

      {loadFailed ? (
        <p role="alert" className="text-destructive">
          Não foi possível carregar os projetos. Recarregue a página para tentar de novo.
        </p>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-4">
            <p className="font-medium">Nenhum projeto ainda.</p>
            <p className="text-sm text-muted-foreground">
              {canCreate
                ? "Clique em “Novo projeto” para começar."
                : "Peça ao Dono do projeto para criar um. Você pode trocar de perfil pelo avatar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="flex flex-col gap-3" aria-labelledby="snapshot-title">
            <h2 id="snapshot-title" className="font-semibold">
              Visão rápida
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SnapshotCard
                title="Projetos"
                hint="ativos no Hub"
                value={String(snapshot.projects)}
                detail={`${snapshot.healthy} em dia, ${snapshot.attention} pedindo atenção`}
              />
              <SnapshotCard
                title="Progresso"
                hint="tarefas concluídas"
                value={`${snapshot.progressPercent}%`}
                detail={`${snapshot.doneTasks} de ${snapshot.totalTasks} tarefas`}
              />
              <SnapshotCard
                title="Tarefas atrasadas"
                hint="em todos os projetos"
                value={String(snapshot.lateTasks)}
                detail={snapshot.lateTasks === 0 ? "Nenhum atraso" : "Veja os motivos na saúde"}
                accent={snapshot.lateTasks === 0 ? "text-green-700" : "text-red-700"}
              />
              <SnapshotCard
                title="Saúde"
                hint="projetos em atenção"
                value={String(snapshot.attention)}
                detail={snapshot.attention === 0 ? "Tudo verde" : "Amarelo ou vermelho"}
                accent={snapshot.attention === 0 ? "text-green-700" : "text-yellow-700"}
              />
            </div>
          </section>

          <section className="flex flex-col gap-3" aria-labelledby="projects-title">
            <div>
              <h2 id="projects-title" className="font-semibold">
                Projetos
              </h2>
              <p className="text-sm text-muted-foreground">
                Os que mais precisam de atenção aparecem primeiro.
              </p>
            </div>
            <Card className="gap-0 py-0">
              <ul className="divide-y">
                {sorted.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.id}`}
                      className="grid gap-3 p-4 transition-colors hover:bg-muted/50 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{project.name}</p>
                        <p className="truncate text-sm text-muted-foreground">{project.objective}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div
                          className="h-2 w-24 overflow-hidden rounded-full bg-muted"
                          role="img"
                          aria-label={`Progresso: ${project.percent}%`}
                        >
                          <div className="h-full bg-primary" style={{ width: `${project.percent}%` }} />
                        </div>
                        <span className="w-10 text-muted-foreground">{project.percent}%</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <HealthBadge color={project.stats.health} label={project.healthLabel} />
                        <span className="text-xs text-muted-foreground">
                          Prazo {formatDate(project.deadline)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        </>
      )}
    </main>
  );
}
