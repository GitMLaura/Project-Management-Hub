import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">Aurora Project Hub</h1>
      <p className="max-w-md text-muted-foreground">
        Escopo, saúde do projeto, especificação e ritos em um só lugar. Projeto
        de portfólio com dados 100% fictícios.
      </p>
      <Button>Em construção</Button>
    </main>
  );
}
