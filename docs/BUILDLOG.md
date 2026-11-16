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
- ~~Conferir no navegador o clique no avatar~~: conferido pela autora em 2026-11-15, funcionou.

## 2026-11-15 — Preset do shadcn/ui

- Aplicado o preset `beqFpGnC` da autora (`npx shadcn init --preset beqFpGnC`): estilo `base-rhea`, base `zinc`, ícones Hugeicons, fonte Roboto, menus translúcidos. Componentes `button` e `dropdown-menu` reinstalados com o novo estilo.
- Decisão: autora (preset); IA aplicou e conferiu lint, tipos, testes e build.

## 2026-11-15 — H0.2.2 (parte 1): conexão com o Supabase

### O que foi feito
- Migração temporária `supabase/migrations/20261115120000_temp_items_connection_check.sql`: tabela `items` mínima, RLS ligado, `GRANT SELECT` para `anon` e `authenticated`, uma política de leitura e uma linha fictícia. Marcada como temporária: a E1 troca pelo esquema real.
- `@supabase/supabase-js` instalado.
- Teste de integração `src/lib/supabase/connection.integration.test.ts`: lê a linha com a anon key e confirma que a escrita é recusada. Fica pulado se as variáveis do Supabase não existirem.
- `vitest.config.mts` carrega só variáveis `NEXT_PUBLIC_*` nos testes; a `service_role` nunca é carregada.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Testes de RLS no projeto Supabase hospedado; regras de negócio não dependem do banco | Autora |
| Tabela `items` temporária, via migração, com RLS e uma política | Autora |
| `service_role` só entra quando criarmos os usuários reais; a autora cola no `.env.local` | Autora |
| Aplicar a migração pelo SQL Editor | Autora |
| `GRANT SELECT` explícito, porque "Automatically expose new tables" está desmarcado | Autora (pediu); IA incluiu |
| Textos das migrações só em ASCII | IA |

### Problema encontrado
- Colar a migração pelo `pbcopy` corrompeu os acentos (`conexão` virou `conex√£o`): o terminal leu UTF-8 como MacRoman. Corrigido com um `UPDATE` e com texto sem acento na migração. Ao copiar para a área de transferência, usar `LC_ALL=en_US.UTF-8 pbcopy`.

### Pendências
- ~~Parte 2 com `service_role` e usuários reais~~: **substituída** pela decisão de 2026-11-15 (entrada "H0.2.2: RLS aberto na demo", abaixo).

## 2026-11-15 — Resumo da sessão

### O que foi feito
- **E0, H0.1.1:** Hub criado com Next.js (App Router, TypeScript estrito), Tailwind, shadcn/ui e Vitest; `.env.example` sem valores; comandos preenchidos no `CLAUDE.md`.
- **E0, H0.2.1:** troca de perfil de demonstração pelo avatar no topo (Dono, Líder de Design, Líder de Dev, Participante), com perfil guardado em cookie validado no servidor.
- **Preset do shadcn/ui** `beqFpGnC` aplicado.
- **E0, H0.2.2, parte 1:** projeto Supabase conectado; migração temporária da tabela `items` com RLS, `GRANT SELECT` explícito e uma política de leitura; teste de integração que lê a linha com a anon key e confirma que a escrita é recusada.
- PRD e BACKLOG alinhados às decisões da autora (sem botão de restaurar, sem tela "Entrar como").
- Termo do produto padronizado para "Hub" nos textos da interface e nos documentos.

