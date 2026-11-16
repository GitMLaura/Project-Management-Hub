import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { ScopeFilters } from "@/components/scope-filters";
import { ScopeTree } from "@/components/scope-tree";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageMessage } from "@/components/page-message";
import { getActiveProfile } from "@/lib/active-profile";
import { canManageScope } from "@/lib/item-rules";
import { buildItemTree, countIncompleteScope } from "@/lib/item-tree";
import { buildProgressMap, filterTree, parseScopeFilters } from "@/lib/scope-view";
import { listItems } from "@/lib/supabase/items";
import { getProject } from "@/lib/supabase/projects";

export default async function ScopePage(props: PageProps<"/projects/[id]/scope">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const profile = await getActiveProfile();

  let project;
  let items;
  try {
    project = await getProject(id);
    items = project ? await listItems(id) : [];
  } catch {
    return (
      <PageMessage
        title="Não foi possível carregar o escopo"
        text="Houve um problema ao falar com o banco de dados. Tente novamente em instantes."
        backHref="/"
        backLabel="Voltar para a página inicial"
      />
    );
  }
  if (!project) notFound();

  const areaNames = Object.fromEntries(project.areas.map((area) => [area.id, area.name]));
  const assigneeNames = Object.fromEntries(
    project.areas.flatMap((area) =>
      area.participants.map((participant) => [participant.id, participant.name]),
    ),
  );
  const canManage = canManageScope(profile);
  const tree = buildItemTree(items.filter((item) => !item.archivedAt));
  const progress = buildProgressMap(tree);
  const people = project.areas.flatMap((area) =>
    area.participants.map((participant) => ({ id: participant.id, name: participant.name })),
  );
  const filters = parseScopeFilters(searchParams, {
    areaIds: project.areas.map((area) => area.id),
    assigneeIds: people.map((person) => person.id),
  });
  const visibleTree = filterTree(tree, filters);
  const archivedTree = buildItemTree(items.filter((item) => item.archivedAt));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="text-4xl font-semibold">Escopo</h1>
          <p className="text-muted-foreground">
            Épicos, funcionalidades, histórias e tarefas de {project.name}.
          </p>
        </div>
        {canManage && (
          <Link href={`/projects/${id}/items/new`} className={buttonVariants({ size: "lg" })}>
            <Plus aria-hidden="true" />
            Novo item
          </Link>
        )}
      </header>

      <section className="flex flex-col gap-3" aria-label="Escopo">
        {countIncompleteScope(tree) > 0 && (
          <p className="text-sm text-muted-foreground">
            {countIncompleteScope(tree)} item(ns) com escopo incompleto: ainda sem nada dentro.
          </p>
        )}
        {tree.length > 0 && (
          <ScopeFilters
            projectId={id}
            areas={project.areas.map((area) => ({ id: area.id, name: area.name }))}
            people={people}
            current={filters}
          />
        )}
        {tree.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col gap-1 pt-4">
              <p className="font-medium">Este projeto ainda não tem escopo.</p>
              <p className="text-sm text-muted-foreground">
                {canManage
                  ? "Comece adicionando um épico."
                  : "O Dono ou um Líder de área pode adicionar o primeiro épico. Troque de perfil pelo avatar."}
              </p>
            </CardContent>
          </Card>
        ) : visibleTree.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col gap-1 pt-4">
              <p className="font-medium">Nenhum item corresponde aos filtros.</p>
              <p className="text-sm text-muted-foreground">
                Tente outra combinação ou use &quot;Limpar filtros&quot;.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScopeTree
            projectId={id}
            nodes={visibleTree}
            areaNames={areaNames}
            assigneeNames={assigneeNames}
            canManage={canManage}
            profile={profile}
            progress={progress}
          />
        )}
      </section>

      {archivedTree.length > 0 && (
        <section className="flex flex-col gap-3" aria-label="Itens arquivados">
          <h2 className="text-lg font-semibold">Arquivados</h2>
          <p className="text-sm text-muted-foreground">
            Itens arquivados saem do escopo ativo, mas não são apagados. Restaurar um item traz
            de volta o que foi arquivado junto com ele.
          </p>
          <ScopeTree
            projectId={id}
            nodes={archivedTree}
            areaNames={areaNames}
            assigneeNames={assigneeNames}
            canManage={canManage}
            profile={profile}
            mode="archived"
          />
        </section>
      )}


    </main>
  );
}
