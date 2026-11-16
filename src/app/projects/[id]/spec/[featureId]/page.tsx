import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { MarkdownView } from "@/components/markdown-view";
import { PageMessage } from "@/components/page-message";
import { ScreenUploadForm } from "@/components/screen-upload-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveProfile } from "@/lib/active-profile";
import { canCreateItemInArea } from "@/lib/item-rules";
import { formatRuleCode } from "@/lib/rules";
import type { FlowRecord } from "@/lib/flows";
import { listFlows } from "@/lib/supabase/flows";
import { listRules } from "@/lib/supabase/rules";
import { screenImageUrl, type ScreenRecord } from "@/lib/screens";
import { listScreens } from "@/lib/supabase/screens";
import { loadFeatureContext, type FeatureContext } from "@/lib/supabase/spec-context";

const TABS = [
  { id: "regras", label: "Regras" },
  { id: "fluxos", label: "Fluxos" },
  { id: "telas", label: "Telas" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function parseTab(value: string | string[] | undefined): TabId {
  const single = Array.isArray(value) ? value[0] : value;
  return TABS.find((tab) => tab.id === single)?.id ?? "regras";
}

export default async function FeatureSpecPage(props: PageProps<"/projects/[id]/spec/[featureId]">) {
  const { id, featureId } = await props.params;
  const tab = parseTab((await props.searchParams).tab);
  const profile = await getActiveProfile();

  let context: FeatureContext | null;
  let rules;
  let flows: FlowRecord[] = [];
  let screens: ScreenRecord[] = [];
  try {
    context = await loadFeatureContext(id, featureId);
    rules = context ? (await listRules(id)).filter((rule) => rule.featureId === featureId) : [];
    flows = context ? (await listFlows(id)).filter((flow) => flow.featureId === featureId) : [];
    screens = context ? (await listScreens(id)).filter((screen) => screen.featureId === featureId) : [];
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
  if (!context) notFound();

  const { project, feature, epic, areaName } = context;
  const canEdit = canCreateItemInArea(profile, areaName);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          {project.name}
          {epic ? ` › ${epic.title}` : ""}
        </p>
        <h1 className="text-2xl font-semibold">{feature.title}</h1>
        <p className="text-sm text-muted-foreground">Área responsável: {areaName}</p>
      </div>

      <nav aria-label="Especificação" className="flex gap-2">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={`/projects/${id}/spec/${featureId}?tab=${item.id}`}
            aria-current={tab === item.id ? "page" : undefined}
            className={buttonVariants({ variant: tab === item.id ? "default" : "outline", size: "sm" })}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "regras" && (
        <section className="flex flex-col gap-3" aria-label="Regras de negócio">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Regras de negócio</h2>
            <div className="flex flex-wrap gap-2">
              {rules.length > 0 && (
                <a
                  href={`/projects/${id}/rules/export?scope=feature&item=${featureId}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Baixar .md
                </a>
              )}
              {rules.length > 0 && (
                <a
                  href={`/projects/${id}/rules/export?scope=feature&item=${featureId}&format=pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Ver PDF
                </a>
              )}
              {rules.length > 0 && (
                <a
                  href={`/projects/${id}/rules/export?scope=feature&item=${featureId}&format=pdf&download=1`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Baixar PDF
                </a>
              )}
              {canEdit && (
                <Link href={`/projects/${id}/spec/${featureId}/rules/new`} className={buttonVariants()}>
                  Nova regra
                </Link>
              )}
            </div>
          </div>
          {rules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col gap-1 pt-4">
                <p className="font-medium">Esta funcionalidade ainda não tem regras de negócio.</p>
                <p className="text-sm text-muted-foreground">
                  {canEdit
                    ? "Comece escrevendo a primeira regra."
                    : `O líder da área ${areaName} (ou o Dono) pode escrever as regras. Troque de perfil pelo avatar.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id} id={formatRuleCode(rule.code)}>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{formatRuleCode(rule.code)}</Badge>
                    <span>{rule.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <MarkdownView source={rule.body} />
                  {canEdit && (
                    <div>
                      <Link
                        href={`/projects/${id}/spec/${featureId}/rules/${rule.id}/edit`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        Editar
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </section>
      )}

      {tab === "fluxos" && (
        <section className="flex flex-col gap-3" aria-label="Fluxos">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Fluxos</h2>
            {canEdit && (
              <Link href={`/projects/${id}/spec/${featureId}/flows/new`} className={buttonVariants()}>
                Novo fluxo
              </Link>
            )}
          </div>
          {flows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col gap-1 pt-4">
                <p className="font-medium">Esta funcionalidade ainda não tem fluxos.</p>
                <p className="text-sm text-muted-foreground">
                  {canEdit
                    ? "Crie o primeiro fluxo em Mermaid."
                    : `O líder da área ${areaName} (ou o Dono) pode criar fluxos. Troque de perfil pelo avatar.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {flows.map((flow) => (
                <li key={flow.id}>
                  <Link
                    href={`/projects/${id}/spec/${featureId}/flows/${flow.id}`}
                    className="font-medium underline underline-offset-2"
                  >
                    {flow.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {tab === "telas" && (
        <section className="flex flex-col gap-3" aria-label="Telas">
          <h2 className="text-lg font-semibold">Telas</h2>
          {canEdit && <ScreenUploadForm projectId={id} featureId={featureId} />}
          {screens.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col gap-1 pt-4">
                <p className="font-medium">Esta funcionalidade ainda não tem telas.</p>
                <p className="text-sm text-muted-foreground">
                  {canEdit
                    ? "Envie a primeira tela (PNG ou JPG) acima."
                    : `O líder da área ${areaName} (ou o Dono) pode enviar telas. Troque de perfil pelo avatar.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {screens.map((screen) => (
                <li key={screen.id} className="flex flex-col gap-2 rounded-2xl border p-3">
                  <Image
                    src={screenImageUrl(screen.storagePath)}
                    alt={`Tela ${screen.name}`}
                    width={screen.width}
                    height={screen.height}
                    unoptimized
                    className="max-h-56 w-full rounded-md border object-contain"
                  />
                  <Link
                    href={`/projects/${id}/spec/screens/${screen.id}`}
                    className="font-medium underline underline-offset-2"
                  >
                    {screen.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {screen.width} × {screen.height} px · {Math.round(screen.sizeBytes / 1024)} KB
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <div>
        <Link href={`/projects/${id}/spec`} className={buttonVariants({ variant: "outline" })}>
          Voltar para a especificação
        </Link>
      </div>
    </main>
  );
}