### Decisões da autora
| Decisão | Efeito |
|---|---|
| Visitantes podem editar a demo, e tudo é gravado de verdade no Supabase; sem botão de restaurar | A segurança precisa vir do banco (RLS), não da interface |
| Tema do Projeto Aurora: app de delivery de comida | O seed (H5.1.1) segue esse tema, com nomes inventados |
| README em português, com resumo em inglês no topo | Já aplicado ao README |
| Sem tela de login: o Hub abre na página inicial com o Dono ativo, e o avatar troca de perfil | Substituiu a tela "Entrar como" no PRD e no BACKLOG |
| Avatar com iniciais, sem fotos | Nenhuma imagem de pessoa no repositório |
| npm como gerenciador de pacotes; Vitest para testes | Base técnica da H0.1.1 |
| Preset de shadcn/ui `beqFpGnC` | Estilo, cores, fonte e ícones do Hub |
| Tabela `items` temporária, por migração em `supabase/`, com RLS e uma política | Só valida a conexão; a E1 a substitui |
| Testes de RLS no projeto Supabase hospedado; regras de negócio não dependem do banco | Testes de banco ficam pulados sem as variáveis |
| `service_role` só na parte 2 da H0.2.2, colada pela autora no `.env.local` | A chave nunca passou pelo chat nem foi para o Git |
| Migração aplicada pelo SQL Editor, não pelo CLI | A IA não tem acesso de escrita ao banco |
| `GRANT SELECT` explícito (autora desmarcou "Automatically expose new tables") | A IA conferiu que faltava e incluiu |

### Gerado pela IA
- Todo o código: estrutura do Hub, configuração de Tailwind, shadcn/ui e Vitest, perfis de demonstração, cabeçalho e seletor de perfil, Server Action, estados de carregando e erro, migração SQL, teste de integração.
- Os testes automatizados (14 ao todo) e a verificação de lint, tipos e build.
- Os nomes fictícios dos 4 perfis (a autora pode trocar em `src/lib/demo-profiles.ts`).
- Os textos da interface em português e esta documentação.
- Decisões técnicas menores tomadas pela IA: `@types/node` 22, `next typegen` antes do `tsc`, cabeçalho dentro de `<Suspense>`, textos de migração só em ASCII.

### O que a IA não verificou
- O clique no avatar (Server Action) não foi testado num navegador pela IA. A autora conferiu depois e a troca de perfil funcionou.

### Pendências
- ~~H0.2.2, parte 2 (`service_role`, usuários reais)~~: substituída pela decisão abaixo (RLS aberto na demo, sem usuários reais).
- ~~Conferir o clique no avatar no navegador~~: conferido pela autora, funcionou.
- `npm audit` mostra 8 avisos moderados, só em ferramentas de lint; não corrigidos de propósito.

## 2026-11-15 — H0.2.2: RLS aberto na demo (decisão revista)

### Decisão da autora
O Hub é um protótipo de portfólio, **sem cadastro de usuários**. O objetivo é persistir as alterações no Supabase e demonstrar a integração. Por isso:
- **Sem `service_role` e sem usuários reais.** Os 4 perfis continuam por cookie.
- **Papéis (Dono, Líder, Participante) valem só na interface.**
- **RLS ligado** em toda tabela, com **políticas abertas**: ler, criar e alterar. **Exclusão nunca** (sem `GRANT` nem política de `DELETE`).
- Isso substitui a parte 2 antiga da H0.2.2 (usuários reais e políticas por papel).

### Risco aceito
Quem chamar a API do Supabase direto, com a chave pública, pode alterar dados mesmo sendo "Participante". Os dados são fictícios. Só a autora limpa dados indesejados, pelo painel do Supabase. Em produção, seriam usuários reais e políticas por papel (documentado no PRD, seção 2).

### O que mudou nos documentos
- **CLAUDE.md:** regra 5 reescrita (RLS sempre ligado, políticas abertas na demo, sem exclusão, papéis só na interface); stack sem Auth.
- **PRD:** seção 2 (demo vs. produção), seção 8 (segurança) e nova decisão 4 na seção 11.
- **BACKLOG:** H0.2.2 reescrita; H0.2.1, H1.2.3, H1.3.2 e H4.2.2 ajustadas.

### Migração e teste
- Nova migração separada, `supabase/migrations/20261115140000_temp_items_open_demo_policies.sql` (a migração temporária já aplicada não foi editada). Só ASCII, por causa do problema do `pbcopy` com acentos.
- Teste de integração ajustado: confirma que uma alteração persiste (e restaura o valor) e que a exclusão é recusada. Não cria linhas, porque sem exclusão o teste não teria como limpar.

