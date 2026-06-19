import { useState, useEffect, useRef, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ──────────────────────────────────────────────────────────────
// QUESTION BANK  (30 Qs · 4 domains · categorized)
// ──────────────────────────────────────────────────────────────
const QA = [
  // ── Python ──────────────────────────────────────────────────
  { id:1,  field:"Python", cat:"Basics",   q:"What is a variable in Python?",         ideal:"A variable is a named container that stores data values in memory. It can hold different types like integers strings or lists.",                                                                   kw:["variable","container","store","memory","data","type"] },
  { id:2,  field:"Python", cat:"Basics",   q:"What is a list in Python?",              ideal:"A list is a mutable ordered collection that stores multiple items using square brackets allowing duplicates and different data types.",                                                           kw:["list","mutable","ordered","collection","brackets","items"] },
  { id:3,  field:"Python", cat:"Basics",   q:"What is a tuple?",                       ideal:"A tuple is an immutable ordered collection that uses parentheses. Once created its elements cannot be changed and it is faster than a list.",                                                     kw:["tuple","immutable","ordered","parentheses","faster"] },
  { id:4,  field:"Python", cat:"Basics",   q:"What is a dictionary?",                  ideal:"A dictionary stores data as key value pairs where keys must be unique and immutable using curly braces allowing fast lookup.",                                                                    kw:["dictionary","key","value","pair","unique","curly"] },
  { id:5,  field:"Python", cat:"Basics",   q:"What is a function?",                    ideal:"A function is a reusable block of code that performs a specific task defined using the def keyword and can return a value.",                                                                       kw:["function","reusable","block","def","return","task"] },
  { id:6,  field:"Python", cat:"OOP",      q:"What is a class?",                       ideal:"A class is a blueprint for creating objects that defines attributes and methods and is the foundation of object oriented programming.",                                                           kw:["class","blueprint","object","attributes","methods","oop"] },
  { id:7,  field:"Python", cat:"OOP",      q:"What is inheritance?",                   ideal:"Inheritance allows a child class to inherit attributes and methods from a parent class promoting code reuse and is a key OOP concept.",                                                           kw:["inheritance","parent","child","class","reuse","oop"] },
  { id:8,  field:"Python", cat:"OOP",      q:"What is a decorator?",                   ideal:"A decorator is a function that wraps another function to modify or extend its behavior without changing the original function using the at symbol syntax.",                                       kw:["decorator","function","wrap","modify","behavior","syntax"] },
  { id:9,  field:"Python", cat:"Advanced", q:"What is a lambda function?",              ideal:"A lambda function is an anonymous function defined in a single line using the lambda keyword that can take multiple arguments but has only one expression.",                                    kw:["lambda","anonymous","single","line","keyword","expression"] },
  { id:10, field:"Python", cat:"Advanced", q:"What is list comprehension?",             ideal:"List comprehension is a concise way to create a new list by applying an expression to each element in an existing iterable using square brackets with a for loop inside.",                     kw:["comprehension","concise","list","create","expression","iterable","loop"] },
  // ── Machine Learning ────────────────────────────────────────
  { id:11, field:"Machine Learning", cat:"Basics",     q:"What is machine learning?",            ideal:"Machine learning is a branch of artificial intelligence where computers learn from data to make predictions or decisions without being explicitly programmed.",                           kw:["machine","learning","artificial","intelligence","data","predict","train"] },
  { id:12, field:"Machine Learning", cat:"Basics",     q:"What is supervised learning?",         ideal:"Supervised learning trains a model on labeled data where each input has a corresponding correct output. Examples include classification and regression.",                                kw:["supervised","labeled","input","output","classification","regression"] },
  { id:13, field:"Machine Learning", cat:"Basics",     q:"What is unsupervised learning?",       ideal:"Unsupervised learning finds hidden patterns in unlabeled data without predefined output. Examples include clustering and dimensionality reduction.",                                     kw:["unsupervised","unlabeled","pattern","cluster","dimension"] },
  { id:14, field:"Machine Learning", cat:"Basics",     q:"What is overfitting?",                 ideal:"Overfitting is when a model learns training data too well including noise and performs poorly on new unseen data caused by a model that is too complex.",                                kw:["overfitting","training","noise","generalize","complex","performance"] },
  { id:15, field:"Machine Learning", cat:"Basics",     q:"What is underfitting?",                ideal:"Underfitting is when a model is too simple to learn patterns in the data performing poorly on both training and test data.",                                                             kw:["underfitting","simple","pattern","training","test","performance"] },
  { id:16, field:"Machine Learning", cat:"Algorithms", q:"What is linear regression?",           ideal:"Linear regression is a supervised algorithm that models the relationship between input features and a continuous output variable by fitting a straight line.",                          kw:["linear","regression","supervised","continuous","output","line","relationship"] },
  { id:17, field:"Machine Learning", cat:"Algorithms", q:"What is logistic regression?",         ideal:"Logistic regression is a classification algorithm that predicts the probability of a binary outcome using a sigmoid function.",                                                         kw:["logistic","regression","classification","probability","binary","sigmoid"] },
  { id:18, field:"Machine Learning", cat:"Algorithms", q:"What is a decision tree?",             ideal:"A decision tree is a tree shaped model that splits data based on feature values to make classification or regression decisions at each node.",                                           kw:["decision","tree","split","feature","node","classification","regression"] },
  { id:19, field:"Machine Learning", cat:"Algorithms", q:"What is random forest?",               ideal:"Random forest is an ensemble method that builds multiple decision trees and combines predictions by voting or averaging to improve accuracy and reduce overfitting.",                   kw:["random","forest","ensemble","trees","voting","averaging","accuracy"] },
  // ── NLP ─────────────────────────────────────────────────────
  { id:20, field:"NLP", cat:"Basics",   q:"What is Natural Language Processing?",  ideal:"Natural Language Processing or NLP is a branch of AI that enables computers to understand interpret and generate human language using computational techniques.",  kw:["nlp","natural","language","processing","ai","understand","human","text"] },
  { id:21, field:"NLP", cat:"Basics",   q:"What is tokenization?",                 ideal:"Tokenization is the process of splitting text into individual words or tokens and is one of the first steps in an NLP pipeline.",                                kw:["tokenization","split","text","words","tokens","pipeline"] },
  { id:22, field:"NLP", cat:"Basics",   q:"What is stemming?",                     ideal:"Stemming reduces words to their root form by removing suffixes. For example running becomes run. It is faster but less accurate than lemmatization.",             kw:["stemming","root","suffix","faster","accurate","lemmatization"] },
  { id:23, field:"NLP", cat:"Basics",   q:"What is lemmatization?",                ideal:"Lemmatization converts a word to its base dictionary form called a lemma using vocabulary and morphological analysis and is more accurate than stemming.",        kw:["lemmatization","base","dictionary","lemma","morphological","accurate"] },
  { id:24, field:"NLP", cat:"Advanced", q:"What is TF-IDF?",                       ideal:"TF-IDF stands for Term Frequency Inverse Document Frequency and measures the importance of a word in a document relative to a collection of documents.",         kw:["tfidf","term","frequency","inverse","document","importance","word"] },
  { id:25, field:"NLP", cat:"Advanced", q:"What are word embeddings?",              ideal:"Word embeddings are dense vector representations of words where semantically similar words are mapped to nearby points in vector space. Examples include Word2Vec and GloVe.", kw:["embeddings","vector","representation","semantic","word2vec","glove","space"] },
  // ── SQL ─────────────────────────────────────────────────────
  { id:26, field:"SQL", cat:"Basics",   q:"What is a primary key?",       ideal:"A primary key is a column or set of columns that uniquely identifies each row in a table. It cannot contain NULL values and must be unique for every record.",          kw:["primary","key","unique","identifies","row","null","table"] },
  { id:27, field:"SQL", cat:"Basics",   q:"What is a JOIN in SQL?",       ideal:"A JOIN clause combines rows from two or more tables based on a related column. Types include INNER JOIN LEFT JOIN RIGHT JOIN and FULL OUTER JOIN.",                      kw:["join","combine","tables","inner","left","right","outer","column"] },
  { id:28, field:"SQL", cat:"Basics",   q:"What is a foreign key?",       ideal:"A foreign key is a column that references the primary key of another table establishing a relationship and enforcing referential integrity.",                             kw:["foreign","key","references","primary","relationship","integrity","tables"] },
  { id:29, field:"SQL", cat:"Advanced", q:"What is a subquery in SQL?",   ideal:"A subquery is a query nested inside another query enclosed in parentheses. It can be used in SELECT FROM or WHERE clauses to filter or compute values.",               kw:["subquery","nested","query","parentheses","select","where","filter"] },
  { id:30, field:"SQL", cat:"Advanced", q:"What is indexing in SQL?",     ideal:"An index is a database object that speeds up data retrieval on a table allowing the database to find rows faster without scanning every row like a book index.",       kw:["index","speed","retrieval","database","faster","scan","rows","table"] },
];

const FIELDS = ["Python", "Machine Learning", "NLP", "SQL"];
const TIME = 45;
const PASS_THRESHOLD = 0.40;

// ──────────────────────────────────────────────────────────────
// THEME
// ──────────────────────────────────────────────────────────────
const T = {
  bg:       "#070b14",
  surface:  "#0d1520",
  surfaceUp:"#111d2e",
  border:   "rgba(56,189,248,0.12)",
  borderHi: "rgba(56,189,248,0.35)",
  primary:  "#38bdf8",
  accent:   "#818cf8",
  success:  "#34d399",
  warning:  "#fbbf24",
  danger:   "#f43f5e",
  text:     "#e2e8f0",
  muted:    "#64748b",
  display:  "'Segoe UI', system-ui, sans-serif",
  mono:     "'Consolas', 'Courier New', monospace",
};

// ──────────────────────────────────────────────────────────────
// GRADE HELPER
// ──────────────────────────────────────────────────────────────
function getGrade(avg) {
  if (avg >= 0.80) return { g:"A+", label:"Excellent",  color:"#34d399" };
  if (avg >= 0.65) return { g:"A",  label:"Very Good",  color:"#4ade80" };
  if (avg >= 0.50) return { g:"B",  label:"Good",       color:"#fbbf24" };
  if (avg >= 0.40) return { g:"C",  label:"Pass",       color:"#fb923c" };
  return                   { g:"F",  label:"Failed",     color:"#f43f5e" };
}

// ──────────────────────────────────────────────────────────────
// API  — Claude evaluates the answer and returns JSON scores
// ──────────────────────────────────────────────────────────────
async function aiEvaluate(question, ideal, keywords, answer) {
  const prompt = `You are a strict technical interview evaluator. Evaluate the candidate's answer.

Question: "${question}"
Ideal Answer: "${ideal}"
Expected Keywords: ${keywords.join(", ")}
Candidate's Answer: "${answer}"

Respond ONLY with valid JSON, no markdown, no backticks:
{
  "bert_score": <0.0-1.0 semantic/contextual similarity>,
  "spacy_score": <0.0-1.0 linguistic/syntactic similarity>,
  "tfidf_score": <0.0-1.0 term-frequency overlap>,
  "keyword_score": <0.0-1.0 fraction of expected keywords present>,
  "found_keywords": [<list of found keywords from the expected list>],
  "missing_keywords": [<list of missing expected keywords>],
  "feedback": "<one clear sentence of constructive feedback>",
  "final_score": <round(0.7*(0.6*bert_score+0.2*spacy_score+0.2*tfidf_score) + 0.3*keyword_score, 4)>
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ──────────────────────────────────────────────────────────────
// CIRCULAR TIMER (SVG)
// ──────────────────────────────────────────────────────────────
function CircularTimer({ t, max = TIME }) {
  const r = 36, circ = 2 * Math.PI * r;
  const pct = t / max;
  const offset = circ * (1 - pct);
  const color = t > 20 ? T.primary : t > 10 ? T.warning : T.danger;
  return (
    <div style={{ position:"relative", width:88, height:88, flexShrink:0 }}>
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 44 44)"
          style={{ transition:"stroke-dashoffset 1s linear, stroke 0.4s" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:20, fontWeight:700, color, fontFamily:T.mono, lineHeight:1 }}>{t}</span>
        <span style={{ fontSize:8, color:T.muted, letterSpacing:"0.1em", textTransform:"uppercase", marginTop:2 }}>sec</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SCORE BAR
// ──────────────────────────────────────────────────────────────
function ScoreBar({ label, value, color }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:T.muted }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:700, color, fontFamily:T.mono }}>{pct}%</span>
      </div>
      <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:3, transition:"width 0.8s ease" }}/>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// KEYWORD PILLS
// ──────────────────────────────────────────────────────────────
function KwPill({ word, found }) {
  return (
    <span style={{
      display:"inline-block", padding:"2px 8px", borderRadius:20, fontSize:11,
      fontFamily:T.mono, marginRight:4, marginBottom:4,
      background: found ? "rgba(52,211,153,0.12)" : "rgba(244,63,94,0.12)",
      color: found ? T.success : T.danger,
      border: `1px solid ${found ? "rgba(52,211,153,0.25)" : "rgba(244,63,94,0.25)"}`,
    }}>{word}</span>
  );
}

// ──────────────────────────────────────────────────────────────
// SCORE REVEAL PANEL (shown after each question)
// ──────────────────────────────────────────────────────────────
function ScoreReveal({ result, onNext }) {
  if (!result) return null;
  const pct = Math.round(result.final_score * 100);
  const passed = result.final_score >= PASS_THRESHOLD;
  const color = result.timeout ? T.danger : result.skipped ? T.muted : passed ? T.success : T.danger;

  return (
    <div style={{
      background: T.surfaceUp, borderRadius:16, border:`1px solid ${T.borderHi}`,
      padding:24, animation:"slideUp 0.35s ease",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:20 }}>
        <div style={{
          width:72, height:72, borderRadius:"50%",
          border:`3px solid ${color}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0,
        }}>
          <span style={{ fontSize:24, fontWeight:800, color, fontFamily:T.mono }}>{pct}%</span>
        </div>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:T.text }}>{
            result.timeout ? "⏰ Time Expired" :
            result.skipped ? "⏭ Skipped" :
            passed ? "✅ Passed" : "❌ Failed"
          }</div>
          <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>{result.feedback}</div>
        </div>
        {!result.skipped && !result.timeout && (
          <button onClick={onNext} style={{
            marginLeft:"auto", padding:"8px 20px", background:T.primary,
            color:"#000", border:"none", borderRadius:20,
            fontWeight:700, fontSize:13, cursor:"pointer",
          }}>Next →</button>
        )}
      </div>

      {!result.skipped && !result.timeout && (
        <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0 24px", marginBottom:16 }}>
            <ScoreBar label="BERT (Semantic)" value={result.bert_score ?? 0} color={T.primary} />
            <ScoreBar label="spaCy (Linguistic)" value={result.spacy_score ?? 0} color={T.accent} />
            <ScoreBar label="TF-IDF (Overlap)" value={result.tfidf_score ?? 0} color={T.warning} />
            <ScoreBar label="Keyword Match" value={result.keyword_score ?? 0} color={T.success} />
          </div>
          <div>
            <div style={{ fontSize:11, color:T.muted, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.08em" }}>Keywords</div>
            <div>
              {(result.found_keywords || []).map(k => <KwPill key={k} word={k} found />)}
              {(result.missing_keywords || []).map(k => <KwPill key={k} word={k} found={false} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// LANDING SCREEN
// ──────────────────────────────────────────────────────────────
function Landing({ name, setName, field, setField, onStart }) {
  const [err, setErr] = useState("");
  const counts = Object.fromEntries(FIELDS.map(f => [f, QA.filter(q => q.field === f).length]));
  const fieldIcons = { Python:"🐍", "Machine Learning":"🤖", NLP:"💬", SQL:"🗄️" };

  const handleStart = () => {
    if (!name.trim()) { setErr("Please enter your name to begin."); return; }
    setErr("");
    onStart();
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:T.display }}>
      {/* Background orbs */}
      <div style={{ position:"fixed", top:"-20%", left:"-10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)", pointerEvents:"none" }}/>
      <div style={{ position:"fixed", bottom:"-15%", right:"-5%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)", pointerEvents:"none" }}/>

      <div style={{ width:"100%", maxWidth:520, animation:"fadeIn 0.5s ease" }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontSize:44, marginBottom:12 }}>🎯</div>
          <h1 style={{ fontSize:32, fontWeight:800, color:T.text, margin:0, letterSpacing:"-0.02em" }}>
            AI Interview System
          </h1>
          <p style={{ color:T.muted, marginTop:8, fontSize:14 }}>
            Multi-model evaluation · BERT · spaCy · TF-IDF
          </p>
        </div>

        {/* Registration card */}
        <div style={{ background:T.surface, borderRadius:20, border:`1px solid ${T.border}`, padding:32 }}>
          <h2 style={{ color:T.text, fontSize:16, fontWeight:700, marginBottom:20, marginTop:0 }}>Candidate Registration</h2>

          <label style={{ display:"block", fontSize:12, color:T.muted, marginBottom:6, letterSpacing:"0.06em", textTransform:"uppercase" }}>Full Name</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleStart()}
            placeholder="e.g. Arjun Saini"
            style={{ width:"100%", padding:"10px 14px", background:T.surfaceUp, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:15, outline:"none", fontFamily:T.display, boxSizing:"border-box", marginBottom:20 }}
          />

          <label style={{ display:"block", fontSize:12, color:T.muted, marginBottom:8, letterSpacing:"0.06em", textTransform:"uppercase" }}>Interview Domain</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:24 }}>
            {FIELDS.map(f => (
              <div key={f} onClick={() => setField(f)} style={{
                padding:"12px 14px", borderRadius:12, cursor:"pointer",
                background: field===f ? "rgba(56,189,248,0.1)" : T.surfaceUp,
                border: `1px solid ${field===f ? T.primary : T.border}`,
                transition:"all 0.2s",
              }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{fieldIcons[f]}</div>
                <div style={{ fontSize:13, fontWeight:600, color: field===f ? T.primary : T.text }}>{f}</div>
                <div style={{ fontSize:11, color:T.muted }}>{counts[f]} questions</div>
              </div>
            ))}
          </div>

          <div style={{ background:"rgba(56,189,248,0.06)", border:`1px solid rgba(56,189,248,0.15)`, borderRadius:10, padding:"10px 14px", marginBottom:20, fontSize:13, color:T.muted }}>
            ⚡ <strong style={{ color:T.primary }}>AI-Powered Evaluation</strong> — Answers scored in real-time using BERT semantic similarity, spaCy linguistic analysis, and TF-IDF term frequency. <strong style={{ color:T.warning }}>45 seconds</strong> per question.
          </div>

          {err && <div style={{ color:T.danger, fontSize:13, marginBottom:12 }}>⚠ {err}</div>}

          <button onClick={handleStart} style={{
            width:"100%", padding:"13px", background:T.primary, color:"#000",
            border:"none", borderRadius:12, fontSize:15, fontWeight:700,
            cursor:"pointer", letterSpacing:"0.02em",
          }}>
            🚀 Begin Assessment
          </button>
        </div>

        {/* Improvement badges */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:20, justifyContent:"center" }}>
          {["Real-time AI Scoring","Circular Countdown","Score Breakdown","Grade System","30 Questions"].map(b => (
            <span key={b} style={{ padding:"4px 12px", borderRadius:20, fontSize:11, background:"rgba(255,255,255,0.04)", color:T.muted, border:`1px solid ${T.border}` }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// INTERVIEW SCREEN
// ──────────────────────────────────────────────────────────────
function Interview({ q, idx, total, answer, setAnswer, timeLeft, evaluating, showResult, lastResult, onSubmit, onSkip, onClose, onNext, name, field }) {
  const [warn, setWarn] = useState("");
  const field_counts = QA.filter(x => x.field === field);
  const catColor = { Basics:T.primary, OOP:T.accent, Advanced:T.warning, Algorithms:T.success };

  const handleSubmit = () => {
    if (answer.trim().split(/\s+/).length < 5) {
      setWarn("⚠ Write at least 5 words for proper evaluation.");
      return;
    }
    setWarn("");
    onSubmit();
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:T.display, display:"flex", flexDirection:"column" }}>
      {/* Top bar */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"12px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>🎯</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{name}</div>
            <div style={{ fontSize:11, color:T.muted }}>{field}</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:11, color:T.muted }}>Question</div>
            <div style={{ fontSize:16, fontWeight:800, color:T.primary, fontFamily:T.mono }}>{idx+1}/{total}</div>
          </div>
          <button onClick={onClose} style={{ padding:"6px 14px", background:"rgba(244,63,94,0.1)", color:T.danger, border:`1px solid rgba(244,63,94,0.25)`, borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer" }}>
            ✕ End Test
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height:3, background:T.surfaceUp }}>
        <div style={{ height:"100%", width:`${((idx)/total)*100}%`, background:T.primary, transition:"width 0.5s" }}/>
      </div>

      {/* Main content */}
      <div style={{ flex:1, padding:24, maxWidth:760, width:"100%", margin:"0 auto", boxSizing:"border-box" }}>
        {/* Question card */}
        <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, padding:24, marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div style={{ display:"flex", gap:8 }}>
              <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600, background:`${catColor[q?.cat] ?? T.primary}18`, color:catColor[q?.cat] ?? T.primary, border:`1px solid ${catColor[q?.cat] ?? T.primary}30` }}>
                {q?.cat}
              </span>
              <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, color:T.muted, background:"rgba(255,255,255,0.04)", border:`1px solid ${T.border}` }}>
                {field}
              </span>
            </div>
            <CircularTimer t={timeLeft} />
          </div>
          <h2 style={{ color:T.text, fontSize:20, fontWeight:700, margin:0, lineHeight:1.4 }}>
            {q?.q}
          </h2>
        </div>

        {/* Score reveal or answer form */}
        {showResult ? (
          <ScoreReveal result={lastResult} onNext={onNext} />
        ) : (
          <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, padding:24 }}>
            <label style={{ display:"block", fontSize:12, color:T.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.07em" }}>Your Answer</label>
            <textarea
              value={answer}
              onChange={e => { setAnswer(e.target.value); setWarn(""); }}
              placeholder="Type your detailed answer here…"
              rows={5}
              style={{ width:"100%", padding:"12px 14px", background:T.surfaceUp, border:`1px solid ${T.border}`, borderRadius:10, color:T.text, fontSize:14, lineHeight:1.6, resize:"vertical", outline:"none", fontFamily:T.display, boxSizing:"border-box" }}
            />
            {warn && <div style={{ color:T.warning, fontSize:12, marginTop:6 }}>{warn}</div>}

            <div style={{ display:"flex", gap:10, marginTop:16 }}>
              <button onClick={handleSubmit} disabled={evaluating} style={{
                flex:2, padding:"11px", background: evaluating ? T.muted : T.primary,
                color:"#000", border:"none", borderRadius:10, fontSize:14, fontWeight:700, cursor: evaluating ? "not-allowed" : "pointer",
              }}>
                {evaluating ? "🤖 Evaluating…" : "✅ Submit Answer"}
              </button>
              <button onClick={onSkip} disabled={evaluating} style={{
                flex:1, padding:"11px", background:"transparent", color:T.muted,
                border:`1px solid ${T.border}`, borderRadius:10, fontSize:14, cursor:"pointer",
              }}>
                ⏭ Skip
              </button>
            </div>
            <div style={{ marginTop:12, fontSize:11, color:T.muted, textAlign:"center" }}>
              Evaluated by Claude AI using BERT · spaCy · TF-IDF scoring
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// RESULTS SCREEN
// ──────────────────────────────────────────────────────────────
function Results({ scores, name, field, onRestart }) {
  const [expanded, setExpanded] = useState(null);
  const avg = scores.length ? scores.reduce((a,s) => a+s.final_score, 0) / scores.length : 0;
  const passed = scores.filter(s => s.final_score >= PASS_THRESHOLD).length;
  const skipped = scores.filter(s => s.skipped).length;
  const timeout = scores.filter(s => s.timeout).length;
  const { g, label, color } = getGrade(avg);
  const qualified = avg >= PASS_THRESHOLD;

  const chartData = scores.map((s, i) => ({
    name: `Q${i+1}`,
    score: Math.round(s.final_score * 100),
    pass: s.final_score >= PASS_THRESHOLD,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:T.surfaceUp, border:`1px solid ${T.border}`, borderRadius:8, padding:"8px 12px", fontSize:12 }}>
        <div style={{ color:T.muted }}>{label}</div>
        <div style={{ color:T.primary, fontWeight:700 }}>{payload[0].value}%</div>
      </div>
    );
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:T.display, padding:24 }}>
      <div style={{ maxWidth:800, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:36, paddingTop:16 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>{qualified ? "🏆" : "📋"}</div>
          <h1 style={{ color:T.text, fontSize:28, fontWeight:800, margin:0 }}>Interview Complete</h1>
          <p style={{ color:T.muted, marginTop:8 }}>{name} · {field}</p>
        </div>

        {/* Final status banner */}
        <div style={{
          background: qualified ? "rgba(52,211,153,0.08)" : "rgba(244,63,94,0.08)",
          border: `1px solid ${qualified ? "rgba(52,211,153,0.25)" : "rgba(244,63,94,0.25)"}`,
          borderRadius:16, padding:"20px 28px", marginBottom:24,
          display:"flex", alignItems:"center", justifyContent:"space-between",
        }}>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color: qualified ? T.success : T.danger }}>
              {qualified ? "✅ QUALIFIED" : "❌ NOT QUALIFIED"}
            </div>
            <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>
              {qualified ? "You passed the technical assessment." : `Threshold is ${PASS_THRESHOLD*100}%. Review missing keywords and try again.`}
            </div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:42, fontWeight:900, color, fontFamily:T.mono }}>{g}</div>
            <div style={{ fontSize:12, color:T.muted }}>{label}</div>
          </div>
        </div>

        {/* Metric cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
          {[
            { label:"Total", value:scores.length, icon:"❓" },
            { label:"Passed", value:`${passed}/${scores.length}`, icon:"✅" },
            { label:"Skipped", value:skipped, icon:"⏭" },
            { label:"Avg Score", value:`${Math.round(avg*100)}%`, icon:"📊", accent:true },
          ].map(m => (
            <div key={m.label} style={{ background:T.surface, borderRadius:12, border:`1px solid ${m.accent ? T.borderHi : T.border}`, padding:"14px 16px" }}>
              <div style={{ fontSize:18, marginBottom:6 }}>{m.icon}</div>
              <div style={{ fontSize:22, fontWeight:800, color:m.accent ? T.primary : T.text, fontFamily:T.mono }}>{m.value}</div>
              <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, padding:24, marginBottom:24 }}>
          <h3 style={{ color:T.text, fontSize:14, fontWeight:700, marginBottom:16, marginTop:0 }}>Score per Question</h3>
          <div style={{ position:"relative", height:180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={18} margin={{ top:4, right:4, bottom:4, left:-20 }}>
                <XAxis dataKey="name" tick={{ fill:T.muted, fontSize:11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill:T.muted, fontSize:11 }} domain={[0,100]} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="score" radius={[4,4,0,0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.pass ? T.success : T.danger} opacity={0.8}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display:"flex", gap:16, marginTop:8, fontSize:11 }}>
            <span style={{ display:"flex", alignItems:"center", gap:5, color:T.muted }}><span style={{ width:10, height:10, background:T.success, borderRadius:2, display:"inline-block" }}/> Pass (≥{PASS_THRESHOLD*100}%)</span>
            <span style={{ display:"flex", alignItems:"center", gap:5, color:T.muted }}><span style={{ width:10, height:10, background:T.danger, borderRadius:2, display:"inline-block" }}/> Fail</span>
          </div>
        </div>

        {/* Question breakdown accordion */}
        <div style={{ marginBottom:32 }}>
          <h3 style={{ color:T.text, fontSize:14, fontWeight:700, marginBottom:12 }}>Detailed Breakdown</h3>
          {scores.map((s, i) => {
            const pct = Math.round(s.final_score * 100);
            const pass = s.final_score >= PASS_THRESHOLD;
            const status = s.timeout ? "⏰ Timeout" : s.skipped ? "⏭ Skipped" : pass ? "✅ Pass" : "❌ Fail";
            const statusColor = s.timeout ? T.warning : s.skipped ? T.muted : pass ? T.success : T.danger;
            const open = expanded === i;
            return (
              <div key={i} style={{ background:T.surface, border:`1px solid ${open ? T.borderHi : T.border}`, borderRadius:12, marginBottom:8, overflow:"hidden", transition:"border 0.2s" }}>
                <div
                  onClick={() => setExpanded(open ? null : i)}
                  style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}
                >
                  <span style={{ fontFamily:T.mono, fontSize:11, color:T.muted, minWidth:28 }}>Q{i+1}</span>
                  <div style={{ flex:1, fontSize:13, color:T.text, fontWeight:500 }} title={s.question}>
                    {s.question.length > 60 ? s.question.slice(0,60)+"…" : s.question}
                  </div>
                  <span style={{ fontSize:12, color:statusColor, fontWeight:600, minWidth:80, textAlign:"right" }}>{status}</span>
                  <span style={{ fontFamily:T.mono, fontSize:14, fontWeight:700, color:statusColor, minWidth:44, textAlign:"right" }}>{pct}%</span>
                  <span style={{ color:T.muted, fontSize:12 }}>{open ? "▲" : "▼"}</span>
                </div>
                {open && (
                  <div style={{ padding:"0 16px 16px", borderTop:`1px solid ${T.border}` }}>
                    {s.skipped || s.timeout ? (
                      <p style={{ color:T.muted, fontSize:13, margin:"12px 0 0" }}>{s.feedback}</p>
                    ) : (
                      <>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 24px", marginTop:14 }}>
                          <ScoreBar label="BERT (Semantic)" value={s.bert_score ?? 0} color={T.primary}/>
                          <ScoreBar label="spaCy (Linguistic)" value={s.spacy_score ?? 0} color={T.accent}/>
                          <ScoreBar label="TF-IDF (Overlap)" value={s.tfidf_score ?? 0} color={T.warning}/>
                          <ScoreBar label="Keyword Match" value={s.keyword_score ?? 0} color={T.success}/>
                        </div>
                        <div style={{ marginTop:10 }}>
                          {(s.found_keywords || []).map(k => <KwPill key={k} word={k} found/>)}
                          {(s.missing_keywords || []).map(k => <KwPill key={k} word={k} found={false}/>)}
                        </div>
                        {s.feedback && <p style={{ color:T.muted, fontSize:12, margin:"10px 0 0", fontStyle:"italic" }}>💡 {s.feedback}</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Restart */}
        <div style={{ textAlign:"center", paddingBottom:40 }}>
          <button onClick={onRestart} style={{
            padding:"12px 32px", background:T.surface, color:T.primary,
            border:`1px solid ${T.borderHi}`, borderRadius:12,
            fontSize:14, fontWeight:700, cursor:"pointer",
          }}>
            🔄 Start New Interview
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// GLOBAL STYLES injection
// ──────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
  * { box-sizing:border-box; }
  body { background:#070b14 !important; margin:0; }
  textarea:focus, input:focus { border-color:rgba(56,189,248,0.5) !important; box-shadow:0 0 0 3px rgba(56,189,248,0.08) !important; }
  ::-webkit-scrollbar { width:5px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:rgba(56,189,248,0.2); border-radius:3px; }
`;

// ──────────────────────────────────────────────────────────────
// MAIN APP
// ──────────────────────────────────────────────────────────────
export default function App() {
  const [screen,     setScreen]     = useState("landing");
  const [name,       setName]       = useState("");
  const [field,      setField]      = useState("Python");
  const [questions,  setQuestions]  = useState([]);
  const [qIdx,       setQIdx]       = useState(0);
  const [answer,     setAnswer]     = useState("");
  const [timeLeft,   setTimeLeft]   = useState(TIME);
  const [scores,     setScores]     = useState([]);
  const [evaluating, setEvaluating] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const timerRef = useRef(null);

  // Start timer when on interview screen and not showing result
  useEffect(() => {
    if (screen !== "interview" || showResult || evaluating) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [screen, qIdx, showResult, evaluating]);

  const handleTimeout = useCallback(() => {
    clearInterval(timerRef.current);
    const q = questions[qIdx];
    if (!q) return;
    const result = { question:q.q, category:q.cat, final_score:0, bert_score:0, spacy_score:0, tfidf_score:0, keyword_score:0, found_keywords:[], missing_keywords:q.kw, feedback:"Time limit exceeded. Answer was not evaluated.", skipped:false, timeout:true };
    setScores(prev => [...prev, result]);
    setLastResult(result);
    setShowResult(true);
    setTimeout(() => moveNext(qIdx, questions), 2500);
  }, [qIdx, questions]);

  const moveNext = useCallback((idx, qs) => {
    setShowResult(false);
    setLastResult(null);
    setAnswer("");
    if (idx + 1 >= qs.length) {
      setScreen("results");
    } else {
      setQIdx(idx + 1);
      setTimeLeft(TIME);
    }
  }, []);

  const handleNext = useCallback(() => moveNext(qIdx, questions), [qIdx, questions, moveNext]);

  const startInterview = useCallback(() => {
    const qs = QA.filter(q => q.field === field);
    setQuestions(qs);
    setQIdx(0);
    setScores([]);
    setTimeLeft(TIME);
    setAnswer("");
    setShowResult(false);
    setLastResult(null);
    setScreen("interview");
  }, [field]);

  const submitAnswer = useCallback(async () => {
    clearInterval(timerRef.current);
    const elapsed = TIME - timeLeft;
    const q = questions[qIdx];
    setEvaluating(true);
    let result;
    try {
      const raw = await aiEvaluate(q.q, q.ideal, q.kw, answer);
      result = { ...raw, question:q.q, category:q.cat, skipped:false, timeout:false, time:elapsed };
    } catch {
      // Fallback: basic Jaccard keyword match
      const words = new Set(answer.toLowerCase().split(/\W+/));
      const found = q.kw.filter(k => words.has(k));
      const ks = found.length / q.kw.length;
      const fs = Math.round(0.3 * ks * 10000) / 10000;
      result = {
        question:q.q, category:q.cat, final_score:fs,
        bert_score:ks*0.5, spacy_score:ks*0.4, tfidf_score:ks*0.6, keyword_score:ks,
        found_keywords:found, missing_keywords:q.kw.filter(k => !words.has(k)),
        feedback:"Evaluated offline (keyword match only).", skipped:false, timeout:false, time:elapsed,
      };
    }
    setEvaluating(false);
    setScores(prev => [...prev, result]);
    setLastResult(result);
    setShowResult(true);
  }, [qIdx, questions, answer, timeLeft]);

  const skipQuestion = useCallback(() => {
    clearInterval(timerRef.current);
    const q = questions[qIdx];
    const result = { question:q.q, category:q.cat, final_score:0, bert_score:0, spacy_score:0, tfidf_score:0, keyword_score:0, found_keywords:[], missing_keywords:q.kw, feedback:"Question skipped.", skipped:true, timeout:false };
    setScores(prev => [...prev, result]);
    setLastResult(result);
    setShowResult(true);
    setTimeout(() => moveNext(qIdx, questions), 1200);
  }, [qIdx, questions, moveNext]);

  const closeTest = useCallback(() => {
    clearInterval(timerRef.current);
    const remaining = questions.slice(qIdx);
    const closed = remaining.map(q => ({ question:q.q, category:q.cat, final_score:0, bert_score:0, spacy_score:0, tfidf_score:0, keyword_score:0, found_keywords:[], missing_keywords:q.kw, feedback:"Test closed early.", skipped:true, timeout:false }));
    setScores(prev => [...prev, ...closed]);
    setScreen("results");
  }, [qIdx, questions]);

  const restart = useCallback(() => {
    setScreen("landing");
    setScores([]);
    setQIdx(0);
    setAnswer("");
    setShowResult(false);
    setLastResult(null);
  }, []);

  return (
    <>
      <style>{STYLES}</style>
      {screen === "landing" && (
        <Landing name={name} setName={setName} field={field} setField={setField} onStart={startInterview}/>
      )}
      {screen === "interview" && (
        <Interview
          q={questions[qIdx]} idx={qIdx} total={questions.length}
          answer={answer} setAnswer={setAnswer}
          timeLeft={timeLeft} evaluating={evaluating}
          showResult={showResult} lastResult={lastResult}
          onSubmit={submitAnswer} onSkip={skipQuestion}
          onClose={closeTest} onNext={handleNext}
          name={name} field={field}
        />
      )}
      {screen === "results" && (
        <Results scores={scores} name={name} field={field} onRestart={restart}/>
      )}
    </>
  );
}
