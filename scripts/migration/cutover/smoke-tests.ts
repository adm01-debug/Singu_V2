// Smoke tests E2E pós-cutover contra o novo Supabase (somente leitura + 1 login de teste).
// Uso: deno run --allow-env --allow-net cutover/smoke-tests.ts
// Requer: DEST_SUPABASE_URL, DEST_ANON_KEY. Opcionais: TEST_URL (URL do app publicado;
//   padrão http://localhost:8080), TEST_EMAIL + TEST_PASSWORD (os dois ou nenhum),
//   SMOKE_TABLE (contacts), SMOKE_TIMEOUT_MS (10000 por requisição).
// Aqui usamos apenas fetch — testes de UI ficam em playwright separado.
// Cada verificação tem timeout; 5xx, chave inválida e tabela inexistente FALHAM.
// Saída: 0 tudo passou · 1 alguma verificação falhou · 2 configuração.

export interface Config {
  appUrl: string; supabaseUrl: string; anonKey: string;
  email?: string; password?: string; tabela: string; timeoutMs: number;
}
export type Resultado = "ok" | "pulado";
export interface Check { name: string; run: () => Promise<Resultado> }
export class ErroConfig extends Error {}

export function lerConfig(get: (k: string) => string | undefined): Config {
  let supabaseUrl = get("DEST_SUPABASE_URL") ?? "";
  while (supabaseUrl.endsWith("/")) supabaseUrl = supabaseUrl.slice(0, -1);
  const anonKey = get("DEST_ANON_KEY") ?? "";
  if (!supabaseUrl || !anonKey) throw new ErroConfig("Defina DEST_SUPABASE_URL e DEST_ANON_KEY");
  const email = get("TEST_EMAIL") || undefined, password = get("TEST_PASSWORD") || undefined;
  if (Boolean(email) !== Boolean(password)) throw new ErroConfig("Defina TEST_EMAIL e TEST_PASSWORD juntos (ou nenhum)");
  const timeoutMs = Number(get("SMOKE_TIMEOUT_MS") ?? "10000");
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new ErroConfig("SMOKE_TIMEOUT_MS inválido");
  const tabela = get("SMOKE_TABLE") ?? "contacts";
  if (!/^[a-z_][a-z0-9_]*$/i.test(tabela)) throw new ErroConfig("SMOKE_TABLE inválido");
  return { appUrl: get("TEST_URL") ?? "http://localhost:8080", supabaseUrl, anonKey, email, password, tabela, timeoutMs };
}

export function montarChecks(c: Config, fetchFn: typeof fetch = fetch): Check[] {
  const req = async (url: string, init: RequestInit = {}): Promise<Response> => {
    try {
      return await fetchFn(url, { ...init, signal: AbortSignal.timeout(c.timeoutMs) });
    } catch (e) {
      throw new Error(e instanceof Error && e.name === "TimeoutError" ? `timeout após ${c.timeoutMs}ms` : `rede: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  const chave = { apikey: c.anonKey };
  let token = "";
  const checks: Check[] = [];
  const push = (name: string, run: () => Promise<Resultado>) => checks.push({ name, run });

  push("App responde 200", async () => {
    const r = await req(c.appUrl);
    const corpo = await r.text();
    if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
    if (!corpo.trim()) throw new Error("HTTP 200 com corpo vazio");
    return "ok";
  });

  push("Supabase Auth /health", async () => {
    const r = await req(`${c.supabaseUrl}/auth/v1/health`, { headers: chave });
    await r.body?.cancel();
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return "ok";
  });

  push(`Data API responde (anon em ${c.tabela})`, async () => {
    const r = await req(`${c.supabaseUrl}/rest/v1/${c.tabela}?select=id&limit=1`, { headers: { ...chave, Authorization: `Bearer ${c.anonKey}` } });
    const corpo = await r.text();
    if (r.status === 200) return "ok";
    // Sem login, "permission denied" (42501) é o esperado com RLS/grants corretos: API e chave funcionam.
    if ((r.status === 401 || r.status === 403) && corpo.includes("42501")) return "ok";
    throw new Error(`HTTP ${r.status}: ${corpo.slice(0, 120)}`);
  });

  if (c.email && c.password) {
    push("Login com credenciais de teste", async () => {
      const r = await req(`${c.supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...chave },
        body: JSON.stringify({ email: c.email, password: c.password }),
      });
      if (!r.ok) { await r.body?.cancel(); throw new Error(`HTTP ${r.status}`); } // corpo pode ecoar o e-mail: não imprime
      const j = await r.json().catch(() => ({})) as { access_token?: string };
      if (!j.access_token) throw new Error("sem access_token");
      token = j.access_token;
      return "ok";
    });
    push(`Leitura autenticada de ${c.tabela}`, async () => {
      if (!token) throw new Error("sem sessão (login falhou)");
      const r = await req(`${c.supabaseUrl}/rest/v1/${c.tabela}?select=id&limit=1`, { headers: { ...chave, Authorization: `Bearer ${token}` } });
      const corpo = await r.text();
      if (r.status !== 200) throw new Error(`HTTP ${r.status}: ${corpo.slice(0, 120)}`);
      if (!Array.isArray(JSON.parse(corpo))) throw new Error("resposta não é lista");
      return "ok";
    });
  } else {
    push("Login com credenciais de teste", () => Promise.resolve("pulado" as const));
  }

  push("Edge function /mcp health (opcional)", async () => {
    const r = await req(`${c.supabaseUrl}/functions/v1/mcp/.well-known/oauth-protected-resource`, { headers: chave });
    await r.body?.cancel();
    if (r.status === 404) return "pulado"; // função não existente é ok, mas não conta como aprovada
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return "ok";
  });
  return checks;
}

export async function executar(checks: Check[], log: { ok: (m: string) => void; erro: (m: string) => void } = { ok: console.log, erro: console.error }): Promise<{ passaram: number; falharam: number; pulados: number }> {
  const r = { passaram: 0, falharam: 0, pulados: 0 };
  for (const c of checks) {
    try {
      if (await c.run() === "pulado") { r.pulados++; log.ok(`– ${c.name} (pulado)`); }
      else { r.passaram++; log.ok(`✔ ${c.name}`); }
    } catch (e) {
      r.falharam++;
      log.erro(`✖ ${c.name} — ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return r;
}

if (import.meta.main) {
  let cfg: Config;
  try { cfg = lerConfig((k) => Deno.env.get(k)); } catch (e) { console.error((e as Error).message); Deno.exit(2); }
  const r = await executar(montarChecks(cfg));
  const pulados = r.pulados ? ` (${r.pulados} pulado(s))` : "";
  console.log(`\n${r.passaram}/${r.passaram + r.falharam} passaram${pulados}.`);
  Deno.exit(r.falharam ? 1 : 0);
}
