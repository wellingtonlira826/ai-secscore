import type { CorpDomainSeed } from "./types";

export const CORP_PILLARS = [
  "Estratégia & Governança",
  "Dados",
  "Tecnologia & Operações",
  "Segurança & Resiliência",
  "Pessoas & Cultura",
  "Valor & Gestão",
  "Ciclo de Vida de Modelos",
] as const;

export const CORP_DOMAINS: CorpDomainSeed[] = [
  // ── Estratégia & Governança ─────────────────────────────────────────────────
  { slug: "estrategia-ia", name: "Estratégia de IA", pillar: "Estratégia & Governança", description: "Alinhamento da IA com a estratégia corporativa, visão executiva, priorização e patrocínio da alta gestão.", weight: 1.5, order: 1 },
  { slug: "governanca-ia", name: "Governança de IA", pillar: "Estratégia & Governança", description: "Estruturas, comitês, papéis e responsabilidades para governar o uso de IA na organização.", weight: 1.5, order: 2 },
  { slug: "politicas-normas", name: "Políticas e Normas de IA", pillar: "Estratégia & Governança", description: "Políticas internas, normas e diretrizes formais para desenvolvimento e uso responsável de IA.", weight: 1.2, order: 3 },
  { slug: "gestao-riscos-ia", name: "Gestão de Riscos de IA", pillar: "Estratégia & Governança", description: "Identificação, avaliação, tratamento e monitoramento de riscos específicos de IA integrados ao ERM.", weight: 1.5, order: 4 },
  { slug: "compliance-regulatorio", name: "Compliance Regulatório", pillar: "Estratégia & Governança", description: "Aderência a regulamentações aplicáveis (LGPD, BACEN, CMN, EU AI Act, normas setoriais).", weight: 1.5, order: 5 },
  { slug: "etica-ia", name: "Ética e IA Responsável", pillar: "Estratégia & Governança", description: "Princípios éticos, mitigação de viés, equidade e supervisão humana em sistemas de IA.", weight: 1.2, order: 6 },
  { slug: "transparencia-explicabilidade", name: "Transparência e Explicabilidade", pillar: "Estratégia & Governança", description: "Capacidade de explicar decisões de modelos e comunicar o uso de IA a stakeholders e clientes.", weight: 1.2, order: 7 },

  // ── Dados ───────────────────────────────────────────────────────────────────
  { slug: "governanca-dados", name: "Governança de Dados", pillar: "Dados", description: "Propriedade, catalogação, linhagem e gestão do ciclo de vida dos dados que alimentam a IA.", weight: 1.5, order: 8 },
  { slug: "qualidade-dados", name: "Qualidade de Dados", pillar: "Dados", description: "Processos e métricas para garantir acurácia, completude e consistência dos dados usados em IA.", weight: 1.3, order: 9 },
  { slug: "arquitetura-dados", name: "Arquitetura e Plataforma de Dados", pillar: "Dados", description: "Infraestrutura de dados (data lakes, warehouses, pipelines, feature stores) que suporta iniciativas de IA.", weight: 1.2, order: 10 },
  { slug: "privacidade-lgpd", name: "Privacidade e LGPD", pillar: "Dados", description: "Proteção de dados pessoais em pipelines de IA conforme a LGPD e boas práticas de privacidade.", weight: 1.5, order: 11 },
  { slug: "seguranca-dados", name: "Segurança de Dados", pillar: "Dados", description: "Controles de acesso, criptografia, mascaramento e prevenção de vazamento de dados em IA.", weight: 1.4, order: 12 },

  // ── Tecnologia & Operações ──────────────────────────────────────────────────
  { slug: "infraestrutura-computacional", name: "Infraestrutura Computacional", pillar: "Tecnologia & Operações", description: "Capacidade computacional (GPU, nuvem, escalabilidade) para treinar e servir modelos de IA.", weight: 1.0, order: 13 },
  { slug: "mlops", name: "MLOps", pillar: "Tecnologia & Operações", description: "Automação do ciclo de vida de modelos de ML: CI/CD, versionamento, deployment e reprodutibilidade.", weight: 1.3, order: 14 },
  { slug: "llmops", name: "LLMOps", pillar: "Tecnologia & Operações", description: "Operação de modelos de linguagem: gestão de prompts, avaliação, guardrails e custos de LLMs.", weight: 1.3, order: 15 },
  { slug: "ai-agents", name: "AI Agents", pillar: "Tecnologia & Operações", description: "Adoção e controle de agentes autônomos de IA, orquestração, limites de ação e supervisão.", weight: 1.2, order: 16 },
  { slug: "rag", name: "RAG e Gestão de Conhecimento", pillar: "Tecnologia & Operações", description: "Arquiteturas de Retrieval-Augmented Generation, bases vetoriais e curadoria de conhecimento corporativo.", weight: 1.2, order: 17 },
  { slug: "arquitetura-integracao", name: "Arquitetura e Integração", pillar: "Tecnologia & Operações", description: "Padrões de arquitetura, APIs e integração de soluções de IA com sistemas legados e core business.", weight: 1.1, order: 18 },
  { slug: "ferramentas-plataformas", name: "Ferramentas e Plataformas de IA", pillar: "Tecnologia & Operações", description: "Padronização de ferramentas, plataformas e ambientes de desenvolvimento de IA.", weight: 1.0, order: 19 },
  { slug: "monitoramento-observabilidade", name: "Monitoramento e Observabilidade", pillar: "Tecnologia & Operações", description: "Monitoramento de desempenho, drift, disponibilidade e comportamento de modelos em produção.", weight: 1.3, order: 20 },

  // ── Segurança & Resiliência ─────────────────────────────────────────────────
  { slug: "seguranca-ia", name: "Segurança de IA", pillar: "Segurança & Resiliência", description: "Proteção contra ameaças específicas de IA: prompt injection, envenenamento, extração e evasão de modelos.", weight: 1.5, order: 21 },
  { slug: "seguranca-aplicacoes-ia", name: "Segurança de Aplicações de IA", pillar: "Segurança & Resiliência", description: "Segurança no SDLC de aplicações com IA, controles de acesso e proteção de APIs de modelos.", weight: 1.3, order: 22 },
  { slug: "gestao-vulnerabilidades-ia", name: "Gestão de Vulnerabilidades e Testes", pillar: "Segurança & Resiliência", description: "Red teaming, testes adversariais e gestão de vulnerabilidades em sistemas de IA.", weight: 1.2, order: 23 },
  { slug: "resposta-incidentes-ia", name: "Resposta a Incidentes e Continuidade", pillar: "Segurança & Resiliência", description: "Planos de resposta a incidentes de IA, rollback, kill switches e continuidade de negócio.", weight: 1.3, order: 24 },

  // ── Pessoas & Cultura ───────────────────────────────────────────────────────
  { slug: "cultura-ia", name: "Cultura de IA", pillar: "Pessoas & Cultura", description: "Disseminação da cultura orientada a dados e IA, engajamento e adoção pelas áreas de negócio.", weight: 1.1, order: 25 },
  { slug: "talentos-capacitacao", name: "Talentos e Capacitação", pillar: "Pessoas & Cultura", description: "Atração, retenção e desenvolvimento de competências em IA (técnicas e de negócio).", weight: 1.2, order: 26 },
  { slug: "gestao-mudanca", name: "Gestão de Mudança", pillar: "Pessoas & Cultura", description: "Gestão da mudança organizacional, redesenho de processos e comunicação na adoção de IA.", weight: 1.0, order: 27 },
  { slug: "colaboracao-inovacao", name: "Colaboração e Inovação", pillar: "Pessoas & Cultura", description: "Estruturas de inovação, experimentação, parcerias e colaboração multidisciplinar em IA.", weight: 1.0, order: 28 },

  // ── Valor & Gestão ──────────────────────────────────────────────────────────
  { slug: "roi-valor", name: "ROI e Gestão de Valor", pillar: "Valor & Gestão", description: "Medição de retorno, benefícios e valor de negócio gerado pelas iniciativas de IA.", weight: 1.3, order: 29 },
  { slug: "finops-ia", name: "FinOps de IA", pillar: "Valor & Gestão", description: "Gestão e otimização de custos de IA: computação, tokens, licenças e chargeback.", weight: 1.1, order: 30 },
  { slug: "portfolio-casos-uso", name: "Portfólio de Casos de Uso", pillar: "Valor & Gestão", description: "Identificação, priorização e gestão do portfólio de casos de uso de IA.", weight: 1.2, order: 31 },
  { slug: "gestao-fornecedores", name: "Gestão de Fornecedores e Terceiros", pillar: "Valor & Gestão", description: "Avaliação, contratação e monitoramento de fornecedores de IA e riscos de terceiros.", weight: 1.1, order: 32 },

  // ── Ciclo de Vida de Modelos ────────────────────────────────────────────────
  { slug: "desenvolvimento-modelos", name: "Desenvolvimento de Modelos", pillar: "Ciclo de Vida de Modelos", description: "Práticas de engenharia, experimentação e documentação no desenvolvimento de modelos.", weight: 1.2, order: 33 },
  { slug: "validacao-modelos", name: "Validação e Aprovação de Modelos", pillar: "Ciclo de Vida de Modelos", description: "Validação independente, aprovação formal e gestão de risco de modelos (model risk management).", weight: 1.3, order: 34 },
];

