# BACKLOG — Hub de Gestão de Projetos

> **Rascunho para revisão da autora.** Derivado do `docs/PRD.md` (fonte da verdade). As prioridades e os cortes são decisões de produto da autora; este documento só organiza o que o PRD já define.

Estrutura: **Épico → Funcionalidade → História** (com critérios de aceite). As tarefas técnicas são criadas por história, durante o desenvolvimento.
Ordem sugerida: E0 → E1 → E2 → E5 (seed) → E3 → E4 → E5 (publicação).

---

## E0. Fundação

### F0.1 Base do projeto
- **H0.1.1** Como autora, quero o projeto criado com a stack definida, para ter uma base para construir.
  - [ ] App Next.js + TypeScript rodando localmente
  - [ ] Tailwind e shadcn/ui configurados
  - [ ] Comandos de instalar, rodar, testar e build preenchidos no `CLAUDE.md`
  - [ ] `.env.example` sem valores; nenhum segredo no repositório

### F0.2 Acesso por perfis de demonstração
- **H0.2.1** Como visitante, quero trocar de perfil (Dono, Líder de Design, Líder de Dev, Participante) clicando no meu avatar, para ver como cada papel enxerga o Hub, sem cadastro.
  - [x] O Hub abre direto na página inicial, com o Dono como perfil padrão (sem tela de login)
  - [x] O perfil ativo aparece no topo (avatar com iniciais, nome e papel em texto)
  - [x] Clicar no avatar abre a lista dos quatro perfis e trocar de perfil não sai do Hub
- **H0.2.2** Como autora, quero o banco com RLS ligado e políticas abertas para a demo, para persistir as alterações dos visitantes sem usar `service_role` nem usuários reais.
  - [x] Conexão com o Supabase funcionando (leitura com a anon key)
  - [x] RLS ligado em todas as tabelas, com políticas que permitem ler, criar e alterar
  - [x] Exclusão recusada pelo banco (nenhuma política nem `GRANT` de `DELETE`)
  - [x] Teste confirma que a exclusão é recusada e que uma alteração persiste (sem deixar sujeira: o teste restaura o valor)
  - [x] Nenhuma `service_role` no projeto
  - [ ] Tabela `items` temporária removida quando o esquema real da E1 entrar
  - *Nota:* os papéis valem só na interface (PRD, seção 2 e decisão 4).

---

## E1. Projeto e escopo

### F1.1 Cadastro do projeto
- **H1.1.1** Como Dono do projeto, quero criar um projeto com nome, objetivo, participantes, áreas e prazo, para começar a organizar o trabalho.
  - [x] Campos obrigatórios validados (regras puras em `src/lib/project-validation.ts`, com testes)
  - [x] Participantes e áreas podem ser adicionados e removidos (no formulário, antes de salvar; depois de salvo, só arquivar, na H1.2.3)
  - [x] Posso definir o líder de cada área (1 por área)

### F1.2 Hierarquia de escopo
- **H1.2.1** Como Líder de área, quero criar épicos, funcionalidades, histórias e tarefas da minha área, para delimitar o escopo.
  - [x] Todo item exige pai, área, responsável e prazo (E1) (regra no banco e na validação)
  - [ ] Histórias aceitam o formato "Como… quero… para…" e critérios de aceite
  - [ ] Status disponíveis: a fazer, em andamento, bloqueado, concluído
  - [ ] Item pode ser marcado como crítico
- **H1.2.2** Como Líder de área, quero ser impedido de ultrapassar prazos do pai, para manter o cronograma consistente.
  - [ ] Prazo de filho acima do prazo do pai é bloqueado ou avisado na hora (E2)
  - [ ] Prazo de épico acima do prazo do projeto é bloqueado ou avisado (E3)
- **H1.2.3** Como Líder de área, quero arquivar em vez de excluir itens com filhos, para não perder trabalho por engano.
  - [ ] Excluir item com filhos não é permitido (E4). Na demo, o banco recusa **qualquer** exclusão: itens só se arquivam
  - [ ] Item arquivado sai das visões ativas, mas pode ser restaurado
