"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importRitual } from "@/app/projects/rituals-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_TRANSCRIPT_BYTES, RITUAL_KINDS, validateRitualImport } from "@/lib/transcripts";

type AreaOption = { id: string; name: string; participants: { id: string; name: string }[] };

export function RitualImportForm({ projectId, areas }: { projectId: string; areas: AreaOption[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const file = data.get("file");
    const fileName = file instanceof File ? file.name : "";
    const problem = validateRitualImport({
      title: String(data.get("title") ?? ""),
      kind: String(data.get("kind") ?? ""),
      heldOn: String(data.get("heldOn") ?? ""),
      participantCount: data.getAll("participantId").length,
      fileName,
      fileSize: file instanceof File ? file.size : 0,
    });
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    data.set("projectId", projectId);
    startTransition(async () => {
      const result = await importRitual(data);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/projects/${projectId}/rituals/${result.ritualId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ritual-title">Título</Label>
        <Input id="ritual-title" name="title" maxLength={120} placeholder="Ex.: Daily de 10/11" />
      </div>
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ritual-kind">Tipo</Label>
          <select id="ritual-kind" name="kind" defaultValue="" className="h-9 rounded-md border bg-background px-2 text-sm">
            <option value="" disabled>
              Escolha
            </option>
            {RITUAL_KINDS.map((kind) => (
              <option key={kind.value} value={kind.value}>
                {kind.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ritual-date">Data</Label>
          <Input id="ritual-date" name="heldOn" type="date" className="w-44" />
        </div>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Participantes</legend>
        {areas.map((area) => (
          <div key={area.id} className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{area.name}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {area.participants.map((participant) => (
                <label key={participant.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="participantId" value={participant.id} />
                  {participant.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ritual-file">Transcrição (.txt ou .vtt, até {MAX_TRANSCRIPT_BYTES / 1_000_000} MB)</Label>
        <input id="ritual-file" name="file" type="file" accept=".txt,.vtt" className="text-sm" />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Importando..." : "Importar rito"}
        </Button>
      </div>
    </form>
  );
}
