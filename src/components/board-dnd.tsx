"use client";

import { useState, useTransition } from "react";
import { updateTaskStatus } from "@/app/projects/status-actions";
import { ITEM_STATUS_LABELS, type ItemStatus } from "@/lib/item-rules";
import { cn } from "@/lib/utils";

const DRAG_TYPE = "application/x-hub-task";

// A column of the board: a frame that accepts a dropped card and moves the task to its status.
export function BoardColumn({
  projectId,
  status,
  count,
  dotClass,
  children,
}: {
  projectId: string;
  status: ItemStatus;
  count: number;
  dotClass: string;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function drop(event: React.DragEvent) {
    event.preventDefault();
    setOver(false);
    const raw = event.dataTransfer.getData(DRAG_TYPE);
    if (!raw) return;
    const { id, from } = JSON.parse(raw) as { id: string; from: ItemStatus };
    if (from === status) return;
    setError(null);
    startTransition(async () => {
      const result = await updateTaskStatus(projectId, id, status);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <section
      aria-label={ITEM_STATUS_LABELS[status]}
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes(DRAG_TYPE)) {
          event.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={drop}
      className={cn(
        "flex min-h-64 flex-col gap-3 rounded-3xl bg-muted p-3 transition-colors",
        over && "bg-primary/10 ring-2 ring-primary/40",
        pending && "opacity-60",
      )}
    >
      <h2 className="flex items-center gap-2 px-1 pt-1 text-sm font-medium">
        <span aria-hidden="true" className={`size-2 rounded-full ${dotClass}`} />
        {ITEM_STATUS_LABELS[status]}
        <span className="text-muted-foreground">{count}</span>
      </h2>
      {error && (
        <p role="alert" className="px-1 text-xs text-destructive">
          {error}
        </p>
      )}
      {children}
    </section>
  );
}

// A task card that can be dragged to another column (only when the person may change it).
export function DragCard({
  id,
  status,
  canMove,
  className,
  children,
}: {
  id: string;
  status: ItemStatus;
  canMove: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={`item-${id}`}
      draggable={canMove}
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ id, from: status }));
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cn(canMove && "cursor-grab active:cursor-grabbing", className)}
    >
      {children}
    </div>
  );
}
