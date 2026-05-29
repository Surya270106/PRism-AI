import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const repo = req.nextUrl.searchParams.get("repo");
    if (!repo) return NextResponse.json({ error: "Repo missing" }, { status: 400 });

    const accessToken = (session as any).accessToken;

    const res = await fetch(`https://api.github.com/repos/${repo}/pulls?state=all&per_page=20`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) throw new Error("Failed to fetch PRs");
    const pulls = await res.json();
    return NextResponse.json({ pulls });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}