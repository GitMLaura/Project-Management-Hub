"use client";

import { Activity, CalendarDays, FileText, Layers } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { segment: "", label: "Status", Icon: Activity },
  { segment: "/scope", label: "Escopo", Icon: Layers },
  { segment: "/spec", label: "Especificação", Icon: FileText },
  { segment: "/rituals", label: "Encontros", Icon: CalendarDays },
] as const;

// Side menu of an open project. Only the selected item is colored.
export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav aria-label="Seções do projeto" className="flex gap-1 md:flex-col">
      {ITEMS.map(({ segment, label, Icon }) => {
        const href = `${base}${segment}`;
        const active = segment === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-foreground hover:bg-muted",
              active && "text-primary",
            )}
          >
            <Icon className="size-[18px]" aria-hidden="true" />
            <span className={cn("py-0.5", active && "border-b-2 border-primary")}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
