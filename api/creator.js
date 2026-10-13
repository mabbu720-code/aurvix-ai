export const config = { runtime: "edge" };
export default async function handler(req) {
  const h = { "Content-Type": "application/json" };
  let b = {}; try { b = await req.json(); } catch {}
  const code = process.env.CREATOR_CODE || "";
  const ok = !!code && String(b.code || "").trim() === code;
  return new Response(JSON.stringify(ok ? { authorized: true, creator: process.env.CREATOR_NAME || "AURVIX Creator" } : { authorized: false }), { headers: h });
}
