"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/projects/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  validateProject,
  type FieldError,
  type ProjectField,
  type ProjectInput,
} from "@/lib/project-validation";

type AreaRow = { key: string; name: string };
type ParticipantRow = {
  key: string;
  name: string;
  areaKey: string;
  isOwner: boolean;
  isAreaLeader: boolean;
};

const SELECT_CLASS =
  "h-8 w-full rounded-2xl border border-transparent bg-input/50 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30";

function FieldMessages({ errors }: { errors: FieldError[] }) {
  return (
    <>
      {errors.map((error) => (
        <p key={error.message} className="text-sm text-destructive">
          {error.message}
        </p>
      ))}
    </>
  );
}

export function ProjectForm({ today }: { today: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const nextKey = useRef(1);

  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [deadline, setDeadline] = useState("");
  const [areas, setAreas] = useState<AreaRow[]>([{ key: "area-0", name: "" }]);
  const [participants, setParticipants] = useState<ParticipantRow[]>([
    { key: "participant-0", name: "", areaKey: "", isOwner: true, isAreaLeader: false },
  ]);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  function newKey(prefix: string) {
    nextKey.current += 1;
    return `${prefix}-${nextKey.current}`;
  }

  function errorsFor(field: ProjectField) {
    return fieldErrors.filter((error) => error.field === field);
  }

  function addArea() {
    setAreas((rows) => [...rows, { key: newKey("area"), name: "" }]);
  }

  function removeArea(key: string) {
    setAreas((rows) => rows.filter((row) => row.key !== key));
    // Participants of a removed area must pick another area.
    setParticipants((rows) =>
      rows.map((row) =>
        row.areaKey === key ? { ...row, areaKey: "", isAreaLeader: false } : row,
      ),
    );
  }

  function addParticipant() {
    setParticipants((rows) => [
      ...rows,
      { key: newKey("participant"), name: "", areaKey: "", isOwner: false, isAreaLeader: false },
    ]);
  }

  function removeParticipant(key: string) {
    setParticipants((rows) => rows.filter((row) => row.key !== key));
  }

  function updateParticipant(key: string, changes: Partial<ParticipantRow>) {
    setParticipants((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );
  }

  function setOwner(key: string) {
    setParticipants((rows) =>
      rows.map((row) => ({ ...row, isOwner: row.key === key })),
    );
  }

  // One leader per area: choosing a leader clears the others in the same area.
  function setLeader(key: string, checked: boolean) {
    setParticipants((rows) => {
      const target = rows.find((row) => row.key === key);
      if (!target) return rows;
      return rows.map((row) => {
        if (row.key === key) return { ...row, isAreaLeader: checked };
        if (checked && row.areaKey === target.areaKey) {
          return { ...row, isAreaLeader: false };
        }
        return row;
      });
    });
  }

  function buildInput(): ProjectInput {
    return {
      name,
      objective,
      startDate,
      deadline,
      areas: areas.map((area) => area.name),
      participants: participants.map((participant) => ({
        name: participant.name,
        area: areas.find((area) => area.key === participant.areaKey)?.name ?? "",
        isOwner: participant.isOwner,
        isAreaLeader: participant.isAreaLeader,
      })),
    };
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const input = buildInput();
    const validation = validateProject(input);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      setFormError("Corrija os campos indicados.");
      return;
    }
    setFieldErrors([]);

    startTransition(async () => {
      try {
        const result = await createProject(input);
        if (result.ok) {
          router.push(`/projects/${result.id}`);
          return;
        }
        setFormError(result.error);
        setFieldErrors(result.fieldErrors ?? []);
      } catch {
        setFormError("Não foi possível salvar o projeto. Tente novamente.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Dados do projeto</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={errorsFor("name").length > 0}
              placeholder="Ex.: Projeto Aurora"
            />
            <FieldMessages errors={errorsFor("name")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="objective">Objetivo</Label>
            <Textarea
              id="objective"
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              aria-invalid={errorsFor("objective").length > 0}
              placeholder="O que este projeto precisa entregar?"
            />
            <FieldMessages errors={errorsFor("objective")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                aria-invalid={errorsFor("startDate").length > 0}
              />
              <FieldMessages errors={errorsFor("startDate")} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="deadline">Prazo</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                aria-invalid={errorsFor("deadline").length > 0}
              />
              <FieldMessages errors={errorsFor("deadline")} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Áreas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {areas.map((area, index) => (
            <div key={area.key} className="flex items-center gap-2">
              <Input
                aria-label={`Nome da área ${index + 1}`}
                value={area.name}
                onChange={(event) =>
                  setAreas((rows) =>
                    rows.map((row) =>
                      row.key === area.key ? { ...row, name: event.target.value } : row,
                    ),
                  )
                }
                placeholder="Ex.: Design"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => removeArea(area.key)}
                aria-label={`Remover área ${area.name || index + 1}`}
              >
                Remover
              </Button>
            </div>
          ))}
          <FieldMessages errors={errorsFor("areas")} />
          <div>
            <Button type="button" variant="secondary" onClick={addArea}>
              Adicionar área
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participantes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Escolha um Dono do projeto e, se quiser, um líder por área.
          </p>
          {participants.map((participant, index) => (
            <div
              key={participant.key}
              className="flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center"
            >
              <Input
                aria-label={`Nome do participante ${index + 1}`}
                value={participant.name}
                onChange={(event) =>
                  updateParticipant(participant.key, { name: event.target.value })
                }
                placeholder="Nome (fictício)"
              />
              <select
                aria-label={`Área do participante ${index + 1}`}
                className={SELECT_CLASS}
                value={participant.areaKey}
                onChange={(event) =>
                  updateParticipant(participant.key, {
                    areaKey: event.target.value,
                    isAreaLeader: false,
                  })
                }
              >
                <option value="">Escolha a área</option>
                {areas.map((area) => (
                  <option key={area.key} value={area.key}>
                    {area.name || "(área sem nome)"}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <input
                  type="radio"
                  name="owner"
                  checked={participant.isOwner}
                  onChange={() => setOwner(participant.key)}
                />
                Dono
              </label>
              <label className="flex items-center gap-2 text-sm whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={participant.isAreaLeader}
                  disabled={!participant.areaKey}
                  onChange={(event) => setLeader(participant.key, event.target.checked)}
                />
                Líder da área
              </label>
              <Button
                type="button"
                variant="outline"
                onClick={() => removeParticipant(participant.key)}
                aria-label={`Remover participante ${participant.name || index + 1}`}
              >
                Remover
              </Button>
            </div>
          ))}
          <FieldMessages errors={errorsFor("participants")} />
          <div>
            <Button type="button" variant="secondary" onClick={addParticipant}>
              Adicionar participante
            </Button>
          </div>
        </CardContent>
      </Card>

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Criando projeto…" : "Criar projeto"}
        </Button>
      </div>
    </form>
  );
}