- **H1.2.4** Como Dono do projeto, quero ver alertas de escopo incompleto, para saber onde falta detalhar.
  - [ ] Item sem filhos (que não seja tarefa) mostra "escopo incompleto" (E5)

### F1.3 Visualização e progresso
- **H1.3.1** Como participante, quero ver a árvore do escopo com o progresso de cada item, para entender o andamento.
  - [ ] Progresso = tarefas concluídas ÷ total de tarefas do item (E6)
  - [ ] Filtros por área, responsável e status
- **H1.3.2** Como participante, quero atualizar o status das tarefas pelas quais respondo, para refletir a realidade.
  - [ ] Só consigo alterar tarefas das quais sou responsável (regra aplicada na interface)
  - [ ] Progresso e saúde atualizam após a mudança

---

## E2. Saúde do projeto

### F2.1 Cálculo de saúde
- **H2.1.1** Como Dono do projeto, quero um semáforo de saúde calculado por regra explícita, para não depender de opinião.
  - [ ] Função pura em `src/lib/health.ts` com limiares em constantes no topo
  - [ ] Regras exatamente como na seção 4 do PRD
  - [ ] A cor final é a mais grave entre as condições atendidas
  - [ ] Testes automatizados cobrem verde, amarelo e vermelho e os casos de borda

### F2.2 Painel de saúde
- **H2.2.1** Como participante, quero ver a saúde do projeto, de cada épico e de cada área, para saber onde agir.
  - [ ] Semáforo por projeto, épico e área
  - [ ] Sempre com o **motivo em texto** (ex.: "Vermelho: 3 tarefas atrasadas em Dev")
  - [ ] A cor nunca aparece sozinha (acessibilidade)
  - [ ] Clicar no motivo leva aos itens responsáveis

---

## E3. Especificação

### F3.1 Regras de negócio
- **H3.1.1** Como Líder de área, quero escrever regras de negócio em Markdown com pré-visualização, para ter uma fonte da verdade limpa.
  - [ ] Editor com pré-visualização ao lado
  - [ ] Cada regra recebe ID estável `RN-###`, único no projeto
- **H3.1.2** Como participante, quero baixar as regras em `.md`, para colar em uma IA.
  - [ ] Download por funcionalidade, por épico e do projeto inteiro
  - [ ] Cabeçalho com projeto, épico e funcionalidade; uma seção por funcionalidade
  - [ ] Teste automatizado da exportação
- **H3.1.3** Como participante, quero ver e baixar as regras em PDF, para compartilhar com quem não usa Markdown.
  - [ ] PDF gerado a partir do mesmo Markdown (tela, `.md` e PDF não divergem)
  - [ ] Dá para visualizar e baixar

### F3.2 Fluxos
- **H3.2.1** Como Líder de área, quero criar fluxos em Mermaid com pré-visualização, para documentar jornadas.
  - [ ] Editor de texto com pré-visualização ao lado
  - [ ] Erro de sintaxe é mostrado de forma compreensível
  - [ ] Passos podem ser vinculados a telas
- **H3.2.2** Como Líder de área, quero ver trechos idênticos entre fluxos, para reaproveitar em vez de duplicar.
  - [ ] Rótulos normalizados (minúsculas, sem acentos, sem pontuação, espaços colapsados)
  - [ ] Detecta sequências de 2 ou mais passos consecutivos iguais em fluxos diferentes
  - [ ] Mostra o trecho, onde aparece e atalho para cada fluxo
  - [ ] Testes automatizados da normalização e da detecção
- **H3.2.3** Como participante, quero buscar um passo ou trecho, para saber em quais fluxos ele ocorre.
  - [ ] Busca por texto lista os fluxos onde o passo aparece

