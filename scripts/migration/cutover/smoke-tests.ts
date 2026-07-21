// Smoke tests E2E pós-cutover contra o novo Supabase.
// Uso: deno run --allow-env --allow-net --allow-read --allow-write cutover/smoke-tests.ts
// Requer: TEST_URL (URL do app publicado), TEST_EMAIL, TEST_PASSWORD
// Instala Playwright na primeira execução se necessário via `deno task` externo.
// Aqui usamos apenas fetch — testes de UI ficam em playwright separado.
const url = Deno.env.get("TEST_URL") ?? "http://localhost:8080";
const email = Deno.env.get("TEST_EMAIL");
const password = Deno.env.get("TEST_PASSWORD");
const supabaseUrl = Deno.env.get("DEST_SUPABASE_URL");
const anonKey = Deno.env.get("DEST_ANON_KEY");

if (!supabaseUrl || !anonKey) { console.error("Defina DEST_SUPABASE_URL e DEST_ANON_KEY"); Deno.exit(2); }

const checks: { name: string; run: () => Promise<void> }[] = [];
const push = (name: string, run: () => Promise<void>) => checks.push({ name, run });

push("App responde 200", async () => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
});

push("Supabase Auth /health", async () => {
  const r = await fetch(`${supabaseUrl}/auth/v1/health`, { headers: { apikey: anonKey } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
});

push("Data API responde", async () => {
  const r = await fetch(`${supabaseUrl}/rest/v1/`, { headers: { apikey: anonKey } });
  if (r.status >= 500) throw new Error(`HTTP ${r.status}`);
});

if (email && password) {
  push("Login com credenciais de teste", async () => {
    const r = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${await r.text()}`);
    const j = await r.json();
    if (!j.access_token) throw new Error("sem access_token");
  });
}

push("Edge function /mcp health (opcional)", async () => {
  const r = await fetch(`${supabaseUrl}/functions/v1/mcp/.well-known/oauth-protected-resource`, {
    headers: { apikey: anonKey },
  });
  if (r.status === 404) return; // função não existente é ok
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
});

let failed = 0;
for (const c of checks) {
  try {
    await c.run();
    console.log(`✔ ${c.name}`);
  } catch (e) {
    failed++;
    console.error(`✖ ${c.name} — ${e instanceof Error ? e.message : String(e)}`);
  }
}
console.log(`\n${checks.length - failed}/${checks.length} passaram.`);
Deno.exit(failed ? 1 : 0);
