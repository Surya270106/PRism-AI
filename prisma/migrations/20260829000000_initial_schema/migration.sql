CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PrReview" (
    "id" TEXT NOT NULL,
    "prId" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "riskScore" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "codeDiff" TEXT,
    "fixes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "PrReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "RepoAnalysis" (
    "id" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "analysis" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RepoAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "PrReview_repo_idx" ON "PrReview"("repo");
CREATE INDEX IF NOT EXISTS "PrReview_userId_idx" ON "PrReview"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "RepoAnalysis_repo_key" ON "RepoAnalysis"("repo");
CREATE INDEX IF NOT EXISTS "RepoAnalysis_repo_commitSha_idx" ON "RepoAnalysis"("repo", "commitSha");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PrReview_userId_fkey') THEN
    ALTER TABLE "PrReview" ADD CONSTRAINT "PrReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
