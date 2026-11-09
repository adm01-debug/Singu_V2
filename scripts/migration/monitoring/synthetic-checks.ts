// synthetic-checks.ts — Jornadas sintéticas contra o app pós-cutover (somente leitura + login).
// Uso: deno run --allow-env --allow-net monitoring/synthetic-checks.ts
// Envs: APP_URL, DEST_SUPABASE_URL, DEST_ANON_KEY, SYNTHETIC_EMAIL, SYNTHETIC_PASSWORD
// Opcional: SENTRY_DSN, INTERVAL_MS (default 300000; 0 = single-shot; mínimo 1000 em loop),
//           CHECK_TIMEOUT_MS (15000 por requisição), MAX_RUNS (0 = sem limite; útil em cron/teste)
// Saída: single-shot → 0 ok / 1 falhou. Loop → roda até Ctrl-C/SIGTERM ou MAX_RUNS e sai 1 se
//        ALGUMA rodada falhou. 2 = configuração.

export interface CheckResult { name: string; ok: boolean; durationMs: number; error?: string }
export interface Config { appUrl: string; sbUrl: string; anon: string; email: string; password: string; sentry: string; intervalMs: number; timeoutMs: number; maxRuns: number }
export class ErroConfig extends Error {}

export function lerConfig(get: (k: string) => string | undefined): Config {
  const c = {
    appUrl: get("APP_URL") ?? "", sbUrl: (get("DEST_SUPABASE_URL") ?? "").replace(/\/+$/, ""), anon: get("DEST_ANON_KEY") ?? "",
    email: get("SYNTHETIC_EMAIL") ?? "", password: get("SYNTHETIC_PASSWORD") ?? "", sentry: get("SENTRY_DSN") ?? "",
  };
  if (!c.appUrl || !c.sbUrl || !c.anon || !c.email || !c.password) throw new ErroConfig("Variáveis obrigatórias ausentes.");
  const num = (nome: string, padrao: string, min: number) => {
    const v = Number(get(nome) ?? padrao);
    if (!Number.isFinite(v) || v < min) throw new ErroConfig(`${nome} inválido: esperado número >= ${min}`);
    return v;
  };
  const intervalMs = num("INTERVAL_MS", "300000", 0);
  if (intervalMs > 0 && intervalMs < 1000) throw new ErroConfig("INTERVAL_MS em loop precisa ser >= 1000 (ou 0 para rodada única)");
  return { ...c, intervalMs, timeoutMs: num("CHECK_TIMEOUT_MS", "15000", 1), maxRuns: Math.floor(num("MAX_RUNS", "0", 0)) };
}

async function timed(name: string, fn: () => Promise<void>): Promise<CheckResult> {
  const t0 = performance.now();
  try { await fn(); return { name, ok: true, durationMs: Math.round(performance.now() - t0) }; }
  catch (e) {
    const err = e as Error;
    return { name, ok: false, durationMs: Math.round(performance.now() - t0), error: err.name === "TimeoutError" ? "timeout" : err.message };
  }
}

