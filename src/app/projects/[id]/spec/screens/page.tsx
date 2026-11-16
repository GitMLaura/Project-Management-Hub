import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PageMessage } from "@/components/page-message";
import { SpecTabs } from "@/components/spec-tabs";
import { ReferenceScreenButton } from "@/components/reference-screen-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <PageHeader
        title="Especificação"
        description="Telas, fluxos e regras de negócio do produto, em um só lugar. Cópias exatas e telas muito parecidas ficam juntas; marcar uma como referência não apaga as outras."
      />
      <SpecTabs projectId={id} current="screens" />

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
      ) : (
        <>
          {groups.length === 0 ? (
            <p className="rounded-xl border bg-card p-4 text-sm">
              <strong>Nenhuma tela repetida.</strong> As {screens.length} telas são diferentes com o
              limiar {threshold}.
            </p>
          ) : (
            <ul className="flex flex-col gap-3" aria-label="Avisos de telas repetidas">
              {groups.map((group) => {
                const names = group.screens.map((screen) => `“${screen.name}”`);
                return (
                  <li
                    key={group.screens.map((screen) => screen.id).join("-")}
                    className="rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-950"
                  >
                    {group.kind === "exact" ? (
                      <>
                        <strong>Telas repetidas encontradas.</strong> {names.join(", ")} são idênticas.
                        Dá para manter só uma como referência.
                      </>
                    ) : (
                      <>
                        <strong>Telas muito parecidas.</strong> {names.join(", ")} quase não mudam. Vale
                        checar se uma pode substituir a outra.
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {screens.map((screen) => {
              const group = groups.find((item) => item.screens.some((member) => member.id === screen.id));
              const groupIds = group?.screens.map((member) => member.id) ?? [];
              return (
                <li key={screen.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/projects/${id}/spec/screens/${screen.id}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {screen.name}
                    </Link>
                    {screen.isReference ? (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs">Referência</span>
                    ) : group ? (
                      <span className="shrink-0 rounded-full border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-xs text-yellow-800">
                        {group.kind === "exact" ? "Repetida" : "Parecida"}
                      </span>
                    ) : null}
                  </div>
                  <Image
                    src={screenImageUrl(screen.storagePath)}
                    alt={`Tela ${screen.name}`}
                    width={screen.width}
                    height={screen.height}
                    unoptimized
                    className="max-h-56 w-full rounded-lg border bg-muted object-contain"
                  />
                  {group && !screen.isReference && canManageScope(profile) && (
                    <ReferenceScreenButton projectId={id} screenId={screen.id} groupIds={groupIds} />
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
