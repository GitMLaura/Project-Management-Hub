import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScopeTree } from "@/components/scope-tree";
import { getActiveProfile } from "@/lib/active-profile";
import { formatDate } from "@/lib/format";
import { canManageScope } from "@/lib/item-rules";
import { buildItemTree } from "@/lib/item-tree";
import { listItems } from "@/lib/supabase/items";
import { getProject } from "@/lib/supabase/projects";

export default async function ProjectPage(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;

  const profile = await getActiveProfile();

  let project;
  let items;
  try {
    project = await getProject(id);
    items = project ? await listItems(id) : [];
  } catch {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">Não foi possível carregar o projeto</h1>
        <p className="text-muted-foreground">
          Houve um problema ao falar com o banco de dados. Tente novamente em instantes.
        </p>
        <div>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Voltar para a página inicial
          </Link>
        </div>
      </main>
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
  const archivedTree = buildItemTree(items.filter((item) => item.archivedAt));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <p>{project.objective}</p>
        <p className="text-sm text-muted-foreground">
          {formatDate(project.startDate)} a {formatDate(project.deadline)}
        </p>
      </div>

      <section className="flex flex-col gap-3" aria-label="Áreas e participantes">
        <h2 className="text-lg font-semibold">Áreas e participantes</h2>
        {project.areas.map((area) => (
          <Card key={area.id}>
            <CardHeader>
              <CardTitle>{area.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {area.participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum participante nesta área.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {area.participants.map((participant) => (
                    <li key={participant.id} className="flex items-center gap-2">
                      <span>{participant.name}</span>
                      {participant.isOwner && <Badge>Dono do projeto</Badge>}
                      {participant.isAreaLeader && (
                        <Badge variant="secondary">Líder da área</Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="flex flex-col gap-3" aria-label="Escopo">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Escopo</h2>
          {canManage && (
            <Link href={`/projects/${id}/items/new`} className={buttonVariants()}>
              Adicionar épico
            </Link>
          )}
        </div>
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
        ) : (
          <ScopeTree
            projectId={id}
            nodes={tree}
            areaNames={areaNames}
            assigneeNames={assigneeNames}
            canManage={canManage}
            profile={profile}
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

      <div>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Voltar para a página inicial
        </Link>
      </div>
    </main>
  );
}
