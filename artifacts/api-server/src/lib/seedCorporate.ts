import { db } from "@workspace/db";
import {
  corpDomainsTable,
  corpQuestionsTable,
  maturityLevelsTable,
  corpBenchmarkProfilesTable,
  corpBenchmarkScoresTable,
} from "@workspace/db";
import { logger } from "./logger";
import { CORP_DOMAINS, CORP_QUESTIONS, MATURITY_LEVELS } from "./corporateSeedData";
import { BENCHMARK_PROFILES, expandBenchmarkScores } from "./corporateSeedData/benchmarks";

async function seedBenchmarks() {
  const existingProfiles = await db.select().from(corpBenchmarkProfilesTable);
  if (existingProfiles.length > 0) return;

  await db.insert(corpBenchmarkProfilesTable).values(
    BENCHMARK_PROFILES.map(({ slug, name, description, order }) => ({
      slug,
      name,
      description,
      order,
    })),
  );

  const scores = expandBenchmarkScores();
  const chunkSize = 100;
  for (let i = 0; i < scores.length; i += chunkSize) {
    await db.insert(corpBenchmarkScoresTable).values(scores.slice(i, i + chunkSize));
  }
  logger.info(
    `Seeded ${BENCHMARK_PROFILES.length} benchmark profiles and ${scores.length} benchmark scores.`,
  );
}

export async function seedCorporate() {
  const existingLevels = await db.select().from(maturityLevelsTable);
  if (existingLevels.length === 0) {
    await db.insert(maturityLevelsTable).values(MATURITY_LEVELS);
    logger.info(`Seeded ${MATURITY_LEVELS.length} maturity levels.`);
  }

  await seedBenchmarks();

  const existingDomains = await db.select().from(corpDomainsTable);
  if (existingDomains.length > 0) {
    logger.info("Corporate domains already seeded, skipping.");
    return;
  }

  logger.info("Seeding corporate domains and questions...");

  const domainIdBySlug = new Map<string, number>();
  for (const domain of CORP_DOMAINS) {
    const [inserted] = await db.insert(corpDomainsTable).values(domain).returning();
    domainIdBySlug.set(domain.slug, inserted.id);
  }

  const rows = CORP_QUESTIONS.map(({ domainSlug, options, ...rest }) => {
    const domainId = domainIdBySlug.get(domainSlug);
    if (!domainId) {
      throw new Error(`Unknown corporate domain slug in seed data: ${domainSlug}`);
    }
    return { ...rest, domainId, options: options ?? null };
  });

  // Insert in chunks to stay well below parameter limits.
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await db.insert(corpQuestionsTable).values(rows.slice(i, i + chunkSize));
  }

  logger.info(`Seeded ${CORP_DOMAINS.length} corporate domains and ${rows.length} questions.`);
}
