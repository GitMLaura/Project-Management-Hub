import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ProfileSwitcher } from "@/components/profile-switcher";
import { ProjectNav } from "@/components/project-nav";
import { getActiveProfile } from "@/lib/active-profile";
import { DEMO_PROFILES } from "@/lib/demo-profiles";

const ASIDE_CLASS =
  "flex shrink-0 flex-col gap-4 border-b bg-sidebar p-4 md:w-60 md:border-r md:border-b-0 md:gap-6";

// Reading params and cookies is "runtime data", so it must sit inside a Suspense boundary.
async function Sidebar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const active = await getActiveProfile();
  return (
    <aside className={ASIDE_CLASS}>
      <ProfileSwitcher profiles={DEMO_PROFILES} activeId={active.id} variant="sidebar" />
      <ProjectNav projectId={id} />
      <Link
        href="/"
        className="mt-auto flex items-center gap-2 px-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Todos os projetos
      </Link>
    </aside>
  );
}

// Everything inside an open project: side menu on the left, page on the right.
export default function ProjectLayout(props: LayoutProps<"/projects/[id]">) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Suspense
        fallback={
          <aside className={ASIDE_CLASS} aria-hidden="true">
            <div className="h-10 animate-pulse rounded-md bg-muted" />
          </aside>
        }
      >
        <Sidebar params={props.params} />
      </Suspense>
      <div className="min-w-0 flex-1">{props.children}</div>
    </div>
  );
}
