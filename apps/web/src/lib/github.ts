import { AppError } from "@/lib/api";

const API = "https://api.github.com";

function githubError(status: number, rateLimited: boolean): AppError {
  if (status === 401) return new AppError("AUTH_REQUIRED", "GitHub session expired. Reconnect GitHub.", 401);
  if (status === 403 && rateLimited) return new AppError("GITHUB_RATE_LIMITED", "GitHub rate limit reached. Retry later.", 429);
  if (status === 403) return new AppError("GITHUB_FORBIDDEN", "GitHub denied access to this repository.", 403);
  if (status === 404) return new AppError("GITHUB_NOT_FOUND", "Repository or pull request was not found.", 404);
  return new AppError("GITHUB_UNAVAILABLE", "GitHub is temporarily unavailable.", 502);
}

export async function githubFetch<T>(path: string, token?: string, accept = "application/vnd.github+json"): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, {
      signal: AbortSignal.timeout(12_000),
      headers: {
        Accept: accept,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new AppError("GITHUB_UNAVAILABLE", "GitHub is temporarily unavailable.", 502, error);
  }
  if (!response.ok) throw githubError(response.status, response.headers.get("x-ratelimit-remaining") === "0");
  if (accept.includes("diff") || accept.includes("raw")) return await response.text() as T;
  return await response.json() as T;
}

export function parseRepo(value: unknown): { owner: string; repo: string; fullName: string } {
  if (typeof value !== "string" || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value)) {
    throw new AppError("BAD_REQUEST", "Enter a valid owner/repository name.", 400);
  }
  const [owner, repo] = value.split("/");
  return { owner, repo, fullName: `${owner}/${repo}` };
}

export function parsePullRequestUrl(value: unknown) {
  if (typeof value !== "string") throw new AppError("BAD_REQUEST", "Enter a valid GitHub pull request URL.", 400);
  const match = /^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/pull\/(\d+)\/?(?:[?#].*)?$/.exec(value);
  if (!match) throw new AppError("BAD_REQUEST", "Enter a valid GitHub pull request URL.", 400);
  return { owner: match[1], repo: match[2], number: Number(match[3]), fullName: `${match[1]}/${match[2]}` };
}
