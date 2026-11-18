import { Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlowBoardCard } from "@/components/flow-board-card";
import { PageHeader } from "@/components/page-header";
import { PageMessage } from "@/components/page-message";
import { SpecTabs } from "@/components/spec-tabs";
import { buttonVariants } from "@/components/ui/button";
import { getActiveProfile } from "@/lib/active-profile";
import { buildFlowBoards } from "@/lib/flow-board";
import { findRepeatedSegments, searchFlows, type FlowRecord } from "@/lib/flows";
import { canManageScope } from "@/lib/item-rules";
import { screenImageUrl, type ScreenRecord } from "@/lib/screens";
import { listItems } from "@/lib/supabase/items";
import { listFlows, listProjectStepLinks } from "@/lib/supabase/flows";
import { getProject } from "@/lib/supabase/projects";
import { listScreens } from "@/lib/supabase/screens";

export default async function FlowsPage(props: PageProps<"/projects/[id]/spec/flows">) {
  const { id } = await props.params;
  const rawQuery = (await props.searchParams).q;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() ?? "";
  const profile = await getActiveProfile();

  let project;
  let flows: FlowRecord[] = [];
  let screens: ScreenRecord[] = [];
  let links: Record<string, Record<string, string>> = {};
  let groupTitles: Record<string, string> = {};
  try {
    project = await getProject(id);
    if (project) {
      const [loadedFlows, loadedScreens, loadedLinks, items] = await Promise.all([
        listFlows(id),
        listScreens(id),
        listProjectStepLinks(id),
        listItems(id),
      ]);
      flows = loadedFlows;
      screens = loadedScreens;
      links = loadedLinks;
      groupTitles = Object.fromEntries(
        items.filter((item) => item.type === "group").map((group) => [group.id, group.title]),
      );
    }
  } catch {
    return (
      <PageMessage
        title="Não foi possível carregar"
        text="Houve um problema ao falar com o banco de dados. Tente novamente em instantes."
        backHref={`/projects/${id}`}
        backLabel="Voltar para o projeto"
      />
    );
  }
  if (!project) notFound();

  const boards = buildFlowBoards({ flows, links, screens });
  const sources = flows.map((flow) => ({ id: flow.id, title: flow.title, source: flow.source }));
  const segments = findRepeatedSegments(sources);
  const matches = query ? searchFlows(sources, query) : [];
  const matchedIds = new Set(matches.map((match) => match.flowId));
  const shownBoards = query ? boards.filter((board) => matchedIds.has(board.flow.id)) : boards;
  const flowById = new Map(flows.map((flow) => [flow.id, flow]));

  const usedScreenIds = new Set(
    Object.values(links).flatMap((flowLinks) => Object.values(flowLinks)),
  );
  const looseScreens = screens.filter((screen) => !usedScreenIds.has(screen.id));
  const canEdit = canManageScope(profile);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <PageHeader
        title="Especificação"
        description="Os fluxos do produto, cada um com a sequência de telas, e as regras de negócio na outra aba."
        action={
          canEdit && (
            <Link href={`/projects/${id}/spec/flows/new`} className={buttonVariants({ size: "lg" })}>
              <Plus aria-hidden="true" />
              Novo fluxo
            </Link>
          )
        }
      />
      <SpecTabs projectId={id} current="flows" />

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-8">
          {flows.length === 0 ? (
            <div className="flex flex-col gap-1 rounded-3xl bg-card p-6">
              <p className="font-medium">Este projeto ainda não tem fluxos.</p>
              <p className="text-sm text-muted-foreground">
                {canEdit
                  ? "Use “Novo fluxo” para escrever o primeiro."
                  : "O Dono ou um Líder de área pode criar o primeiro fluxo. Troque de perfil pelo avatar."}
              </p>
            </div>
          ) : shownBoards.length === 0 ? (
            <p className="rounded-3xl bg-card p-6 text-sm">Nenhum fluxo tem “{query}”.</p>
          ) : (
            <ul className="flex flex-col gap-4" aria-label="Fluxos">
              {shownBoards.map((board) => (
                <FlowBoardCard
                  key={board.flow.id}
                  projectId={id}
                  board={board}
                  groupTitle={groupTitles[board.flow.featureId] ?? "Grupo"}
                />
              ))}
            </ul>
          )}

          {segments.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="segments-title">
              <h2 id="segments-title" className="text-xl font-semibold">
                Trechos repetidos entre fluxos
              </h2>
              <p className="text-sm text-muted-foreground">
                Dois ou mais passos seguidos com o mesmo texto em fluxos diferentes. Vale reaproveitar.
              </p>
              <ul className="flex flex-col gap-3">
                {segments.map((segment) => (
                  <li key={segment.steps.join(">")} className="flex flex-col gap-1 rounded-3xl bg-card p-5 text-sm">
                    <p className="font-medium">{segment.steps.join(" → ")}</p>
                    <p className="text-muted-foreground">
                      Em:{" "}
                      {segment.occurrences.map((occurrence, index) => {
                        const flow = flowById.get(occurrence.flowId);
                        return (
                          <span key={occurrence.flowId}>
                            {index > 0 && ", "}
                            {flow ? (
                              <Link
                                href={`/projects/${id}/spec/${flow.featureId}/flows/${flow.id}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {occurrence.flowTitle}
                              </Link>
                            ) : (
                              occurrence.flowTitle
                            )}
                          </span>
                        );
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {looseScreens.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="loose-title">
              <h2 id="loose-title" className="text-xl font-semibold">
                Telas fora de um fluxo
              </h2>
              <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {looseScreens.map((screen) => (
                  <li key={screen.id}>
                    <Link
                      href={`/projects/${id}/spec/screens/${screen.id}`}
                      className="flex flex-col gap-2 rounded-2xl bg-card p-3 text-sm font-medium outline-none hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Image
                        src={screenImageUrl(screen.storagePath)}
                        alt={`Tela ${screen.name}`}
                        width={screen.width}
                        height={screen.height}
                        unoptimized
                        className="h-32 w-full rounded-xl bg-muted object-contain"
                      />
                      {screen.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4 rounded-3xl bg-card p-5 lg:sticky lg:top-20" aria-label="Lista de fluxos">
          <form method="get" role="search" className="flex items-center gap-2 rounded-full bg-muted px-4">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              maxLength={120}
              placeholder="Buscar passo ou trecho"
              aria-label="Buscar um passo (para um trecho, separe com >)"
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </form>
          <h2 className="text-sm font-medium text-muted-foreground">
            {query ? `${matches.length} fluxo(s) com “${query}”` : `Todos os fluxos (${flows.length})`}
          </h2>
          {flows.length > 0 && (
            <ul className="flex flex-col gap-1">
              {(query ? shownBoards : boards).map((board) => {
                const match = matches.find((item) => item.flowId === board.flow.id);
                return (
                  <li key={board.flow.id}>
                    <Link
                      href={`/projects/${id}/spec/${board.flow.featureId}/flows/${board.flow.id}`}
                      className="flex flex-col rounded-xl px-3 py-2 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="font-medium">{board.flow.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {match ? match.steps.join(" → ") : (groupTitles[board.flow.featureId] ?? "Grupo")}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}
