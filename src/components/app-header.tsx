import { ProfileSwitcher } from "@/components/profile-switcher";
import { getActiveProfile } from "@/lib/active-profile";
import { DEMO_PROFILES } from "@/lib/demo-profiles";

// Shown while the active profile is being read from the cookie.
export function AppHeaderSkeleton() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <span className="font-semibold">Aurora Project Hub</span>
      <div className="size-10 animate-pulse rounded-full bg-muted" aria-hidden />
    </header>
  );
}

export async function AppHeader() {
  const active = await getActiveProfile();

  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <span className="font-semibold">Aurora Project Hub</span>
      <ProfileSwitcher profiles={DEMO_PROFILES} activeId={active.id} />
    </header>
  );
}
