"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadScreen } from "@/app/projects/screens-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_SCREEN_BYTES } from "@/lib/image-analysis";

export function ScreenUploadForm({ projectId, featureId }: { projectId: string; featureId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    setDone(false);
    if (!(file instanceof File) || file.size === 0) {
      setError("Escolha um arquivo de imagem (PNG ou JPG).");
      return;
    }
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setError("Formato não suportado. Envie PNG ou JPG.");
      return;
    }
    if (file.size > MAX_SCREEN_BYTES) {
      setError("A imagem passa de 4 MB. Exporte uma versão menor.");
      return;
    }
    if (!String(data.get("name") ?? "").trim()) {
      setError("Dê um nome para a tela.");
      return;
    }
    setError(null);
    data.set("projectId", projectId);
    data.set("featureId", featureId);
    startTransition(async () => {
      const result = await uploadScreen(data);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setDone(true);
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border p-4" noValidate>
      <h3 className="font-medium">Enviar tela</h3>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="screen-name">Nome da tela</Label>
        <Input id="screen-name" name="name" maxLength={100} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="screen-file">Imagem (PNG ou JPG, até 4 MB)</Label>
        <input id="screen-file" name="file" type="file" accept="image/png,image/jpeg" className="text-sm" />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {done && <p className="text-sm">Tela enviada.</p>}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Enviar tela"}
        </Button>
      </div>
    </form>
  );
}
