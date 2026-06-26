"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface DimensionScores {
  readme_quality: number;
  code_structure: number;
  activity: number;
  documentation: number;
  security: number;
  originality: number;
}

interface Analysis {
  summary: string;
  health_score: number;
  dimension_scores?: DimensionScores;
  bugs: string[];
  security: string[];
  performance: string[];
  architecture: string[];
  positives: string[];
  recommendations: string[];
}

function ReviewContent() {
  const params = useSearchParams();
  const repo = params.get("repo");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [forceRefresh, setForceRefresh] = useState(false);

  const runReview = (force = false) => {
    if (!repo) return;
    setLoading(true);
    setAnalysis(null);
    setError("");
    fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo, force }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); setLoading(false); return; }
        setAnalysis(data.analysis);
        setLoading(false);
      })
      .catch(() => { setError("Review failed."); setLoading(false); });
  };

  useEffect(() => { runReview(); }, [repo]);

  // Higher = better (health score)
  const scoreColor =
    !analysis ? "" :
    analysis.health_score >= 75 ? "text-green-400" :
    analysis.health_score >= 50 ? "text-yellow-400" :
    analysis.health_score >= 25 ? "text-orange-400" : "text-red-400";

  const scoreBg =
    !analysis ? "" :
    analysis.health_score >= 75 ? "border-green-800 bg-green-950/40" :
    analysis.health_score >= 50 ? "border-yellow-800 bg-yellow-950/40" :
    analysis.health_score >= 25 ? "border-orange-800 bg-orange-950/40" : "border-red-800 bg-red-950/40";

  const scoreLabel =
    !analysis ? "" :
    analysis.health_score >= 75 ? "Excellent" :
    analysis.health_score >= 50 ? "Good" :
    analysis.health_score >= 25 ? "Fair" : "Poor";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="border-b border-zinc-800 bg-black px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PRism AI</h1>
          <p className="text-zinc-400 text-sm">AI Code Review</p>
        </div>
        <a href="/" className="bg-zinc-800 text-white px-4 py-2 rounded-xl text-sm hover:bg-zinc-700 transition">
          Back to Dashboard
        </a>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <p className="text-zinc-500 text-sm mb-1">Reviewing</p>
          <h2 className="text-3xl font-bold break-all">{repo}</h2>
          <p className="text-zinc-500 mt-1 text-sm">Powered by Kimi-K2 via HuggingFace</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-2 border-zinc-700" />
              <div className="absolute inset-0 rounded-full border-2 border-t-white animate-spin" />
            </div>
            <p className="text-zinc-300 font-medium">Analyzing repository with AI...</p>
            <div className="flex flex-col items-center gap-1 text-zinc-600 text-sm">
              <p>Fetching README and metadata</p>
              <p>Running Kimi-K2 analysis</p>
              <p>Generating structured review</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-950/50 border border-red-800 rounded-2xl p-6 text-red-400">
            <p className="font-semibold mb-1">Review Failed</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {analysis && !loading && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">AI Summary</p>
                <p className="text-zinc-100 leading-relaxed text-sm">{analysis.summary}</p>
              </div>
              <div className={`rounded-2xl border p-6 flex flex-col items-center justify-center ${scoreBg}`}>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Health Score</p>
                <p className={`text-7xl font-bold ${scoreColor}`}>{analysis.health_score}</p>
                <p className={`mt-2 text-sm font-semibold ${scoreColor}`}>{scoreLabel}</p>
                <div className="mt-4 w-full bg-zinc-800 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      analysis.health_score >= 75 ? "bg-green-500" :
                      analysis.health_score >= 50 ? "bg-yellow-500" :
                      analysis.health_score >= 25 ? "bg-orange-500" : "bg-red-500"
                    }`}
                    style={{ width: `${analysis.health_score}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Bugs Detected</p>
                <ul className="space-y-2">
                  {analysis.bugs.length === 0 ? (
                    <li className="text-green-400 text-sm">No bugs detected</li>
                  ) : analysis.bugs.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-200">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">●</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Security Issues</p>
                <ul className="space-y-2">
                  {analysis.security.length === 0 ? (
                    <li className="text-green-400 text-sm">No security issues</li>
                  ) : analysis.security.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-200">
                      <span className="text-orange-400 mt-0.5 flex-shrink-0">●</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Performance</p>
                <ul className="space-y-2">
                  {analysis.performance && analysis.performance.length > 0 ? (
                    analysis.performance.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-200">
                        <span className="text-yellow-400 mt-0.5 flex-shrink-0">⚡</span>{p}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-zinc-500">No major performance issues detected.</li>
                  )}
                </ul>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Architecture</p>
                <ul className="space-y-2">
                  {analysis.architecture && analysis.architecture.length > 0 ? (
                    analysis.architecture.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-200">
                        <span className="text-blue-400 mt-0.5 flex-shrink-0">🏗️</span>{a}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-zinc-500">Architecture looks standard.</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">What is Working Well</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {analysis.positives && analysis.positives.length > 0 ? (
                  analysis.positives.map((p, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-zinc-200">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">✅</span>{p}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-zinc-500">No major positives identified.</div>
                )}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">AI Recommendations</p>
              <ol className="space-y-3">
                {analysis.recommendations && analysis.recommendations.length > 0 ? (
                  analysis.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-200">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-400 font-medium">
                        {i + 1}
                      </span>
                      <div className="pt-0.5">{r}</div>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-zinc-500">No recommendations.</li>
                )}
              </ol>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => runReview(true)}
                className="bg-white text-black px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition"
              >
                Re-run Analysis
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

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}