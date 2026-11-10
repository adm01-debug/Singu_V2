// Testes de reset-passwords.ts — Auth admin + PostgREST falsos. Nenhum e-mail real é enviado.
import assert from "node:assert/strict";
import { MockSupabase, rodar } from "./_mock_supabase.ts";
import { ErroConfig, executar, parseConfig, provedores, sanitizar, sha256Hex, type Config, type Envio, type LinhaLog, type Portas, type Usuario } from "./reset-passwords.ts";

const SCRIPT = new URL("./reset-passwords.ts", import.meta.url).pathname;
const amb: Record<string, string> = { TARGET_SITE_URL: "https://app.exemplo.com/" };
const cfg = (args: string[] = [], extra: Record<string, string> = {}): Config => parseConfig(args, (k) => ({ ...amb, ...extra } as Record<string, string>)[k]);
const uid = (i: number) => `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`;
const usuario = (i: number, provider = "email"): Usuario => ({ id: uid(i), email: `pessoa${i}@exemplo.com`, identities: [{ provider }] });

/** Portas em memória: registra envios, log e sonos. */
function portas(usuarios: Usuario[], respostas: (email: string, n: number) => Envio = () => ({ ok: true })) {
  const estado = { enviados: [] as string[], log: new Map<string, LinhaLog>(), saida: [] as Record<string, unknown>[], sonos: [] as number[], tentativas: new Map<string, number>(), paginas: 0, falharLog: "" };
  const p: Portas = {
    listar: (page, per) => { estado.paginas++; return Promise.resolve(usuarios.slice((page - 1) * per, page * per)); },
    statusLog: (id) => (estado.falharLog === "ler" ? Promise.reject(new Error("relation does not exist")) : Promise.resolve(estado.log.get(id)?.status ?? null)),
    gravarLog: (l) => { if (estado.falharLog === "gravar") return Promise.reject(new Error("log fora")); estado.log.set(l.user_id, l); return Promise.resolve(); },
    enviar: (email) => {
      const n = (estado.tentativas.get(email) ?? 0) + 1; estado.tentativas.set(email, n);
      const r = respostas(email, n); if (r.ok) estado.enviados.push(email); return Promise.resolve(r);
    },
    dormir: (ms) => { estado.sonos.push(ms); return Promise.resolve(); },
    log: (r) => { estado.saida.push(r); },
  };
  return { p, estado };
}

Deno.test("parseConfig: padrão é SIMULAÇÃO; --execute liga; flags inválidas e site sem https são erro", () => {
  assert.equal(cfg().execute, false); assert.equal(cfg(["--dry-run"]).execute, false);
  assert.equal(cfg(["--execute"]).execute, true);
  assert.equal(cfg().siteUrl, "https://app.exemplo.com");
  assert.equal(cfg(["--limit", "5"]).limite, 5); assert.equal(cfg(["--limit=7"]).limite, 7);
  assert.throws(() => cfg(["--execute", "--dry-run"]), /exclusivos/);
  assert.throws(() => cfg(["--exec"]), /flag desconhecida/); // erro de digitação não pode virar "execução real"
  assert.throws(() => cfg(["--limit", "x"]), ErroConfig);
  assert.throws(() => cfg([], { TARGET_SITE_URL: "http://app.exemplo.com" }), /https/);
  assert.throws(() => cfg([], { TARGET_SITE_URL: "" }), ErroConfig);
  assert.throws(() => cfg([], { RESET_THROTTLE_RPS: "0" }), ErroConfig);
  assert.equal(cfg([], { RESET_THROTTLE_RPS: "2" }).rps, 2);
});
Deno.test("provedores e sanitizar: identities ausentes caem em app_metadata; e-mail e link nunca passam", () => {
  assert.deepEqual(provedores({ id: "1", identities: [{ provider: "google" }, { provider: "email" }] }), ["google", "email"]);
  assert.deepEqual(provedores({ id: "1", identities: null, app_metadata: { providers: ["email"] } }), ["email"]);
  assert.deepEqual(provedores({ id: "1", app_metadata: { provider: "apple" } }), ["apple"]);
  assert.deepEqual(provedores({ id: "1" }), []);
  const s = sanitizar(`Email ana@exemplo.com inválido; veja https://x.supabase.co/verify?token=abc e outro@y.com`, "ana@exemplo.com")!;
  assert.ok(!/ana@|outro@|token=abc/.test(s), s); assert.equal(sanitizar(undefined, "a@b.c"), null);
});

