import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { prUrl } = await req.json();

    if (!prUrl || !prUrl.includes("github.com")) {
      return NextResponse.json({ error: "Invalid GitHub PR URL" }, { status: 400 });
    }

    const urlParts = prUrl.split("/");
    const repo = `${urlParts[3]}/${urlParts[4]}`;
    const prId = `PR-${urlParts[6]}`;

    const diffUrl = `${prUrl}.diff`;
    const diffResponse = await fetch(diffUrl);

    if (!diffResponse.ok) {
      return NextResponse.json({ error: "Could not fetch PR diff. Is the repo public?" }, { status: 400 });
    }

    const codeDiff = await diffResponse.text();
    const truncatedDiff = codeDiff.slice(0, 16000); // Llama 3B has larger context window

    // Forward the diff to our Python Orchestrator Service
    // Use docker-compose internal DNS if available, fallback to localhost
    const orchestratorUrl = process.env.ORCHESTRATOR_URL || "http://localhost:8001/api/v1/review";
    
    console.log(`Sending diff to orchestrator at ${orchestratorUrl}...`);
    
    const orchestratorResponse = await fetch(orchestratorUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diff: truncatedDiff }),
    });

    if (!orchestratorResponse.ok) {
      console.error("Orchestrator failed:", await orchestratorResponse.text());
      return NextResponse.json({ error: "Enterprise Model Router failed to process review." }, { status: 500 });
    }

    const aiReview = await orchestratorResponse.json();
    
    // Convert the detailed orchestrator response to the simplified format the DB expects
    const worstIssue = aiReview.issues?.[0] || { title: "Clean Code", suggestion: "No critical issues found." };
    const maxRisk = aiReview.issues?.some((i: any) => i.severity === "CRITICAL" || i.severity === "HIGH") ? "HIGH" : "LOW";

    const savedReview = await prisma.prReview.create({
      data: {
        prId: prId,
        repo: repo,
        title: worstIssue.title.substring(0, 50),
        riskScore: maxRisk,
        summary: aiReview.summary,
        fixes: worstIssue.suggestion,
        codeDiff: codeDiff,
      }
    });

    return NextResponse.json({ status: "success", review: savedReview });

  } catch (error) {
    console.error("Next.js API Error:", error);
    return NextResponse.json({ error: "Failed to process AI review" }, { status: 500 });
  }
}