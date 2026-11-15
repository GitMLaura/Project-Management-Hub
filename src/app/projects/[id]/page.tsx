import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getProject } from "@/lib/supabase/projects";

export default async function ProjectPage(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;

  let project;
  try {
    project = await getProject(id);
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

      <div>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Voltar para a página inicial
        </Link>
      </div>
    </main>
  );
}
