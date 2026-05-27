"use client";
import { useState, Suspense } from "react";

interface PRComment {
  file: string;
  line: number;
  severity: "critical" | "warning" | "suggestion" | "positive";
  comment: string;
}

interface PRAnalysis {
  title: string;
  summary: string;
  risk_score: number;
  files_changed: number;
  additions: number;
  deletions: number;
  comments: PRComment[];
  overall_feedback: string;
  approval: "approve" | "request_changes" | "needs_review";
}

function PRReviewContent() {
  const [prUrl, setPrUrl] = useState("");
  const [analysis, setAnalysis] = useState<PRAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runPRReview = async () => {
    if (!prUrl.trim()) return;
    setLoading(true);
    setAnalysis(null);
    setError("");

    try {
      const res = await fetch("/api/pr-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pr_url: prUrl }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setAnalysis(data.analysis);
    } catch {
      setError("PR review failed.");
    }
    setLoading(false);
  };

  const severityColor = (s: string) => {
    if (s === "critical") return "text-red-400 border-red-800 bg-red-950/30";
    if (s === "warning") return "text-orange-400 border-orange-800 bg-orange-950/30";
    if (s === "suggestion") return "text-blue-400 border-blue-800 bg-blue-950/30";
    return "text-green-400 border-green-800 bg-green-950/30";
  };

  const severityDot = (s: string) => {
    if (s === "critical") return "bg-red-500";
    if (s === "warning") return "bg-orange-500";
    if (s === "suggestion") return "bg-blue-500";
    return "bg-green-500";
  };

  const approvalStyle = !analysis ? "" :
    analysis.approval === "approve" ? "text-green-400 border-green-800 bg-green-950/30" :
    analysis.approval === "request_changes" ? "text-red-400 border-red-800 bg-red-950/30" :
    "text-yellow-400 border-yellow-800 bg-yellow-950/30";

  const approvalLabel = !analysis ? "" :
    analysis.approval === "approve" ? "Approved" :
    analysis.approval === "request_changes" ? "Changes Requested" :
    "Needs Review";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-zinc-800 bg-black px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PRism AI</h1>
          <p className="text-zinc-400 text-sm">PR Diff Reviewer</p>
        </div>
        <a href="/" className="bg-zinc-800 text-white px-4 py-2 rounded-xl text-sm hover:bg-zinc-700 transition">
          Back to Dashboard
        </a>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">PR Diff Reviewer</h2>
          <p className="text-zinc-500 mt-1 text-sm">Paste a GitHub PR URL to get AI inline comments</p>
        </div>

        {/* Input */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">GitHub PR URL</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runPRReview()}
              placeholder="https://github.com/owner/repo/pull/123"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-500 transition"
            />
            <button
              onClick={runPRReview}
              disabled={loading || !prUrl.trim()}
              className="bg-white text-black px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-40"
            >
              {loading ? "Analyzing..." : "Review PR"}
            </button>
          </div>
          <p className="text-zinc-600 text-xs mt-2">Example: https://github.com/vercel/next.js/pull/12345</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-zinc-700" />
              <div className="absolute inset-0 rounded-full border-2 border-t-white animate-spin" />
            </div>
            <p className="text-zinc-300 font-medium">Analyzing PR diff with AI...</p>
            <div className="flex flex-col items-center gap-1 text-zinc-600 text-sm">
              <p>Fetching PR metadata and diff</p>
              <p>Running line-by-line analysis</p>
              <p>Generating inline comments</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-950/50 border border-red-800 rounded-2xl p-6 text-red-400">
            <p className="font-semibold mb-1">Review Failed</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {analysis && !loading && (
          <div className="space-y-5">

            {/* Header row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Pull Request</p>
                <h3 className="text-lg font-semibold mb-3">{analysis.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{analysis.summary}</p>
                <div className="flex gap-4 mt-4 text-xs text-zinc-500">
                  <span className="text-zinc-300">{analysis.files_changed} files changed</span>
                  <span className="text-green-400">+{analysis.additions} additions</span>
                  <span className="text-red-400">-{analysis.deletions} deletions</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className={`rounded-2xl border p-5 flex flex-col items-center justify-center ${
                  analysis.risk_score >= 75 ? "border-red-800 bg-red-950/40" :
                  analysis.risk_score >= 50 ? "border-orange-800 bg-orange-950/40" :
                  analysis.risk_score >= 25 ? "border-yellow-800 bg-yellow-950/40" :
                  "border-green-800 bg-green-950/40"
                }`}>
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Risk Score</p>
                  <p className={`text-5xl font-bold ${
                    analysis.risk_score >= 75 ? "text-red-400" :
                    analysis.risk_score >= 50 ? "text-orange-400" :
                    analysis.risk_score >= 25 ? "text-yellow-400" : "text-green-400"
                  }`}>{analysis.risk_score}</p>
                </div>
                <div className={`rounded-2xl border p-4 flex flex-col items-center justify-center ${approvalStyle}`}>
                  <p className="text-xs uppercase tracking-widest mb-1 opacity-60">AI Decision</p>
                  <p className="font-bold text-lg">{approvalLabel}</p>
                </div>
              </div>
            </div>

            {/* Inline comments */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-5">
                Inline Comments ({analysis.comments.length})
              </p>
              <div className="space-y-3">
                {analysis.comments.map((c, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${severityColor(c.severity)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${severityDot(c.severity)}`} />
                      <span className="text-xs font-mono opacity-70">{c.file}</span>
                      {c.line > 0 && (
                        <span className="text-xs opacity-50">line {c.line}</span>
                      )}
                      <span className="ml-auto text-xs uppercase opacity-60">{c.severity}</span>
                    </div>
                    <p className="text-sm text-zinc-200">{c.comment}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall feedback */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Overall Feedback</p>
              <p className="text-zinc-200 text-sm leading-relaxed">{analysis.overall_feedback}</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setAnalysis(null); setPrUrl(""); }}
                className="bg-white text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
              >
                Review Another PR
              </button>
              <a href="/" className="bg-zinc-800 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-zinc-700 transition">
                Back to Dashboard
              </a>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}

export default function PRReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <PRReviewContent />
    </Suspense>
  );
}