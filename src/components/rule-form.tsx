"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRule } from "@/app/projects/rules-actions";
import { MarkdownView } from "@/components/markdown-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { validateRuleInput } from "@/lib/rules";

type RuleFormProps = {
  projectId: string;
  featureId: string;
  ruleId: string | null;
  codeLabel: string | null; // e.g. "RN-004" when editing; null for a new rule
  initialTitle: string;
  initialBody: string;
  backHref: string;
};

export function RuleForm(props: RuleFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(props.initialTitle);
  const [body, setBody] = useState(props.initialBody);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const problem = validateRuleInput({ title, body });
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await saveRule({
        projectId: props.projectId,
        featureId: props.featureId,
        ruleId: props.ruleId,
        title,
        body,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(props.backHref);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rule-title">
          Título {props.codeLabel ? `(${props.codeLabel})` : "(o código RN-### é gerado ao salvar)"}
        </Label>
        <Input id="rule-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-body">Texto da regra (Markdown)</Label>
          <Textarea
            id="rule-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={14}
            className="font-mono"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Pré-visualização</span>
          <div className="min-h-40 rounded-2xl border p-3">
            {body.trim() ? (
              <MarkdownView source={body} />
            ) : (
              <p className="text-sm text-muted-foreground">O texto aparece aqui enquanto você escreve.</p>
            )}
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar regra"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(props.backHref)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