### A fazer depois (lembrete)
- **A tabela `items` é temporária e deve ser removida** (com as duas migrações dela, por uma migração nova de `drop table`) quando o esquema real da E1 entrar.

### Gerado pela IA vs. decidido pela autora
- **Autora:** a decisão de não usar `service_role` nem usuários reais, políticas abertas sem exclusão, exigência de migração em arquivo separado e só ASCII.
- **IA:** textos dos documentos, SQL, ajuste do teste.

## 2026-11-15 — H1.1.1 Cadastro do projeto

### O que foi feito
- Migração `20261115160000_projects_areas_participants.sql`: tabelas `projects`, `areas` e `participants`, RLS ligado, políticas abertas (ler, criar e alterar), sem exclusão, índices que garantem 1 Dono por projeto e 1 líder por área, e a função `create_project`, que grava tudo numa transação.
- Regras puras de validação em `src/lib/project-validation.ts` (14 testes): campos obrigatórios, datas, áreas e participantes sem nome repetido, exatamente 1 Dono, no máximo 1 líder por área.
- Formulário `/projects/new` (só o perfil Dono cria), página `/projects/[id]` e lista de projetos na página inicial, com estados de carregando, vazio, erro e sucesso.
- Perfis ganharam o campo `role`; `canCreateProject` libera só o Dono (regra na interface, e conferida de novo na Server Action).
- Teste de integração: tabelas legíveis, `create_project` falha com área inexistente sem gravar nada (rollback) e `DELETE` recusado nas três tabelas.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Seguir direto, sem propor plano antes (a autora pediu) | Autora |
| Criar projeto, áreas e participantes numa função única do banco (transação), porque sem exclusão um projeto pela metade não teria como ser limpo | IA |
| "Remover" áreas e participantes vale no formulário, antes de salvar; depois de salvo, só arquivar (H1.2.3) | IA, por causa da regra "sem exclusão" |
| Data de início do projeto adicionada (o PRD usa o início do projeto no cálculo de saúde) | IA |
| Um líder por área é opcional; exatamente um Dono é obrigatório | IA (PRD diz 1 por área e 1 Dono) |
| Rotas em inglês (`/projects`), textos em português | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** todo o código, SQL, testes e textos.
- **Autora:** aplicar a migração no SQL Editor; testar o formulário no navegador.

### Pendências
- ~~Autora: testar o formulário no navegador~~: conferido, funcionou. Sem exclusão no banco, projeto de teste só sai pelo painel do Supabase.
- Lembrete: remover a tabela `items` temporária quando o esquema real da H1.2.1 entrar.

## 2026-11-15 — H1.2.1 Hierarquia de escopo

### O que foi feito
- Migração `20261115180000_items_scope_hierarchy.sql`: **removeu a tabela `items` temporária** (como planejado) e criou a `items` real (épico, funcionalidade, história, tarefa) com área, responsável, início, prazo, status, crítico, campos da história e critérios de aceite.
- Regras de integridade no banco (gatilho e restrições): pai do tipo certo (E1), área e responsável do mesmo projeto, início obrigatório exceto em tarefas, história com os 3 campos. RLS aberto, sem exclusão.
- Regras puras em `src/lib/item-rules.ts` (validação, hierarquia, permissões de interface) e `src/lib/item-tree.ts` (árvore), com 18 testes.
- Página do projeto com seção **Escopo** em árvore, formulário `/projects/[id]/items/new` e botões "Adicionar" em cada nível.
- Teste de integração novo da tabela real (o antigo, da tabela temporária, foi removido).

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Remover a `items` temporária nesta migração, como previsto no BUILDLOG | Autora (decisão anterior) |
| Dono cria em qualquer área; Líder só na própria área (comparando o nome da área do perfil com as áreas do projeto); Participante só consulta. Regra na interface, conferida de novo na Server Action | IA, a partir do PRD seção 2 |
| Integridade (pai, área, responsável) no banco, porque o RLS está aberto e não protege por papel | IA |
| Prazo do filho ≤ prazo do pai **não** entra aqui: fica na H1.2.2 | IA, seguindo o BACKLOG |
| Sem arquivamento nesta história (H1.2.3) | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** SQL, código, testes, textos. **Autora:** aplicar a migração; testar a criação de itens no navegador.

