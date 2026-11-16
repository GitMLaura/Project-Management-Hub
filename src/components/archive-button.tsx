"use client";

import { useState, useTransition } from "react";
import { archiveItem, restoreItem } from "@/app/projects/archive-actions";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="flex flex-col gap-1">
      <div>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleClick}>
          {pending
            ? mode === "archive"
              ? "Arquivando..."
              : "Restaurando..."
            : mode === "archive"
              ? "Arquivar"
              : "Restaurar"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
