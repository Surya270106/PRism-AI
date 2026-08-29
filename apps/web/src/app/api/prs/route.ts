import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { AppError, errorResponse, logFailure } from "@/lib/api";
import { githubFetch, parseRepo } from "@/lib/github";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) throw new AppError("AUTH_REQUIRED", "GitHub session expired. Reconnect GitHub.", 401);
    const parsed = parseRepo(req.nextUrl.searchParams.get("repo"));
    const pulls = await githubFetch<unknown[]>(`/repos/${parsed.owner}/${parsed.repo}/pulls?state=all&per_page=20`, session.accessToken);
    return NextResponse.json({ success: true, pulls });
  } catch (error) { logFailure("github", "list_pull_requests", startedAt, error); return errorResponse(error); }
}
