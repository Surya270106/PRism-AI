"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
  open_issues_count: number;
}

const navItems = [
  { label: "Dashboard",     href: "/dashboard",  active: true },
  { label: "Pull Requests", href: "/pr-review" },
  { label: "Settings",      href: "/settings" },
];

const timeAgo = (iso: string) => {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
};

const langColor: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f7df1e", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", Java: "#b07219", "C++": "#f34b7d",
  Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [repos, setRepos]           = useState<Repo[]>([]);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState("");

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetch("/api/repos")
      .then((r) => r.json())
      .then((d) => { setRepos(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [session]);

  const filtered = repos.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalStars = repos.reduce((a, r) => a + r.stargazers_count, 0);
  const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))];

  if (!session) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#080808",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap');`}</style>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          style={{ textAlign: "center", maxWidth: 400 }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              background: "#c9a84c",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontStyle: "italic", color: "#080808" }}>P</span>
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: "#f0ebe2", marginBottom: 12 }}>
            Sign in to continue
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6b6560", marginBottom: 32, lineHeight: 1.6 }}>
            Connect your GitHub to view your repositories and analyze pull requests.
          </p>
          <button
            onClick={() => signIn("github")}
            style={{
              background: "#c9a84c",
              color: "#080808",
              border: "none",
              padding: "12px 28px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: 14,
              borderRadius: 3,
              cursor: "pointer",
            }}
          >
            Connect GitHub
          </button>
        </motion.div>
      </div>
    );
  }

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
            top: 0,
            left: 0,
            bottom: 0,
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
            {session.user?.image && (
              <img src={session.user.image} alt="" style={{ width: 26, height: 26, borderRadius: "50%", border: "1px solid rgba(201,168,76,0.3)" }} />
            )}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6b6560", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.user?.name}
              </div>
            </div>
            <button
              onClick={() => signOut()}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#3a342e", fontSize: 11, fontFamily: "'DM Mono', monospace" }}
              title="Sign out"
            >
              ↗
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ marginLeft: 220, flex: 1, padding: "36px 48px", overflowY: "auto" }}>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            style={{ marginBottom: 40 }}
          >
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 34,
                color: "#f0ebe2",
                letterSpacing: "-0.02em",
                marginBottom: 6,
              }}
            >
              Good to see you,{" "}
              <span style={{ fontStyle: "italic", color: "#c9a84c" }}>
                {session.user?.name?.split(" ")[0] || "there"}
              </span>
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6b6560", fontWeight: 300 }}>
              {repos.length} repositories connected · {totalStars.toLocaleString()} total stars
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 40 }}
          >
            {[
              { label: "Repositories", val: repos.length, gold: true },
              { label: "Total Stars",  val: totalStars.toLocaleString() },
              { label: "Languages",    val: languages.length },
              { label: "Open Issues",  val: repos.reduce((a, r) => a + (r.open_issues_count || 0), 0) },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: s.gold ? "1px solid rgba(201,168,76,0.2)" : "1px solid rgba(255,255,255,0.05)",
                  borderRadius: 4,
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 30,
                    color: s.gold ? "#c9a84c" : "#f0ebe2",
                    lineHeight: 1,
                    marginBottom: 6,
                  }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: "#3a342e",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  {s.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Repo grid header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                color: "#3a342e",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Repositories
            </span>
            <input
              placeholder="filter…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 3,
                padding: "5px 10px",
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#c8c0b4",
                outline: "none",
                width: 160,
              }}
            />
          </div>

          {/* Repo grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#3a342e" }}
              >
                loading repositories…
              </motion.div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {filtered.map((repo, i) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, ease: [0.23, 1, 0.32, 1] }}
                  whileHover={{ borderColor: "rgba(201,168,76,0.25)", backgroundColor: "rgba(201,168,76,0.03)" }}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 4,
                    padding: "20px 22px",
                    cursor: "pointer",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                  onClick={() => window.location.href = `/pr-review?repo=${repo.full_name}`}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#f0ebe2",
                      }}
                    >
                      {repo.name}
                    </div>
                    {repo.language && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: langColor[repo.language] || "#6b6560",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6b6560" }}>
                          {repo.language}
                        </span>
                      </div>
                    )}
                  </div>

                  {repo.description && (
                    <p
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 12,
                        color: "#6b6560",
                        lineHeight: 1.5,
                        marginBottom: 14,
                        fontWeight: 300,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {repo.description}
                    </p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 16 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#3a342e" }}>
                        ★ {repo.stargazers_count}
                      </span>
                      {repo.open_issues_count > 0 && (
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#3a342e" }}>
                          ◉ {repo.open_issues_count}
                        </span>
                      )}
                    </div>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#3a342e" }}>
                      {timeAgo(repo.updated_at)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{ marginTop: 40, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#3a342e", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
              Quick Actions
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <a href="/pr-review" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    background: "#c9a84c",
                    color: "#080808",
                    border: "none",
                    padding: "10px 20px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500,
                    fontSize: 13,
                    borderRadius: 3,
                    cursor: "pointer",
                  }}
                >
                  Analyze Pull Requests
                </button>
              </a>
              <a href="/settings" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    background: "transparent",
                    color: "#6b6560",
                    border: "1px solid rgba(255,255,255,0.07)",
                    padding: "10px 20px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    borderRadius: 3,
                    cursor: "pointer",
                  }}
                >
                  Settings
                </button>
              </a>
            </div>
          </motion.div>
        </main>
      </div>
    </>
  );
}