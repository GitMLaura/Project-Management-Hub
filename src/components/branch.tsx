"use client";

import { ChevronRight } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

const BranchContext = createContext<{ open: boolean; toggle: () => void } | null>(null);

// One item of the scope list that can hide the items inside it.
export function Branch({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <BranchContext.Provider value={{ open, toggle: () => setOpen((value) => !value) }}>
      {children}
    </BranchContext.Provider>
  );
}

export function BranchToggle({ label }: { label: string }) {
  const branch = useContext(BranchContext);
  if (!branch) return null;
  return (
    <button
      type="button"
      onClick={branch.toggle}
      aria-expanded={branch.open}
      aria-label={`${branch.open ? "Recolher" : "Expandir"} ${label}`}
      className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronRight
        className={cn("size-4 transition-transform", branch.open && "rotate-90")}
        aria-hidden="true"
      />
    </button>
  );
}

export function BranchBody({ children }: { children: React.ReactNode }) {
  const branch = useContext(BranchContext);
  if (!branch?.open) return null;
  return <>{children}</>;
}
