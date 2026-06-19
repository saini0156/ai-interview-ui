import React, { useState, useEffect, useMemo } from "react";
import { auth, isConfigured, fetchAllResults, deleteResult, deleteAllResults } from "./firebase";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend
} from "recharts";

/* ─── Mini helpers ───────────────────────────────────────────────── */
const fmt = (d) =>
  d?.seconds
    ? new Date(d.seconds * 1000).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      })
    : "—";

const pct = (n) => `${Math.round((n || 0) * 100)}%`;

const gradeColor = (g) =>
  ({ A: "#40D9A5", B: "#4ECDC4", C: "#F59E0B", D: "#F45866", F: "#F45866" }[g] || "#717A9C");

const COLORS_PIE = ["#4ECDC4", "#845EF7", "#40D9A5", "#F59E0B", "#F45866", "#3B82F6"];

/* ─── Custom Recharts Tooltip ────────────────────────────────────── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(12,15,26,0.95)", border: "1px solid var(--border-hi)",
      borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: "var(--shadow-md)"
    }}>
      {label && <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || "var(--primary)", fontWeight: 700 }}>
          {p.name}: {p.value}{typeof p.value === "number" && p.name?.includes("%") ? "" : ""}
        </div>
      ))}
    </div>
  );
}

/* ─── Stat card ──────────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, color, trend }) {
  return (
    <div className="glass-card" style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 28, lineHeight: 1 }}>{icon}</div>
        {trend != null && (
          <div style={{
            fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
            background: trend >= 0 ? "var(--success-dim)" : "var(--danger-dim)",
            color: trend >= 0 ? "var(--success)" : "var(--danger)"
          }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontFamily: "var(--mono)", fontSize: "1.9rem", fontWeight: 800, color: color || "var(--text)", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{sub}</div>}
    </div>
  );
}

/* ─── Score bar ──────────────────────────────────────────────────── */
function ScoreBar({ value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, background: "var(--surface-hi)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, height: "100%", background: color || "var(--primary)", borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--text-muted)", width: 34, textAlign: "right" }}>{value}%</span>
    </div>
  );
}

