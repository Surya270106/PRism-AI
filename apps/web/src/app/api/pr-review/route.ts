import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

function parsePRUrl(url: string) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2], pull_number: parseInt(match[3]) };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prUrl = body.pr_url;

    if (!prUrl) {
      return NextResponse.json({ error: "PR URL missing" }, { status: 400 });
    }

    const parsed = parsePRUrl(prUrl);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid GitHub PR URL" }, { status: 400 });
    }

    const { owner, repo, pull_number } = parsed;
    const headers: any = { Accept: "application/vnd.github.v3+json" };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;

    // Fetch PR metadata
    const prRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}`,
      { headers, timeout: 8000 }
    );
    const pr = prRes.data;

    // Fetch PR files
    const filesRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/files`,
      { headers, timeout: 8000 }
    );
    const files = filesRes.data.slice(0, 10);

    const filesSummary = files.map((f: any) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: (f.patch ?? "").slice(0, 500),
    }));

    const token = process.env.HF_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "HF_TOKEN not set" }, { status: 500 });
    }

    const prompt = `You are an elite senior software engineer reviewing a GitHub pull request.

PR Title: ${pr.title}
Author: ${pr.user?.login}
Base branch: ${pr.base?.ref} <- ${pr.head?.ref}
Description: ${(pr.body ?? "No description").slice(0, 500)}
Files changed: ${pr.changed_files}
Additions: ${pr.additions}
Deletions: ${pr.deletions}

Changed files and diffs:
${JSON.stringify(filesSummary, null, 2)}

Return ONLY valid JSON, no markdown, no backticks:
{
  "title": "${pr.title}",
  "summary": "2-3 sentence summary of what this PR does",
  "risk_score": <number 0-100>,
  "files_changed": ${pr.changed_files},
  "additions": ${pr.additions},
  "deletions": ${pr.deletions},
  "comments": [
    {
      "file": "filename here",
      "line": <line number or 0>,
      "severity": "critical|warning|suggestion|positive",
      "comment": "specific inline comment about this file or change"
    }
  ],
  "overall_feedback": "detailed overall feedback paragraph",
  "approval": "approve|request_changes|needs_review"
}

Generate 4-8 inline comments covering different files and severity levels.`;

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
          max_tokens: 1500,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HF API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = {
        title: pr.title,
        summary: `This PR by ${pr.user?.login} changes ${pr.changed_files} files with ${pr.additions} additions and ${pr.deletions} deletions.`,
        risk_score: 45,
        files_changed: pr.changed_files,
        additions: pr.additions,
        deletions: pr.deletions,
        comments: files.slice(0, 4).map((f: any) => ({
          file: f.filename,
          line: 0,
          severity: "suggestion",
          comment: `Review ${f.filename} — ${f.additions} additions, ${f.deletions} deletions.`,
        })),
        overall_feedback: `PR contains ${pr.changed_files} changed files. Manual review recommended.`,
        approval: "needs_review",
      };
    }

    return NextResponse.json({ analysis });

  } catch (error: any) {
    console.error("PR review error:", error);
    return NextResponse.json(
      { error: "Review failed: " + error.message },
      { status: 500 }
    );
  }
}