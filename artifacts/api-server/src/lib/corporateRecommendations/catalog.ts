// Curated recommendation catalog for the corporate AI maturity assessment.
// Pure reference data (pt-BR content), keyed by domain slug. The rules engine
// in ./engine.ts crosses this catalog with assessment scores — no DB, no AI.

export type Impact = "high" | "medium" | "low";
export type Effort = "high" | "medium" | "low";

export type CatalogEntry = {
  /** Principal risco quando o domínio está imaturo. */
  risk: { title: string; description: string };
  /** Principal oportunidade ao evoluir o domínio. */
  opportunity: { title: string; description: string };
  /** Ação de alto impacto e baixo esforço. */
  quickWin: { title: string; impact: Impact; effort: Effort };
  /** Projeto estruturante prioritário. */
  project: { title: string; description: string; impact: Impact; effort: Effort };
  /** Ferramentas de mercado recomendadas. */
  tools: string[];
  /** Capacitação recomendada. */
  training: { title: string; audience: string };
};

export const RECOMMENDATION_CATALOG: Record<string, CatalogEntry> = {
  "estrategia-ia": {
    risk: {
      title: "Iniciativas de IA desalinhadas da estratégia corporativa",
      description:
        "Sem visão executiva e priorização formal, investimentos em IA se dispersam em pilotos sem retorno e sem patrocínio da alta gestão.",
    },
    opportunity: {
      title: "Estratégia de IA como vetor de vantagem competitiva",
      description:
        "Uma estratégia formal de IA com metas mensuráveis acelera a captura de valor e direciona investimentos aos casos de maior retorno.",
    },
    quickWin: { title: "Nomear um executivo patrocinador (sponsor) de IA e formalizar objetivos anuais", impact: "high", effort: "low" },
    project: {
      title: "Programa de estratégia corporativa de IA",
      description: "Definir visão, ambição, metas e mapa de investimentos de IA aprovados pelo conselho, com revisão semestral.",
      impact: "high",
      effort: "medium",
    },
    tools: ["Gartner AI Maturity Model", "McKinsey QuantumBlack Playbooks"],
    training: { title: "Workshop executivo de estratégia de IA", audience: "C-level e diretoria" },
  },
  "governanca-ia": {
    risk: {
      title: "Uso de IA sem governança formal",
      description:
        "A ausência de comitê, papéis e alçadas para IA gera shadow AI, decisões inconsistentes e exposição regulatória.",
    },
    opportunity: {
      title: "Governança de IA que habilita escala com controle",
      description:
        "Comitê de IA com papéis claros acelera aprovações, reduz retrabalho e dá segurança à adoção em escala.",
    },
    quickWin: { title: "Instituir comitê de governança de IA com reuniões mensais e alçadas definidas", impact: "high", effort: "low" },
    project: {
      title: "Operating model de governança de IA",
      description: "Estruturar papéis (AI owner, risk owner, data steward), fluxos de aprovação e inventário corporativo de sistemas de IA.",
      impact: "high",
      effort: "medium",
    },
    tools: ["Collibra AI Governance", "Microsoft Purview", "IBM watsonx.governance", "Credo AI"],
    training: { title: "Formação em governança de IA (ISO/IEC 42001, NIST AI RMF)", audience: "GRC, riscos e tecnologia" },
  },
  "politicas-normas": {
    risk: {
      title: "Ausência de políticas formais de uso de IA",
      description:
        "Sem normas internas, colaboradores usam IA generativa com dados sensíveis e sem critérios, criando risco legal e de vazamento.",
    },
    opportunity: {
      title: "Política de IA que destrava o uso responsável",
      description: "Diretrizes claras de uso aceitável reduzem incerteza e aceleram a adoção segura por todas as áreas.",
    },
    quickWin: { title: "Publicar política de uso aceitável de IA generativa (dados permitidos, ferramentas aprovadas)", impact: "high", effort: "low" },
    project: {
      title: "Corpo normativo de IA",
      description: "Elaborar política corporativa de IA, normas de desenvolvimento, uso de terceiros e diretrizes por área, com ciclo anual de revisão.",
      impact: "medium",
      effort: "medium",
    },
    tools: ["OneTrust", "ServiceNow GRC", "Archer"],
    training: { title: "Treinamento obrigatório de uso responsável de IA", audience: "Todos os colaboradores" },
  },
  "gestao-riscos-ia": {
    risk: {
      title: "Riscos de IA fora do radar corporativo",
      description:
        "Riscos específicos de IA (viés, alucinação, drift, ataques) não integrados ao ERM deixam a organização exposta sem tratamento formal.",
    },
    opportunity: {
      title: "Gestão de riscos de IA integrada ao ERM",
      description: "Taxonomia e apetite de risco de IA definidos permitem priorizar controles onde há maior exposição.",
    },
    quickWin: { title: "Incluir categoria de risco de IA no registro de riscos corporativo", impact: "high", effort: "low" },
    project: {
      title: "Framework de gestão de riscos de IA",
      description: "Implantar avaliação de risco por sistema de IA (tiering), tratamento, indicadores (KRIs) e reporte ao conselho, alinhado ao NIST AI RMF.",
      impact: "high",
      effort: "medium",
    },
    tools: ["ServiceNow IRM", "Archer", "IBM OpenPages", "Credo AI"],
    training: { title: "Capacitação em NIST AI RMF e avaliação de riscos de IA", audience: "Riscos, compliance e auditoria" },
  },
  "compliance-regulatorio": {
    risk: {
      title: "Não conformidade regulatória em IA",
      description:
        "Descumprimento de LGPD, normas BACEN/CMN e requisitos emergentes (EU AI Act) pode gerar sanções, bloqueios e dano reputacional.",
    },
    opportunity: {
      title: "Conformidade como diferencial de confiança",
      description: "Aderência demonstrável a regulações de IA habilita novos negócios e reduz fricção com reguladores e clientes.",
    },
    quickWin: { title: "Mapear sistemas de IA contra obrigações regulatórias aplicáveis (gap assessment)", impact: "high", effort: "low" },
    project: {
      title: "Programa de compliance regulatório de IA",
      description: "Estabelecer inventário regulatório, classificação de risco por norma (EU AI Act, LGPD, BACEN), controles e evidências de conformidade.",
      impact: "high",
      effort: "high",
    },
    tools: ["OneTrust", "TrustArc", "Microsoft Purview Compliance Manager"],
    training: { title: "Atualização regulatória em IA (LGPD, EU AI Act, BACEN)", audience: "Jurídico, compliance e produto" },
  },
  "etica-ia": {
    risk: {
      title: "Decisões enviesadas e sem supervisão humana",
      description:
        "Modelos com viés não mitigado podem discriminar clientes e gerar passivo legal e reputacional grave.",
    },
    opportunity: {
      title: "IA responsável como marca de confiança",
      description: "Princípios éticos operacionalizados aumentam a confiança de clientes e reduzem risco de incidentes públicos.",
    },
    quickWin: { title: "Adotar checklist de IA responsável na aprovação de novos casos de uso", impact: "medium", effort: "low" },
    project: {
      title: "Programa de IA responsável",
      description: "Definir princípios, avaliação de impacto ético, testes de viés e mecanismos de supervisão humana para sistemas críticos.",
      impact: "high",
      effort: "medium",
    },
    tools: ["Fairlearn", "IBM AI Fairness 360", "Google What-If Tool", "Credo AI"],
    training: { title: "Formação em ética e mitigação de viés em IA", audience: "Cientistas de dados e produto" },
  },
  "transparencia-explicabilidade": {
    risk: {
      title: "Decisões de IA inexplicáveis a clientes e reguladores",
      description:
        "Sem explicabilidade, a organização não consegue justificar decisões automatizadas — exigência da LGPD e de reguladores setoriais.",
    },
    opportunity: {
      title: "Explicabilidade que sustenta decisões automatizadas",
      description: "Modelos explicáveis destravam casos de uso regulados (crédito, seguros) com segurança jurídica.",
    },
    quickWin: { title: "Documentar model cards para os modelos em produção", impact: "medium", effort: "low" },
    project: {
      title: "Capacidade de explicabilidade (XAI)",
      description: "Implantar ferramentas de explicabilidade (SHAP/LIME), comunicação de uso de IA a clientes e trilhas de decisão auditáveis.",
      impact: "medium",
      effort: "medium",
    },
    tools: ["SHAP", "LIME", "Fiddler AI", "Arthur AI"],
    training: { title: "Capacitação em técnicas de explicabilidade de modelos", audience: "Cientistas de dados e validação" },
  },
  "governanca-dados": {
    risk: {
      title: "Dados sem dono, linhagem ou catálogo",
      description:
        "IA construída sobre dados não governados produz resultados não confiáveis e irreproduzíveis, com risco de uso indevido.",
    },
    opportunity: {
      title: "Dados governados aceleram todo o portfólio de IA",
      description: "Catálogo, propriedade e linhagem de dados reduzem em semanas o tempo de desenvolvimento de cada caso de uso.",
    },
    quickWin: { title: "Nomear data owners para os domínios de dados críticos de IA", impact: "high", effort: "low" },
    project: {
      title: "Programa de governança de dados para IA",
      description: "Implantar catálogo corporativo, linhagem, classificação e ciclo de vida dos dados que alimentam modelos.",
      impact: "high",
      effort: "high",
    },
    tools: ["Collibra", "Alation", "Microsoft Purview", "Atlan", "DataHub"],
    training: { title: "Formação de data stewards e data owners", audience: "Áreas de negócio e dados" },
  },
  "qualidade-dados": {
    risk: {
      title: "Modelos treinados com dados de baixa qualidade",
      description:
        "Dados incompletos ou inconsistentes degradam a acurácia dos modelos e corroem a confiança do negócio na IA.",
    },
    opportunity: {
      title: "Qualidade de dados como multiplicador de acurácia",
      description: "Métricas e monitoramento de qualidade elevam a performance dos modelos sem custo adicional de modelagem.",
    },
    quickWin: { title: "Definir métricas de qualidade (completude, acurácia) para os datasets críticos de IA", impact: "medium", effort: "low" },
    project: {
      title: "Observabilidade de qualidade de dados",
      description: "Implantar validação automatizada de dados em pipelines (testes, alertas, SLAs de qualidade) para os dados que alimentam IA.",
      impact: "high",
      effort: "medium",
    },
    tools: ["Great Expectations", "Monte Carlo", "Soda", "dbt tests"],
    training: { title: "Capacitação em engenharia de qualidade de dados", audience: "Engenharia de dados" },
  },
  "arquitetura-dados": {
    risk: {
      title: "Infraestrutura de dados que não suporta IA em escala",
      description:
        "Sem plataforma de dados moderna (lakehouse, pipelines, feature store), cada projeto de IA reconstrói fundações e atrasa entregas.",
    },
    opportunity: {
      title: "Plataforma de dados unificada para IA",
      description: "Lakehouse e feature store compartilhados reduzem duplicidade e aceleram novos modelos.",
    },
    quickWin: { title: "Mapear e consolidar fontes de dados duplicadas usadas por modelos", impact: "medium", effort: "low" },
    project: {
      title: "Modernização da plataforma de dados",
      description: "Evoluir para arquitetura lakehouse com pipelines gerenciados, feature store e camadas de consumo para IA.",
      impact: "high",
      effort: "high",
    },
    tools: ["Databricks", "Snowflake", "Google BigQuery", "AWS Lake Formation", "Feast"],
    training: { title: "Formação em arquitetura lakehouse e feature stores", audience: "Arquitetura e engenharia de dados" },
  },
  "privacidade-lgpd": {
    risk: {
      title: "Dados pessoais em pipelines de IA sem base legal",
      description:
        "Uso de dados pessoais em treinamento sem base legal, minimização ou anonimização expõe a organização a sanções da ANPD.",
    },
    opportunity: {
      title: "Privacidade por design em IA",
      description: "Técnicas de anonimização e minimização permitem usar dados valiosos em IA com segurança jurídica.",
    },
    quickWin: { title: "Executar RIPD (relatório de impacto) para os sistemas de IA que tratam dados pessoais", impact: "high", effort: "low" },
    project: {
      title: "Privacidade em IA (privacy by design)",
      description: "Implantar anonimização/pseudonimização, gestão de consentimento e atendimento a direitos dos titulares em dados de treinamento.",
      impact: "high",
      effort: "medium",
    },
    tools: ["OneTrust", "BigID", "Privacera", "Microsoft Presidio"],
    training: { title: "LGPD aplicada a projetos de IA", audience: "DPO, jurídico e engenharia" },
  },
  "seguranca-dados": {
    risk: {
      title: "Vazamento de dados sensíveis via pipelines de IA",
      description:
        "Sem criptografia, mascaramento e controle de acesso, dados críticos ficam expostos em ambientes de treinamento e inferência.",
    },
    opportunity: {
      title: "Segurança de dados que habilita casos de uso sensíveis",
      description: "Controles maduros de segurança permitem levar IA a dados regulados com risco controlado.",
    },
    quickWin: { title: "Aplicar mascaramento de dados sensíveis nos ambientes de desenvolvimento de IA", impact: "high", effort: "low" },
    project: {
      title: "Proteção de dados em IA ponta a ponta",
      description: "Implantar criptografia, DLP, controle de acesso granular e monitoramento de acesso aos dados usados por modelos.",
      impact: "high",
      effort: "medium",
    },
    tools: ["Immuta", "Privacera", "BigID", "Microsoft Purview DLP"],
    training: { title: "Segurança de dados para times de IA", audience: "Engenharia de dados e segurança" },
  },
  "infraestrutura-computacional": {
    risk: {
      title: "Capacidade computacional insuficiente ou descontrolada",
      description:
        "Falta de GPU/escala trava projetos; provisionamento sem controle explode custos de nuvem.",
    },
    opportunity: {
      title: "Infraestrutura elástica para treinar e servir modelos",
      description: "Computação sob demanda bem gerida reduz custo por experimento e acelera o ciclo de desenvolvimento.",
    },
    quickWin: { title: "Padronizar ambientes de computação para IA com cotas e autoscaling", impact: "medium", effort: "low" },
    project: {
      title: "Plataforma de computação para IA",
      description: "Definir estratégia de computação (nuvem/on-prem, GPUs, reservas), com governança de provisionamento e observabilidade de custos.",
      impact: "medium",
      effort: "medium",
    },
    tools: ["AWS SageMaker", "Google Vertex AI", "Azure Machine Learning", "Run:ai", "Kubernetes"],
    training: { title: "Capacitação em infraestrutura para cargas de IA", audience: "Infraestrutura e plataforma" },
  },
  mlops: {
    risk: {
      title: "Modelos em produção sem CI/CD nem versionamento",
      description:
        "Deploys manuais e irreproduzíveis geram incidentes, lentidão e incapacidade de auditar o que está em produção.",
    },
    opportunity: {
      title: "Esteira MLOps que industrializa a entrega de modelos",
      description: "Automação do ciclo de vida reduz o lead time de modelos de meses para dias, com qualidade auditável.",
    },
    quickWin: { title: "Versionar modelos e datasets em um registry central", impact: "high", effort: "low" },
    project: {
      title: "Esteira MLOps corporativa",
      description: "Implantar CI/CD de modelos, registry, testes automatizados, aprovação de deploy e reprodutibilidade ponta a ponta.",
      impact: "high",
      effort: "medium",
    },
    tools: ["MLflow", "AWS SageMaker", "Google Vertex AI", "Azure ML", "Weights & Biases", "Kubeflow"],
    training: { title: "Formação em MLOps e engenharia de ML", audience: "Engenharia de ML e DevOps" },
  },
  llmops: {
    risk: {
      title: "LLMs em produção sem avaliação, guardrails ou controle de custo",
      description:
        "Prompts não versionados, ausência de avaliação e custos de tokens sem teto criam risco operacional e financeiro.",
    },
    opportunity: {
      title: "Operação profissional de LLMs (LLMOps)",
      description: "Gestão de prompts, avaliação contínua e guardrails permitem escalar IA generativa com previsibilidade.",
    },
    quickWin: { title: "Centralizar prompts em repositório versionado com avaliação básica (golden set)", impact: "high", effort: "low" },
    project: {
      title: "Plataforma de LLMOps",
      description: "Implantar gateway de LLM com observabilidade, avaliação automatizada, guardrails de entrada/saída e gestão de custos por caso de uso.",
      impact: "high",
      effort: "medium",
    },
    tools: ["LangSmith", "Langfuse", "Azure AI Foundry", "Google Vertex AI", "Guardrails AI", "Portkey"],
    training: { title: "Capacitação em LLMOps e engenharia de prompts", audience: "Engenharia de IA" },
  },
  "ai-agents": {
    risk: {
      title: "Agentes autônomos com poderes excessivos e sem supervisão",
      description:
        "Agentes de IA com acesso amplo a sistemas e sem limites de ação podem executar operações indevidas em escala.",
    },
    opportunity: {
      title: "Agentes de IA para automação de processos complexos",
      description: "Agentes bem governados automatizam fluxos multietapas com ganho relevante de produtividade.",
    },
    quickWin: { title: "Definir limites de ação e aprovação humana para agentes existentes", impact: "high", effort: "low" },
    project: {
      title: "Framework corporativo de AI agents",
      description: "Padronizar orquestração, permissões mínimas, trilhas de auditoria e supervisão humana para agentes autônomos.",
      impact: "high",
      effort: "medium",
    },
    tools: ["LangChain", "LangGraph", "CrewAI", "Microsoft AutoGen", "OpenAI Agents SDK"],
    training: { title: "Formação em arquitetura e governança de agentes de IA", audience: "Engenharia de IA e arquitetura" },
  },
  rag: {
    risk: {
      title: "Respostas incorretas por conhecimento desatualizado ou não curado",
      description:
        "RAG sem curadoria de fontes e sem controle de acesso responde com informação errada ou expõe documentos restritos.",
    },
    opportunity: {
      title: "Conhecimento corporativo acessível via RAG",
      description: "Bases vetoriais curadas transformam documentação dispersa em respostas confiáveis para clientes e colaboradores.",
    },
    quickWin: { title: "Curar e classificar as fontes de conhecimento usadas pelo RAG (dono, validade, acesso)", impact: "high", effort: "low" },
    project: {
      title: "Plataforma de RAG corporativa",
      description: "Implantar pipeline de ingestão com curadoria, permissionamento por documento, avaliação de qualidade das respostas e atualização contínua.",
      impact: "high",
      effort: "medium",
    },
    tools: ["Pinecone", "Weaviate", "pgvector", "Azure AI Search", "Vertex AI Search", "LlamaIndex"],
    training: { title: "Capacitação em arquiteturas RAG e busca vetorial", audience: "Engenharia de IA" },
  },
  "arquitetura-integracao": {
    risk: {
      title: "Soluções de IA isoladas e não integradas ao core",
      description:
        "IA que não conversa com sistemas legados vira piloto eterno; integrações ad-hoc criam frangibilidade e retrabalho.",
    },
    opportunity: {
      title: "IA integrada aos processos e sistemas core",
      description: "Padrões de API e integração levam a IA para dentro da jornada real do cliente e dos processos operacionais.",
    },
    quickWin: { title: "Publicar padrões de API e autenticação para consumo de serviços de IA", impact: "medium", effort: "low" },
    project: {
      title: "Arquitetura de referência para IA",
      description: "Definir blueprint de integração (APIs, eventos, segurança) entre plataformas de IA e sistemas core/legados.",
      impact: "medium",
      effort: "medium",
    },
    tools: ["Kong", "Apigee", "MuleSoft", "Apache Kafka"],
    training: { title: "Formação em arquitetura de integração para IA", audience: "Arquitetura corporativa" },
  },
  "ferramentas-plataformas": {
    risk: {
      title: "Proliferação de ferramentas de IA sem padronização",
      description:
        "Cada time com stack própria multiplica custos de licença, dificulta suporte e fragmenta o conhecimento.",
    },
    opportunity: {
      title: "Stack padronizada de desenvolvimento de IA",
      description: "Plataforma comum reduz custo total e acelera onboarding de novos times em IA.",
    },
    quickWin: { title: "Inventariar ferramentas de IA em uso e definir lista aprovada", impact: "medium", effort: "low" },
    project: {
      title: "Racionalização da stack de IA",
      description: "Selecionar plataformas padrão por camada (dados, ML, GenAI), plano de migração e catálogo de ferramentas aprovadas.",
      impact: "medium",
      effort: "medium",
    },
    tools: ["Google Vertex AI", "Azure AI Foundry", "AWS SageMaker", "Databricks", "Dataiku"],
    training: { title: "Onboarding na stack corporativa de IA", audience: "Times de desenvolvimento" },
  },
  "monitoramento-observabilidade": {
    risk: {
      title: "Modelos degradando em produção sem detecção",
      description:
        "Sem monitoramento de drift, performance e comportamento, falhas de modelo só são percebidas pelo impacto no cliente.",
    },
    opportunity: {
      title: "Observabilidade que antecipa falhas de modelo",
      description: "Alertas de drift e queda de performance permitem agir antes do impacto no negócio.",
    },
    quickWin: { title: "Instrumentar dashboards de performance e drift para os modelos críticos", impact: "high", effort: "low" },
    project: {
      title: "Plataforma de observabilidade de IA",
      description: "Implantar monitoramento contínuo (drift de dados/conceito, latência, custo, qualidade de resposta) com alertas e runbooks.",
      impact: "high",
      effort: "medium",
    },
    tools: ["Datadog", "Arize AI", "Fiddler AI", "Evidently AI", "WhyLabs", "Grafana"],
    training: { title: "Capacitação em monitoramento de modelos em produção", audience: "Engenharia de ML e SRE" },
  },
  "seguranca-ia": {
    risk: {
      title: "Exposição a ataques específicos de IA",
      description:
        "Prompt injection, envenenamento de dados, extração e evasão de modelos podem comprometer sistemas e dados sem controles dedicados.",
    },
    opportunity: {
      title: "Defesa em profundidade para sistemas de IA",
      description: "Controles específicos (guardrails, detecção de injeção, validação de dados) reduzem drasticamente a superfície de ataque.",
    },
    quickWin: { title: "Implantar guardrails de entrada/saída nos sistemas de IA expostos a usuários", impact: "high", effort: "low" },
    project: {
      title: "Programa de segurança de IA (AI Security)",
      description: "Adotar OWASP LLM Top 10 e MITRE ATLAS como baseline, com controles de proteção de modelos, dados e pipelines.",
      impact: "high",
      effort: "medium",
    },
    tools: ["Lakera Guard", "Robust Intelligence", "Protect AI", "Guardrails AI", "Azure AI Content Safety"],
    training: { title: "Formação em segurança de IA (OWASP LLM, MITRE ATLAS)", audience: "Segurança e engenharia de IA" },
  },
  "seguranca-aplicacoes-ia": {
    risk: {
      title: "Aplicações de IA sem segurança no SDLC",
      description:
        "APIs de modelos sem autenticação robusta e código de IA sem revisão de segurança abrem portas para abuso e vazamento.",
    },
    opportunity: {
      title: "SDLC seguro para aplicações de IA",
      description: "Segurança integrada ao desenvolvimento evita retrabalho e incidentes em produção.",
    },
    quickWin: { title: "Exigir autenticação e rate limiting em todas as APIs de modelos", impact: "high", effort: "low" },
    project: {
      title: "AppSec para IA",
      description: "Integrar revisão de segurança, SAST/DAST e threat modeling específicos de IA ao ciclo de desenvolvimento.",
      impact: "high",
      effort: "medium",
    },
    tools: ["Snyk", "Semgrep", "Checkmarx", "OWASP ZAP"],
    training: { title: "Desenvolvimento seguro de aplicações com IA", audience: "Desenvolvedores" },
  },
  "gestao-vulnerabilidades-ia": {
    risk: {
      title: "Vulnerabilidades de IA nunca testadas",
      description:
        "Sem red teaming nem testes adversariais, fraquezas exploráveis dos modelos só serão descobertas por atacantes.",
    },
    opportunity: {
      title: "Red teaming contínuo de sistemas de IA",
      description: "Testes adversariais regulares encontram falhas antes dos atacantes e elevam a resiliência dos modelos.",
    },
    quickWin: { title: "Executar um red teaming inicial nos sistemas de IA expostos externamente", impact: "high", effort: "medium" },
    project: {
      title: "Programa de testes adversariais",
      description: "Estabelecer ciclo recorrente de red teaming, testes de robustez e gestão de vulnerabilidades específicas de IA.",
      impact: "high",
      effort: "medium",
    },
    tools: ["Garak", "PyRIT (Microsoft)", "Adversarial Robustness Toolbox", "HiddenLayer"],
    training: { title: "Capacitação em red teaming de IA", audience: "Segurança ofensiva" },
  },
  "resposta-incidentes-ia": {
    risk: {
      title: "Incidentes de IA sem plano de resposta",
      description:
        "Sem playbooks, kill switches e rollback, um incidente de modelo (saída danosa, ataque) escala sem contenção rápida.",
    },
    opportunity: {
      title: "Resiliência operacional para IA",
      description: "Capacidade de desligar, reverter e comunicar rapidamente reduz o impacto de qualquer falha de IA.",
    },
    quickWin: { title: "Implementar kill switch e rollback para os modelos críticos em produção", impact: "high", effort: "low" },
    project: {
      title: "Playbooks de resposta a incidentes de IA",
      description: "Criar playbooks específicos (saída danosa, ataque, drift severo), executar simulados e integrar ao plano de continuidade.",
      impact: "high",
      effort: "medium",
    },
    tools: ["PagerDuty", "ServiceNow ITSM", "Datadog Incident Management"],
    training: { title: "Simulados (tabletop) de incidentes de IA", audience: "SOC, engenharia e comunicação" },
  },
  "cultura-ia": {
    risk: {
      title: "Baixa adoção de IA pelas áreas de negócio",
      description:
        "Sem cultura orientada a dados e IA, soluções entregues não são usadas e o valor projetado não se realiza.",
    },
    opportunity: {
      title: "Cultura de IA que multiplica a adoção",
      description: "Engajamento das áreas de negócio transforma IA de projeto de TI em capacidade organizacional.",
    },
    quickWin: { title: "Lançar programa de embaixadores de IA nas áreas de negócio", impact: "medium", effort: "low" },
    project: {
      title: "Programa de cultura e adoção de IA",
      description: "Plano de comunicação, comunidades de prática, métricas de adoção e incentivos ao uso de IA nas rotinas de trabalho.",
      impact: "medium",
      effort: "medium",
    },
    tools: ["Microsoft Viva", "Plataformas internas de comunidade"],
    training: { title: "Letramento em IA (AI literacy) para todas as áreas", audience: "Todos os colaboradores" },
  },
  "talentos-capacitacao": {
    risk: {
      title: "Escassez de competências em IA",
      description:
        "Falta de talentos técnicos e de negócio em IA limita a execução do portfólio e cria dependência de terceiros.",
    },
    opportunity: {
      title: "Academia interna de IA",
      description: "Trilhas de capacitação estruturadas formam massa crítica interna e reduzem custo com consultorias.",
    },
    quickWin: { title: "Mapear gaps de competências em IA por área e priorizar trilhas", impact: "medium", effort: "low" },
    project: {
      title: "Academia de IA",
      description: "Estruturar trilhas por persona (executivos, negócio, técnicos), parcerias educacionais e metas de certificação.",
      impact: "high",
      effort: "medium",
    },
    tools: ["Coursera for Business", "DataCamp", "Udacity", "Alura"],
    training: { title: "Trilhas estruturadas por persona (executivo, negócio, técnico)", audience: "Toda a organização" },
  },
  "gestao-mudanca": {
    risk: {
      title: "Resistência e processos não redesenhados",
      description:
        "IA implantada sobre processos antigos, sem gestão de mudança, gera resistência e resultados aquém do esperado.",
    },
    opportunity: {
      title: "Mudança organizacional que sustenta a transformação",
      description: "Redesenho de processos e comunicação estruturada garantem que os ganhos da IA se concretizem.",
    },
    quickWin: { title: "Incluir plano de gestão de mudança em todo projeto de IA aprovado", impact: "medium", effort: "low" },
    project: {
      title: "Gestão de mudança para transformação com IA",
      description: "Metodologia de change management aplicada aos casos de uso: redesenho de processos, comunicação e acompanhamento de adoção.",
      impact: "medium",
      effort: "medium",
    },
    tools: ["Prosci ADKAR", "Miro", "ferramentas de process mining (Celonis)"],
    training: { title: "Formação em gestão de mudança para líderes", audience: "Gestores e líderes de área" },
  },
  "colaboracao-inovacao": {
    risk: {
      title: "Inovação em IA isolada e sem experimentação estruturada",
      description:
        "Sem estruturas de experimentação e parcerias, a organização perde velocidade frente a concorrentes que testam e aprendem mais rápido.",
    },
    opportunity: {
      title: "Ecossistema de inovação em IA",
      description: "Laboratório de experimentação e parcerias (startups, academia) aceleram o acesso a novas capacidades.",
    },
    quickWin: { title: "Criar esteira leve de experimentos de IA com critérios de go/no-go", impact: "medium", effort: "low" },
    project: {
      title: "Lab de inovação em IA",
      description: "Estruturar laboratório com backlog de experimentos, parcerias externas e mecanismo de graduação de pilotos para produção.",
      impact: "medium",
      effort: "medium",
    },
    tools: ["Hugging Face", "Kaggle", "programas de parceria com startups"],
    training: { title: "Metodologias de experimentação rápida com IA", audience: "Inovação e produto" },
  },
  "roi-valor": {
    risk: {
      title: "Investimentos em IA sem medição de retorno",
      description:
        "Sem baseline e métricas de valor, é impossível justificar novos investimentos ou encerrar iniciativas que não performam.",
    },
    opportunity: {
      title: "Gestão de valor que direciona o portfólio",
      description: "Medição sistemática de benefícios permite dobrar investimento no que funciona e cortar o que não gera valor.",
    },
    quickWin: { title: "Definir baseline e KPIs de valor para os 5 principais casos de uso", impact: "high", effort: "low" },
    project: {
      title: "Framework de gestão de valor de IA",
      description: "Implantar business cases padronizados, medição de benefícios realizados e revisão trimestral do portfólio por valor.",
      impact: "high",
      effort: "medium",
    },
    tools: ["Power BI", "Tableau", "planilhas de business case padronizadas"],
    training: { title: "Construção de business cases de IA", audience: "Produto e finanças" },
  },
  "finops-ia": {
    risk: {
      title: "Custos de IA crescendo sem visibilidade",
      description:
        "Tokens, GPUs e licenças sem alocação por caso de uso levam a estouros de orçamento e decisões às cegas.",
    },
    opportunity: {
      title: "FinOps que otimiza o custo por caso de uso",
      description: "Visibilidade de custo por modelo e caso de uso permite otimizações que tipicamente reduzem 20–40% do gasto.",
    },
    quickWin: { title: "Implantar tagging e dashboards de custo de IA por caso de uso", impact: "high", effort: "low" },
    project: {
      title: "FinOps para IA",
      description: "Estabelecer alocação de custos (chargeback/showback), orçamentos por iniciativa, alertas e otimização contínua (caching, modelos menores).",
      impact: "medium",
      effort: "medium",
    },
    tools: ["CloudZero", "Kubecost", "AWS Cost Explorer", "Vantage", "Langfuse (custos de LLM)"],
    training: { title: "Capacitação em FinOps aplicado a IA", audience: "Finanças e plataforma" },
  },
  "portfolio-casos-uso": {
    risk: {
      title: "Portfólio de IA sem priorização por valor e risco",
      description:
        "Casos de uso escolhidos por entusiasmo, e não por valor/viabilidade, consomem capacidade e não movem indicadores.",
    },
    opportunity: {
      title: "Funil de casos de uso priorizado por valor",
      description: "Processo estruturado de ideação e priorização concentra recursos nos casos de maior retorno.",
    },
    quickWin: { title: "Priorizar o backlog de casos de uso com matriz valor × viabilidade", impact: "high", effort: "low" },
    project: {
      title: "Gestão de portfólio de casos de uso de IA",
      description: "Implantar funil (ideação → piloto → escala), critérios de stage-gate e revisão periódica de portfólio.",
      impact: "high",
      effort: "medium",
    },
    tools: ["Jira Align", "Aha!", "Airtable"],
    training: { title: "Identificação e priorização de casos de uso de IA", audience: "Negócio e produto" },
  },
  "gestao-fornecedores": {
    risk: {
      title: "Dependência de terceiros de IA sem avaliação de risco",
      description:
        "Fornecedores de IA sem due diligence expõem a organização a riscos de dados, lock-in e descontinuidade.",
    },
    opportunity: {
      title: "Ecossistema de fornecedores avaliado e gerenciado",
      description: "Critérios claros de avaliação aceleram contratações seguras e melhoram o poder de negociação.",
    },
    quickWin: { title: "Incluir requisitos de IA (dados, segurança, SLA) no checklist de contratação de terceiros", impact: "medium", effort: "low" },
    project: {
      title: "Gestão de risco de terceiros de IA",
      description: "Implantar due diligence específica de IA, cláusulas contratuais padrão e monitoramento contínuo de fornecedores críticos.",
      impact: "medium",
      effort: "medium",
    },
    tools: ["OneTrust Vendorpedia", "SecurityScorecard", "BitSight"],
    training: { title: "Avaliação de fornecedores de IA", audience: "Compras e segurança" },
  },
  "desenvolvimento-modelos": {
    risk: {
      title: "Modelos desenvolvidos sem padrões de engenharia",
      description:
        "Sem documentação, experimentação controlada e revisão por pares, modelos são frágeis, irreproduzíveis e difíceis de manter.",
    },
    opportunity: {
      title: "Engenharia de modelos padronizada",
      description: "Templates, documentação e revisão elevam a qualidade e reduzem o custo de manutenção dos modelos.",
    },
    quickWin: { title: "Adotar template padrão de documentação de modelos (model card)", impact: "medium", effort: "low" },
    project: {
      title: "Padrões de desenvolvimento de modelos",
      description: "Definir guia de engenharia (experimentação, código, documentação, revisão por pares) e aplicá-lo ao pipeline de novos modelos.",
      impact: "medium",
      effort: "medium",
    },
    tools: ["MLflow", "Weights & Biases", "DVC", "Jupyter + papermill"],
    training: { title: "Boas práticas de engenharia de ML", audience: "Cientistas de dados" },
  },
  "validacao-modelos": {
    risk: {
      title: "Modelos em produção sem validação independente",
      description:
        "Sem validação independente e aprovação formal (model risk management), erros de modelo chegam à produção sem contestação.",
    },
    opportunity: {
      title: "Model risk management robusto",
      description: "Validação independente reduz perdas por erro de modelo e atende expectativas de reguladores (ex.: BACEN).",
    },
    quickWin: { title: "Exigir validação independente antes do deploy dos modelos de maior risco", impact: "high", effort: "low" },
    project: {
      title: "Programa de model risk management",
      description: "Estruturar segunda linha de validação, inventário de modelos com tiering de risco, revalidação periódica e aprovação formal.",
      impact: "high",
      effort: "medium",
    },
    tools: ["SAS Model Risk Management", "ValidMind", "IBM OpenPages MRG"],
    training: { title: "Formação em validação e risco de modelos", audience: "Validação e riscos" },
  },
};
