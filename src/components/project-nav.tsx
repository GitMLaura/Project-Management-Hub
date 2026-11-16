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

// Floating pill with the project sections: vertical and centered on the left of the screen,
// horizontal at the bottom on phones. The current section is a red circle; hover or focus
// shows its name in a black bubble.
export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  return (
    <nav
      aria-label="Seções do projeto"
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2 rounded-full bg-card p-2 shadow-lg md:top-1/2 md:bottom-auto md:left-4 md:translate-x-0 md:-translate-y-1/2 md:flex-col"
    >
      {ITEMS.map(({ segment, label, Icon }) => {
        const href = `${base}${segment}`;
        const active = segment === "" ? pathname === base : pathname.startsWith(href);
        return (
          <Link
            key={label}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex size-11 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
            <span
              role="tooltip"
              className="pointer-events-none absolute left-full ml-3 hidden rounded-md bg-black px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 md:block"
            >
              {label}
              <span
                aria-hidden="true"
                className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rotate-45 bg-black"
              />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
