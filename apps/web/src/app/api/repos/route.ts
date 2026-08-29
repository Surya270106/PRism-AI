import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { AppError, errorResponse, logFailure } from "@/lib/api";
import { githubFetch } from "@/lib/github";

type Repo = { id: number; name: string; full_name: string; private: boolean; description: string | null; stargazers_count: number; open_issues_count: number; updated_at: string | null; language: string | null; html_url: string };

export async function GET() {
  const startedAt = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) throw new AppError("AUTH_REQUIRED", "GitHub session expired. Reconnect GitHub.", 401);
    const data = await githubFetch<Repo[]>("/user/repos?sort=updated&per_page=50&affiliation=owner,collaborator,organization_member", session.accessToken);
    return NextResponse.json({ success: true, repos: data.map((repo) => ({ ...repo, open_issues: repo.open_issues_count, url: repo.html_url })) });
  } catch (error) { logFailure("github", "list_repositories", startedAt, error); return errorResponse(error); }
}
