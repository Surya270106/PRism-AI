import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session as any).accessToken) {
      return NextResponse.json([], { status: 200 });
    }

    const octokit = new Octokit({
      auth: (session as any).accessToken,
      request: {
        timeout: 20000,
      },
    });

    const { data } =
      await octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: 10,
      });

    const repos = data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      open_issues: repo.open_issues_count,
      updated_at: repo.updated_at,
      language: repo.language,
      url: repo.html_url,
    }));

    return NextResponse.json(repos);
  } catch (error) {
    console.error("GitHub repos error:", error);

    return NextResponse.json([], { status: 200 });
  }
}