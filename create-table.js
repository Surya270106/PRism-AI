const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_EpkPXrh6SM5m@ep-restless-fog-aofmn6za-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

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
    );
  `);
  
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "RepoAnalysis_repo_key" ON "RepoAnalysis"("repo");
  `);
  
  console.log("Table RepoAnalysis created successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