export async function reportSentry(c: Config, results: CheckResult[], fetchFn: typeof fetch = fetch): Promise<void> {
  const failed = results.filter((r) => !r.ok);
  if (!c.sentry || failed.length === 0) return;
  try {
    const dsn = new URL(c.sentry);
    const projectId = dsn.pathname.replace(/^\//, "");
    const r = await fetchFn(`${dsn.protocol}//${dsn.host}/api/${projectId}/store/?sentry_key=${dsn.username}&sentry_version=7`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Synthetic checks falharam: ${failed.map((f) => f.name).join(", ")}`,
        level: "error", extra: { results },
      }),
      signal: AbortSignal.timeout(c.timeoutMs),
    });
    await r.body?.cancel();
    if (!r.ok) console.error(`Falha ao reportar Sentry: HTTP ${r.status}`);
  } catch (e) { console.error("Falha ao reportar Sentry:", (e as Error).name === "TimeoutError" ? "timeout" : "erro de rede"); }
}

/** Uma rodada completa. Login que não devolve token FALHA (antes: seguia sem checar o banco). */
export async function rodada(c: Config, fetchFn: typeof fetch = fetch): Promise<CheckResult[]> {
  const req = (url: string, init: RequestInit = {}) => fetchFn(url, { ...init, signal: AbortSignal.timeout(c.timeoutMs) });
  const exigir = async (r: Response, aceitos: number[] = [200]) => { await r.body?.cancel(); if (!aceitos.includes(r.status)) throw new Error(String(r.status)); };
  const results: CheckResult[] = [];
  results.push(await timed("app.healthcheck", async () => exigir(await req(c.appUrl, { redirect: "follow" }))));
  let token = "";
  results.push(await timed("auth.login", async () => {
    const r = await req(`${c.sbUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: c.anon },
      body: JSON.stringify({ email: c.email, password: c.password }),
    });
    if (!r.ok) { await r.body?.cancel(); throw new Error(`login ${r.status}`); }
    const j = await r.json().catch(() => ({})) as { access_token?: unknown };
    if (typeof j.access_token !== "string" || !j.access_token) throw new Error("login sem access_token");
    token = j.access_token;
  }));
  const h = { apikey: c.anon, Authorization: `Bearer ${token}` };
  const dependente = (name: string, fn: () => Promise<void>) =>
    token ? timed(name, fn) : Promise.resolve<CheckResult>({ name, ok: false, durationMs: 0, error: "não executado (login falhou)" });
  results.push(await dependente("db.contacts", async () => exigir(await req(`${c.sbUrl}/rest/v1/contacts?select=id&limit=1`, { headers: h }))));
  results.push(await dependente("db.companies", async () => exigir(await req(`${c.sbUrl}/rest/v1/companies?select=id&limit=1`, { headers: h }))));
  results.push(await dependente("edge.health", async () => exigir(await req(`${c.sbUrl}/functions/v1/health`, { headers: h }), [200, 401])));
  return results;
}

export function imprimir(results: CheckResult[], ts: string, log: (m: string) => void = console.log): boolean {
  for (const r of results) log(`[${ts}] ${r.ok ? "OK" : "FAIL"} ${r.name.padEnd(24)} ${r.durationMs}ms ${r.error ?? ""}`);
  return results.every((r) => r.ok);
}

/** Laço: devolve o código de saída. `parar` permite encerrar limpo (sinal). */
export async function laco(c: Config, op: { fetchFn?: typeof fetch; parar?: AbortSignal; dormir?: (ms: number, s?: AbortSignal) => Promise<void> } = {}): Promise<number> {
  const dormir = op.dormir ?? ((ms: number, s?: AbortSignal) => new Promise<void>((ok) => {
    const t = setTimeout(ok, ms);
    s?.addEventListener("abort", () => { clearTimeout(t); ok(); }, { once: true });
  }));
  let algumaFalhou = false;
  for (let n = 1; ; n++) {
    const results = await rodada(c, op.fetchFn);
    if (!imprimir(results, new Date().toISOString())) algumaFalhou = true;
    await reportSentry(c, results, op.fetchFn);
    if (c.intervalMs <= 0 || (c.maxRuns > 0 && n >= c.maxRuns) || op.parar?.aborted) break;
    await dormir(c.intervalMs, op.parar);
    if (op.parar?.aborted) break;
  }
  return algumaFalhou ? 1 : 0;
}

if (import.meta.main) {
  let cfg: Config;
  try { cfg = lerConfig((k) => Deno.env.get(k)); } catch (e) { console.error((e as Error).message); Deno.exit(2); }
  const ctl = new AbortController();
  if (cfg.intervalMs > 0) {
    console.log(`Loop a cada ${cfg.intervalMs}ms — ctrl-c para sair.`);
    for (const s of ["SIGINT", "SIGTERM"] as const) Deno.addSignalListener(s, () => ctl.abort());
  }
  Deno.exit(await laco(cfg, { parar: ctl.signal }));
}
