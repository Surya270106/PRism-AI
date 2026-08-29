import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { errorResponse, logFailure } from "@/lib/api";
import { generateStructured } from "@/lib/ai/provider";
import { prReviewJsonSchema, prReviewSchema } from "@/lib/ai/schemas";
import { githubFetch, parsePullRequestUrl } from "@/lib/github";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
type Pull = { title: string; html_url: string };

export async function POST(req: Request) {
  const startedAt = Date.now();
  try {
    const body = await req.json();
    const parsed = parsePullRequestUrl(body.prUrl);
    const session = await getServerSession(authOptions);
    const token = session?.accessToken || process.env.GITHUB_TOKEN;
    const base = `/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.number}`;
    const [pull, diff] = await Promise.all([githubFetch<Pull>(base, token), githubFetch<string>(base, token, "application/vnd.github.v3.diff")]);
    const boundedDiff = diff.slice(0, 45_000);
    const aiReview = await generateStructured({
      operation: "pr_review", schemaName: "pull_request_review", jsonSchema: prReviewJsonSchema, validator: prReviewSchema,
      system: "You are a senior pull-request reviewer. Identify only issues evidenced by the supplied diff. Return structured JSON. Empty issues is valid when no material problem is found.",
      prompt: `Repository: ${parsed.fullName}\nPull request: #${parsed.number} ${pull.title}\nDiff${diff.length > boundedDiff.length ? " (truncated)" : ""}:\n${boundedDiff}`,
    });
    const worst = aiReview.issues.find((i) => i.severity === "CRITICAL") || aiReview.issues.find((i) => i.severity === "HIGH") || aiReview.issues[0];
    const riskScore = aiReview.issues.some((i) => i.severity === "CRITICAL" || i.severity === "HIGH") ? "HIGH" : aiReview.issues.some((i) => i.severity === "MED") ? "MED" : "LOW";
    const review = { prId: `PR-${parsed.number}`, repo: parsed.fullName, title: (worst?.title || "No material issues found").slice(0, 100), riskScore, summary: aiReview.summary, fixes: worst?.suggestion || "No code change is recommended from the supplied diff.", codeDiff: boundedDiff, issues: aiReview.issues };
    let persisted = false;
    let warning: string | undefined;
    if (process.env.DATABASE_URL) {
      try { await prisma.prReview.create({ data: { prId: review.prId, repo: review.repo, title: review.title, riskScore, summary: review.summary, fixes: review.fixes, codeDiff: boundedDiff } }); persisted = true; }
      catch { warning = "Database unavailable — review was returned but could not be saved."; console.warn("[db] pr_review_write failed category=unavailable"); }
    } else warning = "Database is not configured — review was not saved.";
    return NextResponse.json({ success: true, status: "success", review, persisted, warning });
  } catch (error) { logFailure("review", "pr_review", startedAt, error); return errorResponse(error); }
}
