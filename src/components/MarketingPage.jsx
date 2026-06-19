import { useState } from "react";

const testimonials = [
  {
    q: "TalentIntelligence.ai cut our screening time by 80%. The BERT semantic scores align perfectly with our actual engineering evaluations.",
    author: "Sarah Jenkins", role: "VP Talent Acquisition · NextGen AI", avatar: "SJ"
  },
  {
    q: "The anti-cheating proctoring and real-time semantic analysis solved our scaling issues. We hired 14 senior engineers in weeks, not months.",
    author: "Marcus Vance", role: "Director of Engineering · CloudScale", avatar: "MV"
  },
  {
    q: "Uploading our own domain CSV dataset was a game-changer. Adaptive questions tested candidates far more deeply than any generic platform.",
    author: "Aisha Rahman", role: "Lead Recruiter · Innovate Labs", avatar: "AR"
  }
];

const features = [
  { icon: "🧠", title: "BERT Contextual Embeddings", desc: "Maps semantic intent using bidirectional transformer vectors for deep answer comprehension.", color: "var(--primary)", glow: "rgba(78,205,196,0.12)" },
  { icon: "💬", title: "spaCy Linguistic Analysis", desc: "Analyzes POS tagging, verb-noun structures, and complex grammatical patterns in real time.", color: "var(--accent)", glow: "rgba(132,94,247,0.12)" },
  { icon: "📊", title: "TF-IDF Density Scoring", desc: "Measures localized term importance against domain-standard technical benchmarks.", color: "var(--warning)", glow: "rgba(245,158,11,0.12)" },
  { icon: "🛡️", title: "AI Identity Proctoring", desc: "Webcam face matching + tab-switch detection keeps every assessment completely tamper-proof.", color: "var(--success)", glow: "rgba(64,217,165,0.12)" }
];

const faqs = [
  { q: "How does the ATS Resume matching gateway work?", a: "Our parser tokenizes your resume structure against industry benchmarks. Candidates must achieve a 60% relevance score to unlock the technical verbal screening phase." },
  { q: "What AI models grade my answers?", a: "We combine BERT deep learning contextual embeddings, spaCy linguistic parsing, and TF-IDF vectorization with keyword correlation metrics for multi-dimensional scoring." },
  { q: "How does anti-cheating proctoring work?", a: "The portal monitors tab focus, browser blur events, and verifies candidate identity in real-time via webcam face-matching. All events are permanently logged in the recruiter's audit report." },
  { q: "Can organizations upload custom question datasets?", a: "Yes. The system supports standard CSV files mapping questions, ideal answers, and keywords, which are instantly integrated into candidate assessment pipelines." }
];

const pricingTiers = [
  {
    name: "Starter", price: "$0", period: "", desc: "Free gateway for individual skill evaluation.",
    features: ["1 Resume ATS scan", "5 practice questions", "NLP semantic scoring", "Keyword explainers"],
    btn: "Start Free", highlight: false
  },
  {
    name: "Professional", price: "$149", period: "/mo", desc: "For growing agencies scaling hiring pipelines.",
    features: ["150 resume scans / month", "Unlimited interview sessions", "Custom CSV dataset uploads", "Advanced CSV audit reports", "Proctoring logs"],
    btn: "Start Pro Trial", highlight: true
  },
  {
    name: "Enterprise", price: "Custom", period: "", desc: "Full-scale corporate pipeline with SLA backing.",
    features: ["Unlimited resume scanning", "Fine-tuned domain weights", "Identity verification", "API & Webhook integrations", "Dedicated support manager"],
    btn: "Contact Sales", highlight: false
  }
];

