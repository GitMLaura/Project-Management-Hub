import Link from "next/link";
import { notFound } from "next/navigation";
import { PageMessage } from "@/components/page-message";
import { RitualSummaries } from "@/components/ritual-summaries";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getActiveProfile } from "@/lib/active-profile";
import { formatDate } from "@/lib/format";
import { listGroupOptions, type GroupOption } from "@/lib/pending-task";
import { listItems } from "@/lib/supabase/items";
import { getProject } from "@/lib/supabase/projects";
import { getRitual, listRitualSummaries, type RitualAreaSummary, type RitualDetail } from "@/lib/supabase/rituals";
import { ritualKindLabel, searchTranscript } from "@/lib/transcripts";

export default async function RitualPage(props: PageProps<"/projects/[id]/rituals/[ritualId]">) {
  const { id, ritualId } = await props.params;
  const rawQuery = (await props.searchParams).q;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() ?? "";

  let project;
  let ritual: RitualDetail | null = null;
  let summaries: RitualAreaSummary[] = [];
  let groups: GroupOption[] = [];
  const profile = await getActiveProfile();
  try {
    project = await getProject(id);
    if (project) ritual = await getRitual(id, ritualId);
    if (ritual) {
      summaries = await listRitualSummaries(ritualId);
      groups = listGroupOptions(await listItems(id));
    }
  } catch {
    return (
      <PageMessage
        title="Não foi possível carregar"
        text="Houve um problema ao falar com o banco de dados. Tente novamente em instantes."
        backHref={`/projects/${id}/rituals`}
        backLabel="Voltar para os encontros"
      />
    );
  }
  if (!project || !ritual) notFound();

  const names = new Map(project.areas.flatMap((area) => area.participants.map((p) => [p.id, p.name] as const)));
  const participants = ritual.participantIds.map((participantId) => names.get(participantId)).filter(Boolean);
  const lines = searchTranscript(ritual.transcript, query);
  const matchCount = lines.filter((line) => line.match).length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{project.name}</p>
        <h1 className="text-2xl font-semibold">{ritual.title}</h1>
        <p className="text-sm text-muted-foreground">
          {ritualKindLabel(ritual.kind)} · {formatDate(ritual.heldOn)}
        </p>
        <p className="text-sm">Participantes: {participants.length > 0 ? participants.join(", ") : "nenhum registrado"}</p>
      </div>

      <RitualSummaries
        projectId={id}
        areas={project.areas.map((area) => ({ id: area.id, name: area.name }))}
        summaries={summaries}
        profile={profile}
        groups={groups}
        people={[...names].map(([personId, name]) => ({ id: personId, name }))}
      />

      <section id="transcricao" className="flex scroll-mt-20 flex-col gap-3" aria-label="Transcrição">
        <h2 className="text-lg font-semibold">Transcrição</h2>
        <form method="get" role="search" className="flex flex-wrap items-end gap-2">
          <label className="flex min-w-60 flex-1 flex-col gap-1 text-sm">
            Buscar na transcrição
            <Input name="q" defaultValue={query} maxLength={120} />
          </label>
          <Button type="submit" variant="outline">
            Buscar
          </Button>
        </form>
        {query && (
          <p className="text-sm">
            {matchCount === 0
              ? `Nenhuma linha tem "${query}".`
              : `${matchCount} linha(s) com "${query}", destacadas abaixo.`}
          </p>
        )}
        <div className="flex flex-col rounded-2xl border p-3 text-sm">
          {lines.map((line) => (
            <p
              key={line.number}
              className={line.match ? "rounded bg-yellow-200/70 px-1 dark:bg-yellow-500/30" : "px-1"}
            >
              {line.text || " "}
            </p>
          ))}
        </div>
      </section>

      <div>
        <Link href={`/projects/${id}/rituals`} className={buttonVariants({ variant: "outline" })}>
          Voltar para os encontros
        </Link>
      </div>
    </main>
  );
}