Deno.test("simulação (padrão): pagina tudo, não envia, não grava, não espera lote; log sem e-mail", async () => {
  const us = [...Array.from({ length: 250 }, (_, i) => usuario(i)), usuario(900, "google"), { id: uid(901), email: null, identities: [{ provider: "email" }] }];
  const { p, estado } = portas(us);
  const c = await executar(cfg(), p);
  assert.deepEqual(c, { scanned: 252, skipped_no_email_provider: 2, skipped_already_sent: 0, sent: 0, would_send: 250, failed: 0 });
  assert.equal(estado.enviados.length, 0); assert.equal(estado.log.size, 0); assert.deepEqual(estado.sonos, []);
  assert.equal(estado.paginas, 4); // 100+100+52 e a vazia: não para na 1ª página
  assert.ok(!JSON.stringify(estado.saida).includes("@exemplo.com"));
  assert.equal(estado.saida[0].dry_run, true);
});
Deno.test("execução: envia 1 e-mail por usuário de senha, grava log com hash, respeita RPS e pausa entre lotes", async () => {
  const { p, estado } = portas([usuario(1), usuario(2, "google"), usuario(3)]);
  const c = await executar(cfg(["--execute"], { RESET_THROTTLE_RPS: "4", RESET_BATCH_PAUSE_MS: "777" }), p);
  assert.deepEqual({ sent: c.sent, failed: c.failed, pulados: c.skipped_no_email_provider }, { sent: 2, failed: 0, pulados: 1 });
  assert.deepEqual(estado.enviados, ["pessoa1@exemplo.com", "pessoa3@exemplo.com"]);
  const l = estado.log.get(uid(1))!;
  assert.equal(l.status, "sent"); assert.equal(l.email_hash, await sha256Hex("pessoa1@exemplo.com")); assert.ok(l.sent_at);
  assert.ok(!JSON.stringify([...estado.log.values()]).includes("@exemplo.com"), "log de auditoria não guarda e-mail");
  assert.deepEqual(estado.sonos, [250, 250, 777]);
});
Deno.test("retomada: quem já está 'sent' não recebe de novo; 'failed'/'pending' são reprocessados; 2ª execução envia zero", async () => {
  const us = [usuario(1), usuario(2), usuario(3)];
  const { p, estado } = portas(us);
  estado.log.set(uid(1), { user_id: uid(1), email_hash: "h", status: "sent", attempts: 1, provider: "email", error_code: null, error_message: null });
  estado.log.set(uid(2), { user_id: uid(2), email_hash: "h", status: "failed", attempts: 5, provider: "email", error_code: "x", error_message: "y" });
  let c = await executar(cfg(["--execute"]), p);
  assert.deepEqual({ sent: c.sent, ja: c.skipped_already_sent }, { sent: 2, ja: 1 });
  assert.deepEqual(estado.enviados, ["pessoa2@exemplo.com", "pessoa3@exemplo.com"]);
  c = await executar(cfg(["--execute"]), p);
  assert.deepEqual({ sent: c.sent, ja: c.skipped_already_sent }, { sent: 0, ja: 3 }); assert.equal(estado.enviados.length, 2);
});
Deno.test("429/5xx/rede: backoff exponencial e sucesso; erro definitivo não é retentado; 'Unable to generate link' não é confundido com rate limit", async () => {
  const resp = (email: string, n: number): Envio => {
    if (email.startsWith("pessoa1@")) return n < 3 ? { ok: false, status: 429, message: "email rate limit exceeded" } : { ok: true };
    if (email.startsWith("pessoa2@")) return n < 2 ? { ok: false, status: 503, message: "upstream" } : { ok: true };
    if (email.startsWith("pessoa3@")) return { ok: false, status: 422, code: "validation_failed", message: `Unable to generate link for ${email} https://x/y?token=SEGREDO` };
    return { ok: false, status: 429, message: "rate limit" };
  };
  const { p, estado } = portas([usuario(1), usuario(2), usuario(3), usuario(4)], resp);
  const c = await executar(cfg(["--execute"], { RESET_MAX_RETRIES: "4", RESET_BACKOFF_MS: "100", RESET_BATCH_PAUSE_MS: "0", RESET_THROTTLE_RPS: "1000" }), p);
  assert.deepEqual({ sent: c.sent, failed: c.failed }, { sent: 2, failed: 2 });
  assert.deepEqual([1, 2, 3, 4].map((i) => estado.tentativas.get(`pessoa${i}@exemplo.com`)), [3, 2, 1, 4]);
  assert.deepEqual(estado.sonos.filter((s) => s >= 100), [100, 200, 100, 100, 200, 400]);
  const f = estado.log.get(uid(3))!;
  assert.equal(f.status, "failed"); assert.equal(f.error_code, "validation_failed");
  assert.ok(!/pessoa3@|SEGREDO/.test(f.error_message!), f.error_message!);
  assert.ok(!/pessoa\d@|SEGREDO/.test(JSON.stringify(estado.saida)));
});
Deno.test("log ilegível aborta ANTES de qualquer envio; falha ao gravar o log aborta na hora (sem log não há retomada segura)", async () => {
  const a = portas([usuario(1), usuario(2)]); a.estado.falharLog = "ler";
  await assert.rejects(executar(cfg(["--execute"]), a.p), /relation does not exist/);
  assert.equal(a.estado.enviados.length, 0);
  const b = portas([usuario(1), usuario(2), usuario(3)]); b.estado.falharLog = "gravar";
  await assert.rejects(executar(cfg(["--execute"]), b.p), /log fora/);
  assert.equal(b.estado.enviados.length, 1, "para no 1º: não segue enviando sem registrar");
});
Deno.test("--limit processa só N elegíveis; lista vazia termina limpo", async () => {
  const { p, estado } = portas(Array.from({ length: 30 }, (_, i) => usuario(i)));
  const c = await executar(cfg(["--execute", "--limit", "5"], { RESET_BATCH_PAUSE_MS: "0" }), p);
  assert.equal(c.sent, 5); assert.equal(estado.enviados.length, 5);
  const v = portas([]);
  assert.deepEqual((await executar(cfg(["--execute"]), v.p)).scanned, 0);
});

