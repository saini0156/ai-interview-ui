import { useState, useEffect } from "react";
import { fetchResultsByEmail } from "../firebase";
import jsPDF from "jspdf";

const T = {
  bg:        "var(--bg)",
  surface:   "var(--surface)",
  surfaceUp: "var(--surface-up)",
  primary:   "var(--primary)",
  accent:    "var(--accent)",
  success:   "var(--success)",
  warning:   "var(--warning)",
  danger:    "var(--danger)",
  text:      "var(--text)",
  muted:     "var(--text-muted)",
  mono:      "var(--mono)"
};

const PASS_THRESHOLD = 0.40;

function ScoreBar({ label, value, color }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.text }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: T.mono }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

export default function StudentDashboard({ student, onBack }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!student?.email) return;
    setLoading(true);
    fetchResultsByEmail(student.email)
      .then(data => {
        setResults(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard load failed:", err);
        setLoading(false);
      });
  }, [student]);

  const stats = (() => {
    if (!results.length) return { avgScore: 0, passRate: 0, totalTests: 0, cleanTests: 0 };
    const total = results.length;
    const passed = results.filter(r => r.qualified).length;
    const clean = results.filter(r => ((r.violations || 0) + (r.multiFaceWarnings || 0) + (r.identityViolations || 0)) === 0).length;
    const totalScore = results.reduce((acc, curr) => acc + (curr.avgScore || 0), 0);
    return {
      totalTests: total,
      passRate: Math.round((passed / total) * 100),
      cleanTests: clean,
      avgScore: Math.round((totalScore / total) * 100)
    };
  })();

  const downloadPDF = async (record) => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      
      doc.setFillColor(15, 23, 42); doc.rect(0, 0, W, 44, "F");
      doc.setTextColor(255,255,255);
      doc.setFontSize(20); doc.setFont("helvetica","bold");
      doc.text("AI INTERVIEW REPORT", W/2, 16, { align: "center" });
      doc.setFontSize(10); doc.setFont("helvetica","normal");
      doc.text(`${record.name}  ·  ${record.field}  ·  ${new Date(record.timestamp?.seconds * 1000 || Date.now()).toLocaleDateString()}`, W/2, 26, { align: "center" });
      
      doc.setFillColor(record.qualified ? 52 : 244, record.qualified ? 211 : 63, record.qualified ? 153 : 94);
      doc.roundedRect(W-52, 6, 44, 20, 3, 3, "F");
      doc.setTextColor(0,0,0); doc.setFontSize(13); doc.setFont("helvetica","bold");
      doc.text(record.qualified ? "PASSED" : "FAILED", W-30, 19, { align: "center" });
      
      doc.setTextColor(15,23,42);
      doc.setFontSize(11); doc.setFont("helvetica","normal");
      doc.text(`Overall Score: ${Math.round(record.avgScore*100)}%`, 15, 56);
      doc.text(`Grade: ${record.grade || "B"}`, 15, 64);
      doc.text(`Questions: ${record.scores?.length || 0}`, 15, 72);
      doc.text(`Violations: ${(record.violations || 0) + (record.identityViolations || 0)}  |  Confidence: ${Math.round((record.avgConfidence || 1)*100)}%`, 15, 80);
      
      doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.text("Question Breakdown", 15, 96);
      doc.setDrawColor(220,220,220); doc.line(15, 99, W-15, 99);
      let y = 106;
      (record.scores || []).forEach((s, i) => {
        if (y > H - 30) { doc.addPage(); y = 20; }
        const pct = Math.round(s.final_score * 100);
        const st = s.skipped ? "Skipped" : s.timeout ? "Timeout" : pct >= 40 ? "Pass" : "Fail";
        doc.setFont("helvetica","bold"); doc.setFontSize(10);
        doc.setTextColor(st === "Pass" ? 52 : st === "Fail" ? 244 : 100, st === "Pass" ? 211 : st === "Fail" ? 63 : 100, st === "Pass" ? 153 : st === "Fail" ? 94 : 100);
        doc.text(`Q${i+1} [${st}] ${pct}%`, 15, y);
        doc.setTextColor(40,40,40); doc.setFont("helvetica","normal"); doc.setFontSize(9);
        const qLines = doc.splitTextToSize(s.question || "Unknown Question", W-30);
        doc.text(qLines, 15, y+5);
        y += 5 + qLines.length * 4;
        if (s.feedback) {
          const fbLines = doc.splitTextToSize(`Feedback: ${s.feedback}`, W-30);
          doc.setTextColor(100,100,100);
          doc.text(fbLines, 15, y+2);
          y += 2 + fbLines.length * 4;
        }
        doc.setDrawColor(240,240,240); doc.line(15, y+3, W-15, y+3);
        y += 8;
      });
      doc.save(`${record.name.replace(/\s+/g,"_")}_Assessment_Report.pdf`);
    } catch(e) { console.error("PDF download failed:", e); }
    setPdfLoading(false);
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="animate-fade-in" style={{ minHeight: "100vh", background: T.bg, color: T.text, padding: "40px 24px", position: "relative", overflowX: "hidden" }}>
      {/* Background orbs */}
      <div style={{ position: "fixed", top: "-10%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-10%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 10 }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36, borderBottom: "1px solid var(--border)", paddingBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, background: "linear-gradient(to bottom, #ffffff 40%, rgba(255, 255, 255, 0.7) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Student Assessment Portal
            </h1>
            <p style={{ color: T.muted, fontSize: 13.5, marginTop: 4 }}>
              Account: <strong style={{ color: T.primary }}>{student?.email}</strong>
            </p>
          </div>
          <button onClick={onBack} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>
            ← Back to Gateway
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 16 }}>
            <div className="animate-spin" style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: T.primary, borderRadius: "50%" }} />
            <span style={{ color: T.muted, fontSize: 13.5 }}>Fetching past assessments from Firestore...</span>
          </div>
        ) : selectedRecord ? (
          /* Detailed Assessment Audit Record View */
          <div className="glass-card animate-slide-up" style={{ padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, borderBottom: "1px solid var(--border)", paddingBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>📋</span>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 850, margin: 0 }}>{selectedRecord.field} Record</h2>
                  <div style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>Tested on {formatDate(selectedRecord.timestamp)}</div>
                </div>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 12.5 }}>
                ✕ Back to Dashboard
              </button>
            </div>

            {/* Score Overview and Gauges */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
              <div className="glass-card" style={{ padding: 20, background: "rgba(255,255,255,0.01)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Compliance Metrics</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: T.muted }}>Grade:</span>
                    <span style={{ fontWeight: 800, color: selectedRecord.qualified ? T.success : T.danger }}>{selectedRecord.grade || "B"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: T.muted }}>Status:</span>
                    <span style={{ fontWeight: 800, color: selectedRecord.qualified ? T.success : T.danger }}>
                      {selectedRecord.qualified ? "PASSED" : "FAILED"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: T.muted }}>Proctoring Alerts:</span>
                    <span style={{ fontWeight: 800, color: ((selectedRecord.violations || 0) + (selectedRecord.multiFaceWarnings || 0)) > 0 ? T.danger : T.success }}>
                      {(selectedRecord.violations || 0) + (selectedRecord.multiFaceWarnings || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: 20, background: "rgba(255,255,255,0.01)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Overall Grade Score</div>
                    <div style={{ fontSize: 32, fontWeight: 950, color: selectedRecord.qualified ? T.success : T.danger, marginTop: 4 }}>
                      {Math.round((selectedRecord.avgScore || 0) * 100)}%
                    </div>
                  </div>
                  <button onClick={() => downloadPDF(selectedRecord)} disabled={pdfLoading} className="btn btn-primary" style={{ padding: "10px 18px", borderRadius: 8, fontSize: 12.5 }}>
                    {pdfLoading ? "Generating..." : "📄 Download PDF"}
                  </button>
                </div>
              </div>
            </div>

            {/* Question breakdown accordion */}
            <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Question Breakdown & Feedback</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(selectedRecord.scores || []).map((s, i) => {
                const open = expandedQuestion === i;
                const pct = Math.round(s.final_score * 100);
                const pass = s.final_score >= PASS_THRESHOLD;
                const statusColor = s.timeout ? T.warning : s.skipped ? T.muted : pass ? T.success : T.danger;
                const statusLabel = s.timeout ? "⏰ Timeout" : s.skipped ? "⏭ Skipped" : pass ? "✓ Pass" : "✗ Fail";
                return (
                  <div key={i} className="glass-card" style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${open ? "var(--border-hi)" : "var(--border)"}` }}>
                    <div onClick={() => setExpandedQuestion(open ? null : i)} style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, minWidth: 28 }}>Q{i+1}</span>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: T.text }}>
                        {s.question.length > 70 ? s.question.slice(0, 70) + "…" : s.question}
                      </div>
                      <span style={{ fontSize: 12, color: statusColor, fontWeight: 700, minWidth: 80, textAlign: "right" }}>{statusLabel}</span>
                      <span style={{ fontFamily: T.mono, fontSize: 14, fontWeight: 800, color: statusColor, minWidth: 44, textAlign: "right" }}>{pct}%</span>
                      <span style={{ color: T.muted, fontSize: 12 }}>{open ? "▲" : "▼"}</span>
                    </div>

                    {open && (
                      <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border)" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px", marginTop: 14 }}>
                          <ScoreBar label="Semantic Match (BERT)" value={s.bert_score ?? 0} color={T.primary} />
                          <ScoreBar label="Linguistic Structure (spaCy)" value={s.spacy_score ?? 0} color={T.accent} />
                          <ScoreBar label="Keyword Densities" value={s.keyword_score ?? 0} color={T.success} />
                        </div>
                        {s.feedback && (
                          <p style={{ color: T.muted, fontSize: 12, margin: "14px 0 0", fontStyle: "italic", background: "rgba(255,255,255,0.01)", padding: "10px 12px", borderRadius: 8, borderLeft: `2px solid ${statusColor}` }}>
                            💡 {s.feedback}
                          </p>
                        )}
                        {s.userAnswer && (
                          <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(0,0,0,0.15)", borderRadius: 8, fontSize: 12 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, marginBottom: 4, letterSpacing: "0.04em" }}>YOUR RESPONSE:</div>
                            <div style={{ color: T.muted, fontStyle: "italic" }}>"{s.userAnswer}"</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Dashboard Main List */
          <div className="animate-slide-up">
            {/* Stats Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Total Tests", val: stats.totalTests, icon: "📋", color: T.text },
                { label: "Average Score", val: `${stats.avgScore}%`, icon: "📈", color: T.primary },
                { label: "Pass Rate", val: `${stats.passRate}%`, icon: "✅", color: T.success },
                { label: "Clean Records", val: stats.cleanTests, icon: "🛡️", color: T.accent }
              ].map(card => (
                <div key={card.label} className="glass-card" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{card.label}</span>
                    <span style={{ fontSize: 18 }}>{card.icon}</span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 950, color: card.color, fontFamily: T.mono }}>{card.val}</div>
                </div>
              ))}
            </div>

            {/* Assessment History Table */}
            <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0, letterSpacing: "0.02em" }}>ASSESSMENT HISTORY</h2>
                <span className="badge badge-primary" style={{ padding: "4px 10px", fontWeight: 700, fontSize: 11 }}>{results.length} Recorded</span>
              </div>

              {!results.length ? (
                <div style={{ padding: 60, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
                  <div style={{ color: T.muted, fontSize: 13.5 }}>You haven't completed any technical assessments yet.</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-hi)", background: "rgba(255,255,255,0.01)" }}>
                        {["Date", "Target Role", "Score", "Status", "Violations", ""].map(label => (
                          <th key={label} style={{ padding: "14px 20px", fontWeight: 800, color: T.muted, textAlign: "left", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => {
                        const score = Math.round((r.avgScore || 0) * 100);
                        const viols = (r.violations || 0) + (r.multiFaceWarnings || 0);
                        return (
                          <tr key={r.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }} className="hover-row">
                            <td style={{ padding: "14px 20px", color: T.muted, fontFamily: T.mono, fontSize: 11.5 }}>
                              {formatDate(r.timestamp)}
                            </td>
                            <td style={{ padding: "14px 20px", fontWeight: 700 }}>
                              {r.field}
                            </td>
                            <td style={{ padding: "14px 20px", fontFamily: T.mono, fontWeight: 800, color: r.qualified ? T.success : T.danger }}>
                              {score}%
                            </td>
                            <td style={{ padding: "14px 20px" }}>
                              <span className={`badge ${r.qualified ? "badge-success" : "badge-danger"}`} style={{ padding: "4px 8px", fontSize: 10, fontWeight: 800 }}>
                                {r.qualified ? "PASSED" : "FAILED"}
                              </span>
                            </td>
                            <td style={{ padding: "14px 20px" }}>
                              {viols > 0 ? (
                                <span className="badge badge-danger" style={{ padding: "4px 8px", fontSize: 10, fontWeight: 800 }}>🚨 {viols}</span>
                              ) : (
                                <span className="badge badge-success" style={{ padding: "4px 8px", fontSize: 10, fontWeight: 800 }}>🛡️ Clean</span>
                              )}
                            </td>
                            <td style={{ padding: "14px 20px", textAlign: "right" }}>
                              <button onClick={() => setSelectedRecord(r)} className="btn btn-outline" style={{ padding: "6px 12px", fontSize: 11.5, borderRadius: 8 }}>
                                View Details ➔
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
