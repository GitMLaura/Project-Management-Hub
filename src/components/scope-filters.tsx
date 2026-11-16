import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ITEM_STATUSES, ITEM_STATUS_LABELS } from "@/lib/item-rules";
import type { ScopeFilters as Filters } from "@/lib/scope-view";

type Option = { id: string; name: string };

type ScopeFiltersProps = {
  projectId: string;
  areas: Option[];
  people: Option[];
  current: Filters;
};

const SELECT_CLASS = "h-9 rounded-md border bg-background px-2 text-sm";

// A plain GET form: the filters live in the URL, so no client JavaScript is needed.
export function ScopeFilters({ projectId, areas, people, current }: ScopeFiltersProps) {
  const active = Boolean(current.areaId || current.assigneeId || current.status);
  return (
    <form method="get" className="flex flex-wrap items-end gap-3" aria-label="Filtros do escopo">
      <label className="flex flex-col gap-1 text-sm">
        Área
        <select name="area" defaultValue={current.areaId ?? ""} className={SELECT_CLASS}>
          <option value="">Todas</option>
          {areas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Responsável
        <select name="assignee" defaultValue={current.assigneeId ?? ""} className={SELECT_CLASS}>
          <option value="">Todos</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Status
        <select name="status" defaultValue={current.status ?? ""} className={SELECT_CLASS}>
          <option value="">Todos</option>
          {ITEM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {ITEM_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="outline" size="sm">
        Filtrar
      </Button>
      {active && (
        <Link
          href={`/projects/${projectId}/scope`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Limpar filtros
        </Link>
      )}
    </form>
  );
}
