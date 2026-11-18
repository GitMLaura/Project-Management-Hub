import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemForm } from "@/components/item-form";
import { buttonVariants } from "@/components/ui/button";
import { getActiveProfile } from "@/lib/active-profile";
import { canManageScope, findLeaderAreaId } from "@/lib/item-rules";
import { listGroupOptions } from "@/lib/pending-task";
import { listItems } from "@/lib/supabase/items";
import { getProject } from "@/lib/supabase/projects";

function Message({ projectId, title, text }: { projectId: string; title: string; text: string }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p>{text}</p>
      <div>
        <Link href={`/projects/${projectId}/scope`} className={buttonVariants({ variant: "outline" })}>
          Voltar para o projeto
        </Link>
      </div>
    </main>
  );
}

export default async function NewItemPage(props: PageProps<"/projects/[id]/items/new">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const groupParam = typeof searchParams.group === "string" ? searchParams.group : "";

  const profile = await getActiveProfile();
  if (!canManageScope(profile)) {
    return (
      <Message
        projectId={id}
        title="Nova tarefa"
        text={`Como ${profile.roleLabel}, você só consulta o escopo. Troque de perfil pelo avatar para criar tarefas.`}
      />
    );
  }

  let project;
  let groups: { id: string; label: string }[] = [];
  try {
    project = await getProject(id);
    if (project) groups = listGroupOptions(await listItems(id));
  } catch {
    return (
      <Message
        projectId={id}
        title="Não foi possível carregar"
        text="Houve um problema ao falar com o banco de dados. Tente novamente em instantes."
      />
    );
  }
  if (!project) notFound();

  const areas = project.areas.map((area) => ({ id: area.id, name: area.name }));
  const fixedAreaId = findLeaderAreaId(profile, areas);
  if (profile.role === "area-lead" && !fixedAreaId) {
    return (
      <Message
        projectId={id}
        title="Nova tarefa"
        text={`Este projeto não tem a área ${profile.area}, então o perfil ${profile.roleLabel} não pode criar tarefas aqui. Troque de perfil pelo avatar.`}
      />
    );
  }

  const participants = project.areas.flatMap((area) =>
    area.participants.map((participant) => ({ id: participant.id, name: participant.name })),
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Nova tarefa em {project.name}</h1>
      <ItemForm
        projectId={id}
        groups={groups.map((group) => ({ id: group.id, title: group.label }))}
        initialGroupId={groups.some((group) => group.id === groupParam) ? groupParam : ""}
        areas={areas}
        participants={participants}
        fixedAreaId={fixedAreaId}
        maxDeadline={project.deadline}
      />
    </main>
  );
}
