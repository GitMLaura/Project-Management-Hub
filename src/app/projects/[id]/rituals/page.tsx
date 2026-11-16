import Link from "next/link";
import { notFound } from "next/navigation";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <PageHeader
        title="Encontros"
        description="Resumo de cada encontro por área, com decisões, riscos e pendências. A transcrição completa fica no histórico."
        action={
          canManageScope(profile) ? (
            <Link href={`/projects/${id}/rituals/new`} className={buttonVariants({ size: "lg" })}>
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
      {!canManageScope(profile) && (
        <p className="text-sm text-muted-foreground">
          Só líderes de área e o Dono importam encontros. Troque de perfil pelo avatar.
        </p>
      )}

      {rituals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-1 pt-4">
            <p className="font-medium">Ainda não há encontros neste projeto.</p>
            <p className="text-sm text-muted-foreground">Importe a transcrição de uma reunião (.txt ou .vtt).</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {rituals.map((ritual) => (
            <li key={ritual.id}>
              <Link
                href={`/projects/${id}/rituals/${ritual.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border bg-card p-5 shadow-xs hover:bg-muted/50"
              >
                <span className="font-heading text-lg font-semibold">{ritual.title}</span>
                <span className="text-sm text-muted-foreground">
                  {ritualKindLabel(ritual.kind)} · {formatDate(ritual.heldOn)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
