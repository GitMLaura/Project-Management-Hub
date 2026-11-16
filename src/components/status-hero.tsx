const PILL = {
  red: "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-900",
  green: "bg-green-100 text-green-800",
  neutral: "bg-muted text-muted-foreground",
} as const;

function Metric({
  label,
  value,
  pill,
  tone,
}: {
  label: string;
  value: string;
  pill: string;
  tone: keyof typeof PILL;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="flex items-center gap-2">
        <span className="font-heading text-5xl leading-none font-semibold tabular-nums">{value}</span>
        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${PILL[tone]}`}>{pill}</span>
      </p>
    </div>
  );
}

type Totals = { lateTasks: number; blockedItems: number; doneTasks: number; totalTasks: number; percent: number };

// The numbers of the Status page, one line under the title.
export function StatusMetrics({ totals }: { totals: Totals }) {
  return (
    <div className="flex flex-wrap items-end gap-x-10 gap-y-4" role="group" aria-label="Números do projeto">
      <Metric
        label="Atrasadas"
        value={String(totals.lateTasks)}
        pill={totals.lateTasks > 0 ? "Atenção" : "Em dia"}
        tone={totals.lateTasks > 0 ? "red" : "green"}
      />
      <Metric
        label="Bloqueados"
        value={String(totals.blockedItems)}
        pill={totals.blockedItems > 0 ? "Atenção" : "Nenhum"}
        tone={totals.blockedItems > 0 ? "yellow" : "green"}
      />
      <Metric
        label="Concluídas"
        value={`${totals.doneTasks}/${totals.totalTasks}`}
        pill={`${totals.percent}%`}
        tone="neutral"
      />
    </div>
  );
}
