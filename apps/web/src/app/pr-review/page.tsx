"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Design System Constants ---
const GOLD = "#d4a843"; 
const GOLD_LIGHT = "#e8c87a";
const DARK_BG = "#060606";
const SPRING_EASE = [0.23, 1, 0.32, 1]; // Emil's premium strong ease-out

// --- Animation Variants ---
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: SPRING_EASE, delay }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const childFadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, y: 0, 
    transition: { duration: 0.6, ease: SPRING_EASE } 
  }
};

// --- Types ---
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
  body: string;
}

interface AnalysisResult {
  riskScore: number;
  riskLevel: string;
  summary: string;
  changes: Array<{ type: string; text: string }>;
  recommendation: string;
}

export default function PRReviewPage() {
  const { data: session } = useSession();
  
  // State: Repositories
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // State: Pull Requests
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [loadingPrs, setLoadingPrs] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);
  const [selectedPr, setSelectedPr] = useState<PullRequest | null>(null);
  
  // State: AI Analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  // --- High-Performance Mouse Tracking Orb ---
  // Using useRef and vanilla DOM updates instead of React state for buttery smooth 60fps
  const orbRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let animationFrameId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animateOrb = () => {
      // Smooth linear interpolation (lerp) for the spring effect
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      
      if (orbRef.current) {
        orbRef.current.style.transform = `translate3d(${currentX - 200}px, ${currentY - 200}px, 0)`;
      }
      animationFrameId = requestAnimationFrame(animateOrb);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animateOrb();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // --- API Integrations ---

  // 1. Fetch Repositories on Mount
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

  // 2. Fetch PRs when a Repo is Selected
  useEffect(() => {
    if (!selectedRepo) {
      setPrs([]);
      return;
    }
    async function fetchPRs() {
      setLoadingPrs(true);
      setPrError(null);
      setSelectedPr(null);
      setAnalysisResult(null);
      
      try {
        // BUG FIX: Using selectedRepo.full_name to properly target the Github API (e.g. Owner/Repo)
        const res = await fetch(`/api/prs?repo=${encodeURIComponent(selectedRepo.full_name)}`);
        const data = await res.json();
        
        if (!res.ok || data.error) {
          throw new Error(data.error || "Failed to connect to GitHub API.");
        }
        
        // BUG FIX: Safely unwrap the 'pulls' array from the API response
        if (data.pulls && Array.isArray(data.pulls)) {
          setPrs(data.pulls);
        } else {
          setPrs([]);
        }
      } catch (err: any) {
        console.error("Error fetching PRs:", err);
        setPrError(err.message || "An unexpected error occurred while fetching PRs.");
        setPrs([]);
      } finally {
        setLoadingPrs(false);
      }
    }
    fetchPRs();
  }, [selectedRepo]);

  // 3. Mock AI Analysis Execution
  const handleAnalyze = async () => {
    if (!selectedPr || !selectedRepo) return;
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      // Simulate heavy AI computation
      await new Promise((resolve) => setTimeout(resolve, 2800));
      
      setAnalysisResult({
        riskScore: 34,
        riskLevel: "MEDIUM RISK",
        summary: "This pull request introduces critical configuration changes to the environment pipeline along with standard security dependency updates. No malicious vectors detected, but thorough integration testing is advised.",
        changes: [
          { type: "security", text: "Upgraded jsonwebtoken package to address vulnerability CVE-2026-102" },
          { type: "refactor", text: "Abstracted token validation logic into the new middleware layer" },
          { type: "config", text: "Modified docker-compose.yml to include redis cache endpoints" }
        ],
        recommendation: "Approved with cautionary review on edge routing cases."
      });
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative min-h-screen text-white overflow-hidden font-sans" style={{ backgroundColor: DARK_BG }}>
      
      {/* --- BACKGROUND EFFECTS --- */}
      
      {/* 1. The Premium Animated Aurora */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3]
          }} 
          transition={{ 
            duration: 45, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute -top-[20%] -right-[10%] w-[900px] h-[900px] blur-[130px] mix-blend-screen"
        >
          {/* Gold drifting band */}
          <div className="absolute inset-0 rounded-full transform scale-x-150 rotate-45" 
               style={{ background: `radial-gradient(ellipse at center, ${GOLD} 0%, transparent 70%)` }} />
          {/* Indigo drifting band */}
          <div className="absolute inset-0 rounded-full transform scale-y-150 -rotate-45" 
               style={{ background: `radial-gradient(ellipse at center, rgba(79, 70, 229, 0.6) 0%, transparent 70%)` }} />
        </motion.div>
      </div>

      {/* 2. The Mouse Tracking Interaction Orb */}
      <div
        ref={orbRef}
        className="fixed top-0 left-0 w-[400px] h-[400px] pointer-events-none z-0 opacity-[0.07] blur-[100px] rounded-full will-change-transform"
        style={{ backgroundColor: GOLD_LIGHT }}
      />

      {/* --- MAIN LAYOUT GRID --- */}
      <div className="relative z-10 grid grid-cols-12 min-h-screen">
        
        {/* COLUMN 1: Repositories Sidebar */}
        <div className="col-span-3 border-r border-white/10 p-6 bg-black/40 backdrop-blur-xl flex flex-col gap-6 shadow-2xl">
          
          {/* Branding */}
          <div className="flex items-center gap-3">
            <span className="font-serif italic text-2xl font-bold tracking-tight" style={{ color: GOLD }}>PRism</span>
            <span className="text-xs uppercase tracking-[0.2em] font-mono text-white/40 border border-white/10 px-2 py-0.5 rounded">AI</span>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-mono text-white/40 mb-2">Search Repositories</label>
            <div className="relative group">
              <input
                type="text"
                placeholder="Filter codebases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50 transition-all duration-300 font-mono placeholder:text-white/20"
              />
              <div className="absolute inset-0 border border-amber-500/0 group-focus-within:border-amber-500/20 rounded-md pointer-events-none transition-colors duration-500" />
            </div>
          </div>

          {/* Repo List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            <span className="block text-xs uppercase tracking-widest font-mono text-white/40 mb-3 sticky top-0 bg-black/40 backdrop-blur-md py-1 z-10">Your Repositories</span>
            
            {loadingRepos ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-full h-16 bg-white/[0.03] animate-pulse rounded border border-white/5" />
                ))}
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="text-sm font-mono text-white/30 py-4 text-center border border-dashed border-white/10 rounded py-8">No repositories discovered.</div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2">
                {filteredRepos.map((repo) => (
                  <motion.button
                    variants={childFadeUp}
                    key={repo.id}
                    onClick={() => setSelectedRepo(repo)}
                    className={`w-full text-left p-3.5 rounded-lg transition-all duration-300 border flex flex-col gap-1.5 group relative ${
                      selectedRepo?.id === repo.id
                        ? "bg-white/10 border-amber-500/40 shadow-[0_0_15px_rgba(212,168,67,0.1)]"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.06] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-sm truncate max-w-[170px] group-hover:text-amber-100 transition-colors">{repo.name}</span>
                      {repo.private && <span className="text-[9px] font-mono opacity-50 px-1.5 py-0.5 border border-white/10 rounded bg-black/50">PRV</span>}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                        {repo.language || "Markdown"}
                      </span>
                      <span>{new Date(repo.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* COLUMN 2: Pull Requests View List */}
        <div className="col-span-4 border-r border-white/10 p-8 flex flex-col gap-6 bg-black/20 backdrop-blur-sm z-10">
          
          <div className="border-b border-white/10 pb-6">
            <span className="block text-xs uppercase tracking-widest font-mono text-white/40 mb-2">Context Target</span>
            <h2 className="font-serif italic text-3xl font-semibold tracking-wide text-white drop-shadow-md">
              {selectedRepo ? selectedRepo.name : "Select Repository"}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {!selectedRepo ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center p-6 text-white/30 font-mono text-sm">
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-4 bg-white/[0.02]">
                  <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 002-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Connect a repository from the left panel to scan branch pipelines.
              </motion.div>
            ) : loadingPrs ? (
              <div className="space-y-4 pt-4">
                <div className="text-xs font-mono text-amber-500/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                  Fetching pull streams...
                </div>
                {[1, 2].map(i => (
                  <div key={i} className="w-full h-24 bg-white/[0.02] animate-pulse rounded-lg border border-white/5" />
                ))}
              </div>
            ) : prError ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-5 rounded-lg border border-red-500/20 bg-red-500/5 text-center mt-4">
                <span className="text-red-400 text-xs font-mono uppercase tracking-widest block mb-2 font-bold">API Connection Error</span>
                <span className="text-sm text-red-200/80 font-mono leading-relaxed">{prError}</span>
              </motion.div>
            ) : prs.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40 font-mono text-sm">
                <span className="text-emerald-400/60 text-[10px] font-mono uppercase tracking-widest mb-3 border border-emerald-500/20 px-2 py-1 rounded bg-emerald-500/5">Status Clear</span>
                <p className="mb-2">No active pull requests found.</p>
                <p className="text-[11px] text-white/20 max-w-[200px] leading-relaxed">Open a new Pull Request on GitHub to begin analysis.</p>
              </motion.div>
            ) : (
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3 pt-2">
                <span className="block text-xs uppercase tracking-widest font-mono text-white/40 mb-4 sticky top-0 bg-transparent py-1 backdrop-blur-sm z-10">Discovered Pull Requests</span>
                {prs.map((pr) => (
                  <motion.button
                    variants={childFadeUp}
                    key={pr.id}
                    onClick={() => setSelectedPr(pr)}
                    className={`w-full text-left p-5 rounded-lg border transition-all duration-300 flex flex-col gap-3 group ${
                      selectedPr?.id === pr.id
                        ? "bg-gradient-to-br from-white/10 to-white/5 border-amber-500/40 shadow-lg"
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-serif text-lg leading-tight font-medium group-hover:text-amber-100 transition-colors line-clamp-2">{pr.title}</span>
                      <span className="text-xs font-mono text-white/30 whitespace-nowrap mt-1 bg-white/5 px-1.5 py-0.5 rounded">#{pr.number}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-white/50 pt-3 border-t border-white/5">
                      <span className="flex items-center gap-2">
                        <img src={pr.user.avatar_url} alt={pr.user.login} className="w-5 h-5 rounded-full border border-white/20 grayscale group-hover:grayscale-0 transition-all" />
                        {pr.user.login}
                      </span>
                      <span className={`px-2 py-1 rounded-[4px] text-[10px] uppercase tracking-wider font-bold ${
                        pr.state === 'open' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                          : 'bg-white/5 text-white/40 border border-white/10'
                      }`}>
                        {pr.state}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* COLUMN 3: Detailed Analysis Display Panel */}
        <div className="col-span-5 p-10 overflow-y-auto custom-scrollbar flex flex-col justify-between relative bg-black/10 backdrop-blur-sm z-10">
          <AnimatePresence mode="wait">
            
            {/* NO PR SELECTED STATE */}
            {!selectedPr && (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center text-white/30 font-mono text-sm max-w-sm mx-auto"
              >
                <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center mb-6 bg-gradient-to-b from-white/[0.05] to-transparent">
                  <svg className="w-6 h-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: GOLD }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-white/50 leading-relaxed">Select an engineering stream patch request file to deploy automated AI logic parsing.</p>
              </motion.div>
            )}

            {/* PR SELECTED & READY FOR ANALYSIS */}
            {selectedPr && (
              <motion.div
                key={selectedPr.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="space-y-8 flex-1"
              >
                {/* Header: PR Meta Information */}
                <div className="border-b border-white/10 pb-8">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-white/40 mb-4 uppercase tracking-wider">
                    <span className="text-white/60">{selectedRepo?.full_name}</span>
                    <span className="text-white/20">/</span>
                    <span style={{ color: GOLD }}>PR #{selectedPr.number}</span>
                  </div>
                  <h1 className="font-serif italic text-4xl font-bold tracking-tight text-white mb-6 leading-tight drop-shadow-lg">
                    {selectedPr.title}
                  </h1>
                  <a
                    href={selectedPr.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-mono border border-white/20 bg-white/5 px-4 py-2 rounded-md hover:bg-white/10 hover:border-amber-500/50 transition-all duration-300"
                    style={{ color: GOLD }}
                  >
                    View Source on GitHub ↗
                  </a>
                </div>

                {/* Pre-Analysis Trigger */}
                {!analysisResult && !analyzing && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 rounded-xl p-10 text-center space-y-6 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                    <p className="font-serif italic text-xl text-white/80">Ready to execute high-fidelity token vector analysis.</p>
                    <button
                      onClick={handleAnalyze}
                      className="px-8 py-3.5 rounded-md text-sm font-mono font-bold tracking-[0.2em] transition-all duration-300 transform hover:scale-[1.02] active:scale-95 bg-gradient-to-r text-black shadow-[0_0_20px_rgba(212,168,67,0.3)] hover:shadow-[0_0_30px_rgba(212,168,67,0.5)]"
                      style={{ backgroundImage: `linear-gradient(to right, ${GOLD}, ${GOLD_LIGHT})` }}
                    >
                      INITIATE SCAN
                    </button>
                  </motion.div>
                )}

                {/* Loading State Spinner */}
                {analyzing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center space-y-6 flex flex-col items-center">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
                      <div className="absolute inset-0 border-2 border-t-transparent border-r-transparent rounded-full animate-spin" style={{ borderColor: `${GOLD} transparent transparent ${GOLD}` }} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-mono text-amber-500 tracking-[0.2em] uppercase animate-pulse">Analyzing Vectors</p>
                      <p className="text-[10px] font-mono text-white/30 tracking-widest uppercase">Parsing AST changes & validating safety constraints...</p>
                    </div>
                  </motion.div>
                )}

                {/* Completed Analysis Dashboard */}
                {analysisResult && !analyzing && (
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                  >
                    {/* Metrics Grid */}
                    <motion.div variants={childFadeUp} className="grid grid-cols-2 gap-5">
                      <div className="p-5 rounded-lg border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent shadow-inner">
                        <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">Risk Score Evaluated</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-serif font-bold drop-shadow-md" style={{ color: GOLD }}>{analysisResult.riskScore}<span className="text-2xl">%</span></span>
                        </div>
                      </div>
                      <div className="p-5 rounded-lg border border-amber-500/20 bg-amber-500/5 flex flex-col justify-center shadow-[inset_0_0_20px_rgba(212,168,67,0.02)]">
                        <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2">Security Category</span>
                        <span className="text-sm font-mono font-bold tracking-widest text-amber-400 bg-amber-400/10 w-max px-3 py-1 rounded-sm border border-amber-400/20">{analysisResult.riskLevel}</span>
                      </div>
                    </motion.div>

                    {/* Summary Paragraph */}
                    <motion.div variants={childFadeUp} className="space-y-3">
                      <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/50 border-b border-white/5 pb-2">Executive Verdict</h3>
                      <p className="text-sm text-white/80 leading-relaxed font-sans border-l-2 pl-5 py-1 border-amber-500/40 bg-gradient-to-r from-amber-500/5 to-transparent">
                        {analysisResult.summary}
                      </p>
                    </motion.div>

                    {/* Detected Mutations List */}
                    <motion.div variants={childFadeUp} className="space-y-4">
                      <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/50 border-b border-white/5 pb-2">Detected Vector Mutations</h3>
                      <div className="space-y-2.5">
                        {analysisResult.changes.map((change: any, i: number) => (
                          <div key={i} className="p-4 rounded-md bg-white/[0.02] border border-white/5 flex items-start gap-4 hover:bg-white/[0.04] transition-colors">
                            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded bg-black/50 text-white/60 border border-white/10 mt-0.5 min-w-[80px] text-center shadow-inner">
                              {change.type}
                            </span>
                            <span className="text-sm text-white/70 font-mono leading-relaxed">{change.text}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Final Recommendation */}
                    <motion.div variants={childFadeUp} className="p-5 rounded-lg border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent space-y-2 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50" />
                      <span className="block text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400/80">PRism Official Recommendation</span>
                      <p className="text-lg font-serif italic text-emerald-100/90 tracking-wide">{analysisResult.recommendation}</p>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Branding */}
          <div className="pt-8 mt-8 border-t border-white/10 flex justify-between items-center text-[10px] font-mono text-white/30 tracking-[0.2em] uppercase">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
              Secure Shield Pipeline
            </span>
            <span>v1.0.4-PROD</span>
          </div>
        </div>

      </div>

      {/* --- GLOBAL CSS OVERRIDES --- */}
      <style jsx global>{`
        /* Premium custom scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(212, 168, 67, 0.4);
          border: 1px solid transparent;
          background-clip: padding-box;
        }
      `}</style>
    </div>
  );
}