/** Legacy compatibility helper. Prefer `npx prisma migrate deploy`. */
const { PrismaClient } = require("@prisma/client");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Configure it securely; do not place credentials in source.");
}

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "RepoAnalysis" (
      "id" TEXT NOT NULL,
      "repo" TEXT NOT NULL,
      "commitSha" TEXT NOT NULL,
      "analysis" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "RepoAnalysis_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "RepoAnalysis_repo_key" ON "RepoAnalysis"("repo")`);
  console.log("RepoAnalysis is ready. Apply Prisma migrations for the complete schema.");
}

main().finally(() => prisma.$disconnect());
