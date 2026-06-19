// ── Filler word & answer quality analysis ──────────────────────
export const FILLER_WORDS = ["um","uh","like","you know","basically","literally","actually","kind of","sort of","i mean","right","okay","so","well"];

export async function callAnthropic(prompt) {
  const res = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 300,
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
  const data = await res.json();
  const text = data.content.filter(b => b.type === "text").map(b => b.text).join("");
  return text.replace(/```json|```/g, "").trim();
}

export async function callOpenAI(prompt) {
  const res = await fetch("/api/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${(import.meta.env.VITE_OPENAI_API_KEY || "").replace(/^["']|["']$/g, "")}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

export async function callGemini(prompt) {
  const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || "").replace(/^["']|["']$/g, "");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      }
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text.trim();
}

export async function callGroq(prompt) {
  const apiKey = (import.meta.env.VITE_GROQ_API_KEY || "").replace(/^["']|["']$/g, "");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

export async function callGrok(prompt) {
  // Allow multiple keys separated by commas
  const rawKeys = import.meta.env.VITE_GROK_API_KEY || "";
  const keys = rawKeys.split(",").map(k => k.trim().replace(/^["']|["']$/g, "")).filter(Boolean);

  if (keys.length === 0) throw new Error("No Grok API keys found.");

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    console.log(`[Grok] Trying key ${i + 1}/${keys.length}...`);
    try {
      const res = await fetch("/api/xai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "grok-beta",
          temperature: 0.1,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.choices[0].message.content.trim();
    } catch (err) {
      console.warn(`[Grok] Key ${i + 1} failed:`, err.message);
      // If it's the last key, throw the error
      if (i === keys.length - 1) {
        throw new Error(`All Grok API keys failed. Last error: ${err.message}`);
      }
    }
  }
}

export async function callAIWaterfall(prompt) {
  try {
    console.log("Using Grok API exclusively...");
    return await callGrok(prompt);
  } catch (error) {
    console.error("Grok API FAILED!", error);
    throw new Error("Grok API failed: " + error.message);
  }
}

export async function aiEvaluate(question, ideal, keywords, answer) {
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

  const clean = await callAIWaterfall(prompt);
  return JSON.parse(clean);
}

export async function aiGenerateFollowUp(domain, question, answer, missingKeywords) {
  const prompt = `You are a strict technical interviewer. The candidate was asked: "${question}".
Their answer was: "${answer}".
They missed the following key concepts: ${missingKeywords.join(", ")}.

Generate a direct, challenging follow-up question asking them to elaborate specifically on the concepts they missed.
Respond ONLY with valid JSON, no markdown, no backticks:
{
  "q": "<the follow-up question>",
  "ideal": "<a perfect, comprehensive 2-3 sentence answer to this follow-up>",
  "kw": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>"],
  "cat": "Follow-up"
}`;
  const clean = await callAIWaterfall(prompt);
  return JSON.parse(clean);
}

export async function aiGenerateQuestion(domain, previousQs = [], resumeContext = "") {
  const preventRepetition = previousQs.length > 0 
    ? `\nCRITICAL INSTRUCTION: You MUST NOT generate any of these previously asked questions:\n${previousQs.map(q => "- " + q).join("\n")}`
    : "";

  const resumeInstruction = resumeContext 
    ? `\n\nCANDIDATE's RESUME EXTRACT:\n"""${resumeContext.substring(0, 2000)}"""\n\nCRITICAL INSTRUCTION: Analyze the resume above. Generate a challenging interview question explicitly tailored to a specific project, tool, or experience level mentioned in their resume related to "${domain}". Do NOT ask generic textbook questions.`
    : `\nEnsure it is DIFFERENT from standard textbook questions! Pick a random niche sub-topic!`;

  const prompt = `You are a strict technical interviewer. Generate a highly unique, random, and challenging conceptual interview question for a candidate applying for a role involving "${domain}".${resumeInstruction} (Random Seed: ${Math.random()}).${preventRepetition}
Respond ONLY with valid JSON, no markdown, no backticks:
{
  "q": "<the interview question>",
  "ideal": "<a perfect, comprehensive 2-3 sentence answer>",
  "kw": ["<keyword1>", "<keyword2>", "<keyword3>", "<keyword4>", "<keyword5>"],
  "cat": "AI Generated"
}`;
  const clean = await callAIWaterfall(prompt);
  return JSON.parse(clean);
}

export async function aiEvaluateResume(resumeText, domain) {
  const prompt = `Act as a strict technical recruiter. Evaluate the following candidate's resume for a role in "${domain}".
Resume Text: """${resumeText.substring(0, 3000)}"""

Analyze their skills and experience against standard requirements for "${domain}".
Respond ONLY with valid JSON, no markdown, no backticks:
{
  "ats_score": <number 0-100>,
  "matched_skills": ["<skill1>", "<skill2>"],
  "missing_skills": ["<skill1>", "<skill2>"],
  "verdict": "<'Pass' or 'Reject'>",
  "feedback": "<1-2 sentences explaining why they passed or failed>"
}`;
  const clean = await callAIWaterfall(prompt);
  return JSON.parse(clean);
}

