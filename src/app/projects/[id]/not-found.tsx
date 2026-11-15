import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ProjectNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Projeto não encontrado</h1>
      <p className="text-muted-foreground">
        Esse projeto não existe ou o endereço está incorreto.
      </p>
      <div>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Voltar para a página inicial
        </Link>
      </div>
    </main>
  );
}