/* ─── Delete confirm modal ───────────────────────────────────────── */
function DeleteModal({ type, onCancel, onConfirm, loading }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20
    }}>
      <div className="glass-card animate-scale-pop" style={{ maxWidth: 420, width: "100%", padding: 36, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h3 style={{ color: "var(--danger)", marginBottom: 12 }}>
          {type === "all" ? "Delete ALL Records?" : "Delete This Record?"}
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 28, lineHeight: 1.6 }}>
          {type === "all"
            ? "This will permanently delete ALL interview results from Firebase. This action cannot be undone."
            : "This will permanently delete this candidate record from Firebase."}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={onCancel} className="btn btn-outline" disabled={loading}>Cancel</button>
          <button onClick={onConfirm} className="btn btn-danger" disabled={loading}>
            {loading ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Admin Component ───────────────────────────────────────── */
export default function Admin() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [results, setResults] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [filterText, setFilterText] = useState("");
  const [filterField, setFilterField] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortKey, setSortKey] = useState("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [activeTab, setActiveTab] = useState("table"); // table | analytics
  const [deleteModal, setDeleteModal] = useState(null); // null | { type, id? }
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!isConfigured) {
      setUser({ email: "sandbox-admin@company.com", displayName: "Sandbox Admin" });
      setLoading(false);
      loadResults();
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) loadResults();
    });
    return () => unsub();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadResults = async () => {
    setFetching(true);
    const data = await fetchAllResults();
    setResults(data);
    setFetching(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setLoginError("Invalid admin credentials. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDeleteOne = async () => {
    setDeleteLoading(true);
    const ok = await deleteResult(deleteModal.id);
    if (ok) {
      setResults(prev => prev.filter(r => r.id !== deleteModal.id));
      showToast("Record deleted successfully.");
    } else {
      showToast("Failed to delete record.", "error");
    }
    setDeleteLoading(false);
    setDeleteModal(null);
    setExpandedRow(null);
  };

  const handleDeleteAll = async () => {
    setDeleteLoading(true);
    const ok = await deleteAllResults();
    if (ok) {
      setResults([]);
      showToast("All records deleted.");
    } else {
      showToast("Failed to delete records.", "error");
    }
    setDeleteLoading(false);
    setDeleteModal(null);
  };

  const exportCSV = () => {
    const headers = ["Date", "Name", "Email", "Field", "Score", "Grade", "Status", "Tab Violations", "Identity Mismatches", "Multi-Face", "Look-Aways", "Avg Confidence", "Filler Words"];
    const rows = filteredResults.map(r => [
      fmt(r.timestamp),
      `"${r.name || ""}"`,
      `"${r.email || "anonymous"}"`,
      r.field || "",
      Math.round((r.avgScore || 0) * 100) + "%", r.grade || "—",
      r.qualified ? "Pass" : "Fail",
      r.violations || 0, r.identityViolations || 0, r.multiFaceWarnings || 0,
      r.lookAwayCount || 0,
      r.avgConfidence ? Math.round(r.avgConfidence * 100) + "%" : "100%",
      r.totalFillers || 0
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `TalentIntelligence_Results_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast("CSV exported successfully.");
  };

  /* ── Derived data ── */
  const domains = useMemo(() => ["all", ...new Set(results.map(r => r.field).filter(Boolean))], [results]);

  const filteredResults = useMemo(() => {
    let arr = results.filter(r => {
      const txt = filterText.toLowerCase();
      const matchText = !txt || r.name?.toLowerCase().includes(txt) || r.field?.toLowerCase().includes(txt) || r.email?.toLowerCase().includes(txt);
      const matchField = filterField === "all" || r.field === filterField;
      const matchStatus = filterStatus === "all" || (filterStatus === "pass" ? r.qualified : !r.qualified);
      return matchText && matchField && matchStatus;
    });
    arr = [...arr].sort((a, b) => {
      let va, vb;
      if (sortKey === "date") { va = a.timestamp?.seconds || 0; vb = b.timestamp?.seconds || 0; }
      else if (sortKey === "score") { va = a.avgScore || 0; vb = b.avgScore || 0; }
      else if (sortKey === "name") { va = a.name || ""; vb = b.name || ""; }
      else { va = 0; vb = 0; }
      if (typeof va === "string") return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortAsc ? va - vb : vb - va;
    });
    return arr;
  }, [results, filterText, filterField, filterStatus, sortKey, sortAsc]);

  /* ── Analytics data ── */
  const analytics = useMemo(() => {
    const totalPassed = results.filter(r => r.qualified).length;
    const passRate = results.length ? Math.round((totalPassed / results.length) * 100) : 0;
    const totalViolations = results.reduce((a, r) => a + (r.violations || 0) + (r.multiFaceWarnings || 0) + (r.identityViolations || 0), 0);
    const avgScore = results.length ? Math.round(results.reduce((a, r) => a + (r.avgScore || 0), 0) / results.length * 100) : 0;

    // Scores by domain
    const byDomain = {};
    results.forEach(r => {
      if (!r.field) return;
      if (!byDomain[r.field]) byDomain[r.field] = { total: 0, count: 0, pass: 0 };
      byDomain[r.field].total += (r.avgScore || 0);
      byDomain[r.field].count++;
      if (r.qualified) byDomain[r.field].pass++;
    });
    const domainChart = Object.entries(byDomain).map(([name, d]) => ({
      name, avgScore: Math.round(d.total / d.count * 100), passRate: Math.round(d.pass / d.count * 100), count: d.count
    }));

    // Grade distribution
    const gradeCount = {};
    results.forEach(r => { const g = r.grade || "N/A"; gradeCount[g] = (gradeCount[g] || 0) + 1; });
    const gradeChart = Object.entries(gradeCount).map(([name, value]) => ({ name, value }));

    // Score over time (last 10)
    const timeChart = results.slice(0, 10).reverse().map((r, i) => ({
      i: i + 1,
      score: Math.round((r.avgScore || 0) * 100),
      label: r.name?.split(" ")[0] || `C${i + 1}`
    }));

    // Violation breakdown
    const violChart = [
      { name: "Tab Switches", value: results.reduce((a, r) => a + (r.violations || 0), 0) },
      { name: "Identity Mismatch", value: results.reduce((a, r) => a + (r.identityViolations || 0), 0) },
      { name: "Multi-Face", value: results.reduce((a, r) => a + (r.multiFaceWarnings || 0), 0) },
      { name: "Look-Aways", value: results.reduce((a, r) => a + (r.lookAwayCount || 0), 0) },
    ].filter(v => v.value > 0);

    return { totalPassed, passRate, totalViolations, avgScore, domainChart, gradeChart, timeChart, violChart };
  }, [results]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(false); }
  };
  const SortIcon = ({ k }) => sortKey === k ? (sortAsc ? " ↑" : " ↓") : " ↕";

  /* ─────────────────────────────── EARLY RETURNS ───────────────── */


  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", gap: 14, color: "var(--primary)" }}>
        <div className="animate-spin" style={{ width: 24, height: 24, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%" }} />
        <span style={{ fontWeight: 600 }}>Authenticating…</span>
      </div>
    );
  }

  /* ─── LOGIN SCREEN ─────────────────────────────────────────────── */
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
        {/* Orbs */}
        <div className="orb" style={{ width: 500, height: 500, background: "radial-gradient(circle,rgba(78,205,196,0.12) 0%,transparent 70%)", top: "-10%", left: "-10%" }} />
        <div className="orb" style={{ width: 400, height: 400, background: "radial-gradient(circle,rgba(132,94,247,0.10) 0%,transparent 70%)", bottom: "-10%", right: "-5%" }} />

        <form onSubmit={handleLogin} className="glass-card animate-slide-up" style={{ width: "100%", maxWidth: 420, padding: 44 }}>
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,var(--primary),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 20px" }}>🛡️</div>
            <h2 style={{ margin: 0, fontSize: 22 }}>Admin Portal</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 8 }}>TalentIntelligence.ai · Secure Access</p>
          </div>

          {loginError && (
            <div className="animate-fade-in" style={{ background: "var(--danger-dim)", color: "var(--danger)", padding: "12px 16px", borderRadius: 10, fontSize: 13, marginBottom: 20, border: "1px solid rgba(244,88,102,0.3)", display: "flex", gap: 8, alignItems: "center" }}>
              ⚠️ {loginError}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="section-label" style={{ display: "block", marginBottom: 8 }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="input-field" placeholder="admin@company.com" autoComplete="email" />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label className="section-label" style={{ display: "block", marginBottom: 8 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="input-field" placeholder="••••••••" autoComplete="current-password" />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", fontSize: 15 }} disabled={loginLoading}>
            {loginLoading ? <><span className="animate-spin" style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#000", borderRadius: "50%", display: "inline-block" }} /> Signing in…</> : "🔐 Secure Sign In"}
          </button>

          <button type="button" onClick={() => {
            setUser({ email: "sandbox-admin@company.com", displayName: "Sandbox Admin" });
            loadResults();
          }} className="btn btn-outline" style={{ width: "100%", fontSize: 13.5, marginTop: 12, padding: "10px", borderRadius: 10, cursor: "pointer" }}>
            ⚡ Bypass to Sandbox Admin (Local Storage Mode)
          </button>

          <div style={{ marginTop: 20, textAlign: "center" }}>
            <button type="button" onClick={() => window.location.href = "/"} className="btn btn-ghost" style={{ fontSize: 13 }}>← Back to Interview App</button>
          </div>
        </form>
      </div>
    );
  }

  /* ─── MAIN DASHBOARD ───────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>

      {/* Toast */}
      {toast && (
        <div className="animate-slide-up" style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9998,
          background: toast.type === "error" ? "var(--danger)" : "var(--success)",
          color: toast.type === "error" ? "#fff" : "#060810",
          padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700,
          boxShadow: "var(--shadow-lg)", display: "flex", alignItems: "center", gap: 8
        }}>
          {toast.type === "error" ? "❌" : "✅"} {toast.msg}
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <DeleteModal
          type={deleteModal.type}
          loading={deleteLoading}
          onCancel={() => setDeleteModal(null)}
          onConfirm={deleteModal.type === "all" ? handleDeleteAll : handleDeleteOne}
        />
      )}

      {/* ── Navbar ── */}
      <nav className="glass-panel" style={{ position: "sticky", top: 0, zIndex: 100, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 68, borderBottom: "1px solid var(--border-hi)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,var(--primary),var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, filter: "drop-shadow(0 0 6px rgba(56, 189, 248, 0.35))" }}>🛡️</div>
          <div>
            <div style={{ fontFamily: "var(--display)", fontWeight: 850, fontSize: 16, letterSpacing: "-0.02em" }}>Admin Dashboard</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--mono)", marginTop: 1 }}>{user.email}</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 12, padding: 4 }}>
          {[["table", "📋 Candidates"], ["analytics", "📊 Analytics"]].map(([k, label]) => (
            <button key={k} onClick={() => setActiveTab(k)} style={{
              padding: "7px 18px", border: "none", borderRadius: 9, cursor: "pointer", fontSize: 12, fontWeight: 800,
              background: activeTab === k ? "var(--primary)" : "transparent",
              color: activeTab === k ? "#000" : "var(--text-muted)",
              transition: "all 0.2s"
            }}>{label}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => window.location.href = "/"} className="btn btn-outline" style={{ padding: "8px 16px", fontSize: 13, borderRadius: 10 }}>← View Portal</button>
          <button onClick={() => signOut(auth)} className="btn btn-danger" style={{ padding: "8px 16px", fontSize: 13, borderRadius: 10 }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── KPI Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 32 }}>
          <KpiCard icon="📝" label="Total Assessments" value={results.length} color="var(--primary)" />
          <KpiCard icon="✅" label="Pass Rate" value={`${analytics.passRate}%`} color="var(--success)" sub={`${analytics.totalPassed} of ${results.length} passed`} />
          <KpiCard icon="📊" label="Average Score" value={`${analytics.avgScore}%`} color="var(--accent)" />
          <KpiCard
            icon={analytics.totalViolations > 0 ? "🚨" : "🛡️"}
            label="Total Violations"
            value={analytics.totalViolations}
            color={analytics.totalViolations > 0 ? "var(--danger)" : "var(--success)"}
            sub="Across all sessions"
          />
        </div>

        {/* ─────── TABLE TAB ──────────────────────────────────────── */}
        {activeTab === "table" && (
          <>
            {/* Section/Role Navigation Quick-Tabs */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Filter by Candidate Role</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {domains.map(d => {
                  const count = d === "all" ? results.length : results.filter(r => r.field === d).length;
                  const isSelected = filterField === d;
                  return (
                    <button
                      key={d}
                      onClick={() => setFilterField(d)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 12,
                        border: `1px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                        background: isSelected ? "linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(99,102,241,0.06) 100%)" : "rgba(15, 23, 42, 0.45)",
                        color: isSelected ? "var(--primary)" : "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.2s"
                      }}
                    >
                      <span>{d === "all" ? "💼 All Roles" : d}</span>
                      <span style={{ 
                        fontSize: 10, 
                        padding: "2px 6px", 
                        borderRadius: 20, 
                        background: isSelected ? "var(--primary)" : "rgba(255,255,255,0.08)", 
                        color: isSelected ? "#000" : "var(--text-muted)",
                        fontWeight: 800 
                      }}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
              <input
                type="text" placeholder="🔍  Search name or field…" value={filterText}
                onChange={e => setFilterText(e.target.value)} className="input-field"
                style={{ maxWidth: 280, padding: "10px 14px", borderRadius: 10 }}
              />

              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field" style={{ maxWidth: 140, padding: "10px 14px", borderRadius: 10 }}>
                <option value="all">All Status</option>
                <option value="pass">Pass Only</option>
                <option value="fail">Fail Only</option>
              </select>

              <div style={{ flex: 1 }} />

              <button onClick={loadResults} className="btn btn-outline" style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10 }} disabled={fetching}>
                {fetching ? "⏳" : "🔄"} Refresh
              </button>
              <button onClick={exportCSV} className="btn btn-primary" style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10 }} disabled={!filteredResults.length}>
                📥 Export CSV
              </button>
              {results.length > 0 && (
                <button onClick={() => setDeleteModal({ type: "all" })} className="btn btn-danger" style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10 }}>
                  🗑️ Clear All
                </button>
              )}
            </div>

            <div style={{ marginBottom: 12, fontSize: 12, color: "var(--text-muted)" }}>
              Showing {filteredResults.length} of {results.length} records
            </div>

            {/* Table */}
            <div className="glass-card" style={{ overflow: "hidden", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
              {fetching ? (
                <div style={{ padding: 60, textAlign: "center" }}>
                  <div className="animate-spin" style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", margin: "0 auto 16px" }} />
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading from Firebase…</div>
                </div>
              ) : filteredResults.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🔎</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 14 }}>No results match your filters.</div>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-hi)", background: "rgba(255,255,255,0.02)" }}>
                        {[
                          { key: "date", label: "Date" },
                          { key: "name", label: "Candidate" },
                          { key: null, label: "Role / Field" },
                          { key: "score", label: "Overall Score" },
                          { key: null, label: "Status" },
                          { key: null, label: "Violations" },
                          { key: null, label: "" },
                        ].map(({ key, label }, i) => (
                          <th key={i} onClick={key ? () => toggleSort(key) : undefined}
                            style={{
                              padding: "16px 20px", fontWeight: 800, color: "var(--text-muted)",
                              textAlign: "left", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
                              cursor: key ? "pointer" : "default", userSelect: "none", whiteSpace: "nowrap"
                            }}>
                            {label}{key && <SortIcon k={key} />}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((r) => {
                        const isExp = expandedRow === r.id;
                        const viols = (r.violations || 0) + (r.multiFaceWarnings || 0) + (r.identityViolations || 0);
                        const score = Math.round((r.avgScore || 0) * 100);
                        return (
                          <React.Fragment key={r.id}>
                            <tr 
                              onClick={() => setExpandedRow(isExp ? null : r.id)}
                              style={{
                                borderBottom: isExp ? "none" : "1px solid var(--border)",
                                background: isExp ? "rgba(56,189,248,0.03)" : "transparent",
                                transition: "all 0.25s ease",
                                cursor: "pointer"
                              }}
                            >
                              <td style={{ padding: "16px 20px", color: "var(--text-muted)", fontFamily: "var(--mono)", fontSize: 11, whiteSpace: "nowrap" }}>{fmt(r.timestamp)}</td>
                              <td style={{ padding: "16px 20px" }}>
                                <div style={{ fontWeight: 800, color: "var(--text)", fontSize: 14 }}>{r.name || "—"}</div>
                                <div style={{ fontSize: 12, color: "var(--primary)", fontFamily: "var(--mono)", marginTop: 3, fontWeight: 600 }}>{r.email || "No Email"}</div>
                                <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--mono)", marginTop: 2 }}>ID: {r.id?.slice(0, 8)}</div>
                              </td>
                              <td style={{ padding: "16px 20px" }}>
                                <span className="badge badge-primary" style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px" }}>{r.field || "—"}</span>
                              </td>
                              <td style={{ padding: "16px 20px" }}>
                                <div style={{ fontFamily: "var(--mono)", fontWeight: 900, color: score >= 60 ? "var(--success)" : "var(--danger)", marginBottom: 6, fontSize: 14 }}>
                                  {score}%
                                  <span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 400, marginLeft: 6 }}>({r.grade || "—"})</span>
                                </div>
                                <ScoreBar value={score} color={score >= 60 ? "var(--success)" : "var(--danger)"} />
                              </td>
                              <td style={{ padding: "16px 20px" }}>
                                <span className={`badge ${r.qualified ? "badge-success" : "badge-danger"}`} style={{ padding: "5px 12px", fontWeight: 800 }}>
                                  {r.qualified ? "✓ PASS" : "✗ FAIL"}
                                </span>
                              </td>
                              <td style={{ padding: "16px 20px" }}>
                                {viols > 0
                                  ? <span className="badge badge-danger" style={{ fontWeight: 800 }}>🚨 {viols}</span>
                                  : <span className="badge badge-success" style={{ fontWeight: 800 }}>🛡️ Clean</span>}
                              </td>
                              <td style={{ padding: "16px 20px", textAlign: "right" }}>
                                <button onClick={() => setExpandedRow(isExp ? null : r.id)}
                                  style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 12, fontWeight: 800, padding: "6px 12px", borderRadius: 8, transition: "background 0.15s" }}
                                  onMouseEnter={e => e.currentTarget.style.background = "rgba(56,189,248,0.08)"}
                                  onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                  {isExp ? "▲ Hide Details" : "▼ View Report"}
                                </button>
                              </td>
                            </tr>

                            {/* ── Expanded Row (Candidate Assessment breakdown) ── */}
                            {isExp && (
                              <tr style={{ background: "rgba(10,12,22,0.6)" }}>
                                <td colSpan={7} style={{ padding: "0", borderBottom: "2px solid var(--border-hi)" }}>
                                  <div className="animate-fade-in" style={{ padding: "32px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 280px", gap: 32 }}>

                                      {/* Answers Section Breakdown */}
                                      <div>
                                        <div className="section-label" style={{ marginBottom: 16 }}>Live Assessment Answers</div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto", paddingRight: 6 }}>
                                          {(r.scores || []).map((s, i) => (
                                            <div key={i} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: "16px", border: "1px solid var(--border)" }}>
                                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
                                                <span style={{ fontWeight: 700, fontSize: 12.5, color: "var(--text)" }}>Q{i + 1}: {s.question}</span>
                                                <span style={{ fontFamily: "var(--mono)", fontWeight: 900, color: s.final_score >= 0.5 ? "var(--success)" : "var(--danger)" }}>{pct(s.final_score)}</span>
                                              </div>
                                              <ScoreBar value={Math.round((s.final_score || 0) * 100)} color={s.final_score >= 0.5 ? "var(--success)" : "var(--danger)"} />
                                              {s.userAnswer ? (
                                                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10, padding: "10px 12px", background: "rgba(0,0,0,0.15)", borderRadius: 8, borderLeft: "2px solid var(--primary-dim)", fontStyle: "italic", lineHeight: 1.6 }}>
                                                  "{s.userAnswer}"
                                                </div>
                                              ) : (
                                                <div className="badge badge-danger" style={{ marginTop: 10, display: "inline-flex", fontWeight: 800 }}>{s.skipped ? "Skipped" : "Timeout"}</div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Proctoring & Section Components Breakdown */}
                                      <div>
                                        <div className="section-label" style={{ marginBottom: 16 }}>Security & Integrity Audit</div>
                                        <div className="glass-card" style={{ padding: 20, marginBottom: 20, gap: 12, display: "flex", flexDirection: "column", border: "1px solid rgba(255,255,255,0.04)" }}>
                                          {[
                                            { icon: "⚠️", label: "Tab Switches", val: r.violations || 0, warn: (r.violations || 0) > 0 },
                                            { icon: "🪪", label: "Identity Mismatches", val: r.identityViolations || 0, warn: (r.identityViolations || 0) > 0 },
                                            { icon: "👥", label: "Multi-Face Alerts", val: r.multiFaceWarnings || 0, warn: (r.multiFaceWarnings || 0) > 0 },
                                            { icon: "👁️", label: "Look-Aways Events", val: r.lookAwayCount || 0, warn: (r.lookAwayCount || 0) > 2 },
                                            { icon: "🎙️", label: "Linguistic Voice Confidence", val: `${r.avgConfidence ? Math.round(r.avgConfidence * 100) : 100}%`, warn: false },
                                            { icon: "💬", label: "Linguistic Filler Words", val: r.totalFillers || 0, warn: (r.totalFillers || 0) > 10 },
                                          ].map(row => (
                                            <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                                              <span style={{ color: "var(--text-muted)" }}>{row.icon} {row.label}</span>
                                              <span style={{ fontFamily: "var(--mono)", fontWeight: 800, color: row.warn ? "var(--danger)" : "var(--success)" }}>{row.val}</span>
                                            </div>
                                          ))}
                                        </div>

                                        {r.violationsLog && r.violationsLog.length > 0 && (
                                          <div style={{ marginBottom: 20 }}>
                                            <div className="section-label" style={{ marginBottom: 10 }}>Integrity Timeline Logs</div>
                                            <div style={{ maxHeight: 150, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "rgba(0,0,0,0.2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                                              {r.violationsLog.map((log, idx) => (
                                                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, borderLeft: "2px solid var(--danger)", paddingLeft: 8 }}>
                                                  <span style={{ color: "var(--text)" }}>{log.type}</span>
                                                  <span style={{ fontFamily: "var(--mono)", color: "var(--text-muted)", fontSize: 11 }}>{log.timestamp}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Score breakdown bars */}
                                        <div className="section-label" style={{ marginBottom: 12 }}>Score Components (Different Sections)</div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                          {[
                                            { label: "BERT Semantic Context", key: "bert_score", color: "var(--primary)" },
                                            { label: "spaCy Linguistic Grammar", key: "spacy_score", color: "var(--accent)" },
                                            { label: "TF-IDF Density Match", key: "tfidf_score", color: "var(--warning)" },
                                          ].map(({ label, key, color }) => {
                                            const avg = r.scores?.length
                                              ? Math.round(r.scores.reduce((a, s) => a + (s[key] || 0), 0) / r.scores.length * 100)
                                              : 0;
                                            return (
                                              <div key={key}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                                                  <span>{label}</span><span style={{ fontWeight: 700, color: "var(--text)" }}>{avg}%</span>
                                                </div>
                                                <ScoreBar value={avg} color={color} />
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>

                                      {/* Actions panel */}
                                      <div>
                                        <div className="section-label" style={{ marginBottom: 16 }}>Recruiter Panel</div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: 18, border: "1px solid var(--border)" }}>
                                            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>📧 Candidate Summary</div>
                                            <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.8 }}>
                                              <div style={{ marginBottom: 4 }}><strong>Name:</strong> <span style={{ color: "var(--text)" }}>{r.name}</span></div>
                                              <div style={{ marginBottom: 4 }}><strong>Email:</strong> <span style={{ color: "var(--text)", fontFamily: "var(--mono)", fontSize: 12 }}>{r.email || "anonymous"}</span></div>
                                              <div style={{ marginBottom: 4 }}><strong>Domain:</strong> <span style={{ color: "var(--text)" }}>{r.field}</span></div>
                                              <div style={{ marginBottom: 4 }}><strong>Date:</strong> <span style={{ color: "var(--text)" }}>{fmt(r.timestamp)}</span></div>
                                              <div><strong>Outcome:</strong> <span style={{ color: r.qualified ? "var(--success)" : "var(--danger)", fontWeight: 900 }}>{r.qualified ? "APPROVED PASS" : "REJECTED FAIL"}</span></div>
                                            </div>
                                          </div>

                                          {r.email && r.email !== "anonymous" && (
                                            <a href={`mailto:${r.email}?subject=Assessment Status Update: ${r.field}&body=Hi ${r.name},%0D%0A%0D%0AThank you for completing the technical verbal assessment on TalentIntelligence.ai for the ${r.field} role.%0D%0A%0D%0AWe have reviewed your assessment details:%0D%0A- Overall Score: ${Math.round((r.avgScore || 0) * 100)}%%0D%0A- Status: ${r.qualified ? "PASSED" : "FAILED"}%0D%0A%0D%0AWe would love to discuss the next steps in your recruiting process with you.%0D%0A%0D%0ABest regards,%0D%0ARecruiting Team`}
                                               className="btn btn-primary" style={{ width: "100%", fontSize: 13, padding: "10px", borderRadius: 10, textAlign: "center", textDecoration: "none", display: "block", boxSizing: "border-box", marginBottom: 14 }}>
                                              📧 Contact Candidate
                                            </a>
                                          )}

                                          <button onClick={() => setDeleteModal({ type: "one", id: r.id })}
                                            className="btn btn-danger" style={{ width: "100%", fontSize: 13, padding: "10px", borderRadius: 10, cursor: "pointer", marginBottom: 14 }}>
                                            🗑️ Delete Assessment
                                          </button>

                                          <button onClick={exportCSV} className="btn btn-outline" style={{ width: "100%", fontSize: 13, padding: "10px", borderRadius: 10, cursor: "pointer" }}>
                                            📥 Export CSV Record
                                          </button>
                                        </div>
                                      </div>

                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─────── ANALYTICS TAB ──────────────────────────────────── */}
        {activeTab === "analytics" && (
          <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {results.length === 0 && (
              <div className="glass-card" style={{ padding: 60, textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                <div style={{ color: "var(--text-muted)" }}>No data yet. Conduct some interviews first.</div>
              </div>
            )}

            {results.length > 0 && (
              <>
                {/* Row 1: Section Domain scores + score over time */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                  {/* Domain Bar Chart (Section comparison) */}
                  <div className="glass-card" style={{ padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ marginBottom: 20 }}>
                      <div className="section-label" style={{ marginBottom: 4 }}>Performance by Assessment Section (Role)</div>
                      <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Average score & pass rate per technical job role</p>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={analytics.domainChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-muted)" }} />
                        <Bar dataKey="avgScore" name="Avg Score %" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="passRate" name="Pass Rate %" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Score trend line */}
                  <div className="glass-card" style={{ padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ marginBottom: 20 }}>
                      <div className="section-label" style={{ marginBottom: 4 }}>Score Trend (Recent 10)</div>
                      <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Score progression across recent interviews</p>
                    </div>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={analytics.timeChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="label" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line dataKey="score" name="Score %" type="monotone" stroke="var(--primary)" strokeWidth={2.5} dot={{ fill: "var(--primary)", r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Row 2: Grade Pie + Violation Pie + Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

                  {/* Grade Distribution */}
                  <div className="glass-card" style={{ padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="section-label" style={{ marginBottom: 16 }}>Grade Distribution</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={analytics.gradeChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={44} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}>
                          {analytics.gradeChart.map((entry, i) => (
                            <Cell key={i} fill={gradeColor(entry.name)} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
                      {analytics.gradeChart.map((g, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                           <div style={{ width: 8, height: 8, borderRadius: "50%", background: gradeColor(g.name) }} />
                           <span style={{ color: "var(--text-muted)" }}>{g.name}: {g.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Violation Breakdown Pie */}
                  <div className="glass-card" style={{ padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="section-label" style={{ marginBottom: 16 }}>Violation Types</div>
                    {analytics.violChart.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "48px 0", color: "var(--success)", fontSize: 13 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
                        Zero violations recorded!
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={analytics.violChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={44} paddingAngle={3}>
                            {analytics.violChart.map((_, i) => (
                              <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
                      {analytics.violChart.map((v, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS_PIE[i] }} />
                          <span style={{ color: "var(--text-muted)" }}>{v.name}: {v.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary stats */}
                  <div className="glass-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="section-label">Platform Summary</div>
                    {[
                      { label: "Total Interviews", val: results.length, color: "var(--primary)" },
                      { label: "Pass Rate", val: `${analytics.passRate}%`, color: "var(--success)" },
                      { label: "Average Score", val: `${analytics.avgScore}%`, color: "var(--accent)" },
                      { label: "Total Violations", val: analytics.totalViolations, color: analytics.totalViolations > 0 ? "var(--danger)" : "var(--success)" },
                      { label: "Unique Role Sections", val: domains.length - 1, color: "var(--warning)" },
                    ].map(item => (
                      <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{item.label}</span>
                        <span style={{ fontFamily: "var(--mono)", fontWeight: 800, fontSize: 16, color: item.color }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Domain table summary */}
                {analytics.domainChart.length > 0 && (
                  <div className="glass-card" style={{ padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="section-label" style={{ marginBottom: 16 }}>Domain Performance Breakdown</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-hi)" }}>
                          {["Assessment Section (Role)", "Candidates", "Avg Score", "Pass Rate", "Status"].map(h => (
                            <th key={h} style={{ padding: "10px 16px", color: "var(--text-muted)", fontWeight: 700, textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.domainChart.map((d, i) => (
                          <tr key={d.name} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "12px 16px", fontWeight: 800 }}>{d.name}</td>
                            <td style={{ padding: "12px 16px", color: "var(--text-muted)" }}>{d.count}</td>
                            <td style={{ padding: "12px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{ flex: 1, height: 5, background: "var(--surface-hi)", borderRadius: 99, overflow: "hidden", maxWidth: 100 }}>
                                  <div style={{ width: `${d.avgScore}%`, height: "100%", background: "var(--primary)", borderRadius: 99 }} />
                                </div>
                                <span style={{ fontFamily: "var(--mono)", fontWeight: 800, color: d.avgScore >= 60 ? "var(--success)" : "var(--danger)" }}>{d.avgScore}%</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span style={{ fontFamily: "var(--mono)", fontWeight: 800, color: d.passRate >= 50 ? "var(--success)" : "var(--warning)" }}>{d.passRate}%</span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <span className={`badge ${d.passRate >= 50 ? "badge-success" : "badge-warning"}`}>
                                {d.passRate >= 70 ? "Excellent" : d.passRate >= 50 ? "Good" : "Needs Review"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
