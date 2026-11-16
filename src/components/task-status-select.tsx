"use client";

import { useState, useTransition } from "react";
import { updateTaskStatus } from "@/app/projects/status-actions";
import { ITEM_STATUSES, ITEM_STATUS_LABELS, isItemStatus, type ItemStatus } from "@/lib/item-rules";

type TaskStatusSelectProps = {
  projectId: string;
  itemId: string;
  itemTitle: string;
  status: ItemStatus;
};

export function TaskStatusSelect({ projectId, itemId, itemTitle, status }: TaskStatusSelectProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(value: string) {
    if (!isItemStatus(value)) return;
    setError(null);
    startTransition(async () => {
      const result = await updateTaskStatus(projectId, itemId, value);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-center gap-2 text-sm">
        Status
        <select
          aria-label={`Status da tarefa ${itemTitle}`}
          value={status}
          disabled={pending}
          onChange={(event) => handleChange(event.target.value)}
          className="h-8 rounded-md border bg-background px-2 text-sm"
        >
          {ITEM_STATUSES.map((option) => (
            <option key={option} value={option}>
              {ITEM_STATUS_LABELS[option]}
            </option>
          ))}
        </select>
        {pending && <span className="text-muted-foreground">Salvando...</span>}
      </label>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
