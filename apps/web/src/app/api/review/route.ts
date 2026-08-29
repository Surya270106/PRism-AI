import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { AppError, errorResponse, logFailure } from "@/lib/api";
import { generateStructured } from "@/lib/ai/provider";
import { repoAnalysisJsonSchema, repoAnalysisSchema } from "@/lib/ai/schemas";
import { githubFetch, parseRepo } from "@/lib/github";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

type RepoMetadata = { default_branch: string; language: string | null; stargazers_count: number; forks_count: number; open_issues_count: number; created_at: string; pushed_at: string; fork: boolean; license: { spdx_id: string } | null; topics: string[] };
type Commit = { sha: string; commit: { message: string; author?: { name?: string; date?: string } } };
type Tree = { tree: Array<{ path: string; type: string }> };
const bounded = (value: number) => Math.min(100, Math.max(0, value));

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = await req.json().catch(() => { throw new AppError("BAD_REQUEST", "Request body must be valid JSON.", 400); });
    const parsed = parseRepo(body.repo);
    const session = await getServerSession(authOptions);
    const token = session?.accessToken || process.env.GITHUB_TOKEN;
    const base = `/repos/${parsed.owner}/${parsed.repo}`;
    const metadata = await githubFetch<RepoMetadata>(base, token);
    const branch = encodeURIComponent(metadata.default_branch);
    const [commits, readme, packageJson, languages, tree, issues] = await Promise.all([
      githubFetch<Commit[]>(`${base}/commits?per_page=5`, token),
      githubFetch<string>(`${base}/readme?ref=${branch}`, token, "application/vnd.github.raw+json").catch(() => "README not found."),
      githubFetch<string>(`${base}/contents/package.json?ref=${branch}`, token, "application/vnd.github.raw+json").catch(() => "Not found."),
      githubFetch<Record<string, number>>(`${base}/languages`, token).catch(() => ({})),
      githubFetch<Tree>(`${base}/git/trees/${branch}?recursive=1`, token).catch(() => ({ tree: [] })),
      githubFetch<Array<{ title: string; state: string; pull_request?: unknown }>>(`${base}/issues?state=open&per_page=5`, token).catch(() => []),
    ]);
    const latestCommitSha = commits[0]?.sha || "unknown";
    if (!body.force && process.env.DATABASE_URL) {
      try {
        const cached = await prisma.repoAnalysis.findUnique({ where: { repo: parsed.fullName } });
        if (cached?.commitSha === latestCommitSha) return NextResponse.json({ success: true, repo: parsed.fullName, analysis: cached.analysis, cached: true, persisted: true, commitSha: latestCommitSha });
      } catch { console.warn("[db] repo_analysis_cache_read failed category=unavailable"); }
    }

    const paths = tree.tree.slice(0, 300).map((item) => item.path);
    const hasTests = paths.some((p) => /(^|\/)(tests?|__tests__)(\/|$)|\.(test|spec)\./i.test(p));
    const hasWorkflows = paths.some((p) => p.startsWith(".github/workflows/"));
    const hasDocker = paths.some((p) => /(^|\/)(Dockerfile|docker-compose[^/]*)$/i.test(p));
    const hasPrisma = paths.some((p) => p.endsWith("schema.prisma"));
    const readmeText = readme.slice(0, 5000);
    const packageText = packageJson.slice(0, 2500);
    const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
    const languageBreakdown = Object.entries(languages).map(([name, bytes]) => `${name}: ${totalBytes ? ((bytes / totalBytes) * 100).toFixed(1) : 0}%`).join(", ") || "Not available";
    const daysSincePush = metadata.pushed_at ? (Date.now() - new Date(metadata.pushed_at).getTime()) / 86_400_000 : Infinity;
    const readmeQuality = bounded(readme === "README not found." ? 0 : 40 + (readmeText.length > 500 ? 20 : 0) + (readmeText.length > 1500 ? 20 : 0) + (readmeText.length > 3000 ? 20 : 0));
    const codeStructure = bounded(30 + (paths.some((p) => /^(src|app|lib)(\/|$)/.test(p)) ? 20 : 0) + (packageJson !== "Not found." ? 10 : 0) + (paths.some((p) => p.endsWith("tsconfig.json") || p.includes("eslint")) ? 10 : 0) + (hasTests ? 30 : 0));
    const activity = bounded((commits.length >= 3 ? 30 : 0) + (daysSincePush < 30 ? 50 : daysSincePush < 180 ? 30 : daysSincePush < 365 ? 10 : 0) + (metadata.open_issues_count < 20 ? 20 : 0));
    const documentation = bounded(20 + (readme !== "README not found." ? 40 : 0) + (metadata.license ? 20 : 0) + (paths.some((p) => /^docs\//.test(p) || /contributing/i.test(p)) ? 20 : 0));
    const security = bounded(50 + (paths.includes(".env.example") ? 10 : 0) - (paths.some((p) => /(^|\/)\.env$/.test(p)) ? 40 : 0) + (paths.some((p) => /(^|\/)(package-lock|yarn\.lock|pnpm-lock)/.test(p)) ? 20 : 0) + (hasWorkflows ? 20 : 0));
    const originality = bounded(metadata.fork ? 20 + (metadata.stargazers_count > 50 ? 30 : 0) : 50 + (metadata.stargazers_count > 10 ? 20 : 0) + (metadata.stargazers_count > 100 ? 30 : 0));
    const dimension_scores = { readme_quality: readmeQuality, code_structure: codeStructure, activity, documentation, security, originality };
    const health_score = Math.round(readmeQuality * .2 + codeStructure * .2 + activity * .15 + documentation * .15 + security * .15 + originality * .15);
    const analysisText = await generateStructured({
      operation: "repo_analysis", schemaName: "repository_analysis", jsonSchema: repoAnalysisJsonSchema, validator: repoAnalysisSchema,
      system: "You are a senior code reviewer. Use only supplied evidence. Never claim a capability, vulnerability, or implementation detail that the evidence does not support. Return concise structured JSON.",
      prompt: `Repository: ${parsed.fullName}\nDefault branch: ${metadata.default_branch}\nLanguage: ${metadata.language || "Unknown"}\nStars: ${metadata.stargazers_count}\nForks: ${metadata.forks_count}\nOpen issues: ${metadata.open_issues_count}\nLicense: ${metadata.license?.spdx_id || "None"}\nLanguages: ${languageBreakdown}\nDetected CI: ${hasWorkflows}\nDetected tests: ${hasTests}\nDetected Docker: ${hasDocker}\nDetected Prisma: ${hasPrisma}\n\nFile paths (bounded):\n${paths.slice(0, 120).join("\n")}\n\nRecent commits:\n${commits.map((c) => c.commit.message.split("\n")[0]).join("\n") || "Not available"}\n\nOpen issues (excluding PRs):\n${issues.filter((i) => !i.pull_request).map((i) => i.title).join("\n") || "None fetched"}\n\nREADME (bounded):\n${readmeText}\n\npackage.json (bounded):\n${packageText}`,
    });
    const analysis = { ...analysisText, health_score, dimension_scores };
    let persisted = false;
    let warning: string | undefined;
    if (process.env.DATABASE_URL) {
      try {
        await prisma.repoAnalysis.upsert({ where: { repo: parsed.fullName }, update: { commitSha: latestCommitSha, analysis }, create: { repo: parsed.fullName, commitSha: latestCommitSha, analysis } });
        persisted = true;
      } catch { warning = "Database unavailable — analysis was returned but could not be cached."; console.warn("[db] repo_analysis_cache_write failed category=unavailable"); }
    } else warning = "Database is not configured — analysis was not cached.";
    return NextResponse.json({ success: true, repo: parsed.fullName, analysis, commitSha: latestCommitSha, persisted, warning });
  } catch (error) { logFailure("review", "repo_analysis", startedAt, error); return errorResponse(error); }
}