### Pendências
- Autora: no projeto "Teste", criar épico, funcionalidade, história (com critérios) e tarefa; testar status, crítico e a troca de perfil (Líder de Design só cria em Design).
- Observação: os perfis têm áreas fixas ("Design", "Desenvolvimento"). Um Líder só cria se o projeto tiver uma área com o mesmo nome.

## 2026-11-16 — H1.2.2 Limites de prazo e automação das migrações

### O que foi feito
- Migração `20261115200000_items_deadline_bounds.sql`: o banco recusa épico com prazo acima do prazo do projeto (E3) e item com prazo acima do prazo do pai (E2).
- `validateItem` recebe os limites de prazo; a Server Action busca os prazos no banco. O formulário limita a data (`max`) e avisa na hora.
- Teste de integração: o banco recusa épico com prazo acima do projeto.
- **Supabase CLI** configurada (`supabase init`, `link`, histórico das 4 migrações antigas marcado como aplicado). Agora as migrações são aplicadas com `supabase db push`, sem colar SQL. `supabase/config.toml` entra no repositório (sem segredos).

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Usar a Supabase CLI no lugar do SQL Editor; senha do banco só no `.env.local`, fora do chat | Autora |
| Autorizar a marcação das 4 migrações antigas e o `db push` no banco hospedado | Autora |
| Regra de prazo no banco (gatilho) e também na interface | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** SQL, código, testes, comandos da CLI. **Autora:** login na CLI, senha do banco, autorização das mudanças no banco.

### Pendências
- Autora: testar no navegador (prazo de épico acima do projeto; prazo de filho acima do pai) e os 2 critérios restantes da H1.2.1.

## 2026-11-16 — H1.2.3 Arquivar e restaurar itens

### O que foi feito
- Migração `20261116100000_items_archive.sql` (aplicada com `supabase db push`): coluna `archived_at`, funções `archive_item` e `restore_item`, e o gatilho passou a recusar item novo ou restaurado sob um pai arquivado.
- Botão **Arquivar** em cada item (com aviso quando há itens dentro) e seção **Arquivados** com botão **Restaurar**. Itens arquivados saem da árvore ativa.
- Permissão como na criação: Dono em qualquer área; Líder só na própria área; Participante só consulta (interface e Server Action).
- Testes: `countDescendants` e integração (arquivar item inexistente é recusado). Lógica de cascata conferida no banco real numa transação desfeita no fim, sem deixar dados.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Arquivar um item arquiva também tudo que está dentro dele | IA (evita filhos "soltos" na árvore ativa); **a autora pode mudar** |
| Restaurar traz de volta só o que foi arquivado junto com ele; um filho arquivado antes continua arquivado | IA |
| Só o topo de um ramo arquivado tem botão Restaurar; filho sob pai arquivado não pode ser restaurado sozinho | IA |
| Sem exclusão no banco, como já decidido (PRD, decisão 4) | Autora (decisão anterior) |

### Gerado pela IA vs. decidido pela autora
- **IA:** SQL, código, testes. **Autora:** aplicar/aprovar mudanças no banco e testar no navegador.

### Pendências
- Autora: testar no navegador (arquivar um épico com filhos, ver em Arquivados, restaurar; trocar de perfil e ver os botões mudarem).


## 2026-11-16 — H1.2.4 Alerta de escopo incompleto

