export const config = { runtime: "edge" };
const MODES = {
  "General": "Answer helpfully in a few sentences.",
  "Study": "Explain simply like a good teacher, with a short example.",
  "Code": "Give working code in a code block, then 1-2 lines of explanation.",
  "Writer": "Write polished, well-structured text.",
  "Translator": "Translate the text. Output only the translation unless asked.",
  "Math Solver": "Solve step by step, show the final answer clearly.",
  "Research": "Give a structured, factual overview with key points.",
  "Summarizer": "Summarize in short bullet points.",
  "Debugger": "Find the bug, show the fix, explain the cause in one line.",
  "Creative": "Be imaginative and original.",
  "Quiz Master": "Ask or evaluate quiz questions one at a time.",
  "Deep Think": "Reason carefully, then give a clear final answer."
};
const LIMITS = { "Code": 900, "Writer": 700, "Research": 700, "Deep Think": 900, "Math Solver": 700 };
const CREATOR_Q = /(who (made|created|built|developed|owns|founded|trained) you|who (is|are|'s) your (creator|creators|owner|founder|founders|developer|developers|maker)|your (creator|creators|owner|founder|founders|developer|developers|maker)\b|(tumhe|tujhe|aapko) kisne|tera creator|tumhara creator|kisne banaya|kaun banaya)/i;
const PERSONA = "You are AURVIX, a sharp cyber-terminal AI assistant. Your name is AURVIX. Never say you are Gemini or made by Google or any other company; if asked what model you are, say you are AURVIX, a custom AI assistant. Be direct and concise. Reply in the user's language (Hindi/Hinglish/English). ";
const H = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" };
const err = (m, s = 500) => new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } });

export default async function handler(req) {
  if (req.method !== "POST") return err("POST only", 405);
  const KEY = process.env.GEMINI_API_KEY;
  if (!KEY) return err("GEMINI_API_KEY Vercel me set nahi hai", 500);
  let b; try { b = await req.json(); } catch { return err("Bad JSON", 400); }
  const message = String(b.message || "").trim().slice(0, 4000);
  const mode = MODES[b.mode] ? b.mode : "General";
  if (!message) return err("Message is empty", 400);
  if (CREATOR_Q.test(message)) return new Response("Creator identity is protected.", { headers: H });

  const hist = (Array.isArray(b.history) ? b.history : []).slice(-8)
    .filter(h => (h.role === "user" || h.role === "model") && typeof h.text === "string")
    .map(h => ({ role: h.role, parts: [{ text: h.text.slice(0, 2000) }] }));
  const make = think => JSON.stringify({
    systemInstruction: { parts: [{ text: PERSONA + MODES[mode] }] },
    contents: [...hist, { role: "user", parts: [{ text: message }] }],
    generationConfig: { maxOutputTokens: LIMITS[mode] || 500, temperature: mode === "Creative" ? 1 : 0.6,
      ...(think ? { thinkingConfig: { thinkingBudget: mode === "Deep Think" ? 1024 : 0 } } : {}) }
  });
  const call = async (m, think) => {
    const c = new AbortController(), t = setTimeout(() => c.abort(), 6000);
    try {
      return await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:streamGenerateContent?alt=sse`,
        { method: "POST", signal: c.signal, headers: { "Content-Type": "application/json", "x-goog-api-key": KEY }, body: make(think) });
    } finally { clearTimeout(t); }
  };

  const base = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  let r = null, last = "";
  for (const m of [base, "gemini-3.1-flash-lite", "gemini-3.8-flash"]) {
    try {
      r = await call(m, true);
      if (r.status === 400) r = await call(m, false);
    } catch (e) { r = null; last = m + ": slow, trying next"; continue; }
    if (r.ok) break;
    const e = (await r.json().catch(() => ({}))).error || {};
    last = m + ": " + (e.message || "error " + r.status);
    if (r.status === 401 || r.status === 403) break;
  }
  if (!r || !r.ok) return err(last || "Servers busy hain, thodi der baad try karo.", 502);

  const dec = new TextDecoder(), enc = new TextEncoder(); let buf = "";
  const out = new TransformStream({ transform(chunk, ctl) {
    buf += dec.decode(chunk, { stream: true });
    const lines = buf.split("\n"); buf = lines.pop();
    for (const l of lines) {
      if (!l.startsWith("data:")) continue;
      try {
        const j = JSON.parse(l.slice(5));
        const t = ((j.candidates?.[0]?.content?.parts) || []).map(p => p.text || "").join("");
        if (t) ctl.enqueue(enc.encode(t));
      } catch {}
    }
  } });
  return new Response(r.body.pipeThrough(out), { headers: H });
}