import { notFound } from "next/navigation";
import { FlowEditor } from "@/components/flow-editor";
import { PageMessage } from "@/components/page-message";
import { getActiveProfile } from "@/lib/active-profile";
import { canCreateItemInArea } from "@/lib/item-rules";
import { loadFeatureContext, type FeatureContext } from "@/lib/supabase/spec-context";

const TEMPLATE = "flowchart TD\n  A[Abrir o app] --> B[Informar e-mail]\n  B --> C[Validar senha]\n  C --> D[Entrar]\n";

export default async function NewFlowPage(
  props: PageProps<"/projects/[id]/spec/[featureId]/flows/new">,
) {
  const { id, featureId } = await props.params;
  const profile = await getActiveProfile();
  const back = `/projects/${id}/spec/${featureId}?tab=fluxos`;

  let context: FeatureContext | null;
  try {
    context = await loadFeatureContext(id, featureId);
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
  if (!context) notFound();

  if (!canCreateItemInArea(profile, context.areaName)) {
    return (
      <PageMessage
        title="Novo fluxo"
        text={`Como ${profile.roleLabel}, você não cria fluxos da área ${context.areaName}. Troque de perfil pelo avatar.`}
        backHref={back}
        backLabel="Voltar"
      />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Novo fluxo em {context.feature.title}</h1>
      <FlowEditor
        projectId={id}
        featureId={featureId}
        flowId={null}
        initialTitle=""
        initialSource={TEMPLATE}
        readOnly={false}
        backHref={back}
        screens={[]}
        links={{}}
      />
    </main>
  );
}
