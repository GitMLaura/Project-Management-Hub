"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReferenceScreen } from "@/app/projects/screens-actions";
import { Button } from "@/components/ui/button";

export function ReferenceScreenButton({
  projectId,
  screenId,
  groupIds,
}: {
  projectId: string;
  screenId: string;
  groupIds: string[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await setReferenceScreen(projectId, screenId, groupIds);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={pending}>
        {pending ? "Salvando..." : "Manter só esta como referência"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
