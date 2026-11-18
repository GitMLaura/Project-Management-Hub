"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTaskFromPending } from "@/app/projects/rituals-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PersonOption, GroupOption } from "@/lib/pending-task";

export function PendingTaskForm({
  projectId,
  pendingId,
  groups,
  people,
  defaultAssigneeId,
}: {
  projectId: string;
  pendingId: string;
  groups: GroupOption[];
  people: PersonOption[];
  defaultAssigneeId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState(""); // "" = a loose task
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId);
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Criar tarefa
        </Button>
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!assigneeId) return setError("Escolha o responsável.");
    if (!deadline) return setError("Informe o prazo.");
    setError(null);
    startTransition(async () => {
      const result = await createTaskFromPending(projectId, pendingId, groupId, assigneeId, deadline);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-xl border p-3 text-sm" noValidate>
      <label className="flex flex-col gap-1">
        Grupo (opcional)
        <select
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
          className="h-9 rounded-md border bg-background px-2"
        >
          <option value="">Sem grupo</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1">
          Responsável
          <select
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            className="h-9 rounded-md border bg-background px-2"
          >
            <option value="">Escolha</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Prazo
          <Input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className="w-44" />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Criando..." : "Criar tarefa"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