### F3.3 Telas
- **H3.3.1** Como Líder de área, quero enviar imagens de telas (PNG ou JPG), para registrá-las na especificação.
  - [ ] Upload com validação de tipo e tamanho
  - [ ] Tela vinculada a uma funcionalidade
- **H3.3.2** Como Líder de área, quero detectar telas duplicadas ou muito parecidas, para manter apenas uma referência.
  - [ ] SHA-256 identifica cópias exatas
  - [ ] Hash perceptual identifica semelhantes, com limiar ajustável
  - [ ] Grupos de telas repetidas aparecem juntos, com opção de manter só uma
- **H3.3.3** Como participante, quero saber em quais fluxos uma tela aparece, para entender seu uso.
  - [ ] Consulta "em quais fluxos esta tela aparece"
  - [ ] Consulta "quais telas são idênticas ou semelhantes a esta"

---

## E4. Ritos

### F4.1 Importação e visualização
- **H4.1.1** Como Líder de área, quero importar a transcrição de uma reunião, para registrá-la no projeto.
  - [ ] Aceita `.txt` e `.vtt`
  - [ ] Informa tipo (daily, weekly, planning, review, retro), data e participantes
  - [ ] Transcrição completa com busca de texto

### F4.2 Resumo por área
- **H4.2.1** Como participante, quero ver o resumo da reunião por área, para ler só o que me interessa.
  - [ ] Para cada área: pontos principais, decisões, pendências (com responsável sugerido) e riscos
  - [ ] Resumo pré-gerado exibe o aviso "Resumo pré-gerado para demonstração"
  - [ ] Sem resumo pré-gerado, a interface explica que em produção um LLM seria chamado
  - [ ] A demo pública não chama nenhuma IA
- **H4.2.2** Como Líder de área, quero aprovar o resumo, para que só conteúdo revisado vire oficial.
  - [ ] Todo resumo nasce como rascunho
  - [ ] Só líder (ou Dono) aprova (regra aplicada na interface)

### F4.3 Pendência vira tarefa
- **H4.3.1** Como Líder de área, quero transformar uma pendência em tarefa com um clique, para não perder encaminhamentos.
  - [ ] Escolho a funcionalidade pai
  - [ ] Regras de escopo (E1 a E6) são respeitadas
  - [ ] A tarefa criada aparece na árvore e na saúde

---

## E5. Demo e publicação

### F5.1 Dados de exemplo
- **H5.1.1** Como visitante, quero um projeto de exemplo completo, para explorar o Hub sem montar nada.
  - [ ] 1 projeto, 4 áreas, cerca de 8 participantes fictícios
  - [ ] 2 a 3 épicos, 6 a 8 funcionalidades, cerca de 12 histórias, 30 a 40 tarefas
  - [ ] Saúde nas três cores, incluindo atrasos em uma área específica
  - [ ] 2 a 3 fluxos com trechos repetidos de propósito
  - [ ] Cerca de 8 telas, com ao menos duas idênticas e uma quase idêntica
  - [ ] Regras `RN-###` ligadas às funcionalidades
  - [ ] 5 transcrições com resumos pré-gerados
  - [ ] Nenhum dado real

### F5.2 Publicação
- **H5.2.1** Como autora, quero a demo publicada, para compartilhar o link no portfólio.
  - [ ] Deploy público na Vercel, sem nenhuma chave de IA
  - [ ] Demo conferida (Supabase Free pode pausar por inatividade) antes de divulgar
- **H5.2.2** Como autora, quero um README em formato de caso, para mostrar o raciocínio por trás do produto.
  - [ ] Problema, decisões e resultado explicados
  - [ ] `BUILDLOG.md` com a divisão entre decisões da autora e código gerado pela IA
  - [ ] README em português, com resumo em inglês no topo (PRD, seção 11)

---

## Decisões já tomadas (PRD, seção 11)
1. Visitantes podem editar os dados da demo, gravados de verdade no Supabase. Não há botão de restaurar na v1.
2. O Projeto Aurora é um app de delivery de comida.
3. O README é em português, com resumo em inglês no topo.
