import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "../../../lib/prisma";

export const dynamic = 'force-dynamic';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

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
    const truncatedDiff = codeDiff.slice(0, 8000); // Trim large diffs to stay within token limits

    const prompt = `
      Act as a Senior Security and Code Review Engineer. Review the following GitHub PR code diff.
      Analyze for bugs, security vulnerabilities (like auth bypasses), and bad practices.
      
      Respond STRICTLY in valid JSON format matching this exact structure (no markdown, no backticks):
      {
        "title": "A short 4-word title for the review",
        "riskScore": "HIGH",
        "summary": "A 2-sentence summary of your findings",
        "fixes": "A short suggestion on how to fix the worst issue found"
      }

      Here is the Code Diff:
      ${truncatedDiff}
    `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    let aiText = completion.choices[0].message.content!;
    aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiReview = JSON.parse(aiText);

    const savedReview = await prisma.prReview.create({
      data: {
        prId: prId,
        repo: repo,
        title: aiReview.title,
        riskScore: aiReview.riskScore,
        summary: aiReview.summary,
        fixes: aiReview.fixes,
        codeDiff: codeDiff, // Save the full diff to the database
      }
    });

    return NextResponse.json({ status: "success", review: savedReview });

  } catch (error) {
    console.error("AI Engine Error:", error);
    return NextResponse.json({ error: "Failed to process AI review" }, { status: 500 });
  }
}