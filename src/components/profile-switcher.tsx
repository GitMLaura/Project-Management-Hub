"use client";

import { useState, useTransition } from "react";
import { switchProfile } from "@/app/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getInitials,
  type DemoProfile,
  type DemoProfileId,
} from "@/lib/demo-profiles";

// Full class names (not built dynamically) so Tailwind can find them.
const AVATAR_COLORS: Record<DemoProfileId, string> = {
  owner: "bg-emerald-600 text-white",
  "design-lead": "bg-slate-600 text-white",
  "dev-lead": "bg-sky-700 text-white",
  participant: "bg-amber-600 text-white",
};

type ProfileSwitcherProps = {
  profiles: readonly DemoProfile[];
  activeId: DemoProfileId;
  variant?: "header" | "sidebar";
};

export function ProfileSwitcher({ profiles, activeId, variant = "header" }: ProfileSwitcherProps) {
  const sidebar = variant === "sidebar";
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const active = profiles.find((profile) => profile.id === activeId) ?? profiles[0];

  function handleSelect(profileId: DemoProfileId) {
    if (profileId === activeId) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await switchProfile(profileId);
        if (!result.ok) setError(result.error);
      } catch {
        setError("Não foi possível trocar de perfil. Tente novamente.");
      }
    });
  }

  return (
    <div className={sidebar ? "flex flex-col gap-1" : "flex flex-col items-end gap-1"}>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isPending}
          aria-label={`Trocar perfil. Perfil ativo: ${active.name}, ${active.roleLabel}`}
          className={`flex items-center gap-3 outline-none ${sidebar ? "w-full flex-row-reverse justify-end rounded-md p-1" : "rounded-full py-1 pr-1 pl-3"}  hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60`}
        >
          <span className={sidebar ? "text-left leading-tight" : "hidden text-right leading-tight sm:block"}>
            <span className="block text-sm font-medium">{active.name}</span>
            <span className="block text-xs text-muted-foreground">
              {isPending ? "Trocando perfil…" : active.roleLabel}
            </span>
          </span>
          <Avatar size="lg">
            <AvatarFallback className={AVATAR_COLORS[active.id]}>
              {getInitials(active.name)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={sidebar ? "start" : "end"} className="min-w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Ver o Hub como</DropdownMenuLabel>
            {profiles.map((profile) => (
              <DropdownMenuItem
                key={profile.id}
                onClick={() => handleSelect(profile.id)}
                className="gap-3 py-2"
              >
                <Avatar size="sm">
                  <AvatarFallback className={AVATAR_COLORS[profile.id]}>
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex flex-col leading-tight">
                  <span className="font-medium">{profile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {profile.roleLabel} · {profile.area}
                  </span>
                </span>
                {profile.id === activeId && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Ativo
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
