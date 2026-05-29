"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GOLD = "#c9a84c";
const GOLD_LIGHT = "#e8c87a";
const DARK_BG = "#060606";
const SPRING_EASE = [0.23, 1, 0.32, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay, ease: SPRING_EASE }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } }
};

const childFadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: SPRING_EASE } }
};

interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  open_issues: number;
  updated_at: string;
  language: string;
  url: string;
}

interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  user: { login: string; avatar_url: string };
  created_at: string;
  html_url: string;
}

interface RepoAnalysis {
  summary: string;
  risk_score: number;
  bugs: string[];
  security: string[];
  performance: string[];
  architecture: string[];
  positives: string[];
  recommendations: string[];
}

interface PRReview {
  title: string;
  riskScore: string;
  summary: string;
  fixes: string;
  codeDiff: string;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? "#e74c3c" : score >= 50 ? "#f39c12" : score >= 25 ? GOLD : "#2ecc71";
  const label = score >= 75 ? "Critical Risk" : score >= 50 ? "High Risk" : score >= 25 ? "Medium Risk" : "Healthy";
  const circumference = 2 * Math.PI * 40;
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="relative w-24 h-24 mb-3">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx="48" cy="48" r="40" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - score / 100)}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.2s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">{score}</span>
        </div>
      </div>
      <span className="text-xs font-mono font-bold tracking-widest" style={{ color }}>{label}</span>
      <span className="text-[10px] font-mono text-white/30 mt-0.5 uppercase tracking-widest">Risk Score</span>
    </div>
  );
}

