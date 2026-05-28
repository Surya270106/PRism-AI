"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { GitPullRequest, AlertTriangle, ChevronRight, FileCode2, X, ArrowRight } from "lucide-react";
import { DM_Sans, DM_Mono, DM_Serif_Display } from "next/font/google";

const dmSans = DM_Sans({ weight: ["400", "500"], subsets: ["latin"] });
const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"] });
const dmSerif = DM_Serif_Display({ weight: "400", subsets: ["latin"], style: ["normal", "italic"] });

// Fallback Data if GitHub API is rate-limited or has 0 open PRs
const fallbackQueue = [
  { id: "PR-2847", title: "auth/oauth-refactor", risk: "HIGH", files: 34, author: "surya270106", time: "2m ago" },
  { id: "PR-2841", title: "feat/dashboard-v2", risk: "MED", files: 18, author: "alex-dev", time: "1h ago" },
  { id: "PR-2839", title: "fix/api-rate-limit", risk: "LOW", files: 4, author: "sarah-j", time: "3h ago" },
];

const riskColors = {
  HIGH: { text: "#e74c3c", bg: "rgba(231,76,60,0.1)", border: "rgba(231,76,60,0.2)" },
  MED: { text: "#c9a84c", bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.2)" },
  LOW: { text: "#2ecc71", bg: "rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.2)" },
};

