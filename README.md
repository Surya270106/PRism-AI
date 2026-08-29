# PRism AI

PRism AI is a Next.js application that connects to GitHub, analyzes repository evidence, and reviews pull-request diffs with a hosted LLM. The production web path is serverless-safe and does not require Docker, a local Python service, or a local model.

## Architecture

The deployable application is the `apps/web` workspace (Next.js 15.5 / React 19). GitHub OAuth is handled by NextAuth. Server route handlers fetch repository metadata, default-branch files, pull requests, and diffs through the GitHub API. Both repository and PR analysis use Groq strict structured outputs, validated again with Zod. Prisma stores repository-analysis cache entries and PR-review history in PostgreSQL when `DATABASE_URL` is configured.

The Python code under `apps/orchestrator` and `ml` remains available for local research only. Vercel does not call it.

## Request paths

- GitHub OAuth: `/api/auth/*` → NextAuth GitHub provider → access token stored in the server-side JWT/session.
- Repositories: `GET /api/repos` → authenticated GitHub `/user/repos`.
- Pull requests: `GET /api/prs?repo=owner/name` → authenticated GitHub pulls API.
- Repository analysis: `POST /api/review` → GitHub evidence on the repository default branch → Groq → Zod → optional `RepoAnalysis` upsert.
- PR review: `POST /api/pr-review` → validated GitHub PR URL → metadata and diff → Groq → Zod → optional `PrReview` insert.
- Readiness: `GET /api/health` reports configuration booleans only; it never returns secrets.

## Local setup

Requirements: Node.js 22 or 24, npm 11, Python 3.11 only for legacy orchestrator tests, and optional PostgreSQL.

```bash
npm ci
cp .env.example apps/web/.env.local
npx prisma validate
npx prisma generate
npm run dev
```

For an empty database, apply migrations with `npx prisma migrate deploy`. Never use `prisma migrate reset` against a database containing data.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `GITHUB_ID` | Yes | GitHub OAuth App client ID |
| `GITHUB_SECRET` | Yes | GitHub OAuth App client secret |
| `NEXTAUTH_SECRET` | Yes | Signs NextAuth cookies/JWTs |
| `NEXTAUTH_URL` | Yes | Local or deployed application URL |
| `GROQ_API_KEY` | Yes | Hosted AI analysis |
| `GROQ_MODEL` | No | Defaults to `openai/gpt-oss-120b` |
| `AI_PROVIDER` | No | Defaults to `groq` |
| `DATABASE_URL` | No | PostgreSQL persistence/cache; AI still returns if unavailable |
| `GITHUB_TOKEN` | No | Server-only token for public analysis outside an OAuth session |

Legacy `ORCHESTRATOR_URL`, `USE_LOCAL_MODEL`, `USE_CLAUDE_FALLBACK`, `LLAMA_SERVER_URL`, and `ANTHROPIC_API_KEY` are used only by optional local/research services.

## Verification

```bash
npm ci
npx prisma validate
npx prisma generate
npm run lint
npm run type-check
npm run test --workspace=web
npm run build
```

## Vercel and GitHub OAuth

Deploy the repository as a monorepo and set the Vercel Root Directory to `apps/web`. Add the required environment variables to Production and Preview. Set `NEXTAUTH_URL` to the final production domain.

For the GitHub OAuth App:

- Homepage URL: `https://YOUR_PROJECT.vercel.app`
- Authorization callback URL: `https://YOUR_PROJECT.vercel.app/api/auth/callback/github`

See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for recovery and redeployment steps.

## Troubleshooting

- An empty repository list is no longer treated as a hidden success: reconnect GitHub when the UI reports an expired session.
- `AI_NOT_CONFIGURED` means `GROQ_API_KEY` is absent; `AI_UNAVAILABLE` covers provider timeout/rate-limit/outage; `AI_RESPONSE_MALFORMED` means the provider returned output that failed runtime validation.
- A persistence warning means analysis succeeded but PostgreSQL could not cache/save it.
- GitHub 401/403/404 and rate limits are returned as safe, distinct error categories and logged server-side without tokens or prompts.

## License

MIT
