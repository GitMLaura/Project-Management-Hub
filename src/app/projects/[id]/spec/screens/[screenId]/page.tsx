import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageMessage } from "@/components/page-message";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseFlowchart, type FlowRecord } from "@/lib/flows";
import {
  findMatchesForScreen,
  screenImageUrl,
  type ScreenMatch,
  type ScreenRecord,
} from "@/lib/screens";
import { listFlows, listScreenLinks } from "@/lib/supabase/flows";
import { getProject } from "@/lib/supabase/projects";
import { listScreens } from "@/lib/supabase/screens";

export default async function ScreenDetailPage(props: PageProps<"/projects/[id]/spec/screens/[screenId]">) {
  const { id, screenId } = await props.params;

  let project;
  let screens: ScreenRecord[] = [];
  let flows: FlowRecord[] = [];
  let links: { flowId: string; stepId: string }[] = [];
  try {
    project = await getProject(id);
    if (project) {
      [screens, flows, links] = await Promise.all([listScreens(id), listFlows(id), listScreenLinks(screenId)]);
    }
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
  const screen = screens.find((item) => item.id === screenId);
  if (!screen) notFound();

  const flowById = new Map(flows.map((flow) => [flow.id, flow]));
  const usages = links.flatMap((link) => {
    const flow = flowById.get(link.flowId);
    if (!flow) return [];
    const label = parseFlowchart(flow.source).nodes.find((node) => node.id === link.stepId)?.label ?? link.stepId;
    return [{ flow, label }];
  });
  const matches: ScreenMatch[] = findMatchesForScreen(screen, screens);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{project.name}</p>
        <h1 className="text-2xl font-semibold">{screen.name}</h1>
        <p className="text-sm text-muted-foreground">
          {screen.width} × {screen.height} px · {Math.round(screen.sizeBytes / 1024)} KB
          {screen.isReference && " · Referência"}
        </p>
      </div>

      <Image
        src={screenImageUrl(screen.storagePath)}
        alt={`Tela ${screen.name}`}
        width={screen.width}
        height={screen.height}
        unoptimized
        className="max-h-96 w-full rounded-md border object-contain"
      />

      <section className="flex flex-col gap-3" aria-label="Fluxos">
        <h2 className="text-lg font-semibold">Em quais fluxos aparece</h2>
        {usages.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col gap-1 pt-4">
              <p className="font-medium">Esta tela ainda não está em nenhum fluxo.</p>
              <p className="text-sm text-muted-foreground">Vincule a tela a um passo no editor de fluxos.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {usages.map(({ flow, label }) => (
              <li key={`${flow.id}-${label}`} className="flex flex-col text-sm">
                <Link
                  href={`/projects/${id}/spec/${flow.featureId}/flows/${flow.id}`}
                  className="font-medium underline underline-offset-2"
                >
                  {flow.title}
                </Link>
                <span className="text-muted-foreground">Passo: {label}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-label="Telas parecidas">
        <h2 className="text-lg font-semibold">Telas idênticas ou semelhantes</h2>
        {matches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col gap-1 pt-4">
              <p className="font-medium">Nenhuma tela idêntica ou semelhante.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {matches.map((match) => (
              <li key={match.screen.id} className="flex flex-col gap-2 rounded-2xl border p-3">
                <Image
                  src={screenImageUrl(match.screen.storagePath)}
                  alt={`Tela ${match.screen.name}`}
                  width={match.screen.width}
                  height={match.screen.height}
                  unoptimized
                  className="max-h-40 w-full rounded-md border object-contain"
                />
                <Link
                  href={`/projects/${id}/spec/screens/${match.screen.id}`}
                  className="font-medium underline underline-offset-2"
                >
                  {match.screen.name}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {match.kind === "exact" ? "Cópia exata" : `Semelhante (${match.distance} bits de diferença)`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link href={`/projects/${id}/spec/screens`} className={buttonVariants({ variant: "outline" })}>
          Telas repetidas
        </Link>
        <Link href={`/projects/${id}/spec`} className={buttonVariants({ variant: "outline" })}>
          Voltar para a especificação
        </Link>
      </div>
    </main>
  );
}
