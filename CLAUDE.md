# CLAUDE.md — Aurora Project Hub

Leia este arquivo e `docs/PRD.md` no início de toda sessão. O PRD é a fonte da verdade do escopo. Se algo pedido conflitar com o PRD, avise antes de implementar.

## O que é
Portal de gestão de projetos multidisciplinares: hierarquia **projeto → épico → funcionalidade → história → tarefa**, saúde do projeto, especificação (regras de negócio em Markdown, fluxos em Mermaid, telas) e ritos (transcrições e resumos por área).

É um **projeto de portfólio público**, com **dados 100% fictícios** (Projeto Aurora). A autora é Product Designer e não é desenvolvedora: explique decisões técnicas em linguagem simples e priorize código legível e simples.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres e Storage) com RLS ligado; sem Auth na demo
- Mermaid para fluxos
- Deploy: Vercel (Hobby). Custo zero é requisito.

## Regras que nunca podem ser quebradas
1. **Nunca** commitar chaves, tokens ou `.env*` (exceto `.env.example`, sem valores).
2. **Nenhuma chave de LLM em produção.** O app publicado não chama Claude nem Gemini. Resumos de ritos vêm do `seed/`.
3. **Nenhum dado real** de empresa, cliente, pessoa ou documento. Nomes, projetos e transcrições são inventados.
4. Variáveis `NEXT_PUBLIC_*` só para valores públicos (URL e anon key do Supabase). A `service_role` nunca vai para o navegador nem para a Vercel.
5. **RLS sempre ligado** em toda tabela. Na demo, as políticas são abertas (ler, criar e alterar; **nunca excluir**) e os papéis (Dono, Líder, Participante) valem **só na interface**. Sem usuários reais e sem `service_role`. Em produção, as permissões seriam por papel no banco (ver PRD, seção 2).
6. Não deixar arquivos grandes ou binários desnecessários no repositório.

## Domínio (resumo; detalhes no PRD)
- Todo item tem **pai obrigatório**, **área**, **responsável**, **início/prazo** e **status** (`a_fazer`, `em_andamento`, `bloqueado`, `concluido`).
- Prazo de filho ≤ prazo do pai; épico ≤ prazo do projeto. Itens com filhos não podem ser excluídos, só arquivados.
- Progresso = tarefas concluídas ÷ total de tarefas do item.
- **Saúde** (🟢🟡🔴) é calculada por uma **função pura** em `src/lib/health.ts`, com limiares em constantes no topo do arquivo e **sempre com o motivo em texto**. Regras exatas: PRD seção 4.
- Papéis: Dono do projeto, Líder de área (1 por área), Participante.
- **Regras de negócio** são Markdown com IDs `RN-###`. Tela, download `.md` e PDF saem do mesmo Markdown.
- **Fluxos** são Mermaid `flowchart`. Trechos repetidos = sequências de 2+ passos consecutivos com rótulos iguais após normalização (minúsculas, sem acentos, sem pontuação, espaços colapsados).
- **Telas**: SHA-256 para cópias exatas e hash perceptual para semelhantes.
- **Ritos**: importar `.txt` e `.vtt`. Resumos por área são **pré-gerados** (`seed/`) e exibidos com o aviso "Resumo pré-gerado para demonstração". Resumo é rascunho até ser aprovado.

## Convenções
- UI e textos para o usuário em **português do Brasil**; código, nomes de variáveis, tabelas e commits em **inglês**.
- TypeScript estrito. Evite `any`.
- Componentes pequenos, nomes claros, sem abstrações antes da hora.
- Estrutura: `src/app` (rotas), `src/components`, `src/lib` (regras puras: saúde, fluxos, hashes, exportação), `supabase/` (migrações e políticas), `seed/`, `scripts/`, `docs/`.
- Toda lógica de negócio importante fica em `src/lib` como funções puras e **com testes**: cálculo de saúde, normalização e detecção de trechos em fluxos, exportação em Markdown.
- Estados de interface completos: carregando, vazio, erro e sucesso, em todas as telas.

## Como trabalhar
1. **Uma história por vez**, a partir de `docs/BACKLOG.md`, respeitando os critérios de aceite.
2. Para mudanças grandes, **proponha um plano antes de escrever código** e espere confirmação.
3. **Commits pequenos**, um por história, com mensagens claras (ex.: `feat: add health calculation for projects`).
4. Antes de dar uma história como pronta: rodar testes, lint e build, e dizer como conferir no navegador.
5. Ao terminar uma sessão, **atualizar `docs/BUILDLOG.md`**: o que foi feito, o que foi decidido, e o que foi gerado pela IA vs. decidido pela autora.
6. Se faltar informação, pergunte em vez de inventar regras de negócio.

## Comandos
Gerenciador de pacotes: **npm** (Node 22+).

| O que fazer | Comando |
|---|---|
| Instalar dependências | `npm install` |
| Rodar em desenvolvimento (http://localhost:3000) | `npm run dev` |
| Testes (uma vez) | `npm test` |
| Testes em modo observação | `npm run test:watch` |
| Lint | `npm run lint` |
| Checagem de tipos | `npm run typecheck` |
| Build de produção | `npm run build` |
| Adicionar componente shadcn/ui | `npx shadcn@latest add <componente>` |
| Aplicar migrações no Supabase hospedado | `set -a; . ./.env.local; set +a; npx supabase db push --remote --yes` (precisa de `npx supabase login` e `SUPABASE_DB_PASSWORD` no `.env.local`) |
| Gerar seed | _ainda não existe (história H5.1.1)_ |

Variáveis de ambiente: copie `.env.example` para `.env.local` (nunca commitar).

Antes de dar uma história como pronta: `npm test && npm run lint && npm run typecheck && npm run build`.

## Fora do escopo da v1
Notificações, comentários em tempo real, integração com Jira/Figma, gravação de chamadas, edição colaborativa de fluxos, `.docx`, similaridade semântica, LLM real na demo pública. Não implemente sem pedido explícito.
