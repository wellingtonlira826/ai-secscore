import { db } from "@workspace/db";
import { frameworksTable, questionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const FRAMEWORKS = [
  {
    name: "OWASP Top 10 for LLM Applications (2025)",
    slug: "owasp-llm",
    description:
      "The OWASP Top 10 for Large Language Model Applications identifies the ten most critical security risks specific to LLM-based systems.",
    defaultWeight: 1,
  },
  {
    name: "NIST AI RMF 1.0",
    slug: "nist-ai-rmf",
    description:
      "The NIST AI Risk Management Framework provides guidance to manage risks to individuals, organizations, and society from AI systems.",
    defaultWeight: 1,
  },
  {
    name: "MITRE ATLAS",
    slug: "mitre-atlas",
    description:
      "MITRE ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems) is a knowledge base of adversarial ML tactics and techniques.",
    defaultWeight: 1,
  },
  {
    name: "ISO/IEC 42001",
    slug: "iso-42001",
    description:
      "ISO/IEC 42001 specifies requirements for establishing, implementing, maintaining and continually improving an AI management system.",
    defaultWeight: 1,
  },
  {
    name: "Google SAIF",
    slug: "google-saif",
    description:
      "Google's Secure AI Framework (SAIF) defines six core elements for building and deploying AI responsibly and securely.",
    defaultWeight: 1,
  },
  {
    name: "Data Protection & Financial Compliance",
    slug: "data-financial-compliance",
    description:
      "Combined LGPD (Brazil) and BACEN cybersecurity requirements (Resolução 4.893/85) applied to AI pipelines.",
    defaultWeight: 1,
  },
];

type QuestionSeed = {
  frameworkSlug: string;
  section: string;
  text: string;
  weight: number;
  order: number;
  remediation?: string;
};

const QUESTIONS: QuestionSeed[] = [
  // ── OWASP Top 10 for LLM (2025) ──────────────────────────────────────────
  {
    frameworkSlug: "owasp-llm",
    section: "LLM01 – Prompt Injection",
    text: "Do you validate and sanitize all user inputs before passing them to the LLM to prevent prompt injection?",
    weight: 3,
    order: 1,
    remediation: "Implement input validation, output encoding, and consider using system-level prompt guards or a secondary classifier model to detect injection attempts.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM01 – Prompt Injection",
    text: "Are system prompts stored and managed separately from user-provided content, with clear privilege boundaries?",
    weight: 3,
    order: 2,
    remediation: "Maintain strict separation between system instructions and user messages. Use structured chat formats that explicitly delineate roles.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM01 – Prompt Injection",
    text: "Is there monitoring and alerting for anomalous or adversarial prompts in production?",
    weight: 2,
    order: 3,
    remediation: "Deploy prompt monitoring with anomaly detection. Log and alert on prompts that attempt to override system instructions.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM02 – Sensitive Information Disclosure",
    text: "Does the system prevent the LLM from outputting PII, credentials, or proprietary training data in responses?",
    weight: 3,
    order: 4,
    remediation: "Implement output filtering for PII and secrets. Apply DLP controls on LLM responses. Audit training data for sensitive content before ingestion.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM02 – Sensitive Information Disclosure",
    text: "Are there controls to prevent the model from revealing details about its system prompt or internal configuration?",
    weight: 2,
    order: 5,
    remediation: "Use prompt confidentiality instructions and output scanners. Test regularly with known prompt extraction techniques.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM03 – Supply Chain",
    text: "Do you have an inventory of all third-party models, datasets, and plugins used in your AI pipeline?",
    weight: 3,
    order: 6,
    remediation: "Maintain a complete AI Bill of Materials (AI-BOM). Verify the provenance and integrity of all external models and datasets before use.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM03 – Supply Chain",
    text: "Are third-party LLM plugins and tool integrations reviewed for security before deployment?",
    weight: 2,
    order: 7,
    remediation: "Conduct security reviews of all LLM plugins. Apply least-privilege principles and sandbox plugin execution where possible.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM04 – Data and Model Poisoning",
    text: "Is training and fine-tuning data sourced from verified, trusted sources with integrity checks?",
    weight: 3,
    order: 8,
    remediation: "Verify data provenance. Apply cryptographic hashing for data integrity. Use anomaly detection during training to identify poisoned samples.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM04 – Data and Model Poisoning",
    text: "Are model updates and fine-tuning runs subject to security review and rollback capabilities?",
    weight: 2,
    order: 9,
    remediation: "Gate model deployments with security checkpoints. Maintain versioned model artifacts with the ability to roll back to known-good versions.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM05 – Improper Output Handling",
    text: "Is LLM output treated as untrusted and sanitized before being rendered in UI, stored, or passed to other systems?",
    weight: 3,
    order: 10,
    remediation: "Treat all LLM outputs as untrusted. Apply output encoding appropriate to the context (HTML, SQL, shell). Validate before downstream use.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM06 – Excessive Agency",
    text: "Is the LLM's ability to take autonomous actions (file I/O, API calls, code execution) limited to the minimum necessary?",
    weight: 3,
    order: 11,
    remediation: "Apply least-privilege to all LLM tool access. Require human-in-the-loop confirmation for high-impact actions. Restrict LLM to read-only operations where possible.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM06 – Excessive Agency",
    text: "Are there rate limits and hard caps on the number and scope of actions an LLM agent can take per session?",
    weight: 2,
    order: 12,
    remediation: "Implement per-session action budgets and hard limits. Alert on unusual action volumes.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM07 – System Prompt Leakage",
    text: "Is the system prompt protected from extraction via adversarial queries or indirect prompt injection?",
    weight: 2,
    order: 13,
    remediation: "Regularly test for system prompt leakage using known extraction techniques. Monitor outputs for fragments matching internal instructions.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM08 – Vector and Embedding Weaknesses",
    text: "Are vector databases and embedding stores protected from unauthorized access and adversarial retrieval?",
    weight: 2,
    order: 14,
    remediation: "Apply access controls to vector stores. Monitor for unusual retrieval patterns. Validate and sanitize documents before embedding.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM09 – Misinformation",
    text: "Is there a process for detecting and mitigating hallucinations or factually incorrect LLM outputs before they reach end users?",
    weight: 2,
    order: 15,
    remediation: "Implement Retrieval-Augmented Generation (RAG) with verified sources. Add output fact-checking layers. Set clear user expectations about AI limitations.",
  },
  {
    frameworkSlug: "owasp-llm",
    section: "LLM10 – Unbounded Consumption",
    text: "Are there controls to prevent excessive resource consumption (tokens, compute, API calls) from abusive or runaway prompts?",
    weight: 2,
    order: 16,
    remediation: "Enforce per-user and per-request token limits. Implement timeout controls and circuit breakers. Monitor and alert on cost anomalies.",
  },

  // ── NIST AI RMF 1.0 ────────────────────────────────────────────────────────
  {
    frameworkSlug: "nist-ai-rmf",
    section: "GOVERN",
    text: "Has your organization established formal AI governance policies that define roles, responsibilities, and accountability for AI risk management?",
    weight: 3,
    order: 1,
    remediation: "Establish a formal AI governance framework with designated AI risk owners, clear escalation paths, and documented decision-making processes.",
  },
  {
    frameworkSlug: "nist-ai-rmf",
    section: "GOVERN",
    text: "Is there an AI inventory that catalogs all AI systems in production, including their purpose, data sources, and risk classification?",
    weight: 2,
    order: 2,
    remediation: "Create and maintain a centralized AI system registry with risk classifications, owners, and data provenance records.",
  },
  {
    frameworkSlug: "nist-ai-rmf",
    section: "GOVERN",
    text: "Are AI-specific risks incorporated into the enterprise risk management (ERM) framework?",
    weight: 2,
    order: 3,
    remediation: "Integrate AI risk categories into the ERM program. Ensure AI risks are reported at board level.",
  },
  {
    frameworkSlug: "nist-ai-rmf",
    section: "MAP",
    text: "Have the intended use cases, context of deployment, and potential misuse scenarios been documented for each AI system?",
    weight: 3,
    order: 4,
    remediation: "Document intended and foreseeable use cases. Conduct misuse scenario analysis and implement safeguards against the most likely adverse uses.",
  },
  {
    frameworkSlug: "nist-ai-rmf",
    section: "MAP",
    text: "Have the affected stakeholders and impacted populations been identified and their interests considered in AI design?",
    weight: 2,
    order: 5,
    remediation: "Conduct stakeholder mapping. Include diverse groups in AI design review. Document known impacts on affected populations.",
  },
  {
    frameworkSlug: "nist-ai-rmf",
    section: "MAP",
    text: "Are AI systems categorized by risk level, with higher-risk systems subject to more stringent controls?",
    weight: 3,
    order: 6,
    remediation: "Implement a risk tiering system. Apply proportionate controls based on the potential harm of each AI system.",
  },
  {
    frameworkSlug: "nist-ai-rmf",
    section: "MEASURE",
    text: "Are quantitative and qualitative metrics defined to measure AI system performance, bias, and safety?",
    weight: 3,
    order: 7,
    remediation: "Define measurable KPIs for accuracy, fairness, robustness, and safety. Track metrics continuously and report on SLA breaches.",
  },
  {
    frameworkSlug: "nist-ai-rmf",
    section: "MEASURE",
    text: "Is there a regular AI audit process that evaluates model performance and risk against defined thresholds?",
    weight: 2,
    order: 8,
    remediation: "Establish a periodic AI audit cadence. Include third-party audits for high-risk systems. Document findings and remediation actions.",
  },
  {
    frameworkSlug: "nist-ai-rmf",
    section: "MEASURE",
    text: "Are bias and fairness evaluations conducted across relevant demographic groups before and after model deployment?",
    weight: 2,
    order: 9,
    remediation: "Conduct pre-deployment bias testing across protected characteristics. Continuously monitor for demographic performance drift in production.",
  },
  {
    frameworkSlug: "nist-ai-rmf",
    section: "MANAGE",
    text: "Is there an incident response plan specific to AI system failures, including model degradation, adversarial attacks, and harmful outputs?",
    weight: 3,
    order: 10,
    remediation: "Develop an AI-specific incident response playbook. Conduct tabletop exercises. Define escalation paths and rollback procedures.",
  },
  {
    frameworkSlug: "nist-ai-rmf",
    section: "MANAGE",
    text: "Can AI systems be quickly disabled or rolled back when risks exceed acceptable thresholds?",
    weight: 3,
    order: 11,
    remediation: "Implement kill switches and traffic routing controls. Maintain rollback capability to previous model versions. Define automatic shutdown triggers.",
  },
  {
    frameworkSlug: "nist-ai-rmf",
    section: "MANAGE",
    text: "Are risk treatment decisions for AI documented and communicated to relevant stakeholders?",
    weight: 2,
    order: 12,
    remediation: "Maintain a risk register for all AI risks. Communicate treatment decisions to affected business units and leadership.",
  },

  // ── MITRE ATLAS ────────────────────────────────────────────────────────────
  {
    frameworkSlug: "mitre-atlas",
    section: "Reconnaissance",
    text: "Have you assessed your AI system's attack surface for information that adversaries could gather to prepare an attack (model API discovery, documentation leakage)?",
    weight: 2,
    order: 1,
    remediation: "Limit exposure of model architecture details. Apply API rate limiting. Avoid publishing internal model documentation publicly.",
  },
  {
    frameworkSlug: "mitre-atlas",
    section: "Reconnaissance",
    text: "Is there monitoring for reconnaissance activities such as unusual API probing, systematic model querying, or enumeration attacks?",
    weight: 2,
    order: 2,
    remediation: "Deploy anomaly detection for API usage patterns. Alert on systematic query patterns consistent with model reconnaissance.",
  },
  {
    frameworkSlug: "mitre-atlas",
    section: "Resource Development",
    text: "Are controls in place to prevent adversaries from using your AI infrastructure as a resource for attacking other systems (model API abuse)?",
    weight: 2,
    order: 3,
    remediation: "Enforce strict API access controls and user quotas. Detect and block usage patterns consistent with infrastructure abuse.",
  },
  {
    frameworkSlug: "mitre-atlas",
    section: "ML Attack Staging",
    text: "Is the system protected against model evasion attacks where adversaries craft inputs designed to cause misclassification?",
    weight: 3,
    order: 4,
    remediation: "Implement adversarial robustness testing. Use ensemble methods and input preprocessing to reduce evasion attack effectiveness. Apply certified defenses where applicable.",
  },
  {
    frameworkSlug: "mitre-atlas",
    section: "ML Attack Staging",
    text: "Has the system been tested for membership inference attacks that could reveal whether specific records were in the training data?",
    weight: 2,
    order: 5,
    remediation: "Apply differential privacy during training. Limit prediction confidence scores returned by the API. Test for membership inference vulnerability.",
  },
  {
    frameworkSlug: "mitre-atlas",
    section: "ML Attack Staging",
    text: "Are model inversion attacks (reconstructing training data from model outputs) in scope for your threat model?",
    weight: 2,
    order: 6,
    remediation: "Implement query rate limiting. Add noise to model outputs. Train with privacy-preserving techniques to reduce inversion risk.",
  },
  {
    frameworkSlug: "mitre-atlas",
    section: "ML Attack Staging",
    text: "Is the model protected against backdoor attacks embedded during training that activate on trigger inputs?",
    weight: 3,
    order: 7,
    remediation: "Conduct Neural Cleanse or similar backdoor detection testing. Verify training pipelines are under full access control. Scan checkpoints for anomalous behaviors.",
  },
  {
    frameworkSlug: "mitre-atlas",
    section: "Exfiltration",
    text: "Is there detection for model extraction attacks where adversaries systematically query the model to reproduce its functionality?",
    weight: 3,
    order: 8,
    remediation: "Monitor for patterns consistent with model extraction (systematic queries covering the input space). Implement adaptive rate limiting and query fingerprinting.",
  },
  {
    frameworkSlug: "mitre-atlas",
    section: "Impact",
    text: "Can you detect and respond to impact-stage attacks that degrade model availability or cause denial of service?",
    weight: 2,
    order: 9,
    remediation: "Deploy DoS protection at the API layer. Implement redundant model serving infrastructure. Set autoscaling and circuit breaker policies.",
  },
  {
    frameworkSlug: "mitre-atlas",
    section: "Impact",
    text: "Are there controls to prevent AI model corruption or unauthorized modification post-deployment?",
    weight: 3,
    order: 10,
    remediation: "Cryptographically sign model artifacts. Verify model integrity on each deployment and periodically in production. Alert on any unauthorized model changes.",
  },

  // ── ISO/IEC 42001 ──────────────────────────────────────────────────────────
  {
    frameworkSlug: "iso-42001",
    section: "Governance",
    text: "Has top management demonstrated leadership and commitment to the AI management system (AIMS) by assigning accountability and ensuring resources?",
    weight: 3,
    order: 1,
    remediation: "Obtain formal executive sponsorship for the AIMS. Define an AI ethics and governance committee with C-suite representation.",
  },
  {
    frameworkSlug: "iso-42001",
    section: "Governance",
    text: "Is there a documented AI policy that defines the organization's objectives, principles, and commitments regarding responsible AI use?",
    weight: 2,
    order: 2,
    remediation: "Develop and publish a formal AI policy covering transparency, fairness, accountability, and safety. Review annually.",
  },
  {
    frameworkSlug: "iso-42001",
    section: "Risk",
    text: "Has a comprehensive risk assessment been conducted covering the AI system's potential harms to individuals, society, and the organization?",
    weight: 3,
    order: 3,
    remediation: "Conduct a structured AI impact assessment. Document risks to fundamental rights, safety, and business continuity. Review on each significant system change.",
  },
  {
    frameworkSlug: "iso-42001",
    section: "Risk",
    text: "Are risk treatment plans documented and implemented for all identified AI-specific risks?",
    weight: 3,
    order: 4,
    remediation: "Map each identified risk to a treatment (accept, mitigate, transfer, avoid). Track treatment implementation and residual risk.",
  },
  {
    frameworkSlug: "iso-42001",
    section: "Lifecycle",
    text: "Does the AI system development lifecycle include security and privacy by design requirements from the requirements phase?",
    weight: 2,
    order: 5,
    remediation: "Integrate AI-specific security and privacy requirements into the SDLC from project inception. Include AI security checkpoints in design and code reviews.",
  },
  {
    frameworkSlug: "iso-42001",
    section: "Lifecycle",
    text: "Are AI systems decommissioned securely with proper data disposal and model deletion procedures?",
    weight: 2,
    order: 6,
    remediation: "Define an AI system retirement procedure covering model deletion, data disposal, and access revocation. Document and audit decommissioning steps.",
  },
  {
    frameworkSlug: "iso-42001",
    section: "Data Management",
    text: "Is the quality, representativeness, and provenance of training data documented and controlled?",
    weight: 3,
    order: 7,
    remediation: "Implement data governance for AI training sets including quality checks, representativeness analysis, and provenance tracking. Maintain data lineage records.",
  },
  {
    frameworkSlug: "iso-42001",
    section: "Data Management",
    text: "Are data minimization principles applied, using only the data necessary for the AI system's purpose?",
    weight: 2,
    order: 8,
    remediation: "Conduct data necessity reviews before ingesting new data. Remove unnecessary features. Apply aggregation or anonymization where individual-level data is not required.",
  },
  {
    frameworkSlug: "iso-42001",
    section: "Data Management",
    text: "Is there a process for handling data subject rights (access, deletion, correction) that applies to AI training data?",
    weight: 2,
    order: 9,
    remediation: "Implement machine unlearning or model retraining procedures to honor deletion requests affecting training data. Document the process and response SLAs.",
  },
  {
    frameworkSlug: "iso-42001",
    section: "Governance",
    text: "Is the AIMS subject to regular internal audits and management reviews with documented findings and actions?",
    weight: 2,
    order: 10,
    remediation: "Schedule regular AIMS internal audits. Conduct annual management reviews. Track non-conformances and corrective actions to closure.",
  },

  // ── Google SAIF ───────────────────────────────────────────────────────────
  {
    frameworkSlug: "google-saif",
    section: "Secure-by-Default Foundations",
    text: "Are AI models deployed in hardened environments with secure defaults (authentication, encryption, network isolation)?",
    weight: 3,
    order: 1,
    remediation: "Apply infrastructure security hardening to all AI serving environments. Enforce TLS, MFA, and network segmentation by default.",
  },
  {
    frameworkSlug: "google-saif",
    section: "Secure-by-Default Foundations",
    text: "Are AI APIs protected by strong authentication and authorization controls with principle of least privilege?",
    weight: 3,
    order: 2,
    remediation: "Require OAuth/OIDC or API key authentication with scoped permissions. Enforce least-privilege access to model endpoints.",
  },
  {
    frameworkSlug: "google-saif",
    section: "Detection & Response",
    text: "Is there real-time monitoring of AI system behavior for security anomalies, including unusual output patterns and access spikes?",
    weight: 3,
    order: 3,
    remediation: "Deploy SIEM integration for AI workloads. Define behavioral baselines and alert on significant deviations in query patterns, latency, or output distributions.",
  },
  {
    frameworkSlug: "google-saif",
    section: "Detection & Response",
    text: "Is there an AI-specific incident response procedure tested through regular exercises?",
    weight: 2,
    order: 4,
    remediation: "Document and test AI incident response playbooks. Conduct tabletop exercises covering model compromise, harmful output, and data exposure scenarios.",
  },
  {
    frameworkSlug: "google-saif",
    section: "Defenses",
    text: "Are adversarial robustness defenses (input preprocessing, output validation, ensemble methods) applied to protect against evasion attacks?",
    weight: 2,
    order: 5,
    remediation: "Implement input preprocessing pipelines to filter adversarial inputs. Validate model outputs against expected distributions. Use model ensembles for critical decisions.",
  },
  {
    frameworkSlug: "google-saif",
    section: "Defenses",
    text: "Is the model serving infrastructure protected against prompt injection and jailbreak attempts?",
    weight: 3,
    order: 6,
    remediation: "Deploy prompt injection detection at the API gateway. Apply output safety classifiers. Regularly red-team the system with latest jailbreak techniques.",
  },
  {
    frameworkSlug: "google-saif",
    section: "Harmonized Controls",
    text: "Are AI security controls integrated with the broader organizational security program (identity, network, endpoint, application security)?",
    weight: 2,
    order: 7,
    remediation: "Map AI security controls to existing security frameworks (SOC 2, ISO 27001). Ensure AI risks are covered in existing security reviews and audits.",
  },
  {
    frameworkSlug: "google-saif",
    section: "Adaptive Controls",
    text: "Are AI security controls continuously updated based on emerging threats, new attack techniques, and changes in the threat landscape?",
    weight: 2,
    order: 8,
    remediation: "Subscribe to AI security threat intelligence feeds. Review and update controls quarterly. Participate in AI security community sharing (e.g., MITRE ATLAS updates).",
  },
  {
    frameworkSlug: "google-saif",
    section: "Contextual Risk",
    text: "Are AI security controls calibrated to the specific risk context (use case, data sensitivity, regulatory requirements, threat actors)?",
    weight: 2,
    order: 9,
    remediation: "Conduct use-case-specific risk assessments. Apply higher-assurance controls for high-stakes AI applications (healthcare, finance, public safety).",
  },

  // ── Data Protection & Financial Compliance ────────────────────────────────
  {
    frameworkSlug: "data-financial-compliance",
    section: "LGPD – Data Protection",
    text: "Is personal data processed by AI systems covered by a lawful basis under LGPD (e.g., consent, legitimate interest)?",
    weight: 3,
    order: 1,
    remediation: "Document the legal basis for each personal data processing activity in AI systems. Maintain records of processing activities (ROPA) as required by LGPD Art. 37.",
  },
  {
    frameworkSlug: "data-financial-compliance",
    section: "LGPD – Data Protection",
    text: "Is a Data Protection Impact Assessment (DPIA) conducted for high-risk AI processing activities involving personal data?",
    weight: 3,
    order: 2,
    remediation: "Conduct DPIAs for all AI systems that process personal data at scale or that make automated decisions affecting individuals. Document findings and mitigations.",
  },
  {
    frameworkSlug: "data-financial-compliance",
    section: "LGPD – Data Protection",
    text: "Are data subjects able to exercise their rights (access, correction, deletion, portability) regarding their data used in AI systems?",
    weight: 2,
    order: 3,
    remediation: "Implement automated subject access request handling. Ensure AI training pipelines can accommodate data deletion requests. Define SLAs for rights fulfillment.",
  },
  {
    frameworkSlug: "data-financial-compliance",
    section: "Encryption & Masking",
    text: "Is personal and sensitive data encrypted at rest and in transit throughout the AI pipeline?",
    weight: 3,
    order: 4,
    remediation: "Enforce AES-256 encryption at rest and TLS 1.2+ in transit for all data flowing through AI pipelines. Manage encryption keys in a dedicated KMS.",
  },
  {
    frameworkSlug: "data-financial-compliance",
    section: "Encryption & Masking",
    text: "Is data masking, tokenization, or pseudonymization applied to reduce exposure of sensitive attributes in AI training and inference?",
    weight: 2,
    order: 5,
    remediation: "Apply data masking in non-production AI environments. Use tokenization for sensitive identifiers. Pseudonymize training datasets where possible without losing utility.",
  },
  {
    frameworkSlug: "data-financial-compliance",
    section: "Data Minimization & Classification",
    text: "Is all data used in AI systems classified by sensitivity and subject to appropriate handling controls?",
    weight: 2,
    order: 6,
    remediation: "Implement data classification for all AI datasets. Apply access controls and handling requirements based on classification (e.g., public, internal, confidential, restricted).",
  },
  {
    frameworkSlug: "data-financial-compliance",
    section: "Data Minimization & Classification",
    text: "Are data minimization principles enforced, collecting and retaining only the minimum data necessary for the AI system's purpose?",
    weight: 2,
    order: 7,
    remediation: "Conduct data minimization reviews for all AI training and inference pipelines. Remove unnecessary fields, implement retention policies, and delete data when no longer needed.",
  },
  {
    frameworkSlug: "data-financial-compliance",
    section: "BACEN – Financial Security",
    text: "Does the AI system comply with BACEN Resolução 4.893 cybersecurity requirements applicable to financial institution AI applications?",
    weight: 3,
    order: 8,
    remediation: "Map AI system controls to BACEN 4.893 requirements. Include AI systems in the institutional cybersecurity policy. Report compliance status to the board.",
  },
  {
    frameworkSlug: "data-financial-compliance",
    section: "BACEN – Financial Security",
    text: "Is there an incident response procedure for AI-related security events that includes notification to BACEN within required timeframes?",
    weight: 3,
    order: 9,
    remediation: "Define AI incident classification criteria. Ensure the incident response procedure includes BACEN notification requirements for relevant events. Test notification workflows.",
  },
  {
    frameworkSlug: "data-financial-compliance",
    section: "BACEN – Financial Security",
    text: "Are AI systems used in financial decision-making (credit scoring, fraud detection) subject to explainability requirements and human oversight?",
    weight: 2,
    order: 10,
    remediation: "Implement explainable AI (XAI) methods for financial AI decisions. Ensure human review is available for contested automated decisions. Document model logic for regulatory scrutiny.",
  },
];

export async function seedFrameworksAndQuestions() {
  const existingFrameworks = await db.select().from(frameworksTable);
  if (existingFrameworks.length > 0) {
    logger.info("Frameworks already seeded, skipping.");
    return;
  }

  logger.info("Seeding frameworks and questions...");

  for (const fw of FRAMEWORKS) {
    const [inserted] = await db
      .insert(frameworksTable)
      .values(fw)
      .returning();

    const fwQuestions = QUESTIONS.filter((q) => q.frameworkSlug === fw.slug).map(
      ({ frameworkSlug: _slug, ...rest }) => ({
        ...rest,
        frameworkId: inserted.id,
      })
    );

    if (fwQuestions.length > 0) {
      await db.insert(questionsTable).values(fwQuestions);
    }
  }

  logger.info(`Seeded ${FRAMEWORKS.length} frameworks and ${QUESTIONS.length} questions.`);
}
