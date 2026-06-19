// ── Session persistence helpers ─────────────────────────────────
export const SESSION_KEY = "ai_interview_session";

export function saveSession(data) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ ...data, timestamp: Date.now() })); } catch {}
}

export function loadSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (!s) return null;
    const ageMin = (Date.now() - s.timestamp) / 60000;
    return ageMin < 60 ? s : null; // only restore if < 60 min old
  } catch { return null; }
}

export function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch {}
}
