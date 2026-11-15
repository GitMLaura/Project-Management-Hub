import { getActiveProfile } from "@/lib/active-profile";

export default async function Home() {
  const profile = await getActiveProfile();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">Olá, {profile.name}</h1>
      <p className="text-lg">
        Você está vendo o app como <strong>{profile.roleLabel}</strong> (área{" "}
        {profile.area}).
      </p>
      <p className="max-w-md text-muted-foreground">
        Clique na sua foto no canto superior direito para trocar de perfil e
        testar as permissões. Projeto de portfólio com dados 100% fictícios.
      </p>
    </main>
  );
}
