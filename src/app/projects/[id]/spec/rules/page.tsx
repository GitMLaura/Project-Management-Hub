import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PageMessage } from "@/components/page-message";
import { SpecTabs } from "@/components/spec-tabs";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { GROUP_LABELS } from "@/lib/item-rules";
import type { ItemRecord } from "@/lib/item-tree";
import type { RuleRecord } from "@/lib/rules";
import { listItems } from "@/lib/supabase/items";
import { getProject } from "@/lib/supabase/projects";
import { listRules } from "@/lib/supabase/rules";

export default async function SpecPage(props: PageProps<"/projects/[id]/spec">) {
  const { id } = await props.params;

  let project;
  let groups: ItemRecord[] | undefined;
  let rules: RuleRecord[] | undefined;
  try {
    project = await getProject(id);
    if (project) {
      groups = (await listItems(id)).filter((item) => item.type === "group" && !item.archivedAt);
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
  if (!project || !groups || !rules) notFound();

  const allRules = rules;
  const ruleCount = (groupId: string) => allRules.filter((rule) => rule.featureId === groupId).length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <PageHeader
        title="Especificação"
        description="As regras de negócio de cada grupo de tarefas (funcionalidade ou épico)."
      />
      <SpecTabs projectId={id} current="rules" />

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

      {groups.length === 0 ? (
        <div className="flex flex-col gap-1 rounded-3xl bg-card p-6">
          <p className="font-medium">Ainda não há grupos para especificar.</p>
          <p className="text-sm text-muted-foreground">
            No Escopo, marque tarefas e use “Agrupar” para criar o primeiro grupo.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((group) => (
            <li
              key={group.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-card px-5 py-4"
            >
              <div className="flex flex-col">
                <Link
                  href={`/projects/${id}/spec/${group.id}`}
                  className="font-heading text-base font-semibold text-primary hover:underline"
                >
                  {group.title}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {group.groupLabel ? GROUP_LABELS[group.groupLabel] : "Grupo"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{ruleCount(group.id)} regra(s)</Badge>
                {ruleCount(group.id) > 0 && (
                  <a
                    href={`/projects/${id}/rules/export?scope=group&item=${group.id}`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    Baixar (.md)
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

    </main>
  );
}
