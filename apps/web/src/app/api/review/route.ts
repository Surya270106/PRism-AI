import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// ─── In-memory cache (survives across requests within the same server process) ──
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const analysisCache = new Map<
  string,
  { data: any; timestamp: number }
>();

function getCached(repo: string) {
  const entry = analysisCache.get(repo);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    analysisCache.delete(repo);
    return null;
  }
  return entry.data;
}

function setCache(repo: string, data: any) {
  analysisCache.set(repo, { data, timestamp: Date.now() });
}

// ─── Helper: safe GitHub fetch (returns null on failure) ─────────────────────
async function ghFetch(url: string) {
  try {
    const r = await axios.get(url, { timeout: 6000 });
    return r.data;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repo: string | undefined = body.repo;
    const force: boolean = body.force === true;

    if (!repo) {
      return NextResponse.json(
        { success: false, error: "Repository missing" },
        { status: 400 }
      );
    }

    // ── Return cached result unless force-refresh ──
    if (!force) {
      const cached = getCached(repo);
      if (cached) {
        return NextResponse.json({ repo, analysis: cached, cached: true });
      }
    }

    const [owner, repoName] = repo.split("/");

    // ── 1. Fetch README ──
    let readmeContent = "README not found.";
    try {
      const r = await axios.get(
        `https://raw.githubusercontent.com/${owner}/${repoName}/main/README.md`,
        { timeout: 5000 }
      );
      readmeContent = String(r.data).slice(0, 3000);
    } catch {
      try {
        const r = await axios.get(
          `https://raw.githubusercontent.com/${owner}/${repoName}/master/README.md`,
          { timeout: 5000 }
        );
        readmeContent = String(r.data).slice(0, 3000);
      } catch {
        readmeContent = "README not found.";
      }
    }

    // ── 2. Fetch repo metadata ──
    let repoInfo: any = {};
    try {
      const r = await axios.get(
        `https://api.github.com/repos/${owner}/${repoName}`,
        { timeout: 5000 }
      );
      repoInfo = r.data;
    } catch {}

    // ── 3. Fetch package.json ──
    let packageJson = "Not found.";
    try {
      const r = await axios.get(
        `https://raw.githubusercontent.com/${owner}/${repoName}/main/package.json`,
        { timeout: 5000 }
      );
      packageJson = JSON.stringify(r.data, null, 2).slice(0, 1500);
    } catch {}

    // ── 4. Fetch language breakdown ──
    const languages = await ghFetch(
      `https://api.github.com/repos/${owner}/${repoName}/languages`
    );
    let languageBreakdown = "Not available.";
    if (languages && typeof languages === "object") {
      const total = Object.values(languages as Record<string, number>).reduce(
        (a: number, b: number) => a + b,
        0
      );
      if (total > 0) {
        languageBreakdown = Object.entries(languages as Record<string, number>)
          .map(([lang, bytes]) => `${lang}: ${((bytes / total) * 100).toFixed(1)}%`)
          .join(", ");
      }
    }

    // ── 5. Fetch recent commits (last 5) ──
    const commits = await ghFetch(
      `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=5`
    );
    let recentCommits = "Not available.";
    if (Array.isArray(commits) && commits.length > 0) {
      recentCommits = commits
        .map(
          (c: any) =>
            `- "${c.commit?.message?.split("\n")[0] || "no message"}" by ${c.commit?.author?.name || "unknown"} on ${c.commit?.author?.date?.slice(0, 10) || "?"}`
        )
        .join("\n");
    }

    // ── 6. Fetch directory tree (top-level) ──
    const defaultBranch = repoInfo.default_branch || "main";
    const tree = await ghFetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/trees/${defaultBranch}?recursive=0`
    );
    let fileStructure = "Not available.";
    if (tree && Array.isArray(tree.tree)) {
      fileStructure = tree.tree
        .slice(0, 40)
        .map((f: any) => `${f.type === "tree" ? "📁" : "📄"} ${f.path}`)
        .join("\n");
    }

    // ── 7. Contributor count ──
    let contributorCount = "Unknown";
    try {
      const r = await axios.get(
        `https://api.github.com/repos/${owner}/${repoName}/contributors?per_page=1&anon=true`,
        { timeout: 5000 }
      );
      // GitHub puts total page count in the Link header
      const linkHeader = r.headers?.link || "";
      const match = linkHeader.match(/page=(\d+)>; rel="last"/);
      contributorCount = match ? match[1] : String(Array.isArray(r.data) ? r.data.length : 1);
    } catch {}

    // ── Verify HF token ──
    const token = process.env.HF_TOKEN;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "HF_TOKEN not set in .env.local" },
        { status: 500 }
      );
    }

    // ── Deterministic Scoring Criteria ──
    let readme_quality = 0;
    if (readmeContent && readmeContent !== "README not found.") {
      readme_quality += 40;
      if (readmeContent.length > 500) readme_quality += 20;
      if (readmeContent.length > 1500) readme_quality += 20;
      if (readmeContent.length > 2500) readme_quality += 20;
    }

    let code_structure = 30;
    const fsLower = fileStructure.toLowerCase();
    if (fsLower.includes("src") || fsLower.includes("app") || fsLower.includes("lib")) code_structure += 30;
    if (packageJson !== "Not found." || fsLower.includes("requirements.txt") || fsLower.includes("cargo.toml")) code_structure += 20;
    if (fsLower.includes(".eslintrc") || fsLower.includes("tsconfig.json") || fsLower.includes(".gitignore")) code_structure += 20;

    let activity = 0;
    if (recentCommits !== "Not available." && recentCommits.split("\\n").length > 2) activity += 30;
    if (repoInfo.pushed_at) {
      const daysSincePush = (Date.now() - new Date(repoInfo.pushed_at).getTime()) / (1000 * 3600 * 24);
      if (daysSincePush < 30) activity += 50;
      else if (daysSincePush < 180) activity += 30;
      else if (daysSincePush < 365) activity += 10;
    }
    if ((repoInfo.open_issues_count || 0) < 20) activity += 20;

    let documentation = 20;
    if (readmeContent !== "README not found.") documentation += 40;
    if (repoInfo.license) documentation += 20;
    if (fsLower.includes("docs") || fsLower.includes("contributing")) documentation += 20;

    let security = 50;
    if (fsLower.includes(".env.example")) security += 20;
    if (fsLower.includes(".env") && !fsLower.includes(".env.example")) security -= 40;
    if (fsLower.includes("package-lock.json") || fsLower.includes("yarn.lock") || fsLower.includes("pnpm-lock.yaml")) security += 30;

    let originality = repoInfo.fork ? 20 : 50;
    if (!repoInfo.fork) {
      if ((repoInfo.stargazers_count || 0) > 10) originality += 20;
      if ((repoInfo.stargazers_count || 0) > 100) originality += 30;
    } else {
      if ((repoInfo.stargazers_count || 0) > 50) originality += 30;
    }

    const calculated_dimension_scores = {
      readme_quality: Math.min(100, Math.max(0, readme_quality)),
      code_structure: Math.min(100, Math.max(0, code_structure)),
      activity: Math.min(100, Math.max(0, activity)),
      documentation: Math.min(100, Math.max(0, documentation)),
      security: Math.min(100, Math.max(0, security)),
      originality: Math.min(100, Math.max(0, originality)),
    };

    const calculated_health_score = Math.round(
      (calculated_dimension_scores.readme_quality * 0.20) +
      (calculated_dimension_scores.code_structure * 0.20) +
      (calculated_dimension_scores.activity * 0.15) +
      (calculated_dimension_scores.documentation * 0.15) +
      (calculated_dimension_scores.security * 0.15) +
      (calculated_dimension_scores.originality * 0.15)
    );

    // ── Build the structured prompt with calculated scores ──
    const prompt = `You are an expert software engineer and technical recruiter evaluating a GitHub repository.

REPOSITORY DATA:
- Name: ${repo}
- Primary Language: ${repoInfo.language ?? "Unknown"}
- Stars: ${repoInfo.stargazers_count ?? 0}
- Forks: ${repoInfo.forks_count ?? 0}
- Open Issues: ${repoInfo.open_issues_count ?? 0}
- Contributors: ${contributorCount}
- Created: ${repoInfo.created_at?.slice(0, 10) ?? "Unknown"}
- Last Push: ${repoInfo.pushed_at?.slice(0, 10) ?? "Unknown"}
- License: ${repoInfo.license?.spdx_id ?? "None"}
- Topics: ${Array.isArray(repoInfo.topics) && repoInfo.topics.length > 0 ? repoInfo.topics.join(", ") : "None"}

LANGUAGE BREAKDOWN:
${languageBreakdown}

FILE STRUCTURE (top-level):
${fileStructure}

RECENT COMMITS:
${recentCommits}

README (first 3000 chars):
${readmeContent}

package.json:
${packageJson}

I have already calculated the numeric scores for this repository based on a strict deterministic rubric:
Health Score: ${calculated_health_score}/100
Dimension Scores:
- README Quality: ${calculated_dimension_scores.readme_quality}/100
- Code Structure: ${calculated_dimension_scores.code_structure}/100
- Activity: ${calculated_dimension_scores.activity}/100
- Documentation: ${calculated_dimension_scores.documentation}/100
- Security: ${calculated_dimension_scores.security}/100
- Originality: ${calculated_dimension_scores.originality}/100

Based on the provided data and these scores, generate a textual review. 
Return ONLY valid JSON with no markdown, no backticks, no explanation. Exactly this shape:
{
  "summary": "2-3 sentence overall assessment of the repository quality from a recruiter's perspective",
  "bugs": ["concrete bug or issue found, based on actual code/config evidence"],
  "security": ["specific security concern found in the repo"],
  "performance": ["specific performance issue or improvement"],
  "architecture": ["specific architectural suggestion based on the file structure"],
  "positives": ["specific strength observed in the repo"],
  "recommendations": ["actionable next step to improve the repo"]
}`;

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: "moonshotai/Kimi-K2-Instruct-0905",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1024,
          temperature: 0,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("HF API error:", errText);
      throw new Error(`HF API returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";

    console.log("AI raw response:", raw.slice(0, 300));

    const cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
      
      // Ensure all arrays exist
      analysis.bugs = Array.isArray(analysis.bugs) ? analysis.bugs : [];
      analysis.security = Array.isArray(analysis.security) ? analysis.security : [];
      analysis.performance = Array.isArray(analysis.performance) ? analysis.performance : [];
      analysis.architecture = Array.isArray(analysis.architecture) ? analysis.architecture : [];
      analysis.positives = Array.isArray(analysis.positives) ? analysis.positives : [];
      analysis.recommendations = Array.isArray(analysis.recommendations) ? analysis.recommendations : [];
    } catch {
      // Fallback if LLM returns garbage
      analysis = {
        summary: `${repoName} is a ${repoInfo.language ?? "code"} repository with ${repoInfo.stargazers_count ?? 0} stars. Could not fully parse AI response — review below is approximate.`,
        bugs: ["Could not parse AI response — manual review recommended"],
        security: ["Audit dependencies", "Check for exposed secrets"],
        performance: ["Consider adding caching", "Optimize build pipeline"],
        architecture: ["Consider modular structure", "Add clear separation of concerns"],
        positives: ["Repository is accessible", repoInfo.language ? `Written in ${repoInfo.language}` : "Active project"],
        recommendations: ["Add CI/CD pipeline", "Add test coverage", "Add contribution guidelines"],
      };
    }

    // Attach the deterministic scores
    analysis.health_score = calculated_health_score;
    analysis.dimension_scores = calculated_dimension_scores;

    // Cache the result
    setCache(repo, analysis);

    return NextResponse.json({ repo, analysis });

  } catch (error: any) {
    console.error("Review error:", error);
    return NextResponse.json(
      { success: false, error: "Review failed: " + error.message },
      { status: 500 }
    );
  }
}