"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Dashboard",    href: "/dashboard" },
  { label: "Pull Requests",href: "/pr-review" },
  { label: "Settings",     href: "/settings", active: true },
];

type Tab = "profile" | "model" | "review" | "notifications" | "api";

const tabs: { id: Tab; label: string }[] = [
  { id: "profile",       label: "Profile" },
  { id: "model",         label: "AI Model" },
  { id: "review",        label: "Review" },
  { id: "notifications", label: "Notifications" },
  { id: "api",           label: "API Keys" },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      onClick={() => onChange(!value)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: value ? "#c9a84c" : "rgba(255,255,255,0.08)",
        border: "none",
        cursor: "pointer",
        position: "relative",
        flexShrink: 0,
        transition: "background 0.25s ease",
      }}
    >
      <motion.div
        animate={{ x: value ? 20 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
        style={{
          position: "absolute",
          top: 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
        }}
      />
    </motion.button>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 3,
        padding: "8px 12px",
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
        color: "#c8c0b4",
        cursor: "pointer",
        outline: "none",
        minWidth: 180,
      }}
    >
      {options.map((o) => (
        <option key={o} value={o} style={{ background: "#111" }}>{o}</option>
      ))}
    </select>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 24,
        padding: "16px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#c8c0b4", marginBottom: description ? 3 : 0 }}>{label}</div>
        {description && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#3a342e", lineHeight: 1.5, fontWeight: 300 }}>{description}</div>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab]           = useState<Tab>("profile");
  const [saveState, setSaveState]           = useState<"idle" | "saving" | "saved">("idle");

  // Profile
  const [displayName, setDisplayName]       = useState(session?.user?.name || "");
  const [email, setEmail]                   = useState(session?.user?.email || "");

  // Model
  const [model, setModel]                   = useState("claude-sonnet-4-5");
  const [temperature, setTemperature]       = useState("0.3");

  // Review
  const [autoReview, setAutoReview]         = useState(false);
  const [riskThreshold, setRiskThreshold]   = useState("60");
  const [includeTests, setIncludeTests]     = useState(true);
  const [includeDocs, setIncludeDocs]       = useState(false);
  const [detailedSummary, setDetailedSummary] = useState(true);

  // Notifications
  const [emailNotifs, setEmailNotifs]       = useState(true);
  const [highRiskAlert, setHighRiskAlert]   = useState(true);
  const [weeklyDigest, setWeeklyDigest]     = useState(false);

  // API
  const [showHFToken, setShowHFToken]       = useState(false);

  const handleSave = async () => {
    setSaveState("saving");
    await new Promise((r) => setTimeout(r, 900));
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 2500);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; color: #e8e3dc; font-family: 'DM Sans', sans-serif; }
        ::selection { background: rgba(201,168,76,0.2); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #0d0d0d; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }
        input, textarea { outline: none; }
        option { background: #111; color: #c8c0b4; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#080808" }}>

        {/* Sidebar */}
        <aside
          style={{
            width: 220,
            borderRight: "1px solid rgba(255,255,255,0.05)",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
            position: "fixed",
            top: 0, left: 0, bottom: 0,
            background: "#080808",
            zIndex: 30,
          }}
        >
          <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, background: "#c9a84c", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, fontStyle: "italic", color: "#080808" }}>P</span>
            </div>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#f0ebe2" }}>PRism</span>
          </div>
          <nav style={{ padding: "12px 8px", flex: 1 }}>
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={{
                  display: "block",
                  padding: "9px 12px",
                  borderRadius: 4,
                  marginBottom: 2,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  textDecoration: "none",
                  color: item.active ? "#c9a84c" : "#6b6560",
                  background: item.active ? "rgba(201,168,76,0.08)" : "transparent",
                  border: item.active ? "1px solid rgba(201,168,76,0.15)" : "1px solid transparent",
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 10 }}>
            {session?.user?.image && (
              <img src={session.user.image} alt="" style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.3)" }} />
            )}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6b6560", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session?.user?.name}
              </div>
            </div>
            <button
              onClick={() => signOut()}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#3a342e", fontSize: 11, fontFamily: "'DM Mono', monospace" }}
            >
              ↗
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ marginLeft: 220, flex: 1, padding: "36px 48px", maxWidth: 900 }}>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            style={{ marginBottom: 36, display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: 32,
                  color: "#f0ebe2",
                  letterSpacing: "-0.02em",
                  marginBottom: 4,
                }}
              >
                Settings
              </h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6b6560", fontWeight: 300 }}>
                Configure PRism to match your workflow
              </p>
            </div>

            {/* Save button */}
            <motion.button
              onClick={handleSave}
              disabled={saveState === "saving"}
              whileHover={{ opacity: 0.88, y: -1 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: saveState === "saved" ? "rgba(34,197,94,0.15)" : "#c9a84c",
                color: saveState === "saved" ? "#22c55e" : "#080808",
                border: saveState === "saved" ? "1px solid rgba(34,197,94,0.3)" : "none",
                padding: "10px 24px",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: 13,
                borderRadius: 3,
                cursor: saveState === "saving" ? "not-allowed" : "pointer",
                transition: "background 0.3s, color 0.3s, border 0.3s",
                minWidth: 120,
              }}
            >
              <AnimatePresence mode="wait">
                {saveState === "idle" && (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Save Settings
                  </motion.span>
                )}
                {saveState === "saving" && (
                  <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Saving…
                  </motion.span>
                )}
                {saveState === "saved" && (
                  <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    ✓ Saved
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>

          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              gap: 0,
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              marginBottom: 32,
              position: "relative",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: "10px 18px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: activeTab === tab.id ? "#c9a84c" : "#6b6560",
                  cursor: "pointer",
                  position: "relative",
                  transition: "color 0.2s",
                }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    style={{
                      position: "absolute",
                      bottom: -1,
                      left: 0,
                      right: 0,
                      height: 1,
                      background: "#c9a84c",
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >

              {/* ── Profile ─────────────────────────────────────────── */}
              {activeTab === "profile" && (
                <div>
                  <SectionTitle>Account</SectionTitle>
                  <SettingRow label="Display Name">
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 3,
                        padding: "8px 12px",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 12,
                        color: "#c8c0b4",
                        width: 220,
                      }}
                    />
                  </SettingRow>
                  <SettingRow label="Email">
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 3,
                        padding: "8px 12px",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 12,
                        color: "#c8c0b4",
                        width: 220,
                      }}
                    />
                  </SettingRow>
                  <SettingRow label="GitHub Account" description="Connected via OAuth">
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "3px 8px", borderRadius: 2 }}>
                      Connected
                    </span>
                  </SettingRow>
                </div>
              )}

              {/* ── AI Model ─────────────────────────────────────────── */}
              {activeTab === "model" && (
                <div>
                  <SectionTitle>Model Configuration</SectionTitle>
                  <SettingRow label="Analysis Model" description="Model used for PR analysis and risk scoring">
                    <Select
                      value={model}
                      onChange={setModel}
                      options={["claude-sonnet-4-5", "claude-haiku-4-5", "claude-opus-4-5"]}
                    />
                  </SettingRow>
                  <SettingRow label="Temperature" description="Lower = more deterministic, higher = more creative">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        style={{ width: 120, accentColor: "#c9a84c" }}
                      />
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#c9a84c", minWidth: 28 }}>
                        {temperature}
                      </span>
                    </div>
                  </SettingRow>
                  <SettingRow label="Context Window" description="Max tokens for analysis">
                    <Select value="32k" onChange={() => {}} options={["8k", "16k", "32k", "100k"]} />
                  </SettingRow>
                </div>
              )}

              {/* ── Review ───────────────────────────────────────────── */}
              {activeTab === "review" && (
                <div>
                  <SectionTitle>Review Behavior</SectionTitle>
                  <SettingRow label="Auto-review on PR open" description="Automatically analyze new PRs when they are opened">
                    <Toggle value={autoReview} onChange={setAutoReview} />
                  </SettingRow>
                  <SettingRow label="Include test files" description="Analyze test file changes as part of risk scoring">
                    <Toggle value={includeTests} onChange={setIncludeTests} />
                  </SettingRow>
                  <SettingRow label="Include documentation changes" description="Factor in doc updates in the review">
                    <Toggle value={includeDocs} onChange={setIncludeDocs} />
                  </SettingRow>
                  <SettingRow label="Detailed summary" description="Generate longer, more thorough PR summaries">
                    <Toggle value={detailedSummary} onChange={setDetailedSummary} />
                  </SettingRow>
                  <SettingRow label="Risk threshold" description="PRs above this score trigger high-risk alerts">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={riskThreshold}
                        onChange={(e) => setRiskThreshold(e.target.value)}
                        style={{ width: 120, accentColor: "#c9a84c" }}
                      />
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#c9a84c", minWidth: 28 }}>
                        {riskThreshold}
                      </span>
                    </div>
                  </SettingRow>
                </div>
              )}

              {/* ── Notifications ────────────────────────────────────── */}
              {activeTab === "notifications" && (
                <div>
                  <SectionTitle>Notifications</SectionTitle>
                  <SettingRow label="Email notifications" description="Receive email updates about PR analysis results">
                    <Toggle value={emailNotifs} onChange={setEmailNotifs} />
                  </SettingRow>
                  <SettingRow label="High-risk alerts" description="Immediate alert when a PR exceeds the risk threshold">
                    <Toggle value={highRiskAlert} onChange={setHighRiskAlert} />
                  </SettingRow>
                  <SettingRow label="Weekly digest" description="Summary of all PR activity for your repos">
                    <Toggle value={weeklyDigest} onChange={setWeeklyDigest} />
                  </SettingRow>
                </div>
              )}

              {/* ── API Keys ─────────────────────────────────────────── */}
              {activeTab === "api" && (
                <div>
                  <SectionTitle>API Configuration</SectionTitle>
                  <SettingRow label="HuggingFace Token" description="Used for additional AI model access">
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type={showHFToken ? "text" : "password"}
                        placeholder="hf_••••••••••••••••"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 3,
                          padding: "8px 12px",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 12,
                          color: "#c8c0b4",
                          width: 200,
                        }}
                      />
                      <button
                        onClick={() => setShowHFToken(!showHFToken)}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 3,
                          padding: "8px 10px",
                          color: "#6b6560",
                          cursor: "pointer",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: 11,
                        }}
                      >
                        {showHFToken ? "hide" : "show"}
                      </button>
                    </div>
                  </SettingRow>
                  <SettingRow label="NEXTAUTH_SECRET" description="Set via environment variables in Vercel">
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#3a342e" }}>
                      Set in Vercel → Environment Variables
                    </span>
                  </SettingRow>
                  <SettingRow label="GitHub OAuth" description="GitHub App credentials for repository access">
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "3px 8px", borderRadius: 2 }}>
                      Configured
                    </span>
                  </SettingRow>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Danger zone */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              marginTop: 56,
              padding: "20px 24px",
              border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: 4,
              background: "rgba(239,68,68,0.03)",
            }}
          >
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#ef4444", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
              Danger Zone
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#c8c0b4", marginBottom: 3 }}>Sign out of PRism</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#3a342e", fontWeight: 300 }}>Removes your session from this device</div>
              </div>
              <button
                onClick={() => signOut()}
                style={{
                  background: "transparent",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.3)",
                  padding: "8px 18px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  borderRadius: 3,
                  cursor: "pointer",
                }}
              >
                Sign out
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: 10,
        color: "#3a342e",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: 4,
        paddingBottom: 10,
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {children}
    </div>
  );
}