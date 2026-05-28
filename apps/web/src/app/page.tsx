"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.085 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: d, ease: [0.23, 1, 0.32, 1] } }),
};
const cardReveal = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } },
};
const rowReveal = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] } },
};

function ScrollReveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} variants={fadeUp} custom={delay} initial="hidden" animate={inView ? "visible" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

const prData = [
  { pr: "#2847 — auth/oauth-refactor",  risk: 87, label: "HIGH", files: 34, add: "+1,204" },
  { pr: "#2841 — feat/dashboard-v2",    risk: 52, label: "MED",  files: 18, add: "+876"   },
  { pr: "#2839 — fix/api-rate-limit",   risk: 14, label: "LOW",  files: 4,  add: "+92"    },
  { pr: "#2836 — refactor/db-queries",  risk: 61, label: "MED",  files: 11, add: "+340"   },
  { pr: "#2830 — chore/deps-update",    risk: 8,  label: "LOW",  files: 2,  add: "+17"    },
];

const rc = (l: string) =>
  l === "HIGH" ? { text: "#e74c3c", bg: "rgba(231,76,60,0.12)",   bar: "#e74c3c" } :
  l === "MED"  ? { text: "#c9a84c", bg: "rgba(201,168,76,0.12)",  bar: "#c9a84c" } :
                 { text: "#2ecc71", bg: "rgba(46,204,113,0.12)",   bar: "#2ecc71" };

const features = [
  { icon: "⬡", title: "Semantic diff analysis",    body: "Understands intent, not just lines changed. Flags regressions syntax-level tools miss."      },
  { icon: "◈", title: "Risk scoring",              body: "Every PR gets a calibrated risk score. Prioritise what demands attention."                     },
  { icon: "◎", title: "Security surface mapping",  body: "Surfaces auth changes, injection vectors, and exposed endpoints automatically."                },
  { icon: "⬜", title: "Codebase memory",           body: "Builds a graph of your architecture. Each review informed by everything before it."            },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [barsVisible, setBarsVisible] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY       = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const prRef      = useRef(null);
  const prInView   = useInView(prRef, { once: true, margin: "-80px" });

  useEffect(() => {
    if (prInView) setBarsVisible(true);
  }, [prInView]);

  useEffect(() => {
    const h = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#060606", color: "#fff", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}

        @keyframes aurora{
          0%{background-position:50% 50%,50% 50%}
          100%{background-position:350% 50%,350% 50%}
        }

        .aurora-layer{
          position:absolute;inset:-10px;
          background-image:
            repeating-linear-gradient(100deg,#000 0%,#000 7%,transparent 10%,transparent 12%,#000 16%),
            repeating-linear-gradient(100deg,#d4a843 5%,#3b82f6 12%,#a5b4fc 18%,#e8c87a 24%,#60a5fa 30%,#d4a843 40%);
          background-size:300%,200%;
          filter:blur(10px);
          opacity:.45;
          animation:aurora 16s linear infinite;
          mask-image:radial-gradient(ellipse at 70% 0%,black 0%,transparent 65%);
          -webkit-mask-image:radial-gradient(ellipse at 70% 0%,black 0%,transparent 65%);
        }

        .h1{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(3rem,7.5vw,6.5rem);line-height:1.0;letter-spacing:-0.03em;font-weight:400}
        .h1 em{font-style:italic;color:#c9a84c}
        .h2{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(2rem,3.8vw,3.2rem);font-weight:400;line-height:1.1;letter-spacing:-0.025em}
        .h2 em{font-style:italic;color:rgba(201,168,76,0.55)}
        .cta-h{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(2.2rem,4.5vw,4rem);font-weight:400;line-height:1.05;letter-spacing:-0.03em}
        .cta-h em{font-style:italic;color:rgba(201,168,76,0.42)}

        .nav-link{font-size:11px;color:rgba(255,255,255,0.32);letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;transition:color 180ms;text-decoration:none}
        .nav-link:hover{color:rgba(255,255,255,0.8)}

        .btn-primary{display:inline-flex;align-items:center;gap:6px;padding:11px 22px;background:#c9a84c;color:#060606;font-size:12px;font-weight:500;border:none;border-radius:2px;cursor:pointer;font-family:inherit;letter-spacing:0.01em;transition:opacity 160ms,transform 160ms cubic-bezier(0.23,1,0.32,1)}
        .btn-primary:hover{opacity:0.88}
        .btn-primary:active{transform:scale(0.97)}
        .btn-secondary{display:inline-flex;align-items:center;padding:11px 22px;background:transparent;color:rgba(255,255,255,0.38);font-size:12px;border:1px solid rgba(255,255,255,0.1);border-radius:2px;cursor:pointer;font-family:inherit;transition:color 180ms,border-color 180ms}
        .btn-secondary:hover{color:#fff;border-color:rgba(255,255,255,0.25)}

        .tag{display:inline-block;padding:2px 8px;border:1px solid rgba(201,168,76,0.28);border-radius:2px;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(201,168,76,0.65)}

        .metric-num{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(2rem,3.5vw,3.2rem);font-weight:400;line-height:1}
        .metric-num.gold{color:#c9a84c}
        .metric-lbl{margin-top:5px;font-size:10px;color:rgba(255,255,255,0.26);letter-spacing:0.09em;text-transform:uppercase}

        .pr-row-item{display:grid;grid-template-columns:1fr 155px 64px 78px;padding:13px 16px;border-bottom:1px solid rgba(255,255,255,0.04);transition:background 0.15s;cursor:default}
        .pr-row-item:last-child{border-bottom:none}
        .pr-row-item:hover{background:rgba(201,168,76,0.04)}

        .feat-card{padding:28px 22px;transition:background 200ms}
        .feat-card:hover{background:rgba(201,168,76,0.04)}

        .gold-line{height:1px;background:linear-gradient(to right,transparent,rgba(201,168,76,0.28),transparent)}
        .risk-track{width:68px;height:3px;background:rgba(255,255,255,0.07);border-radius:2px;overflow:hidden}
        .risk-fill{height:100%;border-radius:2px;transition:width 1s cubic-bezier(0.23,1,0.32,1)}

        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#060606}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:2px}
        ::selection{background:rgba(201,168,76,0.2)}
      `}</style>

      {/* Aurora */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div className="aurora-layer" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 0%, #060606 75%)" }} />
      </div>

      {/* Mouse orb */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", width: 480, height: 480, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.055) 0%, transparent 70%)",
          transform: `translate(${mousePos.x - 240}px, ${mousePos.y - 240}px)`,
          transition: "transform 1s cubic-bezier(0.23,1,0.32,1)",
        }} />
      </div>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", background: "rgba(6,6,6,0.78)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, border: "1.5px solid #c9a84c", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Serif Display', serif", fontSize: 12, fontStyle: "italic", color: "#c9a84c" }}>P</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 17, color: "#fff" }}>PRism</span>
          <span className="tag" style={{ marginLeft: 6 }}>Beta</span>
        </div>
        <div style={{ display: "flex", gap: 30 }}>
          {["Product", "Docs", "Pricing", "Blog"].map(l => (
            <a key={l} href="#" className="nav-link">{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {session ? (
            <>
              <a href="/pr-review"><button className="btn-primary">Dashboard →</button></a>
              <button className="btn-secondary" onClick={() => signOut()}>Sign out</button>
            </>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => signIn("github")}>Sign in</button>
              <button className="btn-primary" onClick={() => signIn("github")}>Get started →</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} style={{ position: "relative", zIndex: 1, paddingTop: 140 }}>
        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <div style={{ padding: "0 52px 80px", maxWidth: 1100, margin: "0 auto" }}>
            <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
              <span className="tag">AI Code Intelligence</span>
            </motion.div>

            <motion.h1 className="h1" variants={fadeUp} custom={0.1} initial="hidden" animate="visible" style={{ marginTop: 24, maxWidth: 820, color: "#fff" }}>
              Every pull request,<br /><em>understood.</em>
            </motion.h1>

            <motion.p variants={fadeUp} custom={0.22} initial="hidden" animate="visible" style={{ marginTop: 24, fontSize: "clamp(14px,1.5vw,17px)", color: "rgba(255,255,255,0.33)", maxWidth: 490, lineHeight: 1.7, fontWeight: 300, marginBottom: 40 }}>
              PRism reads your codebase the way a senior engineer does — with context, history, and consequence. Reviews that used to take hours happen in seconds.
            </motion.p>

            <motion.div variants={fadeUp} custom={0.33} initial="hidden" animate="visible" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {session
                ? <a href="/pr-review"><button className="btn-primary">Open dashboard →</button></a>
                : <button className="btn-primary" onClick={() => signIn("github")}>Connect GitHub →</button>
              }
              <button className="btn-secondary">See it work</button>
            </motion.div>

            <motion.div variants={fadeUp} custom={0.44} initial="hidden" animate="visible" style={{ width: 36, height: 1, background: "rgba(201,168,76,0.55)", margin: "52px 0 34px" }} />

            <motion.div variants={stagger} initial="hidden" animate="visible" style={{ display: "flex", gap: 52, flexWrap: "wrap" }}>
              {[
                { val: "94%", label: "Catch rate",         gold: true  },
                { val: "12×", label: "Faster review",      gold: false },
                { val: "0",   label: "Context switches",   gold: false },
              ].map((m, i) => (
                <motion.div key={i} variants={fadeUp} custom={0.5 + i * 0.1}>
                  <div className={`metric-num${m.gold ? " gold" : ""}`}>{m.val}</div>
                  <div className="metric-lbl">{m.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      <div className="gold-line" style={{ margin: "0 52px" }} />

      {/* PR Table */}
      <section style={{ position: "relative", zIndex: 1, padding: "72px 52px", maxWidth: 1100, margin: "0 auto" }}>
        <ScrollReveal>
          <span className="tag">Live demo</span>
          <h2 className="h2" style={{ marginTop: 16, marginBottom: 32 }}>Your queue, <em>ranked by risk</em></h2>
        </ScrollReveal>

        <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden", background: "rgba(255,255,255,0.015)" }}>
          {/* Titlebar */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.022)" }}>
            {["#c0392b","#f39c12","#27ae60"].map((c,i) => (
              <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.7 }} />
            ))}
            <span style={{ marginLeft: 8, fontSize: 10, color: "rgba(255,255,255,0.18)", letterSpacing: "0.05em", fontFamily: "monospace" }}>prism — ai review / feature/auth-refactor</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(201,168,76,0.5)", fontFamily: "monospace" }}>● live</span>
          </div>
          {/* Col headers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 155px 64px 78px", padding: "9px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {["Pull Request","Risk Score","Files","Changes"].map(h => (
              <span key={h} style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</span>
            ))}
          </div>
          {/* Rows */}
          <motion.div ref={prRef} variants={stagger} initial="hidden" animate={prInView ? "visible" : "hidden"}>
            {prData.map((row, i) => {
              const c = rc(row.label);
              return (
                <motion.div key={i} variants={rowReveal} className="pr-row-item">
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{row.pr}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div className="risk-track">
                      <div className="risk-fill" style={{ background: c.bar, width: barsVisible ? `${row.risk}%` : "0%" }} />
                    </div>
                    <span className="risk-badge" style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, padding: "2px 5px", borderRadius: 2, letterSpacing: "0.05em", color: c.text, background: c.bg }}>{row.label}</span>
                  </div>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{row.files}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{row.add}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <div className="gold-line" style={{ margin: "0 52px" }} />

      {/* Features */}
      <section style={{ position: "relative", zIndex: 1, padding: "72px 52px 96px", maxWidth: 1100, margin: "0 auto" }}>
        <ScrollReveal>
          <span className="tag">Capabilities</span>
          <h2 className="h2" style={{ marginTop: 16 }}>Built for the complexity<br /><em>of real codebases.</em></h2>
        </ScrollReveal>

        <motion.div
          variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", background: "rgba(255,255,255,0.01)", marginTop: 44 }}
        >
          {features.map((f, i) => (
            <motion.div key={i} variants={cardReveal} className="feat-card" style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <span style={{ fontSize: 18, color: "rgba(201,168,76,0.5)", display: "block", marginBottom: 16 }}>{f.icon}</span>
              <h3 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.82)", marginBottom: 8, letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", lineHeight: 1.65, fontWeight: 300 }}>{f.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <div className="gold-line" style={{ margin: "0 52px" }} />

      {/* CTA */}
      <section style={{ position: "relative", zIndex: 1, padding: "96px 52px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          <div style={{ width: 30, height: 1, background: "#c9a84c", margin: "0 auto 38px", opacity: 0.6 }} />
          <div className="cta-h" style={{ marginBottom: 32, color: "#fff" }}>
            Ship with confidence.<br /><em>Every time.</em>
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", maxWidth: 360, margin: "0 auto 36px", lineHeight: 1.7, fontWeight: 300 }}>
            Connect your GitHub repository in 60 seconds. No code changes. No configuration.
          </p>
          <button className="btn-primary" style={{ fontSize: 13, padding: "13px 30px" }} onClick={() => signIn("github")}>
            Connect GitHub — it&apos;s free →
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.05)", padding: "26px 52px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 16, height: 16, border: "1px solid rgba(201,168,76,0.35)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Serif Display', serif", fontSize: 8, fontStyle: "italic", color: "rgba(201,168,76,0.4)" }}>P</div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 12, color: "rgba(255,255,255,0.18)" }}>PRism AI — {new Date().getFullYear()}</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {[["Privacy","#"],["Terms","#"],["GitHub","https://github.com/Surya270106/PRism-AI"]].map(([label,href]) => (
            <a key={label} href={href} style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "rgba(255,255,255,0.18)", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(201,168,76,0.7)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.18)")}
            >{label}</a>
          ))}
        </div>
      </footer>
    </main>
  );
}
page.tsk, give me the steps to do it in y porject