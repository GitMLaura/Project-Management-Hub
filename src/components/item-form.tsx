"use client";

import { useState, useTransition } from "react";
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
  deadlineLimitError,
  validateItem,
  type ItemField,
  type ItemFieldError,
  type ItemInput,
  type ItemStatus,
} from "@/lib/item-rules";

const SELECT_CLASS =
  "h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-60";

type ItemFormProps = {
  projectId: string;
  groups: { id: string; title: string }[];
  initialGroupId: string; // "" = a loose task
  areas: { id: string; name: string }[];
  participants: { id: string; name: string }[];
  fixedAreaId: string | null; // area leaders can only create tasks in their own area
  // Latest allowed deadline: the project's.
  maxDeadline: string | null;
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
  groups,
  initialGroupId,
  areas,
  participants,
  fixedAreaId,
  maxDeadline,
}: ItemFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState(initialGroupId);
  const [areaId, setAreaId] = useState(fixedAreaId ?? "");
  const [assigneeId, setAssigneeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<ItemStatus>("a_fazer");
  const [isCritical, setIsCritical] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ItemFieldError[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  function errorsFor(field: ItemField) {
    return fieldErrors.filter((error) => error.field === field);
  }

  // Warns right away, before the user submits.
  const liveDeadlineWarning = deadlineLimitError(deadline, maxDeadline);

  function buildInput(): ItemInput {
    return {
      projectId,
      groupId: groupId || null,
      title,
      description,
      areaId,
      assigneeId,
      startDate,
      deadline,
      status,
      isCritical,
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const input = buildInput();
    const validation = validateItem(input, maxDeadline);
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
          router.push(`/projects/${projectId}/scope`);
          return;
        }
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? []);
      } catch {
        setFormError("Não foi possível salvar a tarefa. Tente novamente.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardContent className="flex flex-col gap-4 pt-4">
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="group">Grupo (opcional)</Label>
            <select
              id="group"
              className={SELECT_CLASS}
              value={groupId}
              onChange={(event) => setGroupId(event.target.value)}
            >
              <option value="">Sem grupo</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.title}
                </option>
              ))}
            </select>
          </div>

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
                  Seu perfil só cria tarefas da sua área.
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
              <Label htmlFor="startDate">Início (opcional)</Label>
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
                max={maxDeadline ?? undefined}
                onChange={(event) => setDeadline(event.target.value)}
                aria-invalid={errorsFor("deadline").length > 0 || liveDeadlineWarning !== null}
              />
              {liveDeadlineWarning && (
                <p className="text-sm text-destructive">{liveDeadlineWarning}</p>
              )}
              <FieldMessages
                errors={errorsFor("deadline").filter(
                  (error) => error.message !== liveDeadlineWarning,
                )}
              />
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
              {isPending ? "Salvando…" : "Criar tarefa"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
