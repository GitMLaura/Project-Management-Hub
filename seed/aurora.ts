// Projeto Aurora: fictional food delivery Hub project used as demo data (story H5.1.1).
// 100% invented names and texts. Dates are OFFSETS in days from the day the seed runs
// (0 = today), so the health colors change as time passes.

export type AreaName = "Produto/Negócio" | "Design" | "Desenvolvimento" | "QA";
export type SeedStatus = "a_fazer" | "em_andamento" | "bloqueado" | "concluido";

export type SeedPerson = { name: string; area: AreaName; isOwner?: boolean; isLeader?: boolean };

export type SeedTask = {
  title: string;
  area: AreaName;
  assignee: string;
  status: SeedStatus;
  due: number;
  critical?: boolean;
};

export type SeedStory = {
  title: string;
  persona: string;
  action: string;
  benefit: string;
  criteria: string[];
  area: AreaName;
  assignee: string;
  start: number;
  due: number;
  tasks: SeedTask[];
};

export type SeedRule = { title: string; body: string };

export type SeedFeature = {
  key: string;
  title: string;
  description: string;
  area: AreaName;
  assignee: string;
  start: number;
  due: number;
  stories: SeedStory[];
  rules: SeedRule[];
};

export type SeedEpic = {
  title: string;
  description: string;
  area: AreaName;
  assignee: string;
  start: number;
  due: number;
  features: SeedFeature[];
};

export const PROJECT = {
  name: "Projeto Hits",
  objective:
    "Lançar o Hits, um app de delivery de comida: o cliente escolhe o restaurante, monta o pedido, paga e acompanha a entrega.",
  start: -60,
  due: 60,
};

export const AREAS: readonly AreaName[] = ["Produto/Negócio", "Design", "Desenvolvimento", "QA"];

// The first four names are the demo profiles (src/lib/demo-profiles.ts).
export const PEOPLE: readonly SeedPerson[] = [
  { name: "Helena Duarte", area: "Produto/Negócio", isOwner: true, isLeader: true },
  { name: "Igor Nascimento", area: "Produto/Negócio" },
  { name: "Rafael Moura", area: "Design", isLeader: true },
  { name: "Larissa Prado", area: "Design" },
  { name: "Camila Tavares", area: "Desenvolvimento", isLeader: true },
  { name: "Diego Faria", area: "Desenvolvimento" },
  { name: "Paula Ribeiro", area: "QA", isLeader: true },
  { name: "Bruno Siqueira", area: "QA" },
];

const PN: AreaName = "Produto/Negócio";
const DS: AreaName = "Design";
const DEV: AreaName = "Desenvolvimento";
const QA: AreaName = "QA";

function task(
  title: string,
  area: AreaName,
  assignee: string,
  status: SeedStatus,
  due: number,
  critical = false,
): SeedTask {
  return { title, area, assignee, status, due, critical };
}

