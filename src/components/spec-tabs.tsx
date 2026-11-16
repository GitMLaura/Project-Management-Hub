import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "screens", label: "Telas", path: "/spec/screens" },
  { key: "flows", label: "Fluxos", path: "/spec/flows" },
  { key: "rules", label: "Regras de negócio", path: "/spec/rules" },
] as const;

export type SpecTab = (typeof TABS)[number]["key"];

// Segmented switch between the three views of the specification.
export function SpecTabs({ projectId, current }: { projectId: string; current: SpecTab }) {
  return (
    <nav aria-label="Especificação" className="inline-flex w-fit gap-1 rounded-lg bg-muted p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/projects/${projectId}${tab.path}`}
          aria-current={tab.key === current ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground",
            tab.key === current && "bg-background text-foreground shadow-xs",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