export const MATURITY_LEVELS = [
  {
    level: 1,
    name: "Inicial",
    description: "Práticas de IA ad hoc e não estruturadas. Iniciativas isoladas, dependentes de indivíduos, sem processos formais ou governança.",
    characteristics: [
      "Iniciativas de IA pontuais e experimentais, sem coordenação central",
      "Ausência de políticas, papéis ou governança formal de IA",
      "Resultados imprevisíveis e dependentes de esforços individuais",
    ],
  },
  {
    level: 2,
    name: "Repetível",
    description: "Práticas básicas repetidas em projetos semelhantes. Alguma disciplina de projeto, mas processos ainda não padronizados na organização.",
    characteristics: [
      "Projetos de IA seguem práticas informais repetidas por equipes específicas",
      "Primeiras diretrizes e responsáveis identificados, ainda sem abrangência corporativa",
      "Sucesso replicável em contextos similares, mas sem padronização",
    ],
  },
  {
    level: 3,
    name: "Definido",
    description: "Processos de IA documentados, padronizados e integrados. Governança estabelecida com papéis, políticas e trilhas de capacitação definidas.",
    characteristics: [
      "Processos e políticas de IA documentados e adotados em toda a organização",
      "Governança formal com comitês, papéis e responsabilidades claros",
      "Metodologias padronizadas de desenvolvimento e implantação de modelos",
    ],
  },
  {
    level: 4,
    name: "Gerenciado",
    description: "Processos medidos e controlados quantitativamente. Métricas de desempenho, risco e valor monitoradas sistematicamente com metas definidas.",
    characteristics: [
      "KPIs de desempenho, risco e valor de IA monitorados continuamente",
      "Controles quantitativos, auditorias e gestão proativa de riscos de IA",
      "Decisões de investimento e priorização baseadas em dados e métricas",
    ],
  },
  {
    level: 5,
    name: "Otimizado",
    description: "Melhoria contínua orientada por dados. IA integrada à estratégia, inovação sistemática e otimização permanente de processos e modelos.",
    characteristics: [
      "Melhoria contínua e experimentação sistemática institucionalizadas",
      "IA como diferencial competitivo integrado à estratégia corporativa",
      "Otimização automatizada de modelos, custos e processos com feedback contínuo",
    ],
  },
];
