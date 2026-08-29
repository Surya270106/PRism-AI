import { NextResponse } from "next/server";
import { getAiConfig, isConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const ai = getAiConfig();
  return NextResponse.json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
    githubOAuthConfigured: isConfigured("GITHUB_ID") && isConfigured("GITHUB_SECRET"),
    githubTokenConfigured: isConfigured("GITHUB_TOKEN"),
    aiProviderConfigured: ai.provider === "groq" && Boolean(ai.apiKey),
    databaseConfigured: isConfigured("DATABASE_URL"),
  });
}
