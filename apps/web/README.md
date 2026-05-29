<div align="center">
  <img src="https://img.shields.io/badge/PRism_AI-v1.0-c9a84c?style=for-the-badge&labelColor=060606" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel" />
  <img src="https://img.shields.io/badge/AI-Groq_LLaMA_3.3-orange?style=for-the-badge" />
</div>

<br />

<div align="center">
  <h1>PRism AI</h1>
  <p><strong>Your code, through an HR's eyes.</strong></p>
  <p>Login with GitHub → see your repos → get a full AI-powered code quality report with bugs, security issues, architecture feedback, and a hire-readiness score — instantly.</p>
  <br />
  <a href="https://p-rism-ai-web.vercel.app/"><strong>🚀 Live Demo →</strong></a>
</div>

---

## What it does

PRism scans your GitHub repositories and gives you an honest senior-engineer-level review — the kind of feedback an HR technical screener or staff engineer would give when looking at your code before an interview.

**Repo Analysis (Kimi K2 via HuggingFace)**
- 📊 Risk score (0–100) with visual ring
- 🐛 Bugs detected
- 🔒 Security vulnerabilities
- ⚡ Performance issues
- 🏗️ Architecture suggestions
- ✅ What you're doing well
- 📋 Priority action list — fix these before your next job application

**Pull Request Review (Groq LLaMA 3.3 70B)**
- Fetches the raw code diff from GitHub
- AI reviews changed lines for bugs, security issues, bad practices
- Risk classification: HIGH / MED / LOW
- Suggested fix with one click

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Framer Motion |
| Auth | GitHub OAuth via NextAuth.js |
| Repo Analysis AI | Kimi K2 Instruct via HuggingFace Router |
| PR Diff AI | Groq LLaMA 3.3 70B |
| Database | Neon PostgreSQL via Prisma ORM |
| Deployment | Vercel (CI/CD via GitHub push) |
| Monorepo | Turborepo |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A GitHub OAuth App
- Groq API key (free at [console.groq.com](https://console.groq.com))
- HuggingFace token (free at [huggingface.co](https://huggingface.co))
- Neon PostgreSQL database (free at [neon.tech](https://neon.tech))

### Setup

```bash
git clone https://github.com/Surya270106/PRism-AI.git
cd PRism-AI
npm install
```

Create `apps/web/.env.local`:

```env
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret
NEXTAUTH_SECRET=any_random_secret_string
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=your_neon_postgresql_connection_string
GROQ_API_KEY=your_groq_api_key
HF_TOKEN=your_huggingface_token
```

```bash
cd apps/web
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
PRism-AI/
├── apps/
│   └── web/
│       ├── src/app/
│       │   ├── page.tsx              # Landing page
│       │   ├── pr-review/page.tsx    # Main dashboard
│       │   ├── history/page.tsx      # Review history
│       │   └── api/
│       │       ├── auth/             # NextAuth GitHub OAuth
│       │       ├── repos/            # Fetch user's GitHub repos
│       │       ├── prs/              # Fetch PRs per repo
│       │       ├── review/           # Repo analysis (HuggingFace)
│       │       └── pr-review/        # PR diff review (Groq)
│       └── prisma/schema.prisma
└── turbo.json
```

---

## Screenshots

> Login with GitHub → your repos appear in the sidebar → click any repo → full HR analysis loads automatically

---

## Environment Variables (Vercel)

Add these in your Vercel project settings under **Environment Variables**:

```
GITHUB_ID
GITHUB_SECRET
NEXTAUTH_SECRET
NEXTAUTH_URL          → your production URL e.g. https://p-rism-ai-web.vercel.app
DATABASE_URL
GROQ_API_KEY
HF_TOKEN
```

---

## Author

**Surya Teja Nuthangi**
Pre-final year B.Tech CSE (AI/ML) — VJIT Hyderabad

[GitHub](https://github.com/Surya270106) · [LinkedIn](https://linkedin.com/in/suryateja2005) · [Live Demo](https://p-rism-ai-web.vercel.app/)

---

<div align="center">
  <sub>Built with Next.js · Groq · HuggingFace · Neon · Vercel</sub>
</div>