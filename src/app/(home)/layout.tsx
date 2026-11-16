import { Suspense } from "react";
import { AppHeader, AppHeaderSkeleton } from "@/components/app-header";

// Pages outside a project (home, new project) keep the top bar.
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<AppHeaderSkeleton />}>
        <AppHeader />
      </Suspense>
      {children}
    </>
  );
}
