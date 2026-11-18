import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { PageMessage } from "@/components/page-message";
import { Button, buttonVariants } from "@/components/ui/button";
import { getActiveProfile } from "@/lib/active-profile";
import { formatDate } from "@/lib/format";
import { canManageScope } from "@/lib/item-rules";
import { menuKinds, pickMeetings } from "@/lib/ritual-menu";
import { getProject } from "@/lib/supabase/projects";
import {
  getRitual,
  listRitualSummaries,
  listRituals,
  type RitualAreaSummary,
  type RitualDetail,
  type RitualSummaryRow,
} from "@/lib/supabase/rituals";
import { ritualKindLabel } from "@/lib/transcripts";
import { cn } from "@/lib/utils";

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RitualsPage(props: PageProps<"/projects/[id]/rituals">) {
  const { id } = await props.params;
  const params = await props.searchParams;
  const profile = await getActiveProfile();

  let project;
  let rituals: RitualSummaryRow[] = [];
  let current: RitualDetail | null = null;
  let summaries: RitualAreaSummary[] = [];
  let picked: ReturnType<typeof pickMeetings<RitualSummaryRow>> | null = null;
  try {
    project = await getProject(id);
    if (project) {
      rituals = await listRituals(id);
      picked = pickMeetings(rituals, first(params.tipo), first(params.encontro));
      if (picked.current) {
        current = await getRitual(id, picked.current.id);
        summaries = await listRitualSummaries(picked.current.id);
      }
    }
  } catch {
    return (
      <PageMessage
        title="Não foi possível carregar"
        text="Houve um problema ao falar com o banco de dados. Tente novamente em instantes."
        backHref={`/projects/${id}`}
        backLabel="Voltar para o projeto"
      />
    );
  }
  if (!project || !picked) notFound();

  const areaNames = new Map(project.areas.map((area) => [area.id, area.name]));
  const personNames = new Map(
    project.areas.flatMap((area) => area.participants.map((p) => [p.id, p.name] as const)),
  );
  const participants = (current?.participantIds ?? [])
    .map((personId) => personNames.get(personId))
    .filter((name): name is string => Boolean(name));
  const base = `/projects/${id}/rituals`;
  const detail = current ? `${base}/${current.id}` : base;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 md:p-10">
      <PageHeader
        title="Encontros"
        description="Escolha o tipo de encontro para ver o resumo do que aconteceu."
        action={
          canManageScope(profile) ? (
            <Link href={`${base}/new`} className={buttonVariants({ size: "lg" })}>
              <Upload aria-hidden="true" />
              Importar transcrição
            </Link>
          ) : (
            <Button size="lg" disabled>
              <Upload aria-hidden="true" />
              Importar transcrição
            </Button>
          )
        }
      />

      <div className="grid items-start gap-8 lg:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1.1fr)]">
        <nav aria-label="Tipos de encontro" className="flex flex-row flex-wrap gap-x-5 gap-y-2 lg:flex-col lg:gap-3">
          {menuKinds(rituals).map((item) => (
            <Link
              key={item.value}
              href={`${base}?tipo=${item.value}`}
              aria-current={item.value === picked.kind ? "page" : undefined}
              className={cn(
                "flex items-baseline gap-2 text-lg outline-none hover:text-primary focus-visible:underline",
                item.value === picked.kind ? "font-semibold text-primary" : "text-muted-foreground",
              )}
            >
              {item.label}
              <span className="text-xs font-normal text-muted-foreground">{item.count}</span>
            </Link>
          ))}
        </nav>

        {!current ? (
          <div className="flex flex-col gap-1 rounded-3xl bg-card p-6 lg:col-span-2">
            <p className="font-medium">
              {rituals.length === 0
                ? "Ainda não há encontros neste projeto."
                : `Nenhum encontro do tipo ${ritualKindLabel(picked.kind)} ainda.`}
            </p>
            <p className="text-sm text-muted-foreground">Importe a transcrição de uma reunião (.txt ou .vtt).</p>
          </div>
        ) : (
          <>
            <section className="flex flex-col gap-3" aria-label="Sobre o encontro">
              <h2 className="font-heading text-2xl font-semibold">{current.title}</h2>
              <dl className="flex flex-col gap-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Data</dt>
                  <dd>{formatDate(current.heldOn)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="shrink-0 text-muted-foreground">Participantes</dt>
                  <dd>{participants.length > 0 ? participants.join(", ") : "nenhum registrado"}</dd>
                </div>
              </dl>
              {picked.list.length > 1 && (
                <div className="flex flex-wrap gap-2 pt-2" role="group" aria-label="Outros encontros deste tipo">
                  {picked.list.map((meeting) => (
                    <Link
                      key={meeting.id}
                      href={`${base}?tipo=${picked.kind}&encontro=${meeting.id}`}
                      aria-current={meeting.id === current.id ? "page" : undefined}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        meeting.id === current.id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                      )}
                    >
                      {formatDate(meeting.heldOn)}
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="flex flex-col gap-3" aria-label="Resumos">
              <ul className="flex flex-col gap-3">
                {summaries.map((summary) => (
                  <li key={summary.id}>
                    <Link
                      href={`${detail}#resumo`}
                      className="flex flex-col gap-1 rounded-3xl bg-card p-5 outline-none transition-colors hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="font-heading text-base font-semibold">
                          Resumo de {areaNames.get(summary.areaId) ?? "área"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {summary.status === "approved" ? "Aprovado" : "Rascunho"}
                        </span>
                      </span>
                      <span className="line-clamp-2 text-sm text-muted-foreground">
                        {summary.keyPoints[0] ?? "Sem pontos principais."}
                      </span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href={`${detail}#transcricao`}
                    className="flex items-start gap-3 rounded-3xl bg-card p-5 outline-none transition-colors hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <FileText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="flex flex-col gap-1">
                      <span className="font-heading text-base font-semibold">Transcrição</span>
                      <span className="text-sm text-muted-foreground">
                        O texto completo do encontro, com busca.
                      </span>
                    </span>
                  </Link>
                </li>
              </ul>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
