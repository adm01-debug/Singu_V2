// synthetic-checks.ts — Jornadas sintéticas contra o app pós-cutover.
// Uso: deno run --allow-env --allow-net monitoring/synthetic-checks.ts
// Envs: APP_URL, DEST_SUPABASE_URL, DEST_ANON_KEY, SYNTHETIC_EMAIL, SYNTHETIC_PASSWORD
// Opcional: SENTRY_DSN, INTERVAL_MS (default 300000; 0 = single-shot)

interface CheckResult { name: string; ok: boolean; durationMs: number; error?: string }

const APP_URL = Deno.env.get("APP_URL") ?? "";
const SB_URL = Deno.env.get("DEST_SUPABASE_URL") ?? "";
const ANON = Deno.env.get("DEST_ANON_KEY") ?? "";
const EMAIL = Deno.env.get("SYNTHETIC_EMAIL") ?? "";
const PASSWORD = Deno.env.get("SYNTHETIC_PASSWORD") ?? "";
const SENTRY = Deno.env.get("SENTRY_DSN") ?? "";
const INTERVAL = Number(Deno.env.get("INTERVAL_MS") ?? "300000");

if (!APP_URL || !SB_URL || !ANON || !EMAIL || !PASSWORD) {
  console.error("Variáveis obrigatórias ausentes."); Deno.exit(2);
}

async function timed(name: string, fn: () => Promise<void>): Promise<CheckResult> {
  const t0 = performance.now();
  try { await fn(); return { name, ok: true, durationMs: Math.round(performance.now() - t0) }; }
  catch (e) { return { name, ok: false, durationMs: Math.round(performance.now() - t0), error: (e as Error).message }; }
}

async function login(): Promise<string> {
  const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!r.ok) throw new Error(`login ${r.status}`);
  return (await r.json()).access_token;
}

async function reportSentry(results: CheckResult[]) {
  if (!SENTRY) return;
  const failed = results.filter((r) => !r.ok);
  if (failed.length === 0) return;
  try {
    const dsn = new URL(SENTRY);
    const projectId = dsn.pathname.replace(/^\//, "");
    const key = dsn.username;
    const host = `${dsn.protocol}//${dsn.host}`;
    await fetch(`${host}/api/${projectId}/store/?sentry_key=${key}&sentry_version=7`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Synthetic checks falharam: ${failed.map((f) => f.name).join(", ")}`,
        level: "error", extra: { results },
      }),
    });
  } catch (e) { console.error("Falha ao reportar Sentry:", (e as Error).message); }
}

async function run() {
  const results: CheckResult[] = [];
  results.push(await timed("app.healthcheck", async () => {
    const r = await fetch(APP_URL, { redirect: "follow" });
    if (!r.ok) throw new Error(String(r.status));
  }));
  let token = "";
  results.push(await timed("auth.login", async () => { token = await login(); }));
  if (token) {
    const h = { apikey: ANON, Authorization: `Bearer ${token}` };
    results.push(await timed("db.contacts", async () => {
      const r = await fetch(`${SB_URL}/rest/v1/contacts?select=id&limit=1`, { headers: h });
      if (!r.ok) throw new Error(String(r.status));
    }));
    results.push(await timed("db.companies", async () => {
      const r = await fetch(`${SB_URL}/rest/v1/companies?select=id&limit=1`, { headers: h });
      if (!r.ok) throw new Error(String(r.status));
    }));
    results.push(await timed("edge.health", async () => {
      const r = await fetch(`${SB_URL}/functions/v1/health`, { headers: h });
      if (r.status !== 200 && r.status !== 401) throw new Error(String(r.status));
    }));
  }
  const ts = new Date().toISOString();
  for (const r of results) {
    console.log(`[${ts}] ${r.ok ? "OK" : "FAIL"} ${r.name.padEnd(24)} ${r.durationMs}ms ${r.error ?? ""}`);
  }
  await reportSentry(results);
  return results.every((r) => r.ok);
}

if (INTERVAL <= 0) { const ok = await run(); Deno.exit(ok ? 0 : 1); }
else {
  console.log(`Loop a cada ${INTERVAL}ms — ctrl-c para sair.`);
  while (true) { await run(); await new Promise((r) => setTimeout(r, INTERVAL)); }
}