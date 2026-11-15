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
- **IA:** estrutura inicial do app, configuração do Tailwind, shadcn/ui e Vitest, scripts, `.env.example`, texto da página provisória.
- **Autora:** escolha da stack, do gerenciador de pacotes e do Vitest, e as decisões de produto do PRD.

### Pendências
- Nenhuma para a H0.1.1. Próximo: H0.2.1 (tela "Entrar como"), que pede plano próprio.
