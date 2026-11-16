import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ProfileSwitcher } from "@/components/profile-switcher";
import { ProjectNav } from "@/components/project-nav";
import { getActiveProfile } from "@/lib/active-profile";
import { DEMO_PROFILES } from "@/lib/demo-profiles";

async function SidebarProfile() {
  const active = await getActiveProfile();
  return <ProfileSwitcher profiles={DEMO_PROFILES} activeId={active.id} variant="sidebar" />;
}

// Everything inside an open project: side menu on the left, page on the right.
export default async function ProjectLayout(props: LayoutProps<"/projects/[id]">) {
  const { id } = await props.params;
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 border-b bg-sidebar p-4 md:w-60 md:border-r md:border-b-0 md:gap-6">
        <Suspense fallback={<div className="h-10 animate-pulse rounded-md bg-muted" aria-hidden />}>
          <SidebarProfile />
        </Suspense>
        <Suspense fallback={<div className="h-40" aria-hidden />}>
          <ProjectNav projectId={id} />
        </Suspense>
        <Link
          href="/"
          className="mt-auto flex items-center gap-2 px-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Todos os projetos
        </Link>
      </aside>
      <div className="min-w-0 flex-1">{props.children}</div>
    </div>
  );
}
