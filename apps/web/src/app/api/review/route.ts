import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const repo = body.repo;

    if (!repo) {
      return NextResponse.json(
        { success: false, error: "Repository missing" },
        { status: 400 }
      );
    }

    const [owner, repoName] = repo.split("/");

    // Fetch README
    let readmeContent = "README not found.";
    try {
      const r = await axios.get(
        `https://raw.githubusercontent.com/${owner}/${repoName}/main/README.md`,
        { timeout: 5000 }
      );
      readmeContent = String(r.data).slice(0, 2000);
    } catch {
      try {
        const r = await axios.get(
          `https://raw.githubusercontent.com/${owner}/${repoName}/master/README.md`,
          { timeout: 5000 }
        );
        readmeContent = String(r.data).slice(0, 2000);
      } catch {
        readmeContent = "README not found.";
      }
    }

    // Fetch repo metadata
    let repoInfo: any = {};
    try {
      const r = await axios.get(
        `https://api.github.com/repos/${owner}/${repoName}`,
        { timeout: 5000 }
      );
      repoInfo = r.data;
    } catch {}

    // Fetch package.json
    let packageJson = "Not found.";
    try {
      const r = await axios.get(
        `https://raw.githubusercontent.com/${owner}/${repoName}/main/package.json`,
        { timeout: 5000 }
      );
      packageJson = JSON.stringify(r.data, null, 2).slice(0, 1000);
    } catch {}

    const token = process.env.HF_TOKEN;

    console.log("HF_TOKEN present:", !!token);

    if (!token) {
      return NextResponse.json(
        { success: false, error: "HF_TOKEN not set in .env.local" },
        { status: 500 }
      );
    }

    const prompt = `You are an elite staff software engineer doing a real code review.

Repository: ${repo}
Language: ${repoInfo.language ?? "Unknown"}
Stars: ${repoInfo.stargazers_count ?? 0}
Forks: ${repoInfo.forks_count ?? 0}
Open Issues: ${repoInfo.open_issues_count ?? 0}

README:
${readmeContent}

package.json:
${packageJson}

Return ONLY valid JSON with no markdown, no backticks, no explanation. Exactly this shape:
{
  "summary": "2-3 sentence overall assessment",
  "risk_score": <number 0-100>,
  "bugs": ["bug1", "bug2"],
  "security": ["issue1", "issue2"],
  "performance": ["issue1", "issue2"],
  "architecture": ["suggestion1", "suggestion2"],
  "positives": ["positive1", "positive2"],
  "recommendations": ["action1", "action2", "action3"]
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

    console.log("AI raw response:", raw.slice(0, 200));

    const cleaned = raw
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = {
        summary: `${repoName} is a ${repoInfo.language ?? "code"} repository with ${repoInfo.stargazers_count ?? 0} stars.`,
        risk_score: 40,
        bugs: ["Could not parse AI response — manual review recommended"],
        security: ["Audit dependencies", "Check for exposed secrets"],
        performance: ["Add caching", "Optimize queries"],
        architecture: ["Consider modular structure", "Add API versioning"],
        positives: ["Repository is accessible", repoInfo.language ? `Written in ${repoInfo.language}` : "Active project"],
        recommendations: ["Add CI/CD", "Add tests", "Add contribution guidelines"],
      };
    }

    return NextResponse.json({ repo, analysis });

  } catch (error: any) {
    console.error("Review error:", error);
    return NextResponse.json(
      { success: false, error: "Review failed: " + error.message },
      { status: 500 }
    );
  }
}