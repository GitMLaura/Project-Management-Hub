import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function PageMessage({
  title,
  text,
  backHref,
  backLabel,
}: {
  title: string;
  text: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p>{text}</p>
      <div>
        <Link href={backHref} className={buttonVariants({ variant: "outline" })}>
          {backLabel}
        </Link>
      </div>
    </main>
  );
}
