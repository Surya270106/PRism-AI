# Recreate PRism on Vercel

1. Create a new Vercel project from `Surya270106/PRism-AI`. Do not link it to an inaccessible old project.
2. Use `apps/web` as the Root Directory. Keep the detected Next.js framework settings. The workspace-aware install runs from the repository lockfile; no Docker service is required.
3. Configure Production and Preview variables: `GITHUB_ID`, `GITHUB_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GROQ_API_KEY`, and optionally `GROQ_MODEL`, `DATABASE_URL`, and server-only `GITHUB_TOKEN`.
4. Generate `NEXTAUTH_SECRET` with a cryptographically secure generator and set it in Vercel only. Never commit it.
5. Deploy once to obtain the final domain. Set `NEXTAUTH_URL=https://FINAL_DOMAIN` and redeploy.
6. In the GitHub OAuth App set:
   - Homepage URL: `https://FINAL_DOMAIN`
   - Authorization callback URL: `https://FINAL_DOMAIN/api/auth/callback/github`
7. If the database is new, run `npx prisma migrate deploy` against that exact `DATABASE_URL`. Do not reset an existing database.
8. Verify `/`, `/api/health`, `/api/auth/providers`, and `/api/auth/session`, then complete the signed-in repository-analysis and PR-review flows.

The production web application calls GitHub, Groq, and PostgreSQL over outbound HTTPS/TLS. It does not depend on the Python orchestrator, localhost, Redis, a Docker daemon, persistent disk, or a local model.
