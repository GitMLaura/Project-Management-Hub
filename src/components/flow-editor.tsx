"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { linkStepScreen, saveFlow } from "@/app/projects/flows-actions";
import { MermaidPreview } from "@/components/mermaid-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseFlowchart, validateFlowInput } from "@/lib/flows";

type FlowEditorProps = {
  projectId: string;
  featureId: string;
  flowId: string | null;
  initialTitle: string;
  initialSource: string;
  readOnly: boolean;
  backHref: string;
  screens: { id: string; name: string }[];
  links: Record<string, string>; // step id -> screen id
};

const SELECT_CLASS = "h-8 rounded-2xl border bg-background px-2 text-sm";

function StepLink({
  projectId,
  flowId,
  stepId,
  stepLabel,
  screens,
  initial,
  readOnly,
}: {
  projectId: string;
  flowId: string;
  stepId: string;
  stepLabel: string;
  screens: { id: string; name: string }[];
  initial: string;
  readOnly: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (readOnly) {
    const name = screens.find((screen) => screen.id === value)?.name;
    return <span className="text-sm">{name ?? "Sem tela vinculada"}</span>;
  }

  function handleChange(next: string) {
    setValue(next);
    setError(null);
    startTransition(async () => {
      const result = await linkStepScreen(projectId, flowId, stepId, next || null);
      if (!result.ok) {
        setError(result.error);
        setValue(initial);
      }
    });
  }

  return (
    <span className="flex flex-col gap-1">
      <select
        aria-label={`Tela do passo ${stepLabel}`}
        value={value}
        disabled={pending}
        onChange={(event) => handleChange(event.target.value)}
        className={SELECT_CLASS}
      >
        <option value="">Sem tela vinculada</option>
        {screens.map((screen) => (
          <option key={screen.id} value={screen.id}>
            {screen.name}
          </option>
        ))}
      </select>
      {error && (
        <span role="alert" className="text-sm text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}

export function FlowEditor(props: FlowEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(props.initialTitle);
  const [source, setSource] = useState(props.initialSource);
  const [previewOk, setPreviewOk] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const parsed = useMemo(() => parseFlowchart(source), [source]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const problem = validateFlowInput({ title, source });
    if (problem) {
      setError(problem);
      return;
    }
    if (previewOk === false) {
      setError("Corrija o erro do diagrama antes de salvar.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await saveFlow({
        projectId: props.projectId,
        featureId: props.featureId,
        flowId: props.flowId,
        title,
        source,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (props.flowId) {
        router.refresh();
      } else {
        router.push(props.backHref);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="flow-title">Título do fluxo</Label>
          <Input
            id="flow-title"
            value={title}
            disabled={props.readOnly}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={140}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="flow-source">Diagrama (Mermaid)</Label>
            <Textarea
              id="flow-source"
              value={source}
              readOnly={props.readOnly}
              onChange={(e) => setSource(e.target.value)}
              rows={14}
              className="font-mono"
            />
            {parsed.errors.map((message) => (
              <p key={message} role="alert" className="text-sm text-destructive">
                {message}
              </p>
            ))}
            {parsed.warnings.map((message) => (
              <p key={message} className="text-sm text-muted-foreground">
                Aviso: {message}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Pré-visualização</span>
            <div className="min-h-40 rounded-2xl border p-3">
              <MermaidPreview source={source} onValidity={setPreviewOk} />
            </div>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {!props.readOnly && (
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvando..." : "Salvar fluxo"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push(props.backHref)}>
              Cancelar
            </Button>
          </div>
        )}
      </form>

      <section className="flex flex-col gap-2" aria-label="Passos e telas">
        <h2 className="text-lg font-semibold">Passos e telas</h2>
        {!props.flowId ? (
          <p className="text-sm text-muted-foreground">
            Salve o fluxo para vincular cada passo a uma tela.
          </p>
        ) : parsed.nodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">O fluxo ainda não tem passos.</p>
        ) : props.screens.length === 0 && !props.readOnly ? (
          <p className="text-sm text-muted-foreground">
            Este projeto ainda não tem telas. Envie telas na aba Telas de uma funcionalidade para vincular aos passos.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {parsed.nodes.map((node) => (
              <li key={node.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-2">
                <span className="text-sm font-medium">{node.label}</span>
                <StepLink
                  projectId={props.projectId}
                  flowId={props.flowId as string}
                  stepId={node.id}
                  stepLabel={node.label}
                  screens={props.screens}
                  initial={props.links[node.id] ?? ""}
                  readOnly={props.readOnly}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
