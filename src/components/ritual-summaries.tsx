import Link from "next/link";
import { ApproveSummaryButton } from "@/components/approve-summary-button";
import { PendingTaskForm } from "@/components/pending-task-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DemoProfile } from "@/lib/demo-profiles";
import { canCreateItemInArea } from "@/lib/item-rules";
import { matchAssignee, type PersonOption, type GroupOption } from "@/lib/pending-task";
import type { RitualAreaSummary } from "@/lib/supabase/rituals";

type Area = { id: string; name: string };

function BulletList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-sm font-medium">{title}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada registrado.</p>
      ) : (
        <ul className="list-disc pl-5 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RitualSummaries({
  projectId,
  areas,
  summaries,
  profile,
  groups,
  people,
}: {
  projectId: string;
  areas: Area[];
  summaries: RitualAreaSummary[];
  profile: DemoProfile;
  groups: GroupOption[];
  people: PersonOption[];
}) {
  const byArea = new Map(summaries.map((summary) => [summary.areaId, summary]));

  return (
    <section id="resumo" className="flex scroll-mt-20 flex-col gap-3" aria-label="Resumo por área">
      <h2 className="text-lg font-semibold">Resumo por área</h2>
      {areas.map((area) => {
        const summary = byArea.get(area.id);
        if (!summary) {
          return (
            <Card key={area.id}>
              <CardHeader>
                <CardTitle className="text-base">{area.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Não há resumo pré-gerado para esta área. Em produção, um LLM leria a transcrição e geraria o resumo
                como rascunho. Esta demo não chama nenhuma IA.
              </CardContent>
            </Card>
          );
        }
        const canCreateTasks = canCreateItemInArea(profile, area.name);
        const canApprove = summary.status === "draft" && canCreateItemInArea(profile, area.name);
        return (
          <Card key={area.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                {area.name}
                {summary.status === "approved" ? (
                  <Badge>Aprovado{summary.approvedBy ? ` por ${summary.approvedBy}` : ""}</Badge>
                ) : (
                  <Badge variant="secondary">Rascunho: ainda não aprovado</Badge>
                )}
              </CardTitle>
              {summary.isPregenerated && (
                <p className="text-sm text-muted-foreground">Resumo pré-gerado para demonstração</p>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <BulletList title="Pontos principais" items={summary.keyPoints} />
              <BulletList title="Decisões" items={summary.decisions} />
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-medium">Pendências</h4>
                {summary.pendings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nada registrado.</p>
                ) : (
                  <ul className="list-disc pl-5 text-sm">
                    {summary.pendings.map((pending) => (
                      <li key={pending.id} className="flex flex-col gap-2">
                        <span>
                          {pending.description}
                          {pending.suggestedAssignee && (
                            <span className="text-muted-foreground"> (sugerido: {pending.suggestedAssignee})</span>
                          )}
                        </span>
                        {pending.taskId ? (
                          <span className="text-muted-foreground">
                            Já virou tarefa:{" "}
                            <Link href={`/projects/${projectId}/scope`} className="underline underline-offset-2">
                              ver no escopo do projeto
                            </Link>
                          </span>
                        ) : canCreateTasks ? (
                          <PendingTaskForm
                            projectId={projectId}
                            pendingId={pending.id}
                            groups={groups}
                            people={people}
                            defaultAssigneeId={matchAssignee(pending.suggestedAssignee, people)}
                          />
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <BulletList title="Riscos" items={summary.risks} />
              {canApprove && <ApproveSummaryButton projectId={projectId} summaryId={summary.id} />}
              {summary.status === "draft" && !canApprove && (
                <p className="text-sm text-muted-foreground">
                  Só o líder da área {area.name} (ou o Dono) aprova. Troque de perfil pelo avatar.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
