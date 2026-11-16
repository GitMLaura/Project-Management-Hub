"use client";

import { Check, ChevronDown, CircleDot, Layers, User } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ICONS = { area: Layers, person: User, status: CircleDot } as const;

type Option = { value: string; label: string };

// A filter written on a pill, like the period filter: icon, current choice and a list.
// The choice lives in the URL, so a filtered view can be shared.
export function FilterPill({
  param,
  label,
  icon,
  options,
  current,
}: {
  param: string;
  label: string; // shown while nothing is chosen, e.g. "Área"
  icon: keyof typeof ICONS;
  options: Option[];
  current: string | undefined;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const Icon = ICONS[icon];
  const chosen = options.find((option) => option.value === current);

  function choose(value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(param, value);
    else next.delete(param);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`${label}: ${chosen?.label ?? "todos"}. Trocar filtro`}
        className="flex h-11 items-center gap-2 rounded-full bg-card px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        {chosen ? (
          <span>
            <span className="text-muted-foreground">{label}: </span>
            {chosen.label}
          </span>
        ) : (
          label
        )}
        <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 min-w-52 overflow-y-auto">
        <DropdownMenuItem onClick={() => choose(null)} className="justify-between gap-4">
          Todos
          {!chosen && <Check className="size-4" aria-hidden="true" />}
        </DropdownMenuItem>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => choose(option.value)}
            className="justify-between gap-4"
          >
            {option.label}
            {option.value === current && <Check className="size-4" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