export default function PRReviewDashboard() {
  const { data: session } = useSession();
  
  // State
  const [prQueue, setPrQueue] = useState(fallbackQueue);
  const [activePR, setActivePR] = useState(fallbackQueue[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 3. FETCH REAL GITHUB DATA
  useEffect(() => {
    async function fetchGitHubPRs() {
      try {
        // Fetching live PRs from your actual repo!
        const res = await fetch("https://api.github.com/repos/Surya270106/PRism-AI/pulls");
        if (!res.ok) throw new Error("Rate limited or not found");
        
        const data = await res.json();
        
        if (data && data.length > 0) {
          const formattedPRs = data.map((pr: any, index: number) => ({
            id: `PR-${pr.number}`,
            title: pr.title,
            // Assigning mock risks just for the UI demo based on index
            risk: index % 3 === 0 ? "HIGH" : index % 2 === 0 ? "MED" : "LOW",
            files: Math.floor(Math.random() * 20) + 1, // Mock files count
            author: pr.user.login,
            time: new Date(pr.created_at).toLocaleDateString(),
          }));
          setPrQueue(formattedPRs);
          setActivePR(formattedPRs[0]);
        }
      } catch (error) {
        console.log("Using fallback data. GitHub API rate limit likely reached.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchGitHubPRs();
  }, []);

  return (
    <main className={`flex h-screen bg-[#060606] text-white overflow-hidden ${dmSans.className}`}>
      
      {/* 1. STATEFUL LEFT SIDEBAR */}
      <aside className="w-[340px] flex-shrink-0 border-r border-white/[0.05] bg-[#080808] flex flex-col relative z-20">
        <div className="p-5 border-b border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 border border-[#c9a84c] rounded flex items-center justify-center text-[#c9a84c] ${dmSerif.className} italic`}>P</div>
            <span className="font-medium text-sm tracking-wide">Review Queue</span>
          </div>
          <span className={`text-[10px] uppercase tracking-widest text-[#c9a84c] border border-[#c9a84c]/30 px-2 py-0.5 rounded ${dmMono.className}`}>Live</span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="p-4 text-sm text-zinc-500 text-center animate-pulse">Syncing with GitHub...</div>
          ) : (
            prQueue.map((pr) => {
              const isActive = activePR.id === pr.id;
              const rc = riskColors[pr.risk as keyof typeof riskColors];
              
              return (
                <button
                  key={pr.id}
                  onClick={() => setActivePR(pr)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
                    isActive 
                      ? "bg-white/[0.04] border-white/[0.1]" 
                      : "bg-transparent border-transparent hover:bg-white/[0.02]"
                  }`}
                >
                  {isActive && (
                    <motion.div layoutId="active-indicator" className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#c9a84c]" />
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-xs text-zinc-500 ${dmMono.className}`}>{pr.id}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded tracking-wider" style={{ color: rc.text, backgroundColor: rc.bg, border: `1px solid ${rc.border}` }}>
                      {pr.risk}
                    </span>
                  </div>
                  <div className="font-medium text-sm text-zinc-200 truncate mb-3 group-hover:text-white transition-colors">
                    {pr.title}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1"><FileCode2 className="w-3 h-3" /> {pr.files} files</span>
                    <span>{pr.time}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <section className="flex-1 flex flex-col relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#c9a84c]/5 blur-[100px] pointer-events-none rounded-full" />

        <header className="h-[70px] border-b border-white/[0.05] flex items-center px-8 z-10 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-500">Surya270106</span>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            <span className="text-zinc-300 font-medium">PRism-AI</span>
            <ChevronRight className="w-3 h-3 text-zinc-600" />
            {/* Dynamic ID based on state */}
            <span className={`text-[#c9a84c] ${dmMono.className}`}>{activePR.id}</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.05] text-xs">
              <img src={session?.user?.image || "https://github.com/ghost.png"} alt="User" className="w-5 h-5 rounded-full" />
              <span className="text-zinc-300">{session?.user?.name || "Reviewer"}</span>
            </div>
            <button className="bg-[#c9a84c] text-black px-5 py-2 rounded-md text-xs font-medium hover:bg-[#e8c87a] transition-colors shadow-[0_0_15px_rgba(201,168,76,0.2)]">
              Approve PR
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 z-10">
          <div className="max-w-5xl mx-auto space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePR.id} // Re-animates when PR changes!
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h1 className={`text-3xl text-white ${dmSerif.className}`}>{activePR.title}</h1>
                  <span className="flex items-center gap-2 text-sm text-zinc-400 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/[0.05]">
                    <GitPullRequest className="w-4 h-4" /> opened by <strong className="text-white">{activePR.author}</strong>
                  </span>
                </div>

                {activePR.risk === "HIGH" && (
                  <div className="bg-[#111] border border-[#c9a84c]/20 rounded-xl p-6 mb-8 relative overflow-hidden shadow-2xl">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#c9a84c]" />
                    <div className="flex items-start gap-4">
                      <div className="mt-1 w-8 h-8 flex-shrink-0 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center border border-[#c9a84c]/20">
                        <AlertTriangle className="w-4 h-4 text-[#c9a84c]" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1">Potential Logic Flaw Detected</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                          PRism AI flagged this PR for elevated risk. A core validation check appears to have been removed or modified unsafely in the main logic file.
                        </p>
                        <button 
                          onClick={() => setIsModalOpen(true)}
                          className="text-xs text-[#c9a84c] font-medium hover:text-[#e8c87a] transition-colors flex items-center gap-1 bg-[#c9a84c]/10 px-3 py-1.5 rounded-md border border-[#c9a84c]/20"
                        >
                          View Suggested Fix <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-white/[0.05] bg-[#0A0A0A] overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] border-b border-white/[0.05]">
                    <span className={`text-xs text-zinc-400 ${dmMono.className}`}>src/main.ts</span>
                  </div>
                  <div className={`p-4 overflow-x-auto text-sm ${dmMono.className}`}>
                    <pre className="text-zinc-500 leading-loose">
                      <code>
                        <span className="mr-4 select-none opacity-50">40</span><span className="text-zinc-300">function validatePayload(data: any) {'{'}</span>{"\n"}
                        <span className="mr-4 select-none opacity-50">41</span><span className="text-zinc-300">  const token = extractToken(data);</span>{"\n"}
                        <div className="bg-red-500/10 border-l-2 border-red-500 -mx-4 px-4 py-1 text-red-200">
                          <span className="mr-4 select-none text-red-500/50">42</span>- if (!token) throw new Error('Unauthorized');
                        </div>
                        <div className="bg-emerald-500/10 border-l-2 border-emerald-500 -mx-4 px-4 py-1 text-emerald-200">
                          <span className="mr-4 select-none text-emerald-500/50">43</span>+ // Validation bypassed for faster testing
                        </div>
                        <span className="mr-4 select-none opacity-50">44</span><span className="text-zinc-300">  return processNext(data);</span>{"\n"}
                        <span className="mr-4 select-none opacity-50">45</span><span className="text-zinc-300">{'}'}</span>
                      </code>
                    </pre>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 2. FRAMER MOTION SUGGESTED FIX MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="relative w-full max-w-4xl bg-[#0A0A0A] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/[0.05] bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#c9a84c]/20 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-[#c9a84c]" />
                  </div>
                  <h3 className="text-sm font-medium text-white">AI Remediation Suggestion</h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <p className="text-sm text-zinc-300 mb-4">
                  The current implementation removes the token validation, which creates a critical security vulnerability. PRism AI suggests restoring the check but wrapping it in an environment flag if it needs to be disabled for local testing.
                </p>
                
                {/* Unified Diff UI inside Modal */}
                <div className={`rounded-xl border border-white/[0.05] bg-[#060606] overflow-hidden ${dmMono.className}`}>
                  <div className="flex items-center px-4 py-2 bg-white/[0.02] border-b border-white/[0.05]">
                    <span className="text-xs text-zinc-400">Suggested Fix: src/main.ts</span>
                  </div>
                  <div className="p-4 overflow-x-auto text-sm">
                    <pre className="text-zinc-500 leading-loose">
                      <code>
                        <div className="bg-red-500/10 border-l-2 border-red-500 -mx-4 px-4 py-1 text-red-200 opacity-60 line-through">
                          <span className="mr-4 select-none text-red-500/50">43</span>+ // Validation bypassed for faster testing
                        </div>
                        <div className="bg-emerald-500/10 border-l-2 border-emerald-500 -mx-4 px-4 py-1 text-emerald-300 font-medium">
                          <span className="mr-4 select-none text-emerald-500/50">43</span>+ if (!token && process.env.NODE_ENV !== 'development') {'{'}
                        </div>
                        <div className="bg-emerald-500/10 border-l-2 border-emerald-500 -mx-4 px-4 py-1 text-emerald-300 font-medium">
                          <span className="mr-4 select-none text-emerald-500/50">44</span>+   throw new Error('Unauthorized');
                        </div>
                        <div className="bg-emerald-500/10 border-l-2 border-emerald-500 -mx-4 px-4 py-1 text-emerald-300 font-medium">
                          <span className="mr-4 select-none text-emerald-500/50">45</span>+ {'}'}
                        </div>
                      </code>
                    </pre>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-white/[0.05] bg-white/[0.02] flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                  Dismiss
                </button>
                <button className="bg-[#c9a84c] text-black px-4 py-2 rounded-md text-xs font-medium hover:bg-[#e8c87a] transition-colors shadow-lg shadow-[#c9a84c]/20">
                  Commit Suggestion
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}