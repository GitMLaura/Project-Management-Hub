"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createItem } from "@/app/projects/items-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ITEM_STATUSES,
  ITEM_STATUS_LABELS,
  validateItem,
  type ItemField,
  type ItemFieldError,
  type ItemInput,
  type ItemStatus,
  type ItemType,
} from "@/lib/item-rules";

const SELECT_CLASS =
  "h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-60";

type ItemFormProps = {
  projectId: string;
  type: ItemType;
  typeLabel: string;
  parent: { id: string; title: string; typeLabel: string; deadline: string } | null;
  areas: { id: string; name: string }[];
  participants: { id: string; name: string }[];
  fixedAreaId: string | null; // area leaders can only create items in their own area
  today: string;
};

function FieldMessages({ errors }: { errors: ItemFieldError[] }) {
  return (
    <>
      {errors.map((error) => (
        <p key={error.message} className="text-sm text-destructive">
          {error.message}
        </p>
      ))}
    </>
  );
}

export function ItemForm({
  projectId,
  type,
  typeLabel,
  parent,
  areas,
  participants,
  fixedAreaId,
  today,
}: ItemFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const nextKey = useRef(1);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [areaId, setAreaId] = useState(fixedAreaId ?? "");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState(type === "task" ? "" : today);
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<ItemStatus>("a_fazer");
  const [isCritical, setIsCritical] = useState(false);
  const [persona, setPersona] = useState("");
  const [action, setAction] = useState("");
  const [benefit, setBenefit] = useState("");
  const [criteria, setCriteria] = useState<{ key: string; text: string }[]>([
    { key: "criterion-0", text: "" },
  ]);
  const [fieldErrors, setFieldErrors] = useState<ItemFieldError[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  function errorsFor(field: ItemField) {
    return fieldErrors.filter((error) => error.field === field);
  }

  function buildInput(): ItemInput {
    return {
      projectId,
      type,
      parentId: parent?.id ?? null,
      title,
      description,
      areaId,
      assigneeId,
      startDate,
      deadline,
      status,
      isCritical,
      storyPersona: persona,
      storyAction: action,
      storyBenefit: benefit,
      acceptanceCriteria: criteria.map((criterion) => criterion.text),
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const input = buildInput();
    const validation = validateItem(input);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      setFormError("Corrija os campos indicados.");
      return;
    }
    setFieldErrors([]);

    startTransition(async () => {
      try {
        const result = await createItem(input);
        if (result.ok) {
          router.push(`/projects/${projectId}`);
          return;
        }
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? []);
      } catch {
        setFormError("Não foi possível salvar o item. Tente novamente.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardContent className="flex flex-col gap-4 pt-4">
          {parent && (
            <p className="text-sm text-muted-foreground">
              Dentro de <strong>{parent.typeLabel}: {parent.title}</strong> (prazo{" "}
              {parent.deadline.split("-").reverse().join("/")}).
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              aria-invalid={errorsFor("title").length > 0}
            />
            <FieldMessages errors={errorsFor("title")} />
          </div>

          {type === "story" && (
            <fieldset className="flex flex-col gap-3 rounded-2xl border p-3">
              <legend className="px-1 text-sm font-medium">História</legend>
              <div className="flex flex-col gap-2">
                <Label htmlFor="persona">Como…</Label>
                <Input
                  id="persona"
                  value={persona}
                  onChange={(event) => setPersona(event.target.value)}
                  placeholder="Ex.: cliente do app de delivery"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="action">quero…</Label>
                <Input
                  id="action"
                  value={action}
                  onChange={(event) => setAction(event.target.value)}
                  placeholder="Ex.: recuperar minha senha"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="benefit">para…</Label>
                <Input
                  id="benefit"
                  value={benefit}
                  onChange={(event) => setBenefit(event.target.value)}
                  placeholder="Ex.: voltar a pedir comida"
                />
              </div>
              <FieldMessages errors={errorsFor("story")} />

              <div className="flex flex-col gap-2">
                <Label>Critérios de aceite</Label>
                {criteria.map((criterion, index) => (
                  <div key={criterion.key} className="flex items-center gap-2">
                    <Input
                      aria-label={`Critério de aceite ${index + 1}`}
                      value={criterion.text}
                      onChange={(event) =>
                        setCriteria((rows) =>
                          rows.map((row) =>
                            row.key === criterion.key
                              ? { ...row, text: event.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setCriteria((rows) => rows.filter((row) => row.key !== criterion.key))
                      }
                      aria-label={`Remover critério ${index + 1}`}
                    >
                      Remover
                    </Button>
                  </div>
                ))}
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      nextKey.current += 1;
                      setCriteria((rows) => [
                        ...rows,
                        { key: `criterion-${nextKey.current}`, text: "" },
                      ]);
                    }}
                  >
                    Adicionar critério
                  </Button>
                </div>
              </div>
            </fieldset>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="area">Área</Label>
              <select
                id="area"
                className={SELECT_CLASS}
                value={areaId}
                disabled={fixedAreaId !== null}
                onChange={(event) => setAreaId(event.target.value)}
                aria-invalid={errorsFor("areaId").length > 0}
              >
                <option value="">Escolha a área</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
              {fixedAreaId !== null && (
                <p className="text-xs text-muted-foreground">
                  Seu perfil só cria itens da sua área.
                </p>
              )}
              <FieldMessages errors={errorsFor("areaId")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="assignee">Responsável</Label>
              <select
                id="assignee"
                className={SELECT_CLASS}
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
                aria-invalid={errorsFor("assigneeId").length > 0}
              >
                <option value="">Escolha o responsável</option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name}
                  </option>
                ))}
              </select>
              <FieldMessages errors={errorsFor("assigneeId")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">
                Início{type === "task" ? " (opcional)" : ""}
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                aria-invalid={errorsFor("startDate").length > 0}
              />
              <FieldMessages errors={errorsFor("startDate")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                aria-invalid={errorsFor("deadline").length > 0}
              />
              <FieldMessages errors={errorsFor("deadline")} />
            </div>
          </div>

          <div className="grid items-end gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className={SELECT_CLASS}
                value={status}
                onChange={(event) => setStatus(event.target.value as ItemStatus)}
              >
                {ITEM_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {ITEM_STATUS_LABELS[value]}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isCritical}
                onChange={(event) => setIsCritical(event.target.checked)}
              />
              Crítico (não pode atrasar)
            </label>
          </div>

          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}
          <div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando…" : `Criar ${typeLabel.toLowerCase()}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
