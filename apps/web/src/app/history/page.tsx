"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DM_Sans, DM_Mono, DM_Serif_Display } from "next/font/google";
import { AlertTriangle, Clock, GitPullRequest, ChevronRight, Sparkles, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

const dmSans = DM_Sans({ weight: ["400", "500"], subsets: ["latin"] });
const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"] });
const dmSerif = DM_Serif_Display({ weight: "400", subsets: ["latin"], style: ["normal", "italic"] });

const riskColors = {
  HIGH: { text: "#e74c3c", bg: "rgba(231,76,60,0.1)", border: "rgba(231,76,60,0.2)" },
  MED: { text: "#c9a84c", bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.2)" },
  LOW: { text: "#2ecc71", bg: "rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.2)" },
};

type Review = {
  id: string;
  prId: string;
  repo: string;
  title: string;
  riskScore: string;
  summary: string;
  fixes: string;
  codeDiff: string;
  createdAt: string;
};

export default function HistoryPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch("/api/reviews");
        const data = await res.json();
        if (data.status === "success") {
          setReviews(data.reviews);
        }
      } catch (error) {
        console.error("Failed to fetch reviews:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReviews();
  }, []);

  return (
    <main className={`min-h-screen bg-[#060606] text-white ${dmSans.className}`}>
      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#c9a84c]/5 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto px-8 py-10 relative z-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-1 text-sm text-zinc-500">
              <Link href="/pr-review" className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Dashboard
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-zinc-300">Review History</span>
            </div>
            <h1 className={`text-4xl text-white ${dmSerif.className}`}>Past Reviews</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-xs text-zinc-400">
            <Clock className="w-3 h-3" />
            {reviews.length} total reviews
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 border border-white/[0.05] border-dashed rounded-2xl">
            <Sparkles className="w-10 h-10 text-[#c9a84c] mb-4 opacity-30" />
            <h3 className="text-lg font-medium text-white mb-2">No reviews yet</h3>
            <p className="text-sm text-zinc-500 mb-6">Run your first AI review from the dashboard</p>
            <Link
              href="/pr-review"
              className="flex items-center gap-2 bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/30 hover:bg-[#c9a84c]/20 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* Reviews list */}
        {!isLoading && reviews.length > 0 && (
          <div className="space-y-3">
            {reviews.map((review, i) => {
              const rc = riskColors[review.riskScore as keyof typeof riskColors] || riskColors.LOW;
              return (
                <motion.button
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedReview(review)}
                  className="w-full text-left p-5 rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/[0.08] transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="mt-0.5 w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center border" style={{ backgroundColor: rc.bg, borderColor: rc.border }}>
                        <AlertTriangle className="w-4 h-4" style={{ color: rc.text }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs text-zinc-500 ${dmMono.className}`}>{review.prId}</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded tracking-wider" style={{ color: rc.text, backgroundColor: rc.bg, border: `1px solid ${rc.border}` }}>
                            {review.riskScore} RISK
                          </span>
                        </div>
                        <h3 className="font-medium text-zinc-200 group-hover:text-white transition-colors truncate">
                          {review.title}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                          {review.summary}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1">
                        <GitPullRequest className="w-3 h-3" />
                        <span className={dmMono.className}>{review.repo}</span>
                      </div>
                      <span className="text-[11px] text-zinc-600">
                        {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setSelectedReview(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-3xl bg-[#0A0A0A] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/[0.05] bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#c9a84c]" />
                <h3 className="text-sm font-medium text-white">{selectedReview.title}</h3>
                <span className={`text-[10px] ${dmMono.className} text-zinc-500`}>{selectedReview.prId}</span>
              </div>
              <button onClick={() => setSelectedReview(null)} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Summary</h4>
                <p className="text-sm text-zinc-300 leading-relaxed">{selectedReview.summary}</p>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Suggested Fix</h4>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectedReview.fixes}</p>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Code Diff</h4>
                <pre className={`text-xs text-zinc-500 bg-black/40 rounded-lg p-4 overflow-auto max-h-[300px] leading-loose ${dmMono.className}`}>
                  <code>{selectedReview.codeDiff || "No diff available."}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}