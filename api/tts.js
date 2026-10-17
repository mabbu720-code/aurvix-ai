export const config = { runtime: "edge" };
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });
const err = (m, s = 500) => json({ error: m }, s);
const call = (key, voice, text) => fetch("https://api.elevenlabs.io/v1/text-to-speech/" + encodeURIComponent(voice) + "/stream?output_format=mp3_44100_64", {
  method: "POST",
  headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
  body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5", voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
});

export default async function handler(req) {
  const key = process.env.ELEVENLABS_API_KEY, voice = process.env.ELEVENLABS_VOICE_ID;
  if (req.method === "GET") {
    if (new URL(req.url).searchParams.get("check") !== "1") return err("POST only", 405);
    if (!key || !voice) return json({ ok: false, problem: "Vercel me ELEVENLABS_API_KEY ya ELEVENLABS_VOICE_ID nahi mili", hasKey: !!key, hasVoice: !!voice });
    const r = await call(key, voice, "ok");
    return json({ ok: r.ok, status: r.status, detail: r.ok ? "ElevenLabs theek chal raha hai" : (await r.text()).slice(0, 400), voiceIdLength: voice.length });
  }
  if (req.method !== "POST") return err("POST only", 405);
  if (!key || !voice) return err("ElevenLabs keys not set", 500);
  try {
    const o = req.headers.get("origin");
    if (!o || new URL(o).host !== req.headers.get("host")) return err("Forbidden", 403);
  } catch { return err("Forbidden", 403); }
  let b; try { b = await req.json(); } catch { return err("Bad JSON", 400); }
  const text = String(b.text || "").replace(/\s+/g, " ").trim().slice(0, 500);
  if (!text) return err("No text", 400);
  const r = await call(key, voice, text);
  if (!r.ok) return err("TTS failed " + r.status, 502);
  return new Response(r.body, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
}