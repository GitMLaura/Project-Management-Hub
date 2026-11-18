import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PageMessage } from "@/components/page-message";
import { getActiveProfile } from "@/lib/active-profile";
import { GROUP_LABELS, canManageScope } from "@/lib/item-rules";
import { listItems } from "@/lib/supabase/items";
import { getProject } from "@/lib/supabase/projects";

// A flow belongs to a group of tasks (a funcionalidade or épico), so the first step is to pick it.
export default async function ChooseGroupForFlowPage(props: PageProps<"/projects/[id]/spec/flows/new">) {
  const { id } = await props.params;
  const profile = await getActiveProfile();
  const back = `/projects/${id}/spec/flows`;

  if (!canManageScope(profile)) {
    return (
      <PageMessage
        title="Novo fluxo"
        text={`Como ${profile.roleLabel}, você só consulta a especificação. Troque de perfil pelo avatar para criar fluxos.`}
        backHref={back}
        backLabel="Voltar"
      />
    );
  }

  let project;
  let groups: { id: string; title: string; label: string }[] = [];
  try {
    project = await getProject(id);
    if (project) {
      groups = (await listItems(id))
        .filter((item) => item.type === "group" && !item.archivedAt)
        .map((item) => ({
          id: item.id,
          title: item.title,
          label: item.groupLabel ? GROUP_LABELS[item.groupLabel] : "Grupo",
        }));
    }
  } catch {
    return (
      <PageMessage
        title="Não foi possível carregar"
        text="Houve um problema ao falar com o banco de dados. Tente novamente em instantes."
        backHref={back}
        backLabel="Voltar"
      />
    );
  }
  if (!project) notFound();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6 md:p-10">
      <PageHeader title="Novo fluxo" description="Escolha o grupo de tarefas ao qual o fluxo pertence." />
      {groups.length === 0 ? (
        <div className="flex flex-col gap-1 rounded-3xl bg-card p-6">
          <p className="font-medium">Ainda não há grupos neste projeto.</p>
          <p className="text-sm text-muted-foreground">
            No Escopo, marque tarefas e use “Agrupar” para criar o primeiro grupo.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {groups.map((group) => (
            <li key={group.id}>
              <Link
                href={`/projects/${id}/spec/${group.id}/flows/new`}
                className="flex items-baseline justify-between gap-4 rounded-2xl bg-card px-5 py-4 outline-none hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-medium">{group.title}</span>
                <span className="text-xs text-muted-foreground">{group.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div>
        <Link href={back} className="text-sm font-medium text-primary hover:underline">
          Voltar para a especificação
        </Link>
      </div>
    </main>
  );
}
