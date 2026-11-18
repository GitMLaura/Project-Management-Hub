import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "flows", label: "Fluxos", path: "/spec/flows" },
  { key: "rules", label: "Regras de negócio", path: "/spec/rules" },
] as const;

export type SpecTab = (typeof TABS)[number]["key"];

// Switch between the two views of the specification: flows (with their screens) and rules.
export function SpecTabs({ projectId, current }: { projectId: string; current: SpecTab }) {
  return (
    <nav aria-label="Especificação" className="inline-flex w-fit gap-1 rounded-full bg-card p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/projects/${projectId}${tab.path}`}
          aria-current={tab.key === current ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground",
            tab.key === current && "bg-primary text-primary-foreground hover:text-primary-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
