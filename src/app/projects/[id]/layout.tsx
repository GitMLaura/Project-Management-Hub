import { Home } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ProfileSwitcher } from "@/components/profile-switcher";
import { ProjectNav } from "@/components/project-nav";
import { getActiveProfile } from "@/lib/active-profile";
import { DEMO_PROFILES } from "@/lib/demo-profiles";
import { getProject } from "@/lib/supabase/projects";

const BAR_CLASS = "sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-card px-4 md:px-6";

async function projectName(id: string): Promise<string> {
  try {
    return (await getProject(id))?.name ?? "Projeto";
  } catch {
    return "Projeto";
  }
}

// Reading params and cookies is "runtime data", so it must sit inside a Suspense boundary.
async function TopBar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [active, name] = await Promise.all([getActiveProfile(), projectName(id)]);
  return (
    <>
      <header className={BAR_CLASS}>
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label="Todos os projetos"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Home className="size-5" aria-hidden="true" />
          </Link>
          <span className="flex h-10 min-w-0 items-center gap-2 rounded-full bg-muted pr-4 pl-1.5 text-sm font-semibold">
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
            >
              {name.charAt(0).toUpperCase()}
            </span>
            <span className="truncate">{name}</span>
          </span>
        </div>
        <ProfileSwitcher profiles={DEMO_PROFILES} activeId={active.id} />
      </header>
      <ProjectNav projectId={id} />
    </>
  );
}

// Everything inside an open project: top bar with the profile, floating menu, then the page.
export default function ProjectLayout(props: LayoutProps<"/projects/[id]">) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Suspense fallback={<header className={BAR_CLASS} aria-hidden="true" />}>
        <TopBar params={props.params} />
      </Suspense>
      <div className="min-w-0 flex-1 pb-24 md:pb-0 md:pl-20">{props.children}</div>
    </div>
  );
}
