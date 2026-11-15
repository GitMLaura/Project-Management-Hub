import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemForm } from "@/components/item-form";
import { buttonVariants } from "@/components/ui/button";
import { getActiveProfile } from "@/lib/active-profile";
import {
  ITEM_TYPE_LABELS,
  canManageScope,
  childTypeOf,
  findLeaderAreaId,
} from "@/lib/item-rules";
import { getItem } from "@/lib/supabase/items";
import { getProject } from "@/lib/supabase/projects";

function Message({ projectId, title, text }: { projectId: string; title: string; text: string }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p>{text}</p>
      <div>
        <Link href={`/projects/${projectId}`} className={buttonVariants({ variant: "outline" })}>
          Voltar para o projeto
        </Link>
      </div>
    </main>
  );
}

export default async function NewItemPage(props: PageProps<"/projects/[id]/items/new">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const parentParam = typeof searchParams.parent === "string" ? searchParams.parent : null;

  const profile = await getActiveProfile();
  if (!canManageScope(profile)) {
    return (
      <Message
        projectId={id}
        title="Novo item"
        text={`Como ${profile.roleLabel}, você só consulta o escopo. Troque de perfil pelo avatar para criar itens.`}
      />
    );
  }

  let project;
  let parent = null;
  try {
    project = await getProject(id);
    if (project && parentParam) parent = await getItem(id, parentParam);
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
  if (parentParam && !parent) notFound();

  const type = parent ? childTypeOf(parent.type) : "epic";
  if (!type) {
    return (
      <Message
        projectId={id}
        title="Novo item"
        text="Tarefas são o último nível do escopo e não têm itens dentro."
      />
    );
  }

  const areas = project.areas.map((area) => ({ id: area.id, name: area.name }));
  const fixedAreaId = findLeaderAreaId(profile, areas);
  if (profile.role === "area-lead" && !fixedAreaId) {
    return (
      <Message
        projectId={id}
        title="Novo item"
        text={`Este projeto não tem a área ${profile.area}, então o perfil ${profile.roleLabel} não pode criar itens aqui. Troque de perfil pelo avatar.`}
      />
    );
  }

  const participants = project.areas.flatMap((area) =>
    area.participants.map((participant) => ({ id: participant.id, name: participant.name })),
  );
  const today = new Date().toISOString().slice(0, 10);
  const typeLabel = ITEM_TYPE_LABELS[type];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">
        Novo {typeLabel.toLowerCase()} em {project.name}
      </h1>
      <ItemForm
        projectId={id}
        type={type}
        typeLabel={typeLabel}
        parent={
          parent
            ? {
                id: parent.id,
                title: parent.title,
                typeLabel: ITEM_TYPE_LABELS[parent.type],
                deadline: parent.deadline,
              }
            : null
        }
        areas={areas}
        participants={participants}
        fixedAreaId={fixedAreaId}
        today={today}
      />
    </main>
  );
}
