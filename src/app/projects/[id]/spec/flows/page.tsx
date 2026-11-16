import Link from "next/link";
import { notFound } from "next/navigation";
import { PageMessage } from "@/components/page-message";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { findRepeatedSegments, searchFlows, type FlowRecord } from "@/lib/flows";
import { listFlows } from "@/lib/supabase/flows";
import { getProject } from "@/lib/supabase/projects";

export default async function FlowsOverviewPage(props: PageProps<"/projects/[id]/spec/flows">) {
  const { id } = await props.params;
  const rawQuery = (await props.searchParams).q;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() ?? "";

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
  const sources = flows.map((flow) => ({ id: flow.id, title: flow.title, source: flow.source }));
  const segments = findRepeatedSegments(sources);
  const matches = query ? searchFlows(sources, query) : [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{project.name}</p>
        <h1 className="text-2xl font-semibold">Fluxos do projeto</h1>
      </div>

      <section className="flex flex-col gap-3" aria-label="Buscar passo">
        <h2 className="text-lg font-semibold">Buscar um passo ou trecho</h2>
        <form method="get" className="flex flex-wrap items-end gap-2" role="search">
          <label className="flex min-w-60 flex-1 flex-col gap-1 text-sm">
            Texto do passo (para um trecho, separe com &gt;, ex.: informar e-mail &gt; validar senha)
            <Input name="q" defaultValue={query} maxLength={120} />
          </label>
          <Button type="submit" variant="outline">
            Buscar
          </Button>
        </form>
        {query && (
          matches.length === 0 ? (
            <p className="text-sm">Nenhum fluxo tem &quot;{query}&quot;.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm">
                &quot;{query}&quot; aparece em {matches.length} fluxo(s):
              </p>
              <ul className="flex flex-col gap-2">
                {matches.map((match) => {
                  const flow = flowById.get(match.flowId);
                  return (
                    <li key={match.flowId} className="flex flex-col text-sm">
                      {flow ? (
                        <Link
                          href={`/projects/${id}/spec/${flow.featureId}/flows/${flow.id}`}
                          className="font-medium underline underline-offset-2"
                        >
                          {match.flowTitle}
                        </Link>
                      ) : (
                        match.flowTitle
                      )}
                      <span className="text-muted-foreground">{match.steps.join(" → ")}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )
        )}
        {flows.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não há fluxos neste projeto para buscar.</p>
        )}
      </section>

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
