"use client";

import { useState, useTransition } from "react";
import { archiveItem, restoreItem } from "@/app/projects/archive-actions";
import { Archive, RotateCcw } from "lucide-react";

type ArchiveButtonProps = {
  projectId: string;
  itemId: string;
  itemTitle: string;
  mode: "archive" | "restore";
  descendants: number;
};

export function ArchiveButton({ projectId, itemId, itemTitle, mode, descendants }: ArchiveButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (mode === "archive") {
      const extra = descendants > 0 ? ` e os ${descendants} itens dentro dele` : "";
      if (!window.confirm(`Arquivar "${itemTitle}"${extra}? Você pode restaurar depois.`)) return;
    }
    setError(null);
    startTransition(async () => {
      const result =
        mode === "archive"
          ? await archiveItem(projectId, itemId)
          : await restoreItem(projectId, itemId);
      if (!result.ok) setError(result.error);
    });
  }

  const label = mode === "archive" ? "Arquivar" : "Restaurar";
  const Icon = mode === "archive" ? Archive : RotateCcw;
  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={handleClick}
        aria-label={`${label} ${itemTitle}`}
        title={pending ? `${label}...` : label}
        className="flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <Icon className="size-4" aria-hidden="true" />
      </button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
