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
      <select
        aria-label={`Status da tarefa ${itemTitle}`}
        value={status}
        disabled={pending}
        onChange={(event) => handleChange(event.target.value)}
        className="h-8 w-full cursor-pointer rounded-full bg-muted px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {ITEM_STATUSES.map((option) => (
          <option key={option} value={option}>
            {ITEM_STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
