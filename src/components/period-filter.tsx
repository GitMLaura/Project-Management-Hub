"use client";

import { Calendar, Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PERIOD_LABELS, type Period } from "@/lib/period";

const ORDER: Period[] = ["day", "week", "month", "all"];

// One filter with the chosen period written on it. The choice is kept in the URL.
export function PeriodFilter({ projectId, current }: { projectId: string; current: Period }) {
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Período: ${PERIOD_LABELS[current]}. Trocar período`}
        className="flex h-11 items-center gap-2 rounded-full bg-card px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Calendar className="size-4 text-muted-foreground" aria-hidden="true" />
        {PERIOD_LABELS[current]}
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {ORDER.map((period) => (
          <DropdownMenuItem
            key={period}
            onClick={() => router.push(`/projects/${projectId}?periodo=${period}`)}
            className="justify-between gap-4"
          >
            {PERIOD_LABELS[period]}
            {period === current && <Check className="size-4" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
