# PRism AI — GitHub Career Intelligence

> **Find what's missing in your GitHub before recruiters do.**

PRism AI analyzes your GitHub profile the way a senior recruiter would — spotting weak spots, missing signals, and career gaps that cost students job opportunities.

---

## The Problem

Most students lose job opportunities not because they lack skills — but because their GitHub profile doesn't *show* those skills clearly. Recruiters spend 15 seconds on a profile. PRism tells you exactly what they see.

---

## Features

###  Eagle Eye HR — Recruiter Simulation
Simulates how a recruiter evaluates your GitHub profile in real time:
- Startup HR perspective
- FAANG screening lens
- Internship recruiter view

###  GitHub Profile Scorer
Scores your profile across key dimensions:
- Project originality vs tutorial clones
- README quality and documentation
- Commit consistency and activity
- Deployment presence
- Tech stack diversity
- Code structure and complexity

###  Red Flag Detector
Catches issues recruiters silently penalize:
- Only tutorial/clone repos
- No deployed projects
- Empty or copied READMEs
- Poor commit history
- No pinned repositories
- Weak project descriptions

Career Gap Analysis
Compares your resume claims against GitHub evidence:
- "Resume says React developer — only 1 React project found"
- "Claims backend experience — no API or server repos detected"
- "Strong projects but zero documentation"

###  Automated PR Review
AI-powered pull request reviews with:
- Semantic diff analysis (intent, not just lines changed)
- Risk scoring per PR
- Security surface mapping
- Codebase memory across reviews

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Monorepo | Turborepo |
| AI | Claude API (Anthropic) |
| Data | GitHub REST API v3 |
| Deployment | Vercel |

---

## Project Structure

```
PRism-AI/
├── apps/
│   └── web/              # Next.js frontend
│       ├── app/          # App Router pages
│       ├── components/   # UI components
│       └── lib/          # AI logic, GitHub API
├── packages/             # Shared utilities
├── turbo.json
└── package.json
```

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Surya270106/PRism-AI.git
cd PRism-AI

# Install dependencies
npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env.local
# Add your ANTHROPIC_API_KEY and GITHUB_TOKEN

# Run development server
npm run dev
```

---

## Roadmap

- [x] Landing page with PR review positioning
- [ ] GitHub username analyzer (public profile scan)
- [ ] Red flag detector with specific issue list
- [ ] Resume vs GitHub consistency checker
- [ ] Recruiter persona simulation (startup / FAANG / internship)
- [ ] Career quest system (gamified improvement missions)
- [ ] User accounts with progress tracking
- [ ] Portfolio quality scanner

---

## Why I Built This

Students don't lose jobs because they lack skills — they lose them because recruiters can't *see* those skills. After noticing how many strong developers had weak GitHub profiles with no feedback loop, I built PRism to act as an always-available AI recruiter that gives honest, specific, actionable feedback before the real interview.

---

## Live 

 [p-rism-ai-web.vercel.app](https://p-rism-ai-web.vercel.app)

---


## License

MIT
