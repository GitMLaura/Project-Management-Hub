import Link from "next/link";
import { ProjectForm } from "@/components/project-form";
import { buttonVariants } from "@/components/ui/button";
import { getActiveProfile } from "@/lib/active-profile";
import { canCreateProject } from "@/lib/demo-profiles";

export default async function NewProjectPage() {
  const profile = await getActiveProfile();

  if (!canCreateProject(profile)) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">Novo projeto</h1>
        <p>
          Só o <strong>Dono do projeto</strong> cria projetos. Você está vendo o
          Hub como <strong>{profile.roleLabel}</strong>. Troque de perfil pelo
          avatar no topo.
        </p>
        <div>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Voltar para a página inicial
          </Link>
        </div>
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Novo projeto</h1>
      <ProjectForm today={today} />
    </main>
  );
}
