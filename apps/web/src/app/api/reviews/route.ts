import { NextResponse } from "next/server";
import { AppError, errorResponse, logFailure } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    if (!process.env.DATABASE_URL) throw new AppError("INTERNAL_ERROR", "Database is not configured.", 503);
    const reviews = await prisma.prReview.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
    return NextResponse.json({ success: true, status: "success", reviews });
  } catch (error) { logFailure("db", "list_pr_reviews", startedAt, error); return errorResponse(error); }
}
