"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  FolderGit2, 
  GitPullRequest, 
  Settings, 
  Check, 
  Loader2 
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { id: "repos", label: "Repositories", icon: FolderGit2, href: "/" },
  { id: "pr", label: "Pull Requests", icon: GitPullRequest, href: "/pr-review" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeNav, setActiveNav] = useState("settings");
  
  // Settings State
  const [autoReview, setAutoReview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-zinc-300 selection:bg-white/30 font-sans">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        
        {/* Magic Sidebar */}
        <aside className="w-64 border-r border-white/[0.08] p-4 flex flex-col gap-1 pt-8 hidden md:flex">
          <div className="px-3 pb-6">
            <div className="h-6 w-24 bg-white/10 rounded-md animate-pulse" /> {/* Fake Logo/Brand */}
          </div>
          
          {NAV_ITEMS.map((item) => {
            const isActive = activeNav === item.id;
            const Icon = item.icon;

            return (
              <a
                key={item.id}
                href={item.href}
                onMouseEnter={() => setActiveNav(item.id)}
                className="relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{ color: isActive ? "#fff" : "#A1A1AA" }}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 rounded-lg bg-white/[0.05] border border-white/[0.05]"
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{item.label}</span>
              </a>
            );
          })}
        </aside>

        {/* Content Area */}
        <section className="flex-1 p-6 md:p-12 lg:p-16 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, filter: "blur(4px)", y: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
          >
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">
              Project Settings
            </h1>
            <p className="text-sm text-zinc-500 mb-10">
              Manage your repository behavior and review automation.
            </p>

            {/* Feature Card 1 */}
            <div className="group relative rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] transition-colors hover:bg-white/[0.03]">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-medium text-white">Automated PR Reviews</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
                    Allow the AI to automatically review and comment on new pull requests based on your risk threshold.
                  </p>
                </div>

                {/* Handcrafted Animated Toggle */}
                <button
                  type="button"
                  onClick={() => setAutoReview(!autoReview)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
                    autoReview ? "bg-white" : "bg-zinc-800"
                  }`}
                >
                  <span className="sr-only">Use setting</span>
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#0A0A0A] shadow-sm ring-1 ring-black/5 ${
                      autoReview ? "translate-x-2" : "-translate-x-2 bg-zinc-400"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save Action Area */}
            <div className="mt-8 flex items-center gap-4 border-t border-white/[0.08] pt-6">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="relative flex h-9 items-center justify-center overflow-hidden rounded-md bg-white px-4 text-sm font-medium text-black transition-all hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {isSaving ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                      <span>Saving...</span>
                    </motion.div>
                  ) : saved ? (
                    <motion.div
                      key="saved"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 text-emerald-600"
                    >
                      <Check className="h-4 w-4" />
                      <span>Saved</span>
                    </motion.div>
                  ) : (
                    <motion.span
                      key="default"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      Save changes
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

          </motion.div>
        </section>
      </div>
    </main>
  );
}