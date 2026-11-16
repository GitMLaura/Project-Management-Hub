import { notFound } from "next/navigation";
import { FlowEditor } from "@/components/flow-editor";
import { PageMessage } from "@/components/page-message";
import { getActiveProfile } from "@/lib/active-profile";
import type { FlowRecord } from "@/lib/flows";
import { canCreateItemInArea } from "@/lib/item-rules";
import type { ScreenRecord } from "@/lib/screens";
import { getFlow, listStepLinks } from "@/lib/supabase/flows";
import { listScreens } from "@/lib/supabase/screens";
import { loadFeatureContext, type FeatureContext } from "@/lib/supabase/spec-context";

export default async function FlowPage(
  props: PageProps<"/projects/[id]/spec/[featureId]/flows/[flowId]">,
) {
  const { id, featureId, flowId } = await props.params;
  const profile = await getActiveProfile();
  const back = `/projects/${id}/spec/${featureId}?tab=fluxos`;

  let context: FeatureContext | null;
  let flow: FlowRecord | null = null;
  let links: Record<string, string> = {};
  let screens: ScreenRecord[] = [];
  try {
    context = await loadFeatureContext(id, featureId);
    if (context) {
      flow = await getFlow(id, flowId);
      if (flow) {
        links = await listStepLinks(flowId);
        screens = await listScreens(id);
      }
    }
  } catch {
    return (
      <PageMessage
        title="Não foi possível carregar"
        text="Houve um problema ao falar com o banco de dados. Tente novamente em instantes."
        backHref={back}
        backLabel="Voltar"
      />
    );
  }
  if (!context || !flow || flow.featureId !== featureId) notFound();

  const canEdit = canCreateItemInArea(profile, context.areaName);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{context.feature.title}</p>
        <h1 className="text-2xl font-semibold">{flow.title}</h1>
        {!canEdit && (
          <p className="text-sm text-muted-foreground">
            Só consulta: o líder da área {context.areaName} (ou o Dono) edita este fluxo.
          </p>
        )}
      </div>
      <FlowEditor
        projectId={id}
        featureId={featureId}
        flowId={flow.id}
        initialTitle={flow.title}
        initialSource={flow.source}
        readOnly={!canEdit}
        backHref={back}
        screens={screens.map((screen) => ({ id: screen.id, name: screen.name }))}
        links={links}
      />
    </main>
  );
}
