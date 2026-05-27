"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  open_issues: number;
  language: string;
  updated_at: string;
}

export default function HomePage() {
  const { data: session } = useSession();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetch("/api/repos")
      .then((r) => r.json())
      .then((data) => setRepos(Array.isArray(data) ? data : []))
      .catch(() => setRepos([]))
      .finally(() => setLoading(false));
  }, [session]);

  const reviews = [
    { title: "Fix authentication middleware", ai: "AI detected possible token leak", risk: "Critical" },
    { title: "Optimize dashboard rendering", ai: "AI suggested memoization improvements", risk: "Medium" },
    { title: "Refactor websocket manager", ai: "AI found memory leak risk", risk: "High" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-zinc-800 bg-black px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PRism AI</h1>
          <p className="text-zinc-400 text-sm">AI GitHub Engineering Platform</p>
        </div>
        {session ? (
          <div className="flex items-center gap-4">
            <img src={session.user?.image ?? ""} alt="avatar" className="w-8 h-8 rounded-full" />
            <span className="text-sm text-zinc-300">{session.user?.name}</span>
            <button onClick={() => signOut()} className="bg-zinc-800 hover:bg-zinc-700 transition px-4 py-2 rounded-xl text-sm">
              Sign out
            </button>
          </div>
        ) : (
          <button onClick={() => signIn("github")} className="bg-white text-black px-4 py-2 rounded-xl font-medium hover:opacity-90 transition">
            Connect GitHub
          </button>
        )}
      </header>

      <div className="grid grid-cols-12">
        <aside className="col-span-2 border-r border-zinc-800 min-h-screen p-5">
          <nav className="space-y-1">
            <a href="/" className="block px-4 py-3 rounded-xl hover:bg-zinc-900 transition text-sm text-zinc-300 hover:text-white">Dashboard</a>
            <a href="/" className="block px-4 py-3 rounded-xl hover:bg-zinc-900 transition text-sm text-zinc-300 hover:text-white">Repositories</a>
            <a href="/pr-review" className="block px-4 py-3 rounded-xl hover:bg-zinc-900 transition text-sm text-zinc-300 hover:text-white">Pull Requests</a>
            <a href="/review" className="block px-4 py-3 rounded-xl hover:bg-zinc-900 transition text-sm text-zinc-300 hover:text-white">AI Reviews</a>
            <a href="#" className="block px-4 py-3 rounded-xl hover:bg-zinc-900 transition text-sm text-zinc-300 hover:text-white">Security</a>
            <a href="#" className="block px-4 py-3 rounded-xl hover:bg-zinc-900 transition text-sm text-zinc-300 hover:text-white">Deployments</a>
            <a href="/settings" className="block px-4 py-3 rounded-xl hover:bg-zinc-900 transition text-sm text-zinc-300 hover:text-white">Settings</a>
          </nav>
        </aside>

        <section className="col-span-10 p-8">
          {!session ? (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
              <h2 className="text-4xl font-bold">Connect your GitHub</h2>
              <p className="text-zinc-400 text-center max-w-xl">Sign in to start AI-powered code reviews on your repositories.</p>
              <button onClick={() => signIn("github")} className="bg-white text-black px-6 py-3 rounded-xl font-semibold text-lg hover:opacity-90 transition">
                Connect GitHub
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-4xl font-bold">AI Code Review Command Center</h2>
                <p className="text-zinc-400 mt-2">Monitor repositories, pull requests, vulnerabilities, and AI insights.</p>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-zinc-300">Your Repositories</h3>
                {loading ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-zinc-400">Loading repositories...</div>
                ) : repos.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-400">No repositories found.</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {repos.map((repo) => (
                      <div key={repo.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                        <h4 className="font-semibold text-base">{repo.name}</h4>
                        <p className="text-zinc-400 text-sm mt-1">{repo.language ?? "—"}</p>
                        <div className="mt-4 text-3xl font-bold">{repo.open_issues}</div>
                        <p className="text-zinc-500 text-sm">Open Issues</p>
                        <a href={`/review?repo=${repo.full_name}`} className="mt-4 block text-center bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-xl text-sm transition">
                          Run AI Review
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                <a href="/pr-review" className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 transition">
                  <h3 className="font-semibold mb-1">PR Diff Reviewer</h3>
                  <p className="text-zinc-400 text-sm">Paste any GitHub PR URL for inline AI comments</p>
                  <p className="text-white text-sm mt-3 font-medium">Open Reviewer</p>
                </a>
                <a href="/review" className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 transition">
                  <h3 className="font-semibold mb-1">Repo AI Review</h3>
                  <p className="text-zinc-400 text-sm">Full repository analysis with risk scoring</p>
                  <p className="text-white text-sm mt-3 font-medium">Run Review</p>
                </a>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <h3 className="font-semibold mb-1">Security Scanner</h3>
                  <p className="text-zinc-400 text-sm">Vulnerability and dependency audit</p>
                  <p className="text-zinc-600 text-sm mt-3">Coming soon</p>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-semibold">AI Review Feed</h2>
                  <span className="text-zinc-500 text-sm">Live Analysis</span>
                </div>
                <div className="space-y-3">
                  {reviews.map((review, i) => (
                    <div key={i} className="bg-black border border-zinc-800 rounded-xl p-4 flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{review.title}</h3>
                        <p className="text-zinc-400 text-sm mt-1">{review.ai}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full border ${
                        review.risk === "Critical" ? "text-red-400 border-red-800 bg-red-950" :
                        review.risk === "High" ? "text-orange-400 border-orange-800 bg-orange-950" :
                        "text-yellow-400 border-yellow-800 bg-yellow-950"
                      }`}>
                        {review.risk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold mb-5">Security Scanner</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Critical Vulnerabilities</span><span className="text-red-400 font-bold">3</span></div>
                    <div className="flex justify-between"><span>Warnings</span><span className="text-yellow-400 font-bold">14</span></div>
                    <div className="flex justify-between"><span>Passed Checks</span><span className="text-green-400 font-bold">248</span></div>
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-xl font-semibold mb-5">CI/CD Pipeline</h2>
                  <div className="space-y-3">
                    {["Build #1824 — Success", "Production Deploy — Running", "AI Test Suite — Passed"].map((item, i) => (
                      <div key={i} className="bg-black border border-zinc-800 rounded-xl p-3 text-sm">{item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}