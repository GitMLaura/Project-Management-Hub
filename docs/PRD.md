# PRD — Aurora Project Hub

> Projeto de portfólio com **dados 100% fictícios** (Projeto Aurora). Inspirado em um desafio real de gestão de projetos multidisciplinares; nenhum dado, tela ou documento de empresa real é usado.

## 1. Visão

Um portal onde um projeto é cadastrado e todo o seu trabalho fica em um só lugar: **escopo delimitado** (épico → funcionalidade → história → tarefa), **saúde do projeto** calculada com regra explícita, **especificação** (regras de negócio, fluxos e telas) consultável, e **ritos** (dailys, weeklys, plannings) transformados em resumos por área.

### Problema
- O escopo se espalha: tarefas em um lugar, regras de negócio em documentos soltos, decisões perdidas em reuniões.
- Times de áreas diferentes (Design, Dev, Produto, QA) não enxergam a mesma saúde do projeto.
- Regras de negócio são difíceis de consultar com IA quando não estão em formato limpo e com IDs estáveis.
- Fluxos e telas se repetem entre funcionalidades sem que ninguém perceba.

### Objetivos da v1
1. **Escopo bem delimitado:** hierarquia obrigatória, com responsável e prazo em todo item.
2. **Saúde visível e explicável:** semáforo por projeto, épico e área, sempre com o motivo.
3. **Especificação consultável:** regras em Markdown (fonte da verdade), PDF, e detecção de trechos de fluxo e telas repetidos.
4. **Ritos úteis:** importar transcrição, ver resumo por área e transformar pendências em tarefas.

### Não-objetivos da v1
Ver seção 9.

## 2. Papéis e permissões

| Papel | Quantidade | Pode |
|---|---|---|
| **Dono do projeto** | 1 | Criar o projeto (nome, objetivo, participantes, áreas, prazo), definir o líder de cada área, editar qualquer item |
| **Líder de área** | 1 por área | Criar e editar épicos, funcionalidades, histórias e tarefas da sua área; editar a especificação da sua área; importar ritos |
| **Participante** | N | Atualizar o status das tarefas pelas quais responde e consultar tudo |

Regras:
- Cada item pertence a **uma área** e o líder dessa área responde por ele.
- Um épico pode reunir funcionalidades de áreas diferentes. O líder de uma área cria funcionalidades, histórias e tarefas da sua área sob qualquer épico do projeto.
- Toda ação é validada por papel no banco (políticas RLS do Supabase), não só na interface.

## 3. Modelo de escopo

```
Projeto
 ├─ Épico
 │   └─ Funcionalidade
 │       └─ História
 │           └─ Tarefa
 ├─ Especificação (por funcionalidade: regras, fluxos, telas)
 └─ Ritos (transcrições e resumos)
```

### Regras de escopo
- **E1.** Todo item tem um pai obrigatório. Não existe história solta fora de uma funcionalidade, nem funcionalidade fora de um épico.
- **E2.** O prazo de um filho não pode ultrapassar o prazo do pai. A interface bloqueia ou avisa na hora.
- **E3.** O prazo de um épico não pode ultrapassar o prazo do projeto.
- **E4.** Não é possível excluir um item que tenha filhos. Só arquivar.
- **E5.** Todo item que não seja tarefa e não tenha filhos (ex.: história sem tarefas) aparece com o alerta **"escopo incompleto"**.
- **E6.** A unidade de medida de progresso é a **tarefa**.

### Campos
| Campo | Observação |
|---|---|
| Título | Obrigatório |
| Descrição | Opcional |
| Área | Obrigatório, uma só |
| Responsável | Obrigatório, participante do projeto |
| Início | Obrigatório (opcional em tarefas) |
| Prazo | Obrigatório |
| Status | `a_fazer`, `em_andamento`, `bloqueado`, `concluido` |
| Crítico | Marcador booleano, para itens que não podem atrasar |
| Pai | Obrigatório (exceto épico, cujo pai é o projeto) |

Histórias seguem o formato "Como [perfil], quero [ação] para [benefício]" e têm **critérios de aceite** (lista de texto).

### Progresso
`progresso de um item = tarefas concluídas ÷ total de tarefas dentro dele`

## 4. Saúde do projeto

Calculada para o **projeto, cada épico e cada área**, sempre com o **motivo visível** (ex.: "Vermelho: 3 tarefas atrasadas em Dev").

Definições:
- **Atrasada:** tarefa com prazo anterior a hoje e status diferente de `concluido`.
- **Progresso esperado:** `(hoje − início) ÷ (prazo − início)`, limitado entre 0 e 100%, usando as datas do item (do projeto, para a visão por área).
- **Desvio:** `progresso esperado − progresso real`, em pontos percentuais (p.p.).

