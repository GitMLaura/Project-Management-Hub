"use client";

import { Layers, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useTransition } from "react";
import { createGroup } from "@/app/projects/items-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GROUP_LABELS, type GroupLabel } from "@/lib/item-rules";

type Selection = {
  selected: string[];
  toggle: (id: string) => void;
  clear: () => void;
};

const SelectionContext = createContext<Selection | null>(null);

// Holds the tasks ticked in the list and shows the "Agrupar" bar while there are any.
export function SelectionProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState<GroupLabel>("feature");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const value: Selection = {
    selected,
    toggle: (id) =>
      setSelected((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
      ),
    clear: () => {
      setSelected([]);
      setError(null);
    },
  };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = await createGroup({ projectId, title, label, taskIds: selected });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setSelected([]);
        setTitle("");
        router.refresh();
      } catch {
        setError("Não foi possível agrupar. Tente novamente.");
      }
    });
  }

  return (
    <SelectionContext.Provider value={value}>
      {children}
      {selected.length > 0 && (
        <form
          onSubmit={submit}
          aria-label="Agrupar tarefas"
          className="fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-3xl flex-wrap items-center gap-3 rounded-3xl bg-foreground p-3 pl-5 text-background shadow-lg md:bottom-6 md:left-24"
        >
          <span className="text-sm font-medium" aria-live="polite">
            {selected.length} {selected.length === 1 ? "tarefa marcada" : "tarefas marcadas"}
          </span>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Nome do grupo"
            aria-label="Nome do grupo"
            className="h-9 min-w-40 flex-1 bg-background text-foreground"
          />
          <select
            value={label}
            onChange={(event) => setLabel(event.target.value as GroupLabel)}
            aria-label="Chamar o grupo de"
            className="h-9 rounded-2xl bg-background px-3 text-sm text-foreground outline-none"
          >
            {(Object.keys(GROUP_LABELS) as GroupLabel[]).map((key) => (
              <option key={key} value={key}>
                {GROUP_LABELS[key]}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={pending}>
            <Layers aria-hidden="true" />
            {pending ? "Agrupando…" : "Agrupar"}
          </Button>
          <button
            type="button"
            onClick={value.clear}
            aria-label="Cancelar seleção"
            className="flex size-9 items-center justify-center rounded-full outline-none hover:bg-background/15 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          {error && (
            <p role="alert" className="basis-full text-sm text-red-300">
              {error}
            </p>
          )}
        </form>
      )}
    </SelectionContext.Provider>
  );
}

export function TaskCheckbox({ id, title }: { id: string; title: string }) {
  const selection = useContext(SelectionContext);
  if (!selection) return <span className="size-6 shrink-0" aria-hidden="true" />;
  return (
    <label className="flex size-6 shrink-0 cursor-pointer items-center justify-center">
      <input
        type="checkbox"
        checked={selection.selected.includes(id)}
        onChange={() => selection.toggle(id)}
        aria-label={`Marcar “${title}” para agrupar`}
        className="size-4 accent-[var(--primary)]"
      />
    </label>
  );
}
