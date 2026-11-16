import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Aurora Project Hub",
  description: "Gestão de projetos multidisciplinares: escopo, saúde, especificação e encontros.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={cn("h-full", "antialiased", "font-sans")}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