Regras (limiares padrão, concentrados em um único arquivo para ajuste):

| Cor | Quando |
|---|---|
| 🔴 **Vermelho** | 3 ou mais tarefas atrasadas, **ou** item crítico (de qualquer nível) atrasado ou bloqueado, **ou** desvio maior que 25 p.p., **ou** item sem responsável com prazo em até 7 dias |
| 🟡 **Amarelo** | 1 ou 2 tarefas atrasadas, **ou** algum item bloqueado, **ou** desvio maior que 10 p.p. |
| 🟢 **Verde** | Nenhuma das condições acima |

A cor final é a mais grave entre as condições atendidas. O cálculo é uma função pura, com testes automatizados.

## 5. Especificação (fluxos, telas e regras de negócio)

Cada funcionalidade tem sua especificação, organizada em três abas: **Regras**, **Fluxos** e **Telas**. O épico mostra a agregação das suas funcionalidades.

### 5.1 Regras de negócio (requisitos 3 e 4)
- Escritas em **Markdown**, que é a fonte da verdade, com editor e pré-visualização.
- Cada regra tem **ID estável** (`RN-001`, `RN-002`...), único no projeto, para citar em conversas com IA ("conforme RN-012").
- **Baixar .md:** por funcionalidade, por épico ou do projeto inteiro. O arquivo exportado traz um cabeçalho com projeto, épico e funcionalidade, e uma seção por funcionalidade, pensado para ser colado ou anexado em uma IA.
- **Ver como PDF e baixar:** o PDF é gerado a partir do mesmo Markdown, então tela, `.md` e PDF nunca divergem.

### 5.2 Fluxos (requisito 1)
- Fluxos são **diagramas em Mermaid** (`flowchart`), com editor de texto e pré-visualização ao lado.
- Cada passo do fluxo pode ser **vinculado a uma tela**.
- **Trechos idênticos entre fluxos:** o sistema lê os diagramas, extrai passos e conexões, **normaliza** os rótulos (minúsculas, sem acentos, sem pontuação, espaços colapsados) e procura **sequências de 2 ou mais passos consecutivos** iguais em fluxos diferentes. Mostra: o trecho, em quais fluxos aparece e um atalho para abrir cada um.
- **Busca por texto** de um passo ou trecho, mostrando em quais fluxos ele ocorre.
- Limite assumido na v1: a comparação é por rótulo **idêntico** após a normalização. "Validar senha" e "Conferir senha" não são iguais. Similaridade semântica fica para depois.

### 5.3 Telas (requisito 2)
- Upload de imagens (PNG ou JPG, exports do design). Sem integração com Figma na v1.
- **Telas idênticas:** hash SHA-256 do arquivo (cópias exatas) e **hash perceptual** (imagens muito parecidas, com limiar ajustável).
- Cada tela pode ser vinculada a passos de vários fluxos. Consulta: "em quais fluxos esta tela aparece" e "quais telas são idênticas ou muito semelhantes a esta".
- Grupos de telas repetidas são exibidos juntos, com a opção de manter apenas uma como referência.

## 6. Ritos

- **Tipos:** daily, weekly, planning, review, retro. Metadados: tipo, data e participantes (escolhidos entre os do projeto).
- **Importação:** arquivos `.txt` e `.vtt` gerados por ferramentas de reunião. (`.docx` fica para depois.)
- **Visualização:** transcrição completa, com busca de texto.
- **Resumo por área:** para cada área, **pontos principais, decisões, pendências (com responsável sugerido) e riscos**. As falas são associadas à área pelo cadastro de participantes do projeto.
- **Rascunho → aprovado:** todo resumo nasce como rascunho e só vira oficial após aprovação humana.
- **Pendência vira tarefa:** com um clique, escolhendo a funcionalidade pai, respeitando as regras de escopo (seção 3).

### Modo demo (decisão de produto)
A demo pública **não chama nenhuma IA**:
- O Projeto Aurora traz transcrições de exemplo e **resumos pré-gerados** (carregados do `seed/`).
- O fluxo de importação funciona de ponta a ponta. Quando há resumo pré-gerado para a transcrição, ele é exibido com o aviso **"Resumo pré-gerado para demonstração"**. Quando não há, a interface explica que, em produção, esse passo chamaria um LLM.
- Os resumos de exemplo são gerados **uma vez, localmente**, por um script opcional (`scripts/generate-summaries`), usando a API do Claude ou do Gemini com a chave em `.env.local`, e salvos no `seed/`. O script fica no repositório; a chave, nunca.

