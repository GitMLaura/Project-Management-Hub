"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveSummary } from "@/app/projects/rituals-actions";
import { Button } from "@/components/ui/button";

export function ApproveSummaryButton({ projectId, summaryId }: { projectId: string; summaryId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await approveSummary(projectId, summaryId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div>
        <Button type="button" size="sm" onClick={handleClick} disabled={pending}>
          {pending ? "Aprovando..." : "Aprovar resumo"}
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