export const EPICS: readonly SeedEpic[] = [
  {
    title: "Conta e acesso",
    description: "Entrar no Aurora e recuperar o acesso com segurança.",
    area: PN,
    assignee: "Helena Duarte",
    start: -60,
    due: -7,
    features: [
      {
        key: "login",
        title: "Login",
        description: "Entrada com e-mail e senha.",
        area: DEV,
        assignee: "Camila Tavares",
        start: -60,
        due: -14,
        rules: [
          {
            title: "Sessão do cliente",
            body: "A sessão do cliente dura **30 dias** sem uso. Depois disso, o Hub pede o login de novo.",
          },
          {
            title: "Bloqueio por tentativas",
            body: "Após **5 tentativas** de senha erradas seguidas, o acesso fica bloqueado por 15 minutos.\n\n- O cliente vê o tempo que falta.\n- O bloqueio some sozinho.",
          },
          {
            title: "E-mail único",
            body: "Cada e-mail identifica **uma só conta**. Um e-mail já cadastrado não pode ser usado em outra conta.",
          },
        ],
        stories: [
          {
            title: "Entrar com e-mail e senha",
            persona: "cliente",
            action: "entrar com meu e-mail e senha",
            benefit: "fazer pedidos sem repetir cadastro",
            criteria: ["Credenciais corretas levam à página inicial", "Credenciais erradas mostram uma mensagem clara"],
            area: DEV,
            assignee: "Camila Tavares",
            start: -60,
            due: -20,
            tasks: [
              task("Desenhar a tela de login", DS, "Larissa Prado", "concluido", -45),
              task("Implementar o login", DEV, "Diego Faria", "concluido", -30),
              task("Testar o login", QA, "Bruno Siqueira", "concluido", -22),
            ],
          },
          {
            title: "Continuar logado",
            persona: "cliente",
            action: "continuar logado no meu celular",
            benefit: "não digitar a senha todo dia",
            criteria: ["A sessão volta sozinha ao abrir o Hub", "Sessão vencida pede login de novo"],
            area: DEV,
            assignee: "Diego Faria",
            start: -40,
            due: -14,
            tasks: [
              task("Guardar a sessão do cliente", DEV, "Diego Faria", "concluido", -25),
              task("Testar sessão expirada", QA, "Bruno Siqueira", "concluido", -16),
            ],
          },
        ],
      },
      {
        key: "recovery",
        title: "Recuperação de acesso",
        description: "Redefinir a senha por e-mail.",
        area: DS,
        assignee: "Rafael Moura",
        start: -50,
        due: -7,
        rules: [
          {
            title: "Validade do link de redefinição",
            body: "O link de redefinição expira em **30 minutos** e só pode ser usado **uma vez**.",
          },
          {
            title: "Regras da nova senha",
            body: "A nova senha tem no mínimo **8 caracteres**, com pelo menos uma letra e um número.",
          },
        ],
        stories: [
          {
            title: "Recuperar a senha",
            persona: "cliente",
            action: "recuperar minha senha por e-mail",
            benefit: "voltar a acessar minha conta",
            criteria: ["O e-mail de redefinição chega em até 1 minuto", "A nova senha segue as regras de senha"],
            area: DS,
            assignee: "Rafael Moura",
            start: -50,
            due: -7,
            tasks: [
              task("Desenhar o fluxo de recuperação", DS, "Larissa Prado", "concluido", -35),
              task("Enviar o e-mail de redefinição", DEV, "Camila Tavares", "concluido", -20),
              task("Definir as regras de senha", PN, "Igor Nascimento", "concluido", -28),
              task("Testar a recuperação de acesso", QA, "Paula Ribeiro", "concluido", -9),
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Pedido e entrega",
    description: "Do cardápio até a comida na porta do cliente.",
    area: PN,
    assignee: "Helena Duarte",
    start: -45,
    due: 50,
    features: [
      {
        key: "menu",
        title: "Cardápio e carrinho",
        description: "Ver os pratos e montar o pedido.",
        area: DS,
        assignee: "Rafael Moura",
        start: -45,
        due: 10,
        rules: [
          {
            title: "Preço no cardápio",
            body: "O preço mostrado no cardápio é o preço do prato. A **taxa de entrega** aparece separada, só no carrinho.",
          },
        ],
        stories: [
          {
            title: "Ver o cardápio",
            persona: "cliente",
            action: "ver o cardápio do restaurante",
            benefit: "escolher o que pedir",
            criteria: ["Pratos aparecem por categoria", "Prato esgotado aparece como indisponível"],
            area: DS,
            assignee: "Rafael Moura",
            start: -45,
            due: 5,
            tasks: [
              task("Desenhar a tela de cardápio", DS, "Larissa Prado", "concluido", -30),
              task("Listar pratos por categoria", DEV, "Diego Faria", "concluido", -12),
              task("Testar o cardápio", QA, "Bruno Siqueira", "concluido", -2),
            ],
          },
          {
            title: "Montar o carrinho",
            persona: "cliente",
            action: "montar meu carrinho",
            benefit: "revisar o pedido antes de pagar",
            criteria: ["Posso mudar a quantidade de cada prato", "O total muda na hora"],
            area: DEV,
            assignee: "Camila Tavares",
            start: -30,
            due: 10,
            tasks: [
              task("Desenhar o carrinho", DS, "Larissa Prado", "concluido", -18),
              task("Calcular o total do carrinho", DEV, "Camila Tavares", "em_andamento", 8),
              task("Validar o pedido mínimo", PN, "Igor Nascimento", "a_fazer", 10),
            ],
          },
        ],
      },
      {
        key: "checkout",
        title: "Checkout e pagamento",
        description: "Endereço de entrega e pagamento do pedido.",
        area: DEV,
        assignee: "Camila Tavares",
        start: -30,
        due: 30,
        rules: [
          {
            title: "Pedido mínimo",
            body: "O pedido mínimo é de **R$ 20,00** em pratos, sem contar a taxa de entrega.",
          },
          {
            title: "Validade do Pix",
            body: "O código Pix expira em **15 minutos**. Depois disso, o pedido volta para o carrinho.",
          },
          {
            title: "Tentativas de cartão",
            body: "O cliente pode tentar o cartão **3 vezes** por pedido. Na 3ª recusa, o Hub sugere Pix.",
          },
        ],
        stories: [
          {
            title: "Pagar com cartão ou Pix",
            persona: "cliente",
            action: "pagar com cartão ou Pix",
            benefit: "concluir o pedido do jeito que prefiro",
            criteria: ["Pagamento aprovado confirma o pedido", "Pagamento recusado explica o motivo"],
            area: DEV,
            assignee: "Camila Tavares",
            start: -30,
            due: 30,
            tasks: [
              task("Desenhar a tela de pagamento", DS, "Rafael Moura", "concluido", -20),
              task("Integrar o pagamento com cartão", DEV, "Diego Faria", "a_fazer", -6, true),
              task("Integrar o Pix", DEV, "Camila Tavares", "em_andamento", -4),
              task("Confirmar o pagamento ao cliente", DEV, "Diego Faria", "a_fazer", -2),
              task("Testar os pagamentos", QA, "Paula Ribeiro", "a_fazer", 25),
            ],
          },
          {
            title: "Escolher o endereço de entrega",
            persona: "cliente",
            action: "revisar o endereço de entrega",
            benefit: "receber o pedido no lugar certo",
            criteria: ["O endereço é preenchido pelo CEP", "Posso escolher entre endereços salvos"],
            area: DS,
            assignee: "Larissa Prado",
            start: -20,
            due: 20,
            tasks: [
              task("Desenhar a seleção de endereço", DS, "Larissa Prado", "em_andamento", -3),
              task("Buscar o endereço pelo CEP", DEV, "Diego Faria", "a_fazer", 14),
              task("Testar o endereço de entrega", QA, "Bruno Siqueira", "a_fazer", 20),
            ],
          },
        ],
      },
      {
        key: "tracking",
        title: "Acompanhamento da entrega",
        description: "Saber onde está o pedido e avaliar a entrega.",
        area: DEV,
        assignee: "Camila Tavares",
        start: -10,
        due: 48,
        rules: [
          {
            title: "Status do pedido",
            body: "O pedido passa por: **recebido, em preparo, a caminho, entregue**. Um status nunca volta para o anterior.",
          },
        ],
        stories: [
          {
            title: "Acompanhar o pedido no mapa",
            persona: "cliente",
            action: "acompanhar meu pedido no mapa",
            benefit: "saber quando ele chega",
            criteria: ["O mapa mostra a posição do entregador", "O status aparece em texto"],
            area: DEV,
            assignee: "Camila Tavares",
            start: -10,
            due: 45,
            tasks: [
              task("Desenhar a tela de acompanhamento", DS, "Rafael Moura", "em_andamento", 10),
              task("Atualizar a posição do entregador", DEV, "Camila Tavares", "a_fazer", 35),
              task("Definir as mensagens de status", PN, "Helena Duarte", "concluido", -5),
              task("Testar o acompanhamento", QA, "Paula Ribeiro", "a_fazer", 45),
            ],
          },
          {
            title: "Avaliar a entrega",
            persona: "cliente",
            action: "avaliar a entrega",
            benefit: "dar retorno ao restaurante",
            criteria: ["Posso dar de 1 a 5 estrelas", "A avaliação é opcional"],
            area: DS,
            assignee: "Larissa Prado",
            start: 5,
            due: 40,
            tasks: [
              task("Desenhar a tela de avaliação", DS, "Larissa Prado", "a_fazer", 30),
              task("Salvar a avaliação do cliente", DEV, "Diego Faria", "a_fazer", 40),
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Restaurantes parceiros",
    description: "Cadastro dos restaurantes e painel para receber pedidos.",
    area: PN,
    assignee: "Helena Duarte",
    start: -20,
    due: 58,
    features: [
      {
        key: "signup",
        title: "Cadastro de restaurante",
        description: "O restaurante entra no Aurora e monta seu cardápio.",
        area: PN,
        assignee: "Helena Duarte",
        start: -20,
        due: 40,
        rules: [
          {
            title: "Documentos do restaurante",
            body: "Para ativar o cadastro, o restaurante envia **CNPJ** e **comprovante de endereço**. A conta fica pendente até a análise.",
          },
        ],
        stories: [
          {
            title: "Cadastrar o restaurante",
            persona: "dono de restaurante",
            action: "me cadastrar no Aurora",
            benefit: "vender pelo aplicativo",
            criteria: ["Todos os campos obrigatórios são validados", "O restaurante vê o status da análise"],
            area: PN,
            assignee: "Igor Nascimento",
            start: -20,
            due: 22,
            tasks: [
              task("Definir os documentos exigidos", PN, "Igor Nascimento", "concluido", -12),
              task("Desenhar o formulário de cadastro", DS, "Larissa Prado", "concluido", -6),
              task("Criar o formulário de cadastro", DEV, "Diego Faria", "em_andamento", 12),
              task("Testar o cadastro de restaurante", QA, "Bruno Siqueira", "a_fazer", 22),
            ],
          },
          {
            title: "Cadastrar o cardápio",
            persona: "dono de restaurante",
            action: "cadastrar meu cardápio",
            benefit: "mostrar meus pratos aos clientes",
            criteria: ["Cada prato tem nome, preço e categoria", "Posso pausar um prato"],
            area: DS,
            assignee: "Rafael Moura",
            start: -5,
            due: 38,
            tasks: [
              task("Desenhar o editor de cardápio", DS, "Rafael Moura", "bloqueado", 15),
              task("Salvar pratos e fotos", DEV, "Camila Tavares", "a_fazer", 38),
              task("Definir o limite de fotos por prato", PN, "Igor Nascimento", "a_fazer", 20),
            ],
          },
        ],
      },
      {
        key: "panel",
        title: "Painel de pedidos do restaurante",
        description: "O restaurante vê e prepara os pedidos que chegam.",
        area: DEV,
        assignee: "Camila Tavares",
        start: -5,
        due: 55,
        rules: [
          {
            title: "Tempo para aceitar o pedido",
            body: "O restaurante tem **5 minutos** para aceitar um pedido novo. Passado esse tempo, o pedido é cancelado e o cliente é avisado.",
          },
        ],
        stories: [
          {
            title: "Ver os pedidos que chegam",
            persona: "dono de restaurante",
            action: "ver os pedidos que chegam",
            benefit: "prepará-los a tempo",
            criteria: ["Pedidos novos aparecem no topo", "Posso aceitar ou recusar cada pedido"],
            area: DEV,
            assignee: "Camila Tavares",
            start: -5,
            due: 52,
            tasks: [
              task("Desenhar o painel de pedidos", DS, "Rafael Moura", "a_fazer", 25),
              task("Listar os pedidos recebidos", DEV, "Diego Faria", "a_fazer", 45),
              task("Testar o painel de pedidos", QA, "Paula Ribeiro", "a_fazer", 52),
            ],
          },
        ],
      },
    ],
  },
];

// ---------- Flows (Mermaid) with segments repeated on purpose ----------

export type SeedFlow = {
  featureKey: string;
  title: string;
  source: string;
  // Mermaid step id -> screen key
  links: Record<string, string>;
};

export const FLOWS: readonly SeedFlow[] = [
  {
    featureKey: "login",
    title: "Login com e-mail e senha",
    source: `flowchart TD
  A[Abrir o Hub] --> B[Informar e-mail]
  B --> C[Informar senha]
  C --> D[Validar credenciais]
  D --> E[Entrar na conta]
  D --> F[Mostrar erro de acesso]`,
    links: { B: "login", E: "menu" },
  },
  {
    featureKey: "recovery",
    title: "Recuperação de acesso",
    source: `flowchart TD
  A[Abrir o Hub] --> B[Tocar em esqueci a senha]
  B --> C[Informar e-mail]
  C --> D[Enviar link de redefinição]
  D --> E[Definir nova senha]
  E --> F[Validar credenciais]
  F --> G[Entrar na conta]`,
    links: { B: "login-copy", E: "recovery", G: "menu" },
  },
  {
    featureKey: "checkout",
    title: "Entrar para finalizar o pedido",
    source: `flowchart TD
  A[Abrir carrinho] --> B[Tocar em finalizar pedido]
  B --> C[Informar e-mail]
  C --> D[Informar senha]
  D --> E[Validar credenciais]
  E --> F[Entrar na conta]
  F --> G[Escolher forma de pagamento]`,
    links: { A: "cart", C: "login", G: "payment" },
  },
];

// ---------- Screens (images are drawn by code: seed/screens.ts) ----------

export type SeedScreen = {
  key: string;
  name: string;
  featureKey: string;
  // Pictures with the same layout seed look the same. "variation" adds one small change.
  layout: number;
  variation?: boolean;
};

export const SCREENS: readonly SeedScreen[] = [
  { key: "login", name: "Login", featureKey: "login", layout: 11 },
  { key: "login-copy", name: "Login (cópia na recuperação)", featureKey: "recovery", layout: 11 },
  { key: "recovery", name: "Nova senha", featureKey: "recovery", layout: 23 },
  { key: "menu", name: "Cardápio", featureKey: "menu", layout: 59 },
  { key: "cart", name: "Carrinho", featureKey: "menu", layout: 83 },
  { key: "payment", name: "Pagamento", featureKey: "checkout", layout: 95 },
  { key: "payment-v2", name: "Pagamento (botão novo)", featureKey: "checkout", layout: 95, variation: true },
  { key: "tracking", name: "Acompanhamento", featureKey: "tracking", layout: 119 },
];

// ---------- Rituals ----------

export type SeedSummary = {
  area: AreaName;
  keyPoints: string[];
  decisions: string[];
  risks: string[];
  pendings: { description: string; assignee: string }[];
  status: "draft" | "approved";
};

export type SeedRitual = {
  key: string;
  title: string;
  kind: "daily" | "weekly" | "planning" | "review" | "retro";
  heldOn: number; // days from today (negative = past)
  file: string; // inside seed/transcripts
  participants: string[];
  summaries: SeedSummary[];
};