Deno.test("processo ponta a ponta: sem flag NADA é enviado; --execute envia por /recover (não generate_link), grava o log e não imprime e-mail/link/chave", async () => {
  const m = await MockSupabase.iniciar();
  const env = { TARGET_SUPABASE_URL: m.url, TARGET_SERVICE_ROLE_KEY: "chave-service-role", TARGET_SITE_URL: "https://app.exemplo.com", RESET_BATCH_PAUSE_MS: "0", RESET_THROTTLE_RPS: "1000", RESET_BATCH_SIZE: "2", RESET_BACKOFF_MS: "1" };
  try {
    m.usuarios = [...Array.from({ length: 5 }, (_, i) => ({ id: uid(i), email: `pessoa${i}@exemplo.com`, identities: [{ provider: "email" }] })), { id: uid(50), email: "social@exemplo.com", identities: [{ provider: "google" }] }];
    let r = await rodar(SCRIPT, env);
    assert.equal(r.code, 1); assert.match(r.out + r.err, /create-reset-log\.sql/); // tabela de log ausente: aborta até na simulação
    const log = m.tabela("migration_password_reset_log", ["user_id"]);
    r = await rodar(SCRIPT, env);
    assert.equal(r.code, 0, r.out + r.err); assert.match(r.err, /MODO SIMULAÇÃO/);
    assert.equal(m.recuperacoes.length, 0); assert.equal(m.linksGerados.length, 0); assert.equal(log.linhas.length, 0);
    assert.equal(m.contar("POST", /./), 0, "simulação não faz nenhuma escrita");
    m.falhar("POST", /auth\/v1\/recover/, [429, 500]);
    r = await rodar(SCRIPT, env, ["--execute"]);
    assert.equal(r.code, 0, r.out + r.err);
    assert.deepEqual([...m.recuperacoes].sort(), [0, 1, 2, 3, 4].map((i) => `pessoa${i}@exemplo.com`));
    assert.equal(m.linksGerados.length, 0, "generate_link só devolve o link: não envia e-mail");
    assert.equal(log.linhas.length, 5); assert.ok(log.linhas.every((l) => l.status === "sent" && /^[0-9a-f]{64}$/.test(String(l.email_hash))));
    const corpo = JSON.parse(new TextDecoder().decode(m.reqs.find((q) => q.path.endsWith("/recover"))!.corpo));
    assert.equal(new URL(m.reqs.find((q) => q.path.endsWith("/recover"))!.search, "http://x").searchParams.get("redirect_to") ?? corpo.redirect_to ?? "", "https://app.exemplo.com/reset-password?forced=true");
    assert.ok(!/@exemplo\.com|chave-service-role|token=/.test(r.out + r.err), "nada de e-mail, chave ou link no log");
    const ultima = JSON.parse(r.out.trim().split("\n").at(-1)!);
    assert.deepEqual({ a: ultima.action, s: ultima.counters.sent, p: ultima.counters.skipped_no_email_provider }, { a: "done", s: 5, p: 1 });
    r = await rodar(SCRIPT, env, ["--execute"]); // rerun: ninguém recebe duas vezes
    assert.equal(r.code, 0); assert.equal(m.recuperacoes.length, 5);
    m.usuarios.push({ id: uid(77), email: "novo@exemplo.com", identities: [{ provider: "email" }] });
    m.falhar("POST", /auth\/v1\/recover/, [400], { corpo: JSON.stringify({ code: 400, error_code: "validation_failed", msg: "Unable to validate email address: invalid format" }), headers: { "content-type": "application/json" } });
    r = await rodar(SCRIPT, env, ["--execute"]);
    assert.equal(r.code, 2); assert.equal(log.linhas.find((l) => l.user_id === uid(77))!.status, "failed");
    assert.equal((await rodar(SCRIPT, env, ["--help"])).code, 0);
    assert.equal((await rodar(SCRIPT, env, ["--executar"])).code, 1);
    assert.equal((await rodar(SCRIPT, { TARGET_SITE_URL: "https://x" })).code, 1);
  } finally { await m.parar(); }
});
