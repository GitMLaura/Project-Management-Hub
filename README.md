# Hub de Gestão de Projetos (Aurora Project Hub)

> **In English:** a portfolio case study of a project management Hub for multidisciplinary teams (Design, Development, Product, QA). Work is organized as an agile WBS (epic → feature → story → task), project health is calculated by a pure, tested function that always explains its reason, and business rules, Mermaid flows and screens live in one place with duplicate detection (flow segments, exact and perceptual image hashes). Meeting transcripts (`.txt`, `.vtt`) get per-area summaries that start as drafts and need a leader's approval; pendings become tasks. **All data is fictional** (a food delivery app called "Projeto Aurora"), the published Hub **calls no AI** (summaries are pre-generated in `seed/`), and it runs at zero cost on Next.js, Supabase and Vercel. Built by a Product Designer with Claude Code; the split between her decisions and AI-generated code is documented in [`docs/BUILDLOG.md`](docs/BUILDLOG.md).

Demo publicada: https://project-management-hub-five.vercel.app

## O problema

Em projetos com várias disciplinas, o escopo se espalha: tarefas ficam em um lugar, regras de negócio em documentos soltos e decisões se perdem em reuniões. Design, Desenvolvimento, Produto e QA não enxergam a mesma saúde do projeto, e fluxos e telas se repetem sem que ninguém perceba.

## O que o Hub faz

- **Escopo delimitado:** épico → funcionalidade → história → tarefa. Todo item tem pai, área, responsável, prazo e status. Prazo de filho nunca passa o do pai, item com filhos só pode ser arquivado e item vazio aparece como "escopo incompleto".
- **Saúde explicável:** semáforo (verde, amarelo, vermelho) do projeto, de cada épico e de cada área, **sempre com o motivo em texto** (ex.: "Vermelho: 3 tarefas atrasadas em Desenvolvimento").
- **Especificação consultável:** regras de negócio em Markdown com IDs estáveis (`RN-001`), baixadas como `.md` ou PDF a partir do mesmo texto; fluxos em Mermaid com detecção de trechos repetidos entre fluxos e busca de passos; telas com cópias exatas (SHA-256) e semelhantes (hash perceptual, limiar ajustável), ligadas aos passos dos fluxos.
- **Ritos úteis:** importar transcrição (`.txt` ou `.vtt`), ler o resumo por área (rascunho até um líder aprovar) e transformar pendências em tarefas, respeitando as regras de escopo.

## Decisões de produto e de engenharia

| Decisão | Por quê |
|---|---|
| **Sem IA na demo pública**; resumos pré-gerados no `seed/` com o aviso "Resumo pré-gerado para demonstração" | Custo zero e nenhuma chave de LLM em produção. O fluxo de importação e aprovação funciona de ponta a ponta |
| **Papéis só na interface** (Dono, Líder de área, Participante) e RLS aberto sem exclusão no banco | É um protótipo sem usuários reais. O risco foi aceito e documentado no PRD (seção 11). Em produção, cada pessoa teria conta e políticas RLS por papel |
| **Saúde é uma função pura** com limiares no topo do arquivo, e testes | Regra explícita, fácil de ajustar e de explicar |
| **Markdown como fonte da verdade das regras** | Tela, download `.md` e PDF nunca divergem, e o texto serve para colar em uma IA |
| **Comparação de fluxos por rótulo idêntico** (após normalizar) | Simples e previsível. Similaridade semântica ficou fora da v1 |
| **Telas do seed desenhadas por código** | Sem arquivos binários no repositório |
| **Dados 100% fictícios** | Projeto de portfólio público |

O PRD (fonte da verdade do escopo) está em [`docs/PRD.md`](docs/PRD.md), o backlog por história em [`docs/BACKLOG.md`](docs/BACKLOG.md) e o diário de construção, com **o que foi decidido pela autora e o que foi gerado pela IA**, em [`docs/BUILDLOG.md`](docs/BUILDLOG.md).

## Resultado

Todas as histórias do backlog de E0 a E4 e o seed do Projeto Aurora estão implementadas, com testes automatizados para a saúde, a normalização e detecção de trechos em fluxos, a exportação em Markdown, a análise de imagens, a leitura de transcrições e a consistência do seed. O Projeto Aurora traz 3 épicos, 7 funcionalidades, 12 histórias, 39 tarefas, 12 regras de negócio, 3 fluxos, 8 telas e 5 ritos, com a saúde nas três cores de propósito.

## Como rodar

Requisitos: Node 22+ e um projeto Supabase (plano gratuito).

```bash
npm install
cp .env.example .env.local   # preencha só a URL e a anon key públicas do Supabase
npm run dev                  # http://localhost:3000
npm run seed                 # carrega o Projeto Aurora (use -- --dry-run para só conferir)
```

Antes de dar algo como pronto: `npm test && npm run lint && npm run typecheck && npm run build`.

## Stack

Next.js (App Router) e TypeScript, Tailwind CSS e shadcn/ui, Supabase (Postgres e Storage, RLS ligado), Mermaid, Vitest, deploy na Vercel (Hobby).

## Status

Funcionalidades prontas e testadas por testes automatizados. A demo está publicada na Vercel. Falta a conferência visual no navegador pela autora. Veja os critérios de pronto na seção 10 do PRD.