### O que foi feito
- Funções puras `isScopeIncomplete` e `countIncompleteScope` (regra E5) em `src/lib/item-tree.ts`, com testes.
- Selo "Escopo incompleto: falta detalhar" nos itens que não são tarefa e não têm filhos ativos, e contagem acima da árvore.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Itens arquivados não contam como filhos para o alerta | IA |
| O alerta aparece para todos os perfis, não só para o Dono | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** código e testes. **Autora:** testar no navegador.

## 2026-11-16 — H1.3.1 Árvore com progresso e filtros

### O que foi feito
- `src/lib/scope-view.ts` (funções puras, 11 testes): progresso por item (tarefas concluídas ÷ tarefas dentro dele, E6), leitura e aplicação dos filtros.
- Barra e texto de progresso em cada item ("3 de 10 tarefas concluídas (30%)"); item sem tarefas mostra "sem tarefas ainda".
- Filtros por área, responsável e status em formulário simples (GET): os filtros ficam na URL, então dá para compartilhar o link filtrado.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Filtro mostra os itens que batem e os pais deles (para manter o caminho); filtros combinam com "e" | IA |
| O progresso é sempre calculado na árvore completa, nunca na filtrada | IA |
| Itens arquivados ficam fora do progresso | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** código e testes. **Autora:** testar no navegador.

## 2026-11-16 — H1.3.2 Atualizar status de tarefas

### O que foi feito
- Regra pura `canUpdateTaskStatus` (4 testes), Server Action `updateTaskStatus` e seletor de status na tarefa.
- O progresso atualiza na hora (a página é recarregada após salvar). O critério "saúde atualiza" fica aberto até a H2.2.1, quando a saúde aparecerá na tela.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Dono altera qualquer tarefa; Líder as da própria área e as suas; Participante só as suas (comparando o nome do perfil com o do responsável) | IA, a partir do PRD seção 2 |
| Tarefa arquivada não muda de status | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** código e testes. **Autora:** testar no navegador (perfil "Participante" só altera tarefas do Bruno Siqueira).

### Pendência
- Os perfis só casam com participantes de mesmo nome; o seed (H5.1.1) usa os mesmos nomes dos perfis.

## 2026-11-16 — H2.1.1 Cálculo de saúde

### O que foi feito
- `src/lib/health.ts`: função pura `calculateHealth` com os limiares em constantes no topo (3 tarefas atrasadas = vermelho, 1 a 2 = amarelo, desvio de 25 e 10 p.p., 7 dias sem responsável). Devolve cor, rótulo, motivos em texto e os itens por trás de cada motivo.
- 19 testes: verde, amarelo, vermelho, bordas (desvio exatamente 10 p.p., tarefa que vence hoje, item sem responsável em 7 e 8 dias, período de 1 dia) e a regra de "a mais grave vence".

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Sem tarefas no conjunto, o desvio não é calculado (não há o que medir). Escopo vazio fica verde | IA (o PRD não cobre esse caso) |
| Só os motivos da cor final são mostrados (se vermelho, só os vermelhos) | IA |
| "Sem responsável com prazo em até 7 dias" inclui prazos já vencidos; o banco hoje exige responsável, mas a função cobre o caso | IA |
| Item concluído nunca conta como atrasado, crítico problemático ou sem responsável | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** código e testes. **Autora:** limiares vêm do PRD (decisão dela).

## 2026-11-16 — H2.2.1 Painel de saúde

### O que foi feito
- `src/lib/health-panel.ts` (3 testes): monta a saúde do projeto, de cada épico e de cada área a partir da função pura.
- Seção "Saúde do projeto" no topo da página do projeto: cartões com rótulo de texto ao lado da cor (a cor nunca aparece sozinha), motivo escrito e links que levam ao item responsável na árvore.
- A saúde recalcula a cada mudança (a página é recarregada ao salvar), o que fecha o critério da H1.3.2.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Épico usa o período do próprio épico; área e projeto usam o período do projeto (PRD seção 4) | IA, seguindo o PRD |
| "Hoje" é a data do servidor (UTC) | IA |
| Itens arquivados ficam fora da saúde | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** código, testes, visual. **Autora:** testar no navegador (mude o status de tarefas e veja a cor mudar).

