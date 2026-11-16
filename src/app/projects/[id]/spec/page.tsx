import Link from "next/link";
import { notFound } from "next/navigation";
import { PageMessage } from "@/components/page-message";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildItemTree, type ItemNode } from "@/lib/item-tree";
import type { RuleRecord } from "@/lib/rules";
import { listItems } from "@/lib/supabase/items";
import { getProject } from "@/lib/supabase/projects";
import { listRules } from "@/lib/supabase/rules";

export default async function SpecPage(props: PageProps<"/projects/[id]/spec">) {
  const { id } = await props.params;

  let project;
  let tree: ItemNode[] | undefined;
  let rules: RuleRecord[] | undefined;
  try {
    project = await getProject(id);
    if (project) {
      tree = buildItemTree((await listItems(id)).filter((item) => !item.archivedAt));
      rules = await listRules(id);
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
  if (!project || !tree || !rules) notFound();

  const allRules = rules;
  const ruleCount = (featureId: string) => allRules.filter((rule) => rule.featureId === featureId).length;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{project.name}</p>
        <h1 className="text-2xl font-semibold">Especificação</h1>
        <p className="text-sm text-muted-foreground">
          Regras de negócio, fluxos e telas de cada funcionalidade, agrupadas por épico.
        </p>
      </div>

      <div>
        <Link href={`/projects/${id}/spec/flows`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Fluxos do projeto: trechos repetidos
        </Link>
      </div>

      {rules.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <a
            href={`/projects/${id}/rules/export?scope=project`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Baixar regras do projeto (.md)
          </a>
          <a
            href={`/projects/${id}/rules/export?scope=project&format=pdf`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Ver PDF
          </a>
          <a
            href={`/projects/${id}/rules/export?scope=project&format=pdf&download=1`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Baixar PDF
          </a>
        </div>
      )}

      {tree.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-1 pt-4">
            <p className="font-medium">Ainda não há funcionalidades para especificar.</p>
            <p className="text-sm text-muted-foreground">
              Crie um épico e uma funcionalidade no escopo do projeto.
            </p>
          </CardContent>
        </Card>
      ) : (
        tree.map((epic) => (
          <Card key={epic.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                <span>{epic.title}</span>
                <a
                  href={`/projects/${id}/rules/export?scope=epic&item=${epic.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Baixar regras do épico (.md)
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {epic.children.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este épico ainda não tem funcionalidades.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {epic.children.map((feature) => (
                    <li key={feature.id} className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/projects/${id}/spec/${feature.id}`}
                        className="font-medium underline underline-offset-2"
                      >
                        {feature.title}
                      </Link>
                      <Badge variant="secondary">{ruleCount(feature.id)} regra(s)</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <div>
        <Link href={`/projects/${id}`} className={buttonVariants({ variant: "outline" })}>
          Voltar para o projeto
        </Link>
      </div>
    </main>
  );
}
