import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveProfile } from "@/lib/active-profile";
import { canCreateProject } from "@/lib/demo-profiles";
import { formatDate } from "@/lib/format";
import { listProjects, type ProjectSummary } from "@/lib/supabase/projects";

export default async function Home() {
  const profile = await getActiveProfile();

  let projects: ProjectSummary[] = [];
  let loadFailed = false;
  try {
    projects = await listProjects();
  } catch {
    loadFailed = true;
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Olá, {profile.name}</h1>
        <p className="text-muted-foreground">
          Você está vendo o Hub como <strong>{profile.roleLabel}</strong> (área{" "}
          {profile.area}). Clique na sua foto no canto superior direito para
          trocar de perfil. Projeto de portfólio com dados 100% fictícios.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Projetos</h2>
        {canCreateProject(profile) && (
          <Link href="/projects/new" className={buttonVariants()}>
            Novo projeto
          </Link>
        )}
      </div>

      {loadFailed ? (
        <p role="alert" className="text-destructive">
          Não foi possível carregar os projetos. Recarregue a página para tentar de novo.
        </p>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-4">
            <p className="font-medium">Nenhum projeto ainda.</p>
            <p className="text-sm text-muted-foreground">
              {canCreateProject(profile)
                ? "Clique em “Novo projeto” para começar."
                : "Peça ao Dono do projeto para criar um. Você pode trocar de perfil pelo avatar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link href={`/projects/${project.id}`} className="block">
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle>{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    <p className="text-sm">{project.objective}</p>
                    <div>
                      <Badge variant="secondary">
                        Prazo: {formatDate(project.deadline)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
