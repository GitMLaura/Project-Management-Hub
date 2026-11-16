import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageMessage } from "@/components/page-message";
import { ReferenceScreenButton } from "@/components/reference-screen-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getActiveProfile } from "@/lib/active-profile";
import { canManageScope } from "@/lib/item-rules";
import {
  groupScreens,
  MAX_SIMILARITY_THRESHOLD,
  parseThreshold,
  screenImageUrl,
  type ScreenRecord,
} from "@/lib/screens";
import { getProject } from "@/lib/supabase/projects";
import { listScreens } from "@/lib/supabase/screens";

export default async function DuplicateScreensPage(props: PageProps<"/projects/[id]/spec/screens">) {
  const { id } = await props.params;
  const rawLimit = (await props.searchParams).limite;
  const threshold = parseThreshold(Array.isArray(rawLimit) ? rawLimit[0] : rawLimit);
  const profile = await getActiveProfile();

  let project;
  let screens: ScreenRecord[] = [];
  try {
    project = await getProject(id);
    if (project) screens = await listScreens(id);
  } catch {
    return (
      <PageMessage
        title="Não foi possível carregar"
        text="Houve um problema ao falar com o banco de dados. Tente novamente em instantes."
        backHref={`/projects/${id}/spec`}
        backLabel="Voltar para a especificação"
      />
    );
  }
  if (!project) notFound();

  const groups = groupScreens(screens, threshold);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{project.name}</p>
        <h1 className="text-2xl font-semibold">Telas repetidas</h1>
        <p className="text-sm text-muted-foreground">
          Cópias exatas (mesmo arquivo) e telas muito parecidas ficam juntas. Marcar uma como referência não apaga as
          outras.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-2" aria-label="Ajustar semelhança">
        <label className="flex flex-col gap-1 text-sm">
          Limiar de semelhança (0 a {MAX_SIMILARITY_THRESHOLD}; quanto maior, mais telas entram no grupo)
          <Input
            name="limite"
            type="number"
            min={0}
            max={MAX_SIMILARITY_THRESHOLD}
            defaultValue={threshold}
            className="w-32"
          />
        </label>
        <Button type="submit" variant="outline">
          Aplicar
        </Button>
      </form>

      {screens.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-1 pt-4">
            <p className="font-medium">Ainda não há telas neste projeto.</p>
            <p className="text-sm text-muted-foreground">Envie telas na aba Telas de uma funcionalidade.</p>
          </CardContent>
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-1 pt-4">
            <p className="font-medium">Nenhuma tela repetida encontrada.</p>
            <p className="text-sm text-muted-foreground">
              As {screens.length} telas são diferentes com o limiar {threshold}.
            </p>
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => {
          const groupIds = group.screens.map((screen) => screen.id);
          return (
            <Card key={groupIds.join("-")}>
              <CardHeader>
                <CardTitle className="text-base">
                  {group.kind === "exact" ? "Cópias exatas" : "Telas semelhantes"} ({group.screens.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {group.screens.map((screen) => (
                    <li key={screen.id} className="flex flex-col gap-2 rounded-2xl border p-3">
                      <Image
                        src={screenImageUrl(screen.storagePath)}
                        alt={`Tela ${screen.name}`}
                        width={screen.width}
                        height={screen.height}
                        unoptimized
                        className="max-h-48 w-full rounded-md border object-contain"
                      />
                      <p className="font-medium">
                        {screen.name}
                        {screen.isReference && (
                          <span className="ml-2 rounded-md bg-muted px-2 py-0.5 text-xs font-normal">Referência</span>
                        )}
                      </p>
                      {!screen.isReference && canManageScope(profile) && (
                        <ReferenceScreenButton projectId={id} screenId={screen.id} groupIds={groupIds} />
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })
      )}

      <div>
        <Link href={`/projects/${id}/spec`} className={buttonVariants({ variant: "outline" })}>
          Voltar para a especificação
        </Link>
      </div>
    </main>
  );
}