export default function MarketingPage({ onStartAssessment, student, onLogout }) {
  const [activeFaq, setActiveFaq] = useState(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)", overflowX: "hidden", position: "relative" }}>

      {/* ── Background orbs ── */}
      <div className="orb" style={{ width: 700, height: 700, background: "radial-gradient(circle, rgba(78,205,196,0.18) 0%, transparent 70%)", top: "-15%", left: "-12%", zIndex: 0 }} />
      <div className="orb" style={{ width: 550, height: 550, background: "radial-gradient(circle, rgba(132,94,247,0.14) 0%, transparent 70%)", top: "35%", right: "-10%", zIndex: 0 }} />
      <div className="orb" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(64,217,165,0.08) 0%, transparent 70%)", bottom: "5%", left: "20%", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── NAV ── */}
        <nav className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 1000, padding: "0 40px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,var(--primary),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎯</div>
            <span style={{ fontFamily: "var(--display)", fontWeight: 900, fontSize: 16, letterSpacing: "-0.03em" }}>
              Talent<span style={{ color: "var(--primary)" }}>Intelligence</span>.ai
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 32 }} className="mobile-hide">
            {["Features", "Pricing", "FAQ"].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="nav-link">{item}</a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {student && (
              <span style={{ fontSize: 13, color: "var(--text-muted)", marginRight: 6 }} className="mobile-hide">
                Hi, <strong style={{ color: "var(--primary)" }}>{student.name || student.email}</strong>
              </span>
            )}
            <button onClick={onStartAssessment} className="btn btn-primary" style={{ padding: "9px 20px", fontSize: 13 }}>
              {student ? "Go to Portal →" : "Start Assessment →"}
            </button>
            {student && (
              <button onClick={onLogout} className="btn btn-outline" style={{ padding: "9px 16px", fontSize: 13, cursor: "pointer" }}>
                Logout
              </button>
            )}
          </div>
        </nav>

        {/* ── HERO ── */}
        <header style={{ padding: "96px 24px 72px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div className="badge badge-primary animate-fade-in" style={{ marginBottom: 24, padding: "6px 16px" }}>
            ✨ Powered by BERT · spaCy · TF-IDF · Face Proctoring
          </div>

          <h1 className="animate-slide-up" style={{ fontSize: "clamp(2.4rem, 5.5vw, 4rem)", fontWeight: 900, marginBottom: 28, maxWidth: 860, margin: "0 auto 28px" }}>
            The Smartest Way to&nbsp;
            <span className="hero-gradient-text">Screen Engineering Talent</span>
          </h1>

          <p className="animate-slide-up stagger-1" style={{ color: "var(--text-muted)", fontSize: "clamp(15px, 2vw, 18px)", lineHeight: 1.7, maxWidth: 620, margin: "0 auto 44px" }}>
            Enterprise-grade ATS resume matching, live verbal AI proctoring, and deep NLP semantic scoring — deployed in seconds.
          </p>

          <div className="animate-slide-up stagger-2" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 72 }}>
            <button onClick={onStartAssessment} className="btn btn-primary" style={{ padding: "15px 36px", fontSize: 15 }}>
              🚀 Begin Free Assessment
            </button>
            <a href="#features" className="btn btn-outline" style={{ padding: "15px 32px", fontSize: 15 }}>
              Explore the Science
            </a>
          </div>

          {/* Stats strip */}
          <div className="glass-card animate-scale-pop stagger-3" style={{ maxWidth: 760, margin: "0 auto", padding: "6px 0", display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
            {[
              { val: "94.2%", label: "ATS Screening Accuracy", color: "var(--primary)" },
              { val: "82.5%", label: "Faster Time-to-Hire",    color: "var(--success)" },
              { val: "18K+",  label: "Assessments Completed",  color: "var(--accent)"  }
            ].map((s, i) => (
              <div key={s.label} className="stat-card" style={{ borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
                <div className="stat-val" style={{ color: s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </header>

        {/* ── FEATURES ── */}
        <section id="features" style={{ padding: "88px 24px", background: "rgba(12,15,26,0.4)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>Platform Science</div>
              <h2>Multi-Dimensional AI Grading Models</h2>
              <p style={{ color: "var(--text-muted)", marginTop: 8, maxWidth: 500, margin: "8px auto 0" }}>
                Four distinct NLP engines evaluate every candidate response simultaneously.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
              {features.map((f, i) => (
                <div key={f.title} className={`glass-card animate-slide-up stagger-${i + 1}`} style={{ padding: 28, borderTop: `3px solid ${f.color}`, background: `radial-gradient(ellipse at top,${f.glow},transparent 70%)` }}>
                  <div style={{ fontSize: 36, marginBottom: 18, filter: "drop-shadow(0 0 8px rgba(255,255,255,0.1))" }}>{f.icon}</div>
                  <h3 style={{ color: f.color, fontSize: 15, marginBottom: 10 }}>{f.title}</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF ── */}
        <section style={{ padding: "88px 24px", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <div className="section-label" style={{ marginBottom: 28 }}>Trusted by Talent Teams</div>

          <div style={{ display: "flex", gap: "12px 40px", justifyContent: "center", flexWrap: "wrap", marginBottom: 64, opacity: 0.4 }}>
            {["GOOGLE_TECH", "META_LABS", "NETFLIX_CORE", "OPENAI_GRID"].map(b => (
              <span key={b} style={{ fontSize: 14, fontWeight: 900, letterSpacing: "-0.04em", fontFamily: "var(--display)" }}>{b}</span>
            ))}
          </div>

          {/* Testimonial card */}
          <div className="glass-card" style={{ padding: "44px 52px", position: "relative", textAlign: "left" }}>
            <div style={{ fontSize: 72, lineHeight: 1, color: "var(--primary)", opacity: 0.15, position: "absolute", top: 12, left: 28, fontFamily: "serif", pointerEvents: "none" }}>"</div>

            <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--text)", marginBottom: 28, fontStyle: "italic", paddingTop: 16 }}>
              {testimonials[testimonialIdx].q}
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,var(--primary),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#060810" }}>
                  {testimonials[testimonialIdx].avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--primary)" }}>{testimonials[testimonialIdx].author}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{testimonials[testimonialIdx].role}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setTestimonialIdx(p => (p - 1 + testimonials.length) % testimonials.length)}
                  className="btn btn-ghost" style={{ width: 36, height: 36, padding: 0, borderRadius: "50%", border: "1px solid var(--border-hi)", fontSize: 14 }}>◀</button>
                <button onClick={() => setTestimonialIdx(p => (p + 1) % testimonials.length)}
                  className="btn btn-ghost" style={{ width: 36, height: 36, padding: 0, borderRadius: "50%", border: "1px solid var(--border-hi)", fontSize: 14 }}>▶</button>
              </div>
            </div>

            {/* Dots */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 24 }}>
              {testimonials.map((_, i) => (
                <div key={i} onClick={() => setTestimonialIdx(i)} style={{ width: i === testimonialIdx ? 24 : 6, height: 6, borderRadius: 99, background: i === testimonialIdx ? "var(--primary)" : "var(--border-hi)", cursor: "pointer", transition: "all 0.3s" }} />
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" style={{ padding: "88px 24px", background: "rgba(12,15,26,0.4)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>Pricing</div>
              <h2>Transparent Plans Built to Scale</h2>
              <p style={{ color: "var(--text-muted)", marginTop: 8 }}>Launch free or upgrade for full recruitment pipelines.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, alignItems: "start" }}>
              {pricingTiers.map((tier, i) => (
                <div key={tier.name} className={`glass-card pricing-card${tier.highlight ? " highlighted" : ""}`}
                  style={{ padding: "36px 32px", display: "flex", flexDirection: "column", borderRadius: "var(--radius-xl)" }}>
                  {tier.highlight && (
                    <div className="badge badge-primary" style={{ alignSelf: "flex-start", marginBottom: 16 }}>⭐ Most Popular</div>
                  )}
                  <div className="section-label" style={{ marginBottom: 8 }}>{tier.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "10px 0 6px" }}>
                    <span style={{ fontSize: "2.6rem", fontWeight: 900, fontFamily: "var(--mono)", color: tier.highlight ? "var(--primary)" : "var(--text)" }}>{tier.price}</span>
                    {tier.period && <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{tier.period}</span>}
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5, marginBottom: 28 }}>{tier.desc}</p>

                  <div style={{ flexGrow: 1, marginBottom: 32, display: "flex", flexDirection: "column", gap: 10 }}>
                    {tier.features.map(f => (
                      <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13 }}>
                        <span style={{ color: "var(--success)", marginTop: 1, flexShrink: 0 }}>✓</span>
                        <span style={{ color: "var(--text-muted)" }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={onStartAssessment} className={tier.highlight ? "btn btn-primary" : "btn btn-outline"} style={{ width: "100%" }}>
                    {tier.btn}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" style={{ padding: "88px 24px", maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>FAQ</div>
            <h2>Frequently Asked Questions</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {faqs.map((faq, i) => {
              const open = activeFaq === i;
              return (
                <div key={faq.q} className="glass-card faq-item"
                  style={{ borderRadius: "var(--radius-md)", overflow: "hidden", border: `1px solid ${open ? "var(--border-glow)" : "var(--border)"}` }}>
                  <div onClick={() => setActiveFaq(open ? null : i)}
                    style={{ padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: open ? "var(--primary)" : "var(--text)" }}>{faq.q}</span>
                    <span style={{ fontSize: 18, color: "var(--text-muted)", flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(45deg)" : "none" }}>+</span>
                  </div>
                  {open && (
                    <div className="animate-fade-in" style={{ padding: "0 24px 20px", color: "var(--text-muted)", fontSize: 13, lineHeight: 1.7, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section style={{ padding: "72px 24px", textAlign: "center", borderTop: "1px solid var(--border)" }}>
          <div className="glass-card" style={{ maxWidth: 680, margin: "0 auto", padding: "52px 48px", background: "radial-gradient(ellipse at top left,rgba(78,205,196,0.08),transparent 60%),radial-gradient(ellipse at bottom right,rgba(132,94,247,0.08),transparent 60%)" }}>
            <h2 style={{ fontSize: "2rem", marginBottom: 16 }}>Ready to Hire 10× Faster?</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 36, fontSize: 15 }}>Launch a free technical assessment for your next candidate right now.</p>
            <button onClick={onStartAssessment} className="btn btn-primary" style={{ padding: "16px 40px", fontSize: 16 }}>
              🚀 Start Your First Assessment Free
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "52px 40px 32px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(4, 1fr)", gap: 40, marginBottom: 40 }} className="mobile-hide">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,var(--primary),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🎯</div>
                  <span style={{ fontWeight: 900, fontSize: 14, fontFamily: "var(--display)" }}>TalentIntelligence.ai</span>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: 12, lineHeight: 1.6 }}>Next-generation applicant tracking with real-time semantic assessment grids.</p>
              </div>
              {[
                ["Platform",   ["BERT Analytics", "spaCy Parsing", "ATS Scanner", "API Sandbox"]],
                ["Resources",  ["Science Library", "API Reference", "Status Page", "Help Center"]],
                ["Enterprise", ["Client Services", "Custom Weights", "GDPR Compliance", "SLA Auditing"]],
                ["Legal",      ["Terms of Use", "Privacy Policy", "Proctoring Notice", "Cookie Policy"]]
              ].map(([col, links]) => (
                <div key={col}>
                  <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 11, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.06em" }}>{col}</div>
                  {links.map(l => <div key={l} style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, cursor: "pointer" }}>{l}</div>)}
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 12, color: "var(--text-muted)" }}>
              <span>© 2026 TalentIntelligence.ai — Secure proctoring active.</span>
              <div style={{ display: "flex", gap: 20 }}>
                {["Twitter", "LinkedIn", "GitHub"].map(s => <span key={s} style={{ cursor: "pointer" }}>{s}</span>)}
              </div>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
