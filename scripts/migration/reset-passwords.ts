// ============================================================================
// reset-passwords.ts (Deno)
// ----------------------------------------------------------------------------
// Worker de disparo em massa de e-mails de recuperação de senha pós-migração.
//
// Uso:
//   deno run --allow-env --allow-net scripts/migration/reset-passwords.ts            # SIMULAÇÃO (padrão)
//   deno run --allow-env --allow-net scripts/migration/reset-passwords.ts --execute  # envia de verdade
//   Flags: --dry-run (explícito; é o padrão) · --execute · --limit N · --help
//
// MODO SEGURO: sem --execute nada é enviado nem gravado. Com --execute, cada usuário
// de login por senha recebe um e-mail de recuperação (POST /auth/v1/recover) — mexe com
// usuários REAIS. `auth.admin.generateLink` NÃO é usado: ele só devolve o link, não envia.
//
// Variáveis de ambiente obrigatórias (do banco de DESTINO):
//   TARGET_SUPABASE_URL          https://<project>.supabase.co
//   TARGET_SERVICE_ROLE_KEY      service_role key
//   TARGET_SITE_URL              https://app.exemplo.com  (usado no redirectTo)
// Opcionais: RESET_THROTTLE_RPS (10), RESET_BATCH_SIZE (100), RESET_BATCH_PAUSE_MS (10000),
//            RESET_MAX_RETRIES (5), RESET_BACKOFF_MS (1000)
//
// Comportamento:
//   - Pagina auth.users em lotes (até a página vir vazia).
//   - Ignora usuários sem provider 'email' (contas exclusivamente sociais).
//   - Retomada: ignora quem já está com status='sent' em migration_password_reset_log
//     (rode sql/create-reset-log.sql antes). Falha ao LER ou GRAVAR o log aborta na hora:
//     sem log não há como garantir que ninguém receba e-mail duplicado.
//   - Rate limit: RPS configurável, retry exponencial em 429/5xx/rede.
//   - Auditoria: uma linha JSON por ação no stdout, só com user_id e sha256(email) — nunca
//     e-mail, link ou chave.
// Saída: 0 ok · 2 houve usuário com falha de envio · 1 erro fatal (config, listagem, log).
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2.117.3";

export interface Config {
  siteUrl: string; execute: boolean; limite: number;
  batchSize: number; rps: number; maxRetries: number; backoffMs: number; pausaLoteMs: number;
}
export interface Usuario { id: string; email?: string | null; identities?: { provider: string }[] | null; app_metadata?: { provider?: string; providers?: string[] } | null }
export interface LinhaLog {
  user_id: string; email_hash: string; status: "sent" | "failed"; attempts: number; provider: string;
  sent_at?: string; error_code: string | null; error_message: string | null;
}
export type Envio = { ok: true } | { ok: false; status?: number; code?: string; message: string; retentavel?: boolean };
export interface Portas {
  listar(page: number, perPage: number): Promise<Usuario[]>;
  /** status atual no log (null = sem registro). Deve lançar em erro de leitura. */
  statusLog(userId: string): Promise<string | null>;
  gravarLog(l: LinhaLog): Promise<void>;
  enviar(email: string, redirectTo: string): Promise<Envio>;
  dormir(ms: number): Promise<void>;
  log(rec: Record<string, unknown>): void;
}
export interface Contadores {
  scanned: number; skipped_no_email_provider: number; skipped_already_sent: number;
  sent: number; would_send: number; failed: number;
}
export class ErroConfig extends Error {}

export const AJUDA = `reset-passwords.ts — dispara e-mails de recuperação de senha (pós-migração).
  (sem flag)   simulação: lista quem receberia, não envia nem grava nada
  --execute    envia de verdade e registra em migration_password_reset_log
  --dry-run    simulação explícita (não combina com --execute)
  --limit N    processa no máximo N usuários elegíveis
  --help       esta ajuda
Env: TARGET_SUPABASE_URL, TARGET_SERVICE_ROLE_KEY, TARGET_SITE_URL (obrigatórias).`;