## 2026-11-16 — H3.1.1 Regras de negócio em Markdown

### O que foi feito
- Migração `20261116120000_business_rules.sql` (aplicada com a CLI): tabela `business_rules` com RLS aberto e sem exclusão. O banco gera o código `RN-###` (próximo número do projeto, com trava para duas pessoas não receberem o mesmo) e não deixa o código mudar.
- Páginas: `/projects/[id]/spec` (funcionalidades por épico), `/projects/[id]/spec/[featureId]` (abas Regras, Fluxos, Telas) e telas de nova regra e edição, com editor e pré-visualização lado a lado.
- Lógica pura em `src/lib/rules.ts` (código, validação) com testes. Dependência nova: `react-markdown`.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Cada regra é um registro (título + texto em Markdown), não um documento único; o `RN-###` vem do banco | IA |
| Só o líder da área da funcionalidade (ou o Dono) escreve regras, como na criação de itens | IA, a partir do PRD seção 2 |

### Gerado pela IA vs. decidido pela autora
- **IA:** SQL, código, testes. **Autora:** testar no navegador (criar uma regra, ver o RN-001 e editar).

## 2026-11-16 — H3.1.2 Baixar regras em .md

### O que foi feito
- `src/lib/rules-export.ts` (função pura, 9 testes): gera o Markdown com cabeçalho (projeto; épico e funcionalidade quando o escopo é menor) e uma seção por funcionalidade, regras em ordem de código.
- Rota `GET /projects/[id]/rules/export?scope=project|epic|feature&item=<id>` e botões de download no projeto, no épico e na funcionalidade.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Funcionalidades sem regras ficam fora do arquivo (menos ruído ao colar numa IA) | IA |
| Cada regra vira `### RN-001 — Título`, para citar "conforme RN-001" | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** código e testes. **Autora:** abrir um arquivo baixado e conferir.

## 2026-11-16 — H3.1.3 Regras em PDF

### O que foi feito
- `src/lib/markdown-pdf.ts` (3 testes): converte o **mesmo Markdown** do `.md` em PDF (títulos, parágrafos, listas, código), no servidor, sem custo. Conferi o texto extraído do PDF (acentos e travessão corretos).
- A rota de exportação aceita `format=pdf`: abre no navegador ("Ver PDF") ou baixa (`download=1`). Botões no projeto e na funcionalidade. Dependências novas: `jspdf` e `marked`.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| PDF montado a partir do Markdown (e não imprimindo a tela), para garantir que tela, `.md` e PDF nunca divirjam | IA, seguindo o PRD seção 5.1 |
| Negrito e itálico viram texto simples no PDF; símbolos fora do alfabeto latino viram "?" | IA (limite das fontes padrão de PDF) |

### Gerado pela IA vs. decidido pela autora
- **IA:** código e testes. **Autora:** abrir o PDF e conferir se está legível.

## 2026-11-16 — H3.2.1 Fluxos em Mermaid

### O que foi feito
- Migração `20261116140000_flows_and_screens.sql` (aplicada com a CLI): tabelas `flows`, `screens` (já completa, o upload vem na H3.3.1) e `flow_step_screens` (passo ↔ tela), com RLS aberto, sem exclusão e gatilhos de integridade (tudo do mesmo projeto).
- `src/lib/flows.ts` (função pura): leitura do `flowchart` (passos, setas, textos entre colchetes e aspas, vários formatos de seta), normalização de rótulos, caminhos de 2+ passos, trechos repetidos e busca. 29 testes. A mesma base serve às histórias H3.2.2 e H3.2.3.
- Editor com pré-visualização ao lado (Mermaid desenhado no navegador); erros explicados em português ("O Mermaid não entendeu o diagrama na linha 3...") e avisos de linhas que não consegui ler.
- Lista de fluxos na aba Fluxos; cada passo pode ser vinculado a uma tela já enviada. Dependência nova: `mermaid`.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Só erro estrutural (sem `flowchart`, colchete aberto) bloqueia o salvamento; linha que a leitura própria não entende vira aviso, porque o Mermaid pode desenhá-la | IA |
| Salvar também é bloqueado se o Mermaid não consegue desenhar o diagrama | IA |
| A seta com texto no formato `-- texto -->` não é lida pela análise própria (só `-->|texto|`); o desenho continua funcionando | IA (limite assumido) |
| O vínculo passo-tela usa o id do passo no texto do Mermaid | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** SQL, código, testes. **Autora:** testar o editor no navegador (digite um fluxo, veja o desenho e provoque um erro de sintaxe).

