"use client";

import { useState, useTransition } from "react";
import { updateTaskStatus } from "@/app/projects/status-actions";
import { ArrowRightLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ITEM_STATUSES, ITEM_STATUS_LABELS, type ItemStatus } from "@/lib/item-rules";
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
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOver(false);
      }}
      onDrop={drop}
      className={cn(
        "flex min-h-64 flex-col gap-3 rounded-3xl p-1 transition-colors",
        over && "bg-primary/10 ring-2 ring-primary/40",
        pending && "opacity-60",
      )}
    >
      <h2 className="flex w-fit items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm font-medium">
        <span
          aria-hidden="true"
          className={`size-2 rounded-full ${dotClass}`}
        />
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
// Without a mouse: focus the card and press the left or right arrow, or (on touch screens)
// use the small "Mover" button.
export function DragCard({
  projectId,
  id,
  title,
  status,
  canMove,
  className,
  children,
}: {
  projectId: string;
  id: string;
  title: string;
  status: ItemStatus;
  canMove: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function moveTo(next: ItemStatus) {
    if (next === status) return;
    setError(null);
    startTransition(async () => {
      const result = await updateTaskStatus(projectId, id, next);
      if (!result.ok) setError(result.error);
    });
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.target !== event.currentTarget) return;
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const next = ITEM_STATUSES[ITEM_STATUSES.indexOf(status) + step];
    if (step !== 0 && next) {
      event.preventDefault();
      moveTo(next);
    }
  }

  return (
    <div
      id={`item-${id}`}
      draggable={canMove}
      tabIndex={canMove ? 0 : undefined}
      aria-label={canMove ? `${title}. Use as setas esquerda e direita para mudar o status.` : undefined}
      aria-busy={pending}
      onKeyDown={canMove ? onKeyDown : undefined}
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ id, from: status }));
        event.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "relative outline-none focus-visible:ring-2 focus-visible:ring-ring",
        canMove && "cursor-grab active:cursor-grabbing",
        pending && "opacity-60",
        className,
      )}
    >
      {children}
      {canMove && (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Mover “${title}” para outra coluna`}
            className="absolute right-2 bottom-2 hidden size-8 items-center justify-center rounded-full bg-muted text-muted-foreground outline-none pointer-coarse:flex"
          >
            <ArrowRightLeft className="size-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {ITEM_STATUSES.filter((option) => option !== status).map((option) => (
              <DropdownMenuItem key={option} onClick={() => moveTo(option)}>
                {ITEM_STATUS_LABELS[option]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