export function parseConfig(args: string[], get: (k: string) => string | undefined): Config {
  const conhecidas = new Set(["--execute", "--dry-run", "--limit", "--help"]);
  let limite = 0;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith("--limit=")) { limite = Number(a.slice(8)); continue; }
    if (a === "--limit") { limite = Number(args[++i]); continue; }
    if (!conhecidas.has(a)) throw new ErroConfig(`flag desconhecida: ${a}`);
  }
  if (!Number.isInteger(limite) || limite < 0) throw new ErroConfig("--limit precisa ser inteiro >= 0");
  if (args.includes("--execute") && args.includes("--dry-run")) throw new ErroConfig("--execute e --dry-run são exclusivos");
  const int = (nome: string, padrao: number, min: number) => {
    const v = Number(get(nome) ?? padrao);
    if (!Number.isInteger(v) || v < min) throw new ErroConfig(`${nome} inválido: esperado inteiro >= ${min}`);
    return v;
  };
  const siteUrl = (get("TARGET_SITE_URL") ?? "").replace(/\/+$/, "");
  let u: URL;
  try { u = new URL(siteUrl); } catch { throw new ErroConfig("TARGET_SITE_URL ausente ou não é URL"); }
  if (u.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(u.hostname)) throw new ErroConfig("TARGET_SITE_URL precisa ser https");
  return {
    siteUrl, execute: args.includes("--execute"), limite,
    batchSize: int("RESET_BATCH_SIZE", 100, 1), rps: int("RESET_THROTTLE_RPS", 10, 1),
    maxRetries: int("RESET_MAX_RETRIES", 5, 1), backoffMs: int("RESET_BACKOFF_MS", 1000, 0),
    pausaLoteMs: int("RESET_BATCH_PAUSE_MS", 10_000, 0),
  };
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Providers do usuário (identities; se a API não as trouxer, app_metadata). */
export function provedores(u: Usuario): string[] {
  const ids = (u.identities ?? []).map((i) => i.provider);
  if (ids.length) return ids;
  return u.app_metadata?.providers ?? (u.app_metadata?.provider ? [u.app_metadata.provider] : []);
}

/** Tira e-mails e links de mensagens de erro antes de logar/persistir. */
export function sanitizar(msg: string | undefined, email: string): string | null {
  if (!msg) return null;
  return msg.split(email).join("<email>").replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "<email>").replace(/https?:\/\/\S+/g, "<url>").slice(0, 300);
}

const recuperavel = (e: Extract<Envio, { ok: false }>) =>
  e.retentavel === true || e.status === 429 || (e.status !== undefined && e.status >= 500) || e.status === 0 || /rate limit|too many|timeout|network|fetch failed/i.test(e.message);

async function processar(cfg: Config, p: Portas, c: Contadores, u: Usuario & { email: string }, provider: string): Promise<void> {
  const emailHash = await sha256Hex(u.email.toLowerCase().trim());
  if (await p.statusLog(u.id) === "sent") {
    c.skipped_already_sent++;
    p.log({ level: "info", user_id: u.id, email_hash: emailHash, action: "skip_already_sent" });
    return;
  }
  if (!cfg.execute) {
    c.would_send++;
    p.log({ level: "info", user_id: u.id, email_hash: emailHash, action: "dry_run" });
    return;
  }
  let attempt = 0;
  let ultimo: Extract<Envio, { ok: false }> | null = null;
  while (attempt < cfg.maxRetries) {
    attempt++;
    let r: Envio;
    try { r = await p.enviar(u.email, `${cfg.siteUrl}/reset-password?forced=true`); }
    catch (err) { r = { ok: false, status: 0, message: err instanceof Error ? err.message : String(err) }; }
    if (r.ok) {
      await p.gravarLog({ user_id: u.id, email_hash: emailHash, status: "sent", attempts: attempt, provider, sent_at: new Date().toISOString(), error_code: null, error_message: null });
      c.sent++;
      p.log({ level: "info", user_id: u.id, email_hash: emailHash, action: "sent", attempt });
      return;
    }
    ultimo = r;
    if (!recuperavel(r) || attempt >= cfg.maxRetries) break;
    const backoff = cfg.backoffMs * 2 ** (attempt - 1);
    p.log({ level: "warn", user_id: u.id, action: r.status === 429 ? "backoff_429" : "retry", attempt, backoff_ms: backoff });
    await p.dormir(backoff);
  }
  c.failed++;
  const erro = { code: ultimo?.code ?? (ultimo?.status ? String(ultimo.status) : null), message: sanitizar(ultimo?.message, u.email) };
  await p.gravarLog({ user_id: u.id, email_hash: emailHash, status: "failed", attempts: attempt, provider, error_code: erro.code, error_message: erro.message });
  p.log({ level: "error", user_id: u.id, email_hash: emailHash, action: "failed", attempt, error: erro });
}

