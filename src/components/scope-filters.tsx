import Link from "next/link";
import { Suspense } from "react";
import { FilterPill } from "@/components/filter-pill";
import { ITEM_STATUSES, ITEM_STATUS_LABELS } from "@/lib/item-rules";
import type { ScopeFilters as Filters } from "@/lib/scope-view";

type Option = { id: string; name: string };

// Filters of the scope list: area, person and status. Same look as the period filter.
export function ScopeFilters({
  projectId,
  areas,
  people,
  current,
}: {
  projectId: string;
  areas: Option[];
  people: Option[];
  current: Filters;
}) {
  const active = Boolean(current.areaId || current.assigneeId || current.status);
  return (
    <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Filtros do escopo">
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<div className="h-11 w-64" aria-hidden="true" />}>
        <FilterPill
          param="area"
          label="Área"
          icon="area"
          options={areas.map((area) => ({ value: area.id, label: area.name }))}
          current={current.areaId}
        />
        <FilterPill
          param="assignee"
          label="Responsável"
          icon="person"
          options={people.map((person) => ({ value: person.id, label: person.name }))}
          current={current.assigneeId}
        />
        <FilterPill
          param="status"
          label="Status"
          icon="status"
          options={ITEM_STATUSES.map((status) => ({ value: status, label: ITEM_STATUS_LABELS[status] }))}
          current={current.status}
        />
      </Suspense>
      {active && (
        <Link
          href={`/projects/${projectId}/scope`}
          className="rounded-full px-3 py-2 text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          Limpar filtros
        </Link>
      )}
    </div>
  );
}
