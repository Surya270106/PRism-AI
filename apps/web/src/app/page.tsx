"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardReveal = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } },
};

function ScrollReveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const { data: session } = useSession();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const metrics = [
    { value: "15s", label: "Recruiter scan time" },
    { value: "73%", label: "Have fixable red flags" },
    { value: "0", label: "Sign-ups to analyse" },
  ];

  const features = [
    { icon: "⬡", title: "Eagle Eye HR", desc: "Simulates a recruiter reviewing your profile in 15 seconds. See exactly what a startup HR or FAANG screener would think — before they do." },
    { icon: "◈", title: "Profile Scorer", desc: "Scores across 8 dimensions: originality, deployments, README quality, activity, tech stack, code structure, documentation, and collaboration." },
    { icon: "◎", title: "Red Flag Detector", desc: "Catches the silent deal-breakers: tutorial clones, no deployments, copied READMEs, activity gaps, missing pinned repos." },
    { icon: "⬜", title: "Resume vs GitHub", desc: "Compares what your resume claims against what your repos prove. This is exactly how recruiters already think." },
  ];

  const prRows = [
    { risk: "HIGH", title: "9 of 14 repos are tutorial clones — originality score: 32%",       color: "#e74c3c" },
    { risk: "HIGH", title: "0 deployed projects detected — recruiters need live proof",          color: "#e74c3c" },
    { risk: "MED",  title: "Resume claims React expert — only 1 React repo found",              color: "#c9a84c" },
    { risk: "LOW",  title: "No pinned repositories — weakest repos shown by default",           color: "rgba(255,255,255,0.25)" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#060606", color: "#fff", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}

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

        .h1{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(2rem,5vw,4.5rem);line-height:1.0;letter-spacing:-0.03em;font-weight:400}
        .h1 em{font-style:italic;color:#c9a84c}
        .h2{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(2rem,4vw,3.5rem);font-weight:400;line-height:1.1;letter-spacing:-0.025em}
        .h2 em{font-style:italic;color:rgba(201,168,76,0.55)}
        .cta-h{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(2.5rem,5vw,4.5rem);font-weight:400;line-height:1.05;letter-spacing:-0.03em}
        .cta-h em{font-style:italic;color:rgba(201,168,76,0.4)}

        .nav-link{font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;transition:color 180ms;text-decoration:none}
        .nav-link:hover{color:rgba(255,255,255,0.8)}

        .btn-primary{display:inline-flex;align-items:center;gap:8px;padding:13px 26px;background:#c9a84c;color:#060606;font-size:13px;font-weight:500;border:none;border-radius:2px;cursor:pointer;font-family:inherit;transition:opacity 160ms,transform 160ms cubic-bezier(0.23,1,0.32,1);letter-spacing:0.01em}
        .btn-primary:hover{opacity:0.88}
        .btn-primary:active{transform:scale(0.97)}
        .btn-secondary{display:inline-flex;align-items:center;padding:13px 26px;background:transparent;color:rgba(255,255,255,0.4);font-size:13px;border:1px solid rgba(255,255,255,0.1);border-radius:2px;cursor:pointer;font-family:inherit;transition:color 180ms,border-color 180ms}
        .btn-secondary:hover{color:#fff;border-color:rgba(255,255,255,0.25)}

        .tag{display:inline-block;padding:3px 9px;border:1px solid rgba(201,168,76,0.25);border-radius:2px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(201,168,76,0.6)}

        .metric-num{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(2.2rem,4vw,3.5rem);font-weight:400;line-height:1}
        .metric-lbl{margin-top:5px;font-size:11px;color:rgba(255,255,255,0.28);letter-spacing:0.08em;text-transform:uppercase}

        .feat-card{padding:30px;transition:background 200ms}
        .feat-card:hover{background:rgba(201,168,76,0.04)}

        .pr-row{display:flex;align-items:center;gap:14px;padding:11px 20px;border-bottom:1px solid rgba(255,255,255,0.04);transition:background 150ms;cursor:default}
        .pr-row:last-child{border-bottom:none}
        .pr-row:hover{background:rgba(255,255,255,0.025)}

        .gold-line{height:1px;background:linear-gradient(to right,transparent,rgba(201,168,76,0.3),transparent)}
      `}</style>

      {/* Aurora */}
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

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 48px", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", background: "rgba(6,6,6,0.75)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 19, height: 19, border: "1.5px solid #c9a84c", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 500, color: "#c9a84c" }}>P</div>
          <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.02em", color: "rgba(255,255,255,0.9)" }}>PRism</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="/pr-review" className="nav-link">Reviews</a>
          <a href="/settings" className="nav-link">Settings</a>
          {session ? (
            <a href="/pr-review" className="btn-primary" style={{ padding: "8px 16px", fontSize: 12 }}>Open app →</a>
          ) : (
            <button onClick={() => signIn("github")} className="btn-primary" style={{ padding: "8px 16px", fontSize: 12 }}>Connect GitHub →</button>
          )}
        </div>
      </nav>

      {/* Hero — parallax on scroll */}
      <section ref={heroRef} style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "140px 48px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
            <span className="tag">Eagle Eye HR — Career Intelligence</span>
          </motion.div>

          <motion.h1 className="h1" variants={fadeUp} custom={0.1} initial="hidden" animate="visible" style={{ marginTop: 28, maxWidth: 860 }}>
            Find what's missing<br />in your GitHub <em>before<br />recruiters do.</em>
          </motion.h1>

          <motion.p variants={fadeUp} custom={0.22} initial="hidden" animate="visible" style={{ marginTop: 28, fontSize: "clamp(14px,1.6vw,17px)", color: "rgba(255,255,255,0.35)", maxWidth: 500, lineHeight: 1.7, fontWeight: 300 }}>
            Most students lose jobs not because they lack skills — but because their GitHub profile doesn't show it. PRism analyses your profile the way a recruiter would, in 15 seconds.
          </motion.p>

          <motion.div variants={fadeUp} custom={0.34} initial="hidden" animate="visible" style={{ marginTop: 44, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {session ? (
              <a href="/pr-review" className="btn-primary">Analyse my GitHub →</a>
            ) : (
              <button onClick={() => signIn("github")} className="btn-primary">Connect GitHub →</button>
            )}
            <button className="btn-secondary">See a sample report</button>
          </motion.div>

          <motion.div variants={fadeUp} custom={0.44} initial="hidden" animate="visible" style={{ marginTop: 72, width: 40, height: 1, background: "rgba(201,168,76,0.5)" }} />

          <motion.div variants={stagger} initial="hidden" animate="visible" style={{ marginTop: 40, display: "flex", gap: 56, flexWrap: "wrap" }}>
            {metrics.map((m, i) => (
              <motion.div key={i} variants={fadeUp} custom={0.5 + i * 0.1}>
                <div className="metric-num" style={{ color: i === 0 ? "#c9a84c" : "#fff" }}>{m.value}</div>
                <div className="metric-lbl">{m.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Gold divider */}
      <div style={{ padding: "0 48px", position: "relative", zIndex: 1 }}>
        <div className="gold-line" />
      </div>

      {/* PR Table — slides up on scroll */}
      <section style={{ position: "relative", zIndex: 1, padding: "72px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <ScrollReveal>
          <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden", background: "rgba(255,255,255,0.015)", backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.025)" }}>
              {["#c0392b","#f39c12","#27ae60"].map((c, i) => (
                <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.7 }} />
              ))}
              <span style={{ marginLeft: 8, fontSize: 10, color: "rgba(255,255,255,0.18)", letterSpacing: "0.06em", fontFamily: "monospace" }}>prism — eagle-eye-hr / github.com/your-username</span>
              <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(201,168,76,0.5)", fontFamily: "monospace", letterSpacing: "0.05em" }}>● live</span>
            </div>
            {/* Rows stagger in */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              {prRows.map((row, i) => (
                <motion.div key={i} variants={cardReveal} className="pr-row">
                  <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.08em", color: row.color, fontFamily: "monospace", minWidth: 32 }}>{row.risk}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>{row.title}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </ScrollReveal>
      </section>

      {/* Gold divider */}
      <div style={{ padding: "0 48px", position: "relative", zIndex: 1 }}>
        <div className="gold-line" />
      </div>

      {/* Features — stagger on scroll */}
      <section style={{ position: "relative", zIndex: 1, padding: "72px 48px 96px", maxWidth: 1200, margin: "0 auto" }}>
        <ScrollReveal>
          <span className="tag">What PRism analyses</span>
          <h2 className="h2" style={{ marginTop: 18 }}>
            Built to think like a recruiter,<br />
            <em>not a linter.</em>
          </h2>
        </ScrollReveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", backdropFilter: "blur(4px)", background: "rgba(255,255,255,0.01)", marginTop: 48 }}
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={cardReveal}
              className="feat-card"
              style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
            >
              <span style={{ fontSize: 20, marginBottom: 18, display: "block", color: "rgba(201,168,76,0.5)" }}>{f.icon}</span>
              <h3 style={{ fontSize: 13, fontWeight: 500, marginBottom: 9, color: "rgba(255,255,255,0.82)", letterSpacing: "-0.01em" }}>{f.title}</h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", lineHeight: 1.65, fontWeight: 300 }}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Gold divider */}
      <div style={{ padding: "0 48px", position: "relative", zIndex: 1 }}>
        <div className="gold-line" />
      </div>

      {/* CTA — scale + fade on scroll */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px 48px", maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          <div style={{ width: 32, height: 1, background: "#c9a84c", margin: "0 auto 40px", opacity: 0.6 }} />
          <div className="cta-h" style={{ marginBottom: 36 }}>
            See your profile through<br />
            <em>a recruiter's eyes.</em>
          </div>
          <button onClick={() => signIn("github")} className="btn-primary" style={{ fontSize: 14, padding: "15px 34px" }}>
            Connect GitHub — it&apos;s free →
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.05)", padding: "28px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 14, height: 14, border: "1px solid rgba(201,168,76,0.4)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "rgba(201,168,76,0.4)" }}>P</div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.16)", letterSpacing: "0.04em" }}>PRism AI — {new Date().getFullYear()}</span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="#" style={{ fontSize: 11, color: "rgba(255,255,255,0.16)", textDecoration: "none" }}>Privacy</a>
          <a href="https://github.com/Surya270106/PRism-AI" style={{ fontSize: 11, color: "rgba(255,255,255,0.16)", textDecoration: "none" }}>GitHub</a>
        </div>
      </footer>
    </main>
  );
}