/** Laço paginado. Lança em erro fatal (listagem/log); devolve contadores no caminho normal. */
export async function executar(cfg: Config, p: Portas): Promise<Contadores> {
  const c: Contadores = { scanned: 0, skipped_no_email_provider: 0, skipped_already_sent: 0, sent: 0, would_send: 0, failed: 0 };
  p.log({ level: "info", action: "start", dry_run: !cfg.execute, site_url: cfg.siteUrl });
  await p.statusLog("00000000-0000-0000-0000-000000000000"); // pré-voo: a tabela de log existe e é legível?
  let elegiveis = 0;
  for (let page = 1; ; page++) {
    const users = await p.listar(page, cfg.batchSize);
    if (users.length === 0) break;
    c.scanned += users.length;
    for (const u of users) {
      const provs = provedores(u);
      if (!provs.includes("email") || !u.email) { c.skipped_no_email_provider++; continue; }
      if (cfg.limite && elegiveis >= cfg.limite) { p.log({ level: "info", action: "limit_reached", limit: cfg.limite }); return fim(p, c); }
      elegiveis++;
      const antes = c.sent + c.failed;
      await processar(cfg, p, c, u as Usuario & { email: string }, provs[0] ?? "email");
      if (c.sent + c.failed > antes) await p.dormir(Math.ceil(1_000 / cfg.rps)); // throttle só quando houve envio
    }
    p.log({ level: "info", action: "batch_done", page, counters: { ...c } });
    if (cfg.execute) await p.dormir(cfg.pausaLoteMs); // pausa entre lotes para respeitar o provedor de e-mail
  }
  return fim(p, c);
}
function fim(p: Portas, c: Contadores): Contadores {
  p.log({ level: "info", action: "done", counters: { ...c } });
  return c;
}

/** Portas reais (supabase-js com service role). */
export function portasSupabase(url: string, chave: string): Portas {
  const admin = createClient(url, chave, { auth: { autoRefreshToken: false, persistSession: false } });
  const TAB = "migration_password_reset_log";
  return {
    async listar(page, perPage) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(`listUsers página ${page}: ${error.message}`);
      return (data?.users ?? []) as Usuario[];
    },
    async statusLog(userId) {
      const { data, error } = await admin.from(TAB).select("status").eq("user_id", userId).maybeSingle();
      if (error) throw new Error(`ler ${TAB}: ${error.message} (rodou sql/create-reset-log.sql no destino?)`);
      return (data as { status?: string } | null)?.status ?? null;
    },
    async gravarLog(l) {
      const { error } = await admin.from(TAB).upsert(l, { onConflict: "user_id" });
      if (error) throw new Error(`gravar ${TAB} (user ${l.user_id}, status ${l.status}): ${error.message}`);
    },
    async enviar(email, redirectTo) {
      const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
      if (!error) return { ok: true };
      const e = error as { name?: string; status?: number; code?: string; message: string };
      // Resposta não-JSON de gateway (429/502 em HTML) chega sem status: é transitória, vale retentar.
      const retentavel = e.name === "AuthRetryableFetchError" || e.name === "AuthUnknownError";
      return { ok: false, status: e.status, code: e.code, message: e.message, retentavel };
    },
    dormir: (ms) => new Promise((r) => setTimeout(r, ms)),
    log: (rec) => console.log(JSON.stringify({ ts: new Date().toISOString(), ...rec })),
  };
}

if (import.meta.main) {
  if (Deno.args.includes("--help") || Deno.args.includes("-h")) { console.log(AJUDA); Deno.exit(0); }
  const fatal = (m: string): never => { console.error(`[fatal] ${m}`); Deno.exit(1); };
  const url = Deno.env.get("TARGET_SUPABASE_URL") || fatal("Missing env: TARGET_SUPABASE_URL");
  const chave = Deno.env.get("TARGET_SERVICE_ROLE_KEY") || fatal("Missing env: TARGET_SERVICE_ROLE_KEY");
  let cfg: Config;
  try { cfg = parseConfig(Deno.args, (k) => Deno.env.get(k)); } catch (e) { fatal((e as Error).message); throw e; }
  if (!cfg.execute) console.error("[info] MODO SIMULAÇÃO — nada será enviado. Use --execute para disparar de verdade.");
  try {
    const c = await executar(cfg, portasSupabase(url, chave));
    Deno.exit(c.failed > 0 ? 2 : 0);
  } catch (e) {
    console.log(JSON.stringify({ ts: new Date().toISOString(), level: "error", action: "fatal", error: sanitizar(e instanceof Error ? e.message : String(e), "\u0000") }));
    fatal("interrompido — veja a linha action=fatal; rerun é seguro (quem já recebeu é pulado)");
  }
}
