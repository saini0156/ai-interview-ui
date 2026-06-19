import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, isConfigured } from "../firebase";

export default function StudentAuth({ onAuthSuccess, onBack }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!isConfigured) {
      // Offline/Local Simulated Auth Fallback
      setTimeout(() => {
        setLoading(false);
        const displayName = isLogin ? (email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1)) : name;
        onAuthSuccess({ email, name: displayName, uid: "mock-student-uid" });
      }, 1000);
      return;
    }

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        onAuthSuccess({ email: user.email, name: user.displayName || user.email.split("@")[0], uid: user.uid });
      } else {
        if (!name.trim()) {
          setError("Please enter your full name.");
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        onAuthSuccess({ email: user.email, name: name, uid: user.uid });
      }
    } catch (err) {
      console.error(err);
      let msg = err.message;
      if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password") || msg.includes("auth/user-not-found")) {
        msg = "Invalid email or password.";
      } else if (msg.includes("auth/email-already-in-use")) {
        msg = "This email is already registered.";
      } else if (msg.includes("auth/weak-password")) {
        msg = "Password should be at least 6 characters.";
      } else if (msg.includes("auth/invalid-email")) {
        msg = "Invalid email address format.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden", background: "var(--bg)", fontFamily: "var(--display)" }}>
      {/* Glow orbs */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <form onSubmit={handleSubmit} className="glass-card animate-slide-up" style={{ width: "100%", maxWidth: 420, padding: "44px 36px", border: "1px solid rgba(255,255,255,0.05)", boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
        {/* Brand/Heading */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", padding: 12, borderRadius: 16, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", marginBottom: 16 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(56, 189, 248, 0.4))" }}>
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, background: "linear-gradient(to bottom, #ffffff 40%, rgba(255, 255, 255, 0.7) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {isLogin ? "Student Sign In" : "Create Student Account"}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 6 }}>
            Access the secure technical proctoring portal
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          <button type="button" onClick={() => { setIsLogin(true); setError(""); }} style={{
            flex: 1, padding: "8px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 800,
            background: isLogin ? "var(--primary)" : "transparent",
            color: isLogin ? "#000" : "var(--text-muted)",
            transition: "all 0.2s"
          }}>Sign In</button>
          <button type="button" onClick={() => { setIsLogin(false); setError(""); }} style={{
            flex: 1, padding: "8px", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12.5, fontWeight: 800,
            background: !isLogin ? "var(--primary)" : "transparent",
            color: !isLogin ? "#000" : "var(--text-muted)",
            transition: "all 0.2s"
          }}>Sign Up</button>
        </div>

        {error && (
          <div className="animate-fade-in" style={{
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "12px 14px", fontSize: 12.5, color: "#f87171", marginBottom: 20,
            display: "flex", gap: 8, alignItems: "center"
          }}>
            ⚠️ {error}
          </div>
        )}

        {!isConfigured && (
          <div style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 10, padding: "10px 12px", fontSize: 11.5, color: "#fbbf24", marginBottom: 20, textAlign: "left", lineHeight: 1.4 }}>
            💡 <strong>Sandbox/Offline Mode Active:</strong> Firebase credentials not detected. Enter any simulated email/password to log in locally.
          </div>
        )}

        {!isLogin && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="input-field" placeholder="e.g. Arjun Saini" style={{ borderRadius: 10 }} />
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
            className="input-field" placeholder="student@university.edu" style={{ borderRadius: 10 }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: "var(--text-muted)", marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
            className="input-field" placeholder="••••••••" style={{ borderRadius: 10 }} />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: "100%", fontSize: 14.5, padding: 12, borderRadius: 10 }} disabled={loading}>
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span className="animate-spin" style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#000", borderRadius: "50%" }} />
              Connecting…
            </span>
          ) : isLogin ? "🔐 Sign In Student" : "🚀 Register Account"}
        </button>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button type="button" onClick={onBack} className="btn btn-ghost" style={{ fontSize: 12.5 }}>← Back to Info</button>
        </div>
      </form>
    </div>
  );
}