export default function PRReviewPage() {
  const { data: session } = useSession();

  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [activeTab, setActiveTab] = useState<"analysis" | "pulls">("analysis");

  // Repo analysis
  const [repoAnalysis, setRepoAnalysis] = useState<RepoAnalysis | null>(null);
  const [analyzingRepo, setAnalyzingRepo] = useState(false);

  // PRs
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [loadingPrs, setLoadingPrs] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);
  const [selectedPr, setSelectedPr] = useState<PullRequest | null>(null);
  const [prReview, setPrReview] = useState<PRReview | null>(null);
  const [analyzingPr, setAnalyzingPr] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  // Fetch repos
  useEffect(() => {
    if (!session) return;
    async function fetchRepos() {
      try {
        const res = await fetch("/api/repos");
        const data = await res.json();
        setRepos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching repos:", err);
      } finally {
        setLoadingRepos(false);
      }
    }
    fetchRepos();
  }, [session]);

  // Auto-analyze when repo selected
  useEffect(() => {
    if (!selectedRepo) return;
    setRepoAnalysis(null);
    setPrs([]);
    setSelectedPr(null);
    setPrReview(null);
    setActiveTab("analysis");
    analyzeRepo(selectedRepo.full_name);
    fetchPRs(selectedRepo.full_name);
  }, [selectedRepo]);

  async function analyzeRepo(fullName: string) {
    setAnalyzingRepo(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: fullName }),
      });
      const data = await res.json();
      if (data.analysis) setRepoAnalysis(data.analysis);
    } catch (err) {
      console.error("Repo analysis failed:", err);
    } finally {
      setAnalyzingRepo(false);
    }
  }

  async function fetchPRs(fullName: string) {
    setLoadingPrs(true);
    setPrError(null);
    try {
      const res = await fetch(`/api/prs?repo=${encodeURIComponent(fullName)}`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to fetch PRs");
      setPrs(Array.isArray(data.pulls) ? data.pulls : []);
    } catch (err: any) {
      setPrError(err.message);
    } finally {
      setLoadingPrs(false);
    }
  }

  async function analyzePR(pr: PullRequest) {
    setSelectedPr(pr);
    setAnalyzingPr(true);
    setPrReview(null);
    try {
      const res = await fetch("/api/pr-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prUrl: pr.html_url }),
      });
      const data = await res.json();
      if (data.status === "success") setPrReview(data.review);
    } catch (err) {
      console.error("PR review failed:", err);
    } finally {
      setAnalyzingPr(false);
    }
  }

  const filteredRepos = repos.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const prRiskColors: Record<string, { text: string; bg: string; border: string }> = {
    HIGH: { text: "#e74c3c", bg: "rgba(231,76,60,0.1)", border: "rgba(231,76,60,0.2)" },
    MED:  { text: GOLD,     bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.2)" },
    LOW:  { text: "#2ecc71", bg: "rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.2)" },
  };
  const activePrColor = prReview
    ? prRiskColors[prReview.riskScore] || prRiskColors.LOW
    : prRiskColors.LOW;

  return (
    <div className="relative min-h-screen text-white overflow-hidden font-sans" style={{ backgroundColor: DARK_BG }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        @keyframes aurora{0%{background-position:50% 50%,50% 50%}100%{background-position:350% 50%,350% 50%}}
        .aurora-layer{
          background-image:
            repeating-linear-gradient(100deg,#000 0%,#000 7%,transparent 10%,transparent 12%,#000 16%),
            repeating-linear-gradient(100deg,#d4a843 5%,#3b82f6 12%,#a5b4fc 18%,#e8c87a 24%,#60a5fa 30%,#d4a843 40%);
          background-size:300%,200%;
          filter:blur(12px);
          opacity:.32;
          animation:aurora 18s linear infinite;
          mask-image:radial-gradient(ellipse at 65% 0%,black 10%,transparent 70%);
          -webkit-mask-image:radial-gradient(ellipse at 65% 0%,black 10%,transparent 70%);
        }
        .custom-scrollbar::-webkit-scrollbar{width:4px}
        .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:10px}
        .custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(201,168,76,0.3)}
      `}</style>

      {/* AURORA — exact same as landing page */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div className="aurora-layer" style={{ position: "absolute", inset: "-10px" }} />
      </div>

      {/* Mouse orb */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.055) 0%, transparent 70%)",
          transform: `translate(${mousePos.x - 250}px, ${mousePos.y - 250}px)`,
          transition: "transform 1s cubic-bezier(0.23,1,0.32,1)",
        }} />
      </div>

      {/* LAYOUT */}
      <div className="relative z-10 grid grid-cols-12 min-h-screen">

        {/* COLUMN 1: Repos */}
        <div className="col-span-3 border-r border-white/[0.07] p-6 flex flex-col gap-5"
          style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(20px)" }}>

          <div className="flex items-center gap-3 pb-2">
            <a href="/" className="font-serif italic text-xl font-bold tracking-tight" style={{ color: GOLD }}>PRism</a>
            <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-white/30 border border-white/10 px-2 py-0.5 rounded">AI</span>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest font-mono text-white/30 mb-2">Search</label>
            <input
              type="text"
              placeholder="Filter repos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded px-3 py-2 text-xs focus:outline-none focus:border-amber-500/40 transition-all font-mono placeholder:text-white/20"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
            <span className="block text-[10px] uppercase tracking-widest font-mono text-white/30 mb-2">Your Repositories</span>
            {loadingRepos ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-white/[0.02] animate-pulse rounded border border-white/5" />
              ))
            ) : filteredRepos.length === 0 ? (
              <div className="text-xs font-mono text-white/20 text-center border border-dashed border-white/10 rounded py-8">No repositories found.</div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-1.5">
                {filteredRepos.map((repo) => (
                  <motion.button
                    variants={childFadeUp}
                    key={repo.id}
                    onClick={() => setSelectedRepo(repo)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-300 flex flex-col gap-1 group ${
                      selectedRepo?.id === repo.id
                        ? "bg-white/10 border-amber-500/40 shadow-[0_0_15px_rgba(212,168,67,0.1)]"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium truncate max-w-[160px] group-hover:text-amber-100 transition-colors">{repo.name}</span>
                      {repo.private && <span className="text-[8px] font-mono text-white/30 border border-white/10 px-1 rounded">PRV</span>}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-white/30">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50" />
                        {repo.language || "—"}
                      </span>
                      <span>{new Date(repo.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* COLUMN 2 + 3: Main Content */}
        <div className="col-span-9 flex flex-col overflow-hidden"
          style={{ background: "rgba(0,0,0,0.12)", backdropFilter: "blur(8px)" }}>

          {!selectedRepo ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-6 bg-white/[0.02]">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={GOLD} strokeWidth={1.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-mono text-white/30">Select a repository to begin analysis</p>
                <p className="text-xs font-mono text-white/15 mt-2">PRism will scan it through an HR's eye</p>
              </motion.div>
            </div>
          ) : (
            <>
              {/* Repo Header */}
              <div className="px-8 pt-7 pb-0 border-b border-white/[0.06]">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">{selectedRepo.full_name}</p>
                    <h1 className="font-serif italic text-3xl text-white">{selectedRepo.name}</h1>
                  </div>
                  <a href={"https://github.com/" + selectedRepo.full_name} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-mono text-white/30 hover:text-amber-400 transition-colors border border-white/10 px-3 py-1.5 rounded hover:border-amber-500/30 mt-1">
                    View on GitHub ↗
                  </a>
                </div>

                {/* Tabs */}
                <div className="flex gap-0">
                  {(["analysis", "pulls"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-2.5 text-[11px] font-mono uppercase tracking-widest transition-colors relative border-b-2 ${
                        activeTab === tab
                          ? "text-amber-400 border-amber-500/60"
                          : "text-white/30 border-transparent hover:text-white/60"
                      }`}
                    >
                      {tab === "analysis" ? "HR Analysis" : `Pull Requests ${prs.length > 0 ? `(${prs.length})` : ""}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <AnimatePresence mode="wait">

                  {/* ANALYSIS TAB */}
                  {activeTab === "analysis" && (
                    <motion.div key="analysis"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                      className="max-w-4xl"
                    >
                      {analyzingRepo && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                          <div className="relative w-14 h-14 mb-6">
                            <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
                            <div className="absolute inset-0 border-2 border-t-amber-500 border-r-amber-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                          </div>
                          <p className="text-sm font-mono text-amber-500/80 tracking-widest uppercase animate-pulse">Scanning Repository</p>
                          <p className="text-[11px] font-mono text-white/20 mt-2 tracking-wider">Reading README · Analyzing structure · Generating HR report</p>
                        </div>
                      )}

                      {repoAnalysis && !analyzingRepo && (
                        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">

                          {/* HR Eye Banner */}
                          <motion.div variants={childFadeUp} className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 flex items-center gap-3">
                            <span className="text-lg">👁️</span>
                            <div>
                              <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400/70 mb-0.5">HR Eagle Eye View</p>
                              <p className="text-xs text-white/60 font-mono">Here is what a hiring manager sees when they look at this repository</p>
                            </div>
                          </motion.div>

                          {/* Summary + Score */}
                          <motion.div variants={childFadeUp} className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                              <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">Overall Assessment</p>
                              <p className="text-sm text-white/75 leading-relaxed border-l-2 border-amber-500/40 pl-4">{repoAnalysis.summary}</p>
                            </div>
                            <ScoreRing score={repoAnalysis.risk_score} />
                          </motion.div>

                          {/* Bugs + Security */}
                          <motion.div variants={childFadeUp} className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                              <p className="text-[10px] font-mono uppercase tracking-widest text-red-400/70 mb-3">🐛 Bugs to Fix</p>
                              <ul className="space-y-2">
                                {repoAnalysis.bugs.length === 0 ? (
                                  <li className="text-xs text-green-400 font-mono">No bugs detected ✓</li>
                                ) : repoAnalysis.bugs.map((b, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-white/60 font-mono">
                                    <span className="text-red-400 mt-0.5 flex-shrink-0">●</span>{b}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                              <p className="text-[10px] font-mono uppercase tracking-widest text-orange-400/70 mb-3">🔒 Security Issues</p>
                              <ul className="space-y-2">
                                {repoAnalysis.security.length === 0 ? (
                                  <li className="text-xs text-green-400 font-mono">No issues ✓</li>
                                ) : repoAnalysis.security.map((s, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-white/60 font-mono">
                                    <span className="text-orange-400 mt-0.5 flex-shrink-0">●</span>{s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>

                          {/* Performance + Architecture */}
                          <motion.div variants={childFadeUp} className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                              <p className="text-[10px] font-mono uppercase tracking-widest text-yellow-400/70 mb-3">⚡ Performance</p>
                              <ul className="space-y-2">
                                {repoAnalysis.performance.map((p, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-white/60 font-mono">
                                    <span className="text-yellow-400 mt-0.5 flex-shrink-0">●</span>{p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                              <p className="text-[10px] font-mono uppercase tracking-widest text-blue-400/70 mb-3">🏗️ Architecture</p>
                              <ul className="space-y-2">
                                {repoAnalysis.architecture.map((a, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-white/60 font-mono">
                                    <span className="text-blue-400 mt-0.5 flex-shrink-0">●</span>{a}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </motion.div>

                          {/* Positives */}
                          <motion.div variants={childFadeUp} className="p-5 rounded-xl border border-green-500/20 bg-green-500/5">
                            <p className="text-[10px] font-mono uppercase tracking-widest text-green-400/70 mb-3">✅ What You Are Doing Well</p>
                            <div className="grid grid-cols-2 gap-2">
                              {repoAnalysis.positives.map((p, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-white/60 font-mono">
                                  <span className="text-green-400 flex-shrink-0">✓</span>{p}
                                </div>
                              ))}
                            </div>
                          </motion.div>

                          {/* Priority Action List */}
                          <motion.div variants={childFadeUp} className="p-5 rounded-xl border border-amber-500/25 bg-amber-500/5">
                            <p className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: "rgba(201,168,76,0.8)" }}>
                              📋 Fix These Before Your Next Job Application
                            </p>
                            <ol className="space-y-3">
                              {repoAnalysis.recommendations.map((r, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs text-white/65 font-mono">
                                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-[10px] font-bold" style={{ color: GOLD }}>
                                    {i + 1}
                                  </span>
                                  {r}
                                </li>
                              ))}
                            </ol>
                          </motion.div>

                          <motion.div variants={childFadeUp}>
                            <button
                              onClick={() => analyzeRepo(selectedRepo.full_name)}
                              className="text-[10px] font-mono text-white/20 hover:text-white/50 transition-colors uppercase tracking-widest"
                            >
                              ↺ Re-run analysis
                            </button>
                          </motion.div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* PULL REQUESTS TAB */}
                  {activeTab === "pulls" && (
                    <motion.div key="pulls"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                      className="max-w-4xl"
                    >
                      {loadingPrs && (
                        <div className="flex items-center gap-3 py-8 font-mono text-xs text-amber-500/60 uppercase tracking-widest">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                          Fetching pull requests...
                        </div>
                      )}

                      {prError && (
                        <div className="p-4 rounded-lg border border-red-500/20 bg-red-500/5 text-xs font-mono text-red-400">{prError}</div>
                      )}

                      {!loadingPrs && !prError && prs.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-xl">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-green-400/60 border border-green-500/20 px-2 py-1 rounded bg-green-500/5 mb-3">Status Clear</span>
                          <p className="text-sm font-mono text-white/30">No pull requests found</p>
                          <p className="text-xs font-mono text-white/15 mt-1 max-w-xs">Open a Pull Request on GitHub to begin diff analysis</p>
                        </div>
                      )}

                      {/* PR List */}
                      {!loadingPrs && !selectedPr && prs.length > 0 && (
                        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
                          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4">Click a PR to run AI diff review</p>
                          {prs.map((pr) => (
                            <motion.button
                              variants={childFadeUp}
                              key={pr.id}
                              onClick={() => analyzePR(pr)}
                              className="w-full text-left p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/20 transition-all group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <span className="font-serif text-lg text-white/85 group-hover:text-white transition-colors line-clamp-1">{pr.title}</span>
                                  <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-white/30">
                                    <img src={pr.user.avatar_url} alt={pr.user.login} className="w-4 h-4 rounded-full grayscale group-hover:grayscale-0 transition-all" />
                                    <span>{pr.user.login}</span>
                                    <span>#{pr.number}</span>
                                    <span>{new Date(pr.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded border uppercase tracking-wider flex-shrink-0 ${
                                  pr.state === "open"
                                    ? "text-green-400 border-green-500/20 bg-green-500/10"
                                    : "text-white/30 border-white/10 bg-white/5"
                                }`}>{pr.state}</span>
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}

                      {/* PR Analyzing */}
                      {analyzingPr && (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                          <div className="relative w-14 h-14 mb-6">
                            <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
                            <div className="absolute inset-0 border-2 border-t-amber-500 border-r-amber-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                          </div>
                          <p className="text-sm font-mono text-amber-500/80 tracking-widest uppercase animate-pulse">Analyzing PR Diff</p>
                          <p className="text-[11px] font-mono text-white/20 mt-2">Running Llama 3.3 vector analysis...</p>
                        </div>
                      )}

                      {/* PR Review Results */}
                      {prReview && selectedPr && !analyzingPr && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                          <button
                            onClick={() => { setSelectedPr(null); setPrReview(null); }}
                            className="text-[10px] font-mono text-white/30 hover:text-white/60 uppercase tracking-widest mb-2 transition-colors"
                          >
                            ← Back to all PRs
                          </button>

                          <div className="p-5 rounded-xl border relative overflow-hidden"
                            style={{ borderColor: activePrColor.border, background: "rgba(255,255,255,0.02)" }}>
                            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: activePrColor.text }} />
                            <div className="flex items-start gap-4 pl-2">
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="text-white font-medium text-sm">{prReview.title}</h3>
                                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded tracking-wider"
                                    style={{ color: activePrColor.text, background: activePrColor.bg, border: `1px solid ${activePrColor.border}` }}>
                                    {prReview.riskScore} RISK
                                  </span>
                                </div>
                                <p className="text-xs text-white/55 font-mono leading-relaxed mb-3">{prReview.summary}</p>
                                <button
                                  onClick={() => setIsModalOpen(true)}
                                  className="text-[11px] font-mono flex items-center gap-1 px-3 py-1.5 rounded border transition-colors"
                                  style={{ color: activePrColor.text, background: activePrColor.bg, borderColor: activePrColor.border }}
                                >
                                  View Suggested Fix →
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-white/[0.06] bg-black/30 overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/[0.05] bg-white/[0.02]">
                              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Code Diff</span>
                            </div>
                            <div className="p-4 overflow-auto max-h-[400px]">
                              <pre className="text-[11px] font-mono text-white/30 leading-relaxed">
                                <code>{prReview.codeDiff || "No diff available."}</code>
                              </pre>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PR Fix Modal */}
      <AnimatePresence>
        {isModalOpen && prReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: SPRING_EASE }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-white/70">Suggested Fix</span>
                  <span className="text-[9px] font-mono text-amber-400/60 border border-amber-500/20 px-1.5 py-0.5 rounded">AI</span>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <p className="text-sm text-white/65 font-mono whitespace-pre-wrap leading-relaxed">{prReview.fixes}</p>
              </div>
              <div className="p-4 border-t border-white/[0.06] bg-white/[0.02] flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-mono text-white/30 hover:text-white/60 transition-colors">Dismiss</button>
                <button className="px-4 py-2 text-xs font-mono font-bold text-black rounded transition-opacity hover:opacity-85"
                  style={{ background: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT})` }}>
                  Apply Fix
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        body { background: ${DARK_BG}; }
      `}</style>
    </div>
  );
}