### Pendência
- Eu não consegui abrir o navegador nesta sessão: o desenho do Mermaid foi verificado só por compilação e testes da lógica. Vale conferir na tela.

## 2026-11-16 — H3.2.2 Trechos repetidos entre fluxos

### O que foi feito
- `findRepeatedSegments` (em `src/lib/flows.ts`, testes em `flows.test.ts`): normaliza os rótulos (minúsculas, sem acentos, sem pontuação, espaços colapsados), segue as setas e acha sequências de 2+ passos iguais em fluxos diferentes. Se um trecho curto está dentro de um maior que cobre os mesmos fluxos, só o maior aparece.
- Página `/projects/[id]/spec/flows`: cada trecho com os passos, a contagem e um link para cada fluxo onde aparece.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Comparação por rótulo idêntico após normalização, como no PRD (sem similaridade semântica) | Autora (PRD seção 5.2) |
| Trecho = caminho que segue as setas, até 8 passos; repetição dentro do mesmo fluxo não conta | IA |
| Fluxos com erro de sintaxe ficam fora da comparação | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** código e testes. **Autora:** conferir no navegador com 2 fluxos que compartilham passos.

## 2026-11-16 — H3.2.3 Busca de passos nos fluxos

### O que foi feito
- Campo de busca em `/projects/[id]/spec/flows`: lista os fluxos onde o passo aparece, com o texto do passo e link. A função `searchFlows` (já testada em `flows.test.ts`) ignora maiúsculas, acentos e pontuação, aceita parte do texto e também uma sequência separada por `>` ("informar e-mail > validar senha").

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Busca por parte do texto (não só texto exato); a ordem dos passos importa nas sequências | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** código e testes. **Autora:** conferir no navegador.

## 2026-11-16 — H3.3.1 Upload de telas

### O que foi feito
- Migração `20261116160000_screens_storage.sql` (aplicada com a CLI): bucket público `screens` (só PNG e JPG, até 4 MB) com política aberta de envio e leitura. Conferi com a chave anon: texto é recusado, PNG sobe e **não dá para apagar**.
- `src/lib/image-analysis.ts` (11 testes): descobre o tipo pelos bytes (não pelo nome), valida tamanho, lê a imagem, calcula SHA-256 e o hash perceptual (dHash de 64 bits). Já deixa pronto o que a H3.3.2 precisa. Dependências novas: `pngjs`, `jpeg-js` (JavaScript puro, sem binários).
- Server Action `uploadScreen` e formulário na aba Telas da funcionalidade, com miniaturas.
- `next.config.ts`: limite de envio das Server Actions subiu de 1 MB para 5 MB.

### Decisões
| Decisão | Quem decidiu |
|---|---|
| Limite de 4 MB por imagem e 25 milhões de pixels (evita travar o servidor ao decodificar) | IA |
| Hash perceptual por diferença (dHash): simples, sem dependência nativa | IA |
| Sem exclusão no banco, uma imagem enviada fica no Storage mesmo se o registro falhar (só a autora limpa pelo painel). Existe 1 arquivo de teste de 2 pixels em `screens/_probe/pixel.png` | IA |
| O Vercel Hobby limita o corpo da requisição a ~4,5 MB, por isso o teto de 4 MB | IA |

### Gerado pela IA vs. decidido pela autora
- **IA:** SQL, código, testes. **Autora:** testar o envio de uma imagem real no navegador.
