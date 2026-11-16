import Link from "next/link";
import { notFound } from "next/navigation";
import { PageMessage } from "@/components/page-message";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { findRepeatedSegments, type FlowRecord } from "@/lib/flows";
import { listFlows } from "@/lib/supabase/flows";
import { getProject } from "@/lib/supabase/projects";

export default async function FlowsOverviewPage(props: PageProps<"/projects/[id]/spec/flows">) {
  const { id } = await props.params;

  let project;
  let flows: FlowRecord[] = [];
  try {
    project = await getProject(id);
    if (project) flows = await listFlows(id);
  } catch {
    return (
      <PageMessage
        title="Não foi possível carregar"
        text="Houve um problema ao falar com o banco de dados. Tente novamente em instantes."
        backHref={`/projects/${id}/spec`}
        backLabel="Voltar para a especificação"
      />
    );
  }
  if (!project) notFound();

  const flowById = new Map(flows.map((flow) => [flow.id, flow]));
  const segments = findRepeatedSegments(flows.map((flow) => ({ id: flow.id, title: flow.title, source: flow.source })));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{project.name}</p>
        <h1 className="text-2xl font-semibold">Fluxos do projeto</h1>
      </div>

      <section className="flex flex-col gap-3" aria-label="Trechos repetidos">
        <h2 className="text-lg font-semibold">Trechos repetidos entre fluxos</h2>
        <p className="text-sm text-muted-foreground">
          Sequências de 2 ou mais passos seguidos com o mesmo texto (sem diferenciar maiúsculas, acentos e pontuação) em
          fluxos diferentes. Vale reaproveitar em vez de duplicar.
        </p>
        {flows.length < 2 ? (
          <Card>
            <CardContent className="flex flex-col gap-1 pt-4">
              <p className="font-medium">É preciso ter pelo menos 2 fluxos para comparar.</p>
              <p className="text-sm text-muted-foreground">Crie fluxos na aba Fluxos de uma funcionalidade.</p>
            </CardContent>
          </Card>
        ) : segments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col gap-1 pt-4">
              <p className="font-medium">Nenhum trecho repetido encontrado.</p>
              <p className="text-sm text-muted-foreground">
                Os {flows.length} fluxos não têm 2 passos seguidos iguais.
              </p>
            </CardContent>
          </Card>
        ) : (
          segments.map((segment) => (
            <Card key={segment.steps.join(">")}>
              <CardHeader>
                <CardTitle className="text-base">{segment.steps.join(" → ")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <p>
                  {segment.steps.length} passos, em {segment.occurrences.length} fluxos:
                </p>
                <ul className="flex flex-col gap-1">
                  {segment.occurrences.map((occurrence) => {
                    const flow = flowById.get(occurrence.flowId);
                    return (
                      <li key={occurrence.flowId}>
                        {flow ? (
                          <Link
                            href={`/projects/${id}/spec/${flow.featureId}/flows/${flow.id}`}
                            className="font-medium underline underline-offset-2"
                          >
                            {occurrence.flowTitle}
                          </Link>
                        ) : (
                          occurrence.flowTitle
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      <div>
        <Link href={`/projects/${id}/spec`} className={buttonVariants({ variant: "outline" })}>
          Voltar para a especificação
        </Link>
      </div>
    </main>
  );
}
