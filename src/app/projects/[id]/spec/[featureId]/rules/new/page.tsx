import { notFound } from "next/navigation";
import { PageMessage } from "@/components/page-message";
import { RuleForm } from "@/components/rule-form";
import { getActiveProfile } from "@/lib/active-profile";
import { canCreateItemInArea } from "@/lib/item-rules";
import { loadFeatureContext, type FeatureContext } from "@/lib/supabase/spec-context";

export default async function NewRulePage(
  props: PageProps<"/projects/[id]/spec/[featureId]/rules/new">,
) {
  const { id, featureId } = await props.params;
  const profile = await getActiveProfile();
  const back = `/projects/${id}/spec/${featureId}?tab=regras`;

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
        title="Nova regra"
        text={`Como ${profile.roleLabel}, você não escreve regras da área ${context.areaName}. Troque de perfil pelo avatar.`}
        backHref={back}
        backLabel="Voltar"
      />
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold">Nova regra em {context.feature.title}</h1>
      <RuleForm
        projectId={id}
        featureId={featureId}
        ruleId={null}
        codeLabel={null}
        initialTitle=""
        initialBody=""
        backHref={back}
      />
    </main>
  );
}
