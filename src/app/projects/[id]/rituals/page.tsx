import Link from "next/link";
import { notFound } from "next/navigation";
import { PageMessage } from "@/components/page-message";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getActiveProfile } from "@/lib/active-profile";
import { formatDate } from "@/lib/format";
import { canManageScope } from "@/lib/item-rules";
import { getProject } from "@/lib/supabase/projects";
import { listRituals, type RitualSummaryRow } from "@/lib/supabase/rituals";
import { ritualKindLabel } from "@/lib/transcripts";

export default async function RitualsPage(props: PageProps<"/projects/[id]/rituals">) {
  const { id } = await props.params;
  const profile = await getActiveProfile();

  let project;
  let rituals: RitualSummaryRow[] = [];
  try {
    project = await getProject(id);
    if (project) rituals = await listRituals(id);
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
  if (!project) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{project.name}</p>
          <h1 className="text-2xl font-semibold">Ritos</h1>
        </div>
        {canManageScope(profile) ? (
          <Link href={`/projects/${id}/rituals/new`} className={buttonVariants()}>
            Importar transcrição
          </Link>
        ) : (
          <Button disabled>Importar transcrição</Button>
        )}
      </div>
      {!canManageScope(profile) && (
        <p className="text-sm text-muted-foreground">
          Só líderes de área e o Dono importam ritos. Troque de perfil pelo avatar.
        </p>
      )}

      {rituals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-1 pt-4">
            <p className="font-medium">Ainda não há ritos neste projeto.</p>
            <p className="text-sm text-muted-foreground">Importe a transcrição de uma reunião (.txt ou .vtt).</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {rituals.map((ritual) => (
            <li key={ritual.id} className="flex flex-col rounded-2xl border p-3">
              <Link href={`/projects/${id}/rituals/${ritual.id}`} className="font-medium underline underline-offset-2">
                {ritual.title}
              </Link>
              <span className="text-sm text-muted-foreground">
                {ritualKindLabel(ritual.kind)} · {formatDate(ritual.heldOn)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div>
        <Link href={`/projects/${id}`} className={buttonVariants({ variant: "outline" })}>
          Voltar para o projeto
        </Link>
      </div>
    </main>
  );
}