### Como funcionaria em produção (apenas documentado)
Importar a transcrição → um serviço no servidor chama um LLM (Claude ou Gemini, configurável) com saída estruturada por área → o resumo fica como rascunho → um líder aprova → as pendências viram tarefas.

Formato do resumo (por área):
```json
{
  "area": "Desenvolvimento",
  "pontos_principais": ["..."],
  "decisoes": ["..."],
  "pendencias": [{ "descricao": "...", "responsavel_sugerido": "..." }],
  "riscos": ["..."]
}
```

## 7. Demo e dados fictícios

O **Projeto Aurora** deve ser pequeno, mas completo o bastante para exercitar tudo:
- 1 projeto, 4 áreas (Design, Desenvolvimento, Produto/Negócio, QA) e cerca de 8 participantes com nomes inventados.
- 2 a 3 épicos, 6 a 8 funcionalidades, cerca de 12 histórias e 30 a 40 tarefas.
- Dados escolhidos **de propósito** para mostrar a saúde nas três cores (incluindo atrasos em uma área específica).
- 2 a 3 fluxos em Mermaid com **trechos repetidos de propósito** (ex.: login e recuperação de acesso).
- Cerca de 8 telas, com **pelo menos duas idênticas** e uma quase idêntica.
- Regras de negócio com IDs `RN-###` ligadas às funcionalidades.
- 5 transcrições de ritos fictícias, com resumos pré-gerados por área.

**Perfis de demonstração:** tela "Entrar como" (Dono, Líder de Design, Líder de Dev, Participante), sem cadastro, para visitantes testarem as permissões.

## 8. Requisitos não funcionais

- **Segurança:** nenhuma chave de API no repositório; **nenhuma chave de LLM em produção**; permissões aplicadas por RLS; apenas dados fictícios.
- **Custo zero:** Vercel Hobby (uso não comercial) e Supabase Free. O Supabase Free pausa projetos com pouca atividade, então a demo deve ser aberta e conferida antes de compartilhar o link.
- **Idioma:** interface em português do Brasil; código e identificadores em inglês.
- **Responsividade:** desktop primeiro, utilizável em tablet.
- **Acessibilidade básica:** contraste adequado, navegação por teclado, cor da saúde sempre acompanhada de texto (não depender só da cor).
- **Qualidade:** testes automatizados para o cálculo de saúde, a normalização de fluxos, a detecção de trechos repetidos e a exportação em Markdown.

## 9. Fora do escopo da v1

Notificações, comentários em tempo real, integração com Jira ou Figma, gravação de chamadas, edição colaborativa de fluxos, importação de `.docx`, similaridade semântica de passos, chamada real a LLM na demo pública e cobrança ou multiempresa.

## 10. Critérios de pronto da v1

- [ ] Criar um projeto com nome, objetivo, participantes, áreas e prazo
- [ ] Criar épicos, funcionalidades, histórias e tarefas com responsável, prazo e status, respeitando E1 a E6
- [ ] Painel de saúde por projeto, épico e área, com motivo
- [ ] Regras de negócio em Markdown com visualização, download `.md` e PDF (visualizar e baixar)
- [ ] Fluxos em Mermaid com detecção de trechos idênticos e busca
- [ ] Telas com detecção de duplicadas e vínculo com fluxos
- [ ] Ritos: importar transcrição, ver resumo por área (pré-gerado) e criar tarefa a partir de pendência
- [ ] Projeto Aurora carregado a partir do `seed/`
- [ ] Deploy público funcionando, sem nenhuma chave de IA
- [ ] README em formato de caso, com `BUILDLOG.md` e a divisão entre decisões da autora e código gerado pela IA

## 11. Decisões

1. **Escrita pública na demo (decidido):** os visitantes **podem editar** os dados nos perfis de demonstração, e tudo é gravado de verdade no Supabase, para demonstrar a integração funcionando. **Não haverá botão de restaurar** na v1.
2. **Tema do Projeto Aurora (decidido):** um **app de delivery de comida** (pedidos, restaurantes, entregas, login e recuperação de acesso). Todos os dados do seed seguem esse tema, com nomes inventados.
3. **Idioma do README (decidido):** **português**, com um **resumo em inglês** no topo.

## 12. Próximos documentos

`docs/BACKLOG.md` (épicos, funcionalidades e histórias do próprio produto, com critérios de aceite), `docs/BUILDLOG.md` (diário de decisões e construção) e `seed/` (dados do Projeto Aurora).
