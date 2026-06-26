"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] },
  }),
};

const stagger: any = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardReveal: any = {
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
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 64]);
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
    { risk: "HIGH", title: "9 of 14 repos are tutorial clones — originality score: 32%", color: "#e74c3c" },
    { risk: "HIGH", title: "0 deployed projects detected — recruiters need live proof", color: "#e74c3c" },
    { risk: "MED",  title: "Resume claims React expert — only 1 React repo found", color: "#c9a84c" },
    { risk: "LOW",  title: "No pinned repositories — weakest repos shown by default", color: "rgba(255,255,255,0.25)" },
  ];

  return (
    <main className="min-h-screen bg-[#060606] text-white overflow-x-hidden relative" style={{ fontFamily: "'DM Sans', sans-serif" }}>
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

        .h1{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(2rem,5vw,4.5rem);line-height:1.0;letter-spacing:-0.03em;font-weight:400}
        .h1 em{font-style:italic;color:#c9a84c}
        .h2{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(2rem,4vw,3.5rem);font-weight:400;line-height:1.1;letter-spacing:-0.025em}
        .h2 em{font-style:italic;color:rgba(201,168,76,0.55)}
        .cta-h{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(2.5rem,5vw,4.5rem);font-weight:400;line-height:1.05;letter-spacing:-0.03em}
        .cta-h em{font-style:italic;color:rgba(201,168,76,0.4)}

        .nav-link{font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:0.06em;text-transform:uppercase;cursor:pointer;transition:color 150ms ease-in-out;text-decoration:none}
        .nav-link:hover{color:rgba(255,255,255,0.8)}

        .btn-primary{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#c9a84c;color:#060606;font-size:13px;font-weight:500;border:none;border-radius:4px;cursor:pointer;font-family:inherit;transition:opacity 150ms ease-in-out,transform 150ms cubic-bezier(0.23,1,0.32,1);letter-spacing:0.01em}
        .btn-primary:hover{opacity:0.9}
        .btn-primary:active{transform:scale(0.98)}
        .btn-secondary{display:inline-flex;align-items:center;padding:12px 24px;background:transparent;color:rgba(255,255,255,0.4);font-size:13px;border:1px solid rgba(255,255,255,0.1);border-radius:4px;cursor:pointer;font-family:inherit;transition:color 150ms ease-in-out,border-color 150ms ease-in-out}
        .btn-secondary:hover{color:#fff;border-color:rgba(255,255,255,0.25)}

        .tag{display:inline-block;padding:4px 12px;border:1px solid rgba(201,168,76,0.25);border-radius:4px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(201,168,76,0.6)}

        .metric-num{font-family:'DM Serif Display',Georgia,serif;font-size:clamp(2.2rem,4vw,3.5rem);font-weight:400;line-height:1}
        .metric-lbl{margin-top:4px;font-size:11px;color:rgba(255,255,255,0.28);letter-spacing:0.08em;text-transform:uppercase}

        .feat-card{padding:32px;transition:background 150ms ease-in-out}
        .feat-card:hover{background:rgba(201,168,76,0.04)}

        .pr-row{display:flex;align-items:center;gap:16px;padding:12px 24px;border-bottom:1px solid rgba(255,255,255,0.04);transition:background 150ms ease-in-out;cursor:default}
        .pr-row:last-child{border-bottom:none}
        .pr-row:hover{background:rgba(255,255,255,0.025)}

        .gold-line{height:1px;background:linear-gradient(to right,transparent,rgba(201,168,76,0.3),transparent)}
      `}</style>

      {/* Aurora Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="aurora-layer absolute -inset-4" />
      </div>

      {/* Mouse Orb (Kept minimal as requested) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)",
          transform: `translate(${mousePos.x - 200}px, ${mousePos.y - 200}px)`,
          transition: "transform 1s cubic-bezier(0.23,1,0.32,1)",
        }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between py-6 px-12 border-b border-white/5 bg-[#060606]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border border-[#c9a84c] rounded flex items-center justify-center text-[9px] font-medium text-[#c9a84c]">P</div>
          <span className="text-sm font-medium tracking-wide text-white/90">PRism</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="/pr-review" className="nav-link">Reviews</a>
          <a href="/settings" className="nav-link">Settings</a>
          {session ? (
            <a href="/pr-review" className="btn-primary px-4 py-2 text-xs">Open app →</a>
          ) : (
            <button onClick={() => signIn("github")} className="btn-primary px-4 py-2 text-xs">Connect GitHub →</button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative z-10 flex flex-col justify-center min-h-screen pt-32 px-12 pb-20 max-w-6xl mx-auto">
        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <motion.div variants={fadeUp} custom={0} initial="hidden" animate="visible">
            <span className="tag">Eagle Eye HR — Career Intelligence</span>
          </motion.div>

          <motion.h1 className="h1 mt-8 max-w-4xl" variants={fadeUp} custom={0.1} initial="hidden" animate="visible">
            Find what's missing<br />in your GitHub <em>before<br />recruiters do.</em>
          </motion.h1>

          <motion.p variants={fadeUp} custom={0.22} initial="hidden" animate="visible" className="mt-8 text-base md:text-lg text-white/35 max-w-xl leading-relaxed font-light">
            Most students lose jobs not because they lack skills — but because their GitHub profile doesn't show it. PRism analyses your profile the way a recruiter would, in 15 seconds.
          </motion.p>

          <motion.div variants={fadeUp} custom={0.34} initial="hidden" animate="visible" className="mt-12 flex flex-wrap gap-4">
            {session ? (
              <a href="/pr-review" className="btn-primary">Analyse my GitHub →</a>
            ) : (
              <button onClick={() => signIn("github")} className="btn-primary">Connect GitHub →</button>
            )}
            <button className="btn-secondary">See a sample report</button>
          </motion.div>

          <motion.div variants={fadeUp} custom={0.44} initial="hidden" animate="visible" className="mt-16 w-10 h-px bg-[#c9a84c]/50" />

          <motion.div variants={stagger} initial="hidden" animate="visible" className="mt-12 flex flex-wrap gap-16">
            {metrics.map((m, i) => (
              <motion.div key={i} variants={fadeUp} custom={0.5 + i * 0.1}>
                <div className="metric-num" style={{ color: i === 0 ? "#c9a84c" : "#fff" }}>{m.value}</div>
                <div className="metric-lbl">{m.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Gold Divider */}
      <div className="px-12 relative z-10">
        <div className="gold-line" />
      </div>

      {/* PR Table Section */}
      <section className="relative z-10 py-24 px-12 max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="border border-white/5 rounded-lg overflow-hidden bg-white/5 backdrop-blur-md">
            <div className="flex items-center gap-2 px-6 py-3 border-b border-white/5 bg-white/5">
              {["#c0392b","#f39c12","#27ae60"].map((c, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full opacity-70" style={{ background: c }} />
              ))}
              <span className="ml-2 text-[10px] text-white/20 tracking-wider font-mono">prism — eagle-eye-hr / github.com/your-username</span>
              <span className="ml-auto text-[10px] text-[#c9a84c]/50 font-mono tracking-wider">● live</span>
            </div>
            
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-64px" }}
            >
              {prRows.map((row, i) => (
                <motion.div key={i} variants={cardReveal} className="pr-row">
                  <span className="text-[10px] font-medium tracking-widest font-mono min-w-[40px]" style={{ color: row.color }}>{row.risk}</span>
                  <span className="text-xs text-white/45 font-mono">{row.title}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </ScrollReveal>
      </section>

      {/* Gold Divider */}
      <div className="px-12 relative z-10">
        <div className="gold-line" />
      </div>

      {/* Features Section */}
      <section className="relative z-10 pt-24 px-12 pb-32 max-w-6xl mx-auto">
        <ScrollReveal>
          <span className="tag">What PRism analyses</span>
          <h2 className="h2 mt-6">
            Built to think like a recruiter,<br />
            <em>not a linter.</em>
          </h2>
        </ScrollReveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-64px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-white/5 rounded-lg overflow-hidden backdrop-blur-sm bg-white/5 mt-16"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={cardReveal}
              className="feat-card border-r border-white/5 last:border-r-0"
            >
              <span className="text-xl mb-6 block text-[#c9a84c]/50">{f.icon}</span>
              <h3 className="text-sm font-medium mb-3 text-white/80 tracking-tight">{f.title}</h3>
              <p className="text-xs text-white/30 leading-relaxed font-light">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Gold Divider */}
      <div className="px-12 relative z-10">
        <div className="gold-line" />
      </div>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-12 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 24 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-64px" }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="w-8 h-px bg-[#c9a84c]/60 mx-auto mb-10" />
          <div className="cta-h mb-10">
            See your profile through<br />
            <em>a recruiter's eyes.</em>
          </div>
          <button onClick={() => signIn("github")} className="btn-primary text-sm px-8 py-4">
            Connect GitHub — it&apos;s free →
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-[#c9a84c]/40 rounded flex items-center justify-center text-[7px] text-[#c9a84c]/40">P</div>
          <span className="text-xs text-white/20 tracking-wider">PRism AI — {new Date().getFullYear()}</span>
        </div>
        <div className="flex gap-8">
          <a href="#" className="text-xs text-white/20 no-underline hover:text-white/40 transition-colors">Privacy</a>
          <a href="https://github.com/Surya270106/PRism-AI" className="text-xs text-white/20 no-underline hover:text-white/40 transition-colors">GitHub</a>
        </div>
      </footer>
    </main>
  );
}