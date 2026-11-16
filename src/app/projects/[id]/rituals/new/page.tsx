import Link from "next/link";
import { notFound } from "next/navigation";
import { PageMessage } from "@/components/page-message";
import { RitualImportForm } from "@/components/ritual-import-form";
import { buttonVariants } from "@/components/ui/button";
import { getActiveProfile } from "@/lib/active-profile";
import { canManageScope } from "@/lib/item-rules";
import { getProject } from "@/lib/supabase/projects";

export default async function NewRitualPage(props: PageProps<"/projects/[id]/rituals/new">) {
  const { id } = await props.params;
  const profile = await getActiveProfile();

  let project;
  try {
    project = await getProject(id);
  } catch {
    return (
      <PageMessage
        title="Não foi possível carregar"
        text="Houve um problema ao falar com o banco de dados. Tente novamente em instantes."
        backHref={`/projects/${id}/rituals`}
        backLabel="Voltar para os ritos"
      />
    );
  }
  if (!project) notFound();

  if (!canManageScope(profile)) {
    return (
      <PageMessage
        title="Importar transcrição"
        text={`Como ${profile.roleLabel}, você não importa ritos. Troque para um líder de área ou para o Dono pelo avatar.`}
        backHref={`/projects/${id}/rituals`}
        backLabel="Voltar para os ritos"
      />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{project.name}</p>
        <h1 className="text-2xl font-semibold">Importar transcrição</h1>
      </div>
      <RitualImportForm
        projectId={id}
        areas={project.areas.map((area) => ({
          id: area.id,
          name: area.name,
          participants: area.participants.map((participant) => ({ id: participant.id, name: participant.name })),
        }))}
      />
      <div>
        <Link href={`/projects/${id}/rituals`} className={buttonVariants({ variant: "outline" })}>
          Voltar para os ritos
        </Link>
      </div>
    </main>
  );
}
