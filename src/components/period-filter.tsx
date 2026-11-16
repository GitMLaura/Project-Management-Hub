import Link from "next/link";
import { PERIOD_LABELS, type Period } from "@/lib/period";
import { cn } from "@/lib/utils";

// Switch between all tasks and the ones due today, this week or this month (kept in the URL).
export function PeriodFilter({ projectId, current }: { projectId: string; current: Period }) {
  const base = `/projects/${projectId}`;
  return (
    <nav aria-label="Período" className="inline-flex gap-1 rounded-lg bg-muted p-1">
      {(Object.keys(PERIOD_LABELS) as (keyof typeof PERIOD_LABELS)[]).map((period) => {
        const active = current === period;
        return (
          <Link
            key={period}
            // Clicking the active period again goes back to "all".
            href={active ? base : `${base}?periodo=${period}`}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
              active && "bg-background text-foreground shadow-xs",
            )}
          >
            {PERIOD_LABELS[period]}
          </Link>
        );
      })}
    </nav>
  );
}
