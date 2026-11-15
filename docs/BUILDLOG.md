# BUILDLOG — Aurora Project Hub

Diário de decisões e construção. Em cada sessão: o que foi feito, o que foi decidido e quem decidiu (autora ou IA).

## 2026-11-15 — H0.1.1 Base do projeto

### O que foi feito
- Commit de documentação: PRD com decisões da seção 11, `BACKLOG.md` alinhado ao PRD (removida a história do botão "Restaurar demo") e resumo em inglês no README.
- App Next.js (App Router, TypeScript estrito, `src/`) criado, com Tailwind CSS e shadcn/ui (componente `Button` e utilitário `cn`).
- Vitest configurado, com um teste mínimo de `cn` para provar que o ambiente de testes funciona.
- `.env.example` criado só com os nomes das variáveis públicas do Supabase, sem valores.
- Seção "Comandos" do `CLAUDE.md` preenchida.
- Página inicial provisória em português.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Usar npm como gerenciador de pacotes | Autora |
| Usar Vitest para testes | Autora |
| Alinhar o BACKLOG ao PRD (remover H5.1.2 e as perguntas abertas) | Autora |
| Subir `@types/node` de 20 para 22, para combinar com o Node 22 e com o Vitest 5 | IA (sem `--force`) |
| `typecheck` roda `next typegen` antes do `tsc`, porque o Next gera tipos como `LayoutProps` sob demanda | IA |
| Não rodar `npm audit fix --force`: os 8 avisos moderados são só de ferramentas de lint (dev) e a correção rebaixaria o `eslint-config-next` | IA |
| Manter o `AGENTS.md` gerado pelo Next.js (orienta agentes de IA a ler a documentação da versão instalada) | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** estrutura inicial do Hub, configuração do Tailwind, shadcn/ui e Vitest, scripts, `.env.example`, texto da página provisória.
- **Autora:** escolha da stack, do gerenciador de pacotes e do Vitest, e as decisões de produto do PRD.

### Pendências
- Nenhuma para a H0.1.1.

## 2026-11-15 — H0.2.1 Troca de perfil de demonstração

### O que foi feito
- Perfis de demonstração em `src/lib/demo-profiles.ts` (4 perfis, lógica pura com 10 testes).
- Perfil ativo guardado num cookie (`demo_profile`), lido no servidor; valor ausente ou inválido cai no perfil Dono.
- Server Action `switchProfile` valida o id no servidor antes de gravar o cookie.
- Cabeçalho com avatar (iniciais) e nome/papel; clicar abre o menu "Ver o Hub como" com os 4 perfis.
- Estados: carregando (esqueleto do cabeçalho e `loading.tsx`), erro (`error.tsx` e mensagem ao falhar a troca) e sucesso.
- PRD (seção 7) e BACKLOG (H0.2.1) atualizados: não existe tela "Entrar como".

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Sem tela de login: o Hub abre direto na página inicial e o avatar troca de perfil | Autora |
| Perfil padrão: Dono do projeto | Autora |
| Avatar com iniciais, sem fotos | Autora |
| Cookie agora; login real do Supabase na H0.2.2 | Autora |
| Nomes fictícios: Helena Duarte (Dono), Rafael Moura (Design), Camila Tavares (Dev), Bruno Siqueira (Participante, QA) | IA propôs; autora pode trocar |
| O cabeçalho fica dentro de `<Suspense>`, porque este Next exige isso para ler cookies (Cache Components) | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** código, testes, textos da interface, nomes fictícios.
- **Autora:** o fluxo (sem login, troca pelo avatar), perfil padrão, avatar com iniciais.

### Pendências
- O cookie é só "faz de conta" de interface: não protege nada. A segurança real vem na H0.2.2 (RLS).
- Conferir no navegador o clique no avatar (a troca usa Server Action).

## 2026-11-15 — Preset do shadcn/ui

- Aplicado o preset `beqFpGnC` da autora (`npx shadcn init --preset beqFpGnC`): estilo `base-rhea`, base `zinc`, ícones Hugeicons, fonte Roboto, menus translúcidos. Componentes `button` e `dropdown-menu` reinstalados com o novo estilo.
- Decisão: autora (preset); IA aplicou e conferiu lint, tipos, testes e build.
