// ============================================================================
// reset-passwords.ts (Deno)
// ----------------------------------------------------------------------------
// Worker de disparo em massa de recovery links pós-migração.
//
// Uso:
//   deno run --allow-env --allow-net scripts/migration/reset-passwords.ts [--dry-run]
//
// Variáveis de ambiente obrigatórias (do banco de DESTINO):
//   TARGET_SUPABASE_URL          https://<project>.supabase.co
//   TARGET_SERVICE_ROLE_KEY      service_role key
//   TARGET_SITE_URL              https://app.exemplo.com  (usado no redirectTo)
//
// Comportamento:
//   - Pagina auth.users em lotes de 100.
//   - Ignora usuários sem provider 'email' (contas exclusivamente sociais).
//   - Ignora usuários já com status='sent' em migration_password_reset_log.
//   - Rate limit: 10 req/s, retry exponencial em 429 (até 5 tentativas).
//   - Persiste progresso em migration_password_reset_log (UNIQUE user_id).
// ============================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

// ---------------------------------------------------------------- constantes
const BATCH_SIZE = 100;
const REQS_PER_SEC = 10;
const MAX_RETRIES = 5;
const BASE_BACKOFF_MS = 1_000;

// ---------------------------------------------------------------- utilidades
function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  return crypto.subtle.digest("SHA-256", bytes).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""),
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function log(record: Record<string, unknown>): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...record }));
}

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) {
    console.error(`[fatal] Missing env: ${name}`);
    Deno.exit(1);
  }
  return v;
}

// ---------------------------------------------------------------- main
const DRY_RUN = Deno.args.includes("--dry-run");

const SUPABASE_URL = requireEnv("TARGET_SUPABASE_URL");
const SERVICE_KEY = requireEnv("TARGET_SERVICE_ROLE_KEY");
const SITE_URL = requireEnv("TARGET_SITE_URL");

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface CountByStatus {
  scanned: number;
  skipped_no_email_provider: number;
  skipped_already_sent: number;
  sent: number;
  failed: number;
}

const counters: CountByStatus = {
  scanned: 0,
  skipped_no_email_provider: 0,
  skipped_already_sent: 0,
  sent: 0,
  failed: 0,
};

// Retorna true se link foi (ou seria) enviado com sucesso.
async function processUser(userId: string, email: string, provider: string): Promise<void> {
  const emailHash = await sha256Hex(email.toLowerCase().trim());

  // Idempotência: se já 'sent', skip.
  const { data: existing } = await admin
    .from("migration_password_reset_log")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.status === "sent") {
    counters.skipped_already_sent++;
    log({ level: "info", user_id: userId, email_hash: emailHash, action: "skip_already_sent" });
    return;
  }

  if (DRY_RUN) {
    counters.sent++;
    log({ level: "info", user_id: userId, email_hash: emailHash, action: "dry_run" });
    return;
  }

  // Retry loop
  let attempt = 0;
  let lastErr: { code?: string; message?: string } | null = null;

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      const { error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${SITE_URL}/reset-password?forced=true` },
      });

      if (!error) {
        await admin.from("migration_password_reset_log").upsert(
          {
            user_id: userId,
            email_hash: emailHash,
            status: "sent",
            attempts: attempt,
            provider,
            sent_at: new Date().toISOString(),
            error_code: null,
            error_message: null,
          },
          { onConflict: "user_id" },
        );
        counters.sent++;
        log({ level: "info", user_id: userId, email_hash: emailHash, action: "sent", attempt });
        return;
      }

      lastErr = { code: (error as { code?: string }).code, message: error.message };

      // Rate limit → backoff exponencial
      const isRateLimit =
        error.message?.toLowerCase().includes("rate") ||
        (error as { status?: number }).status === 429;
      if (isRateLimit) {
        const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
        log({ level: "warn", user_id: userId, action: "backoff_429", attempt, backoff_ms: backoff });
        await sleep(backoff);
        continue;
      }

      // Erro não recuperável
      break;
    } catch (err) {
      lastErr = { message: err instanceof Error ? err.message : String(err) };
      const backoff = BASE_BACKOFF_MS * 2 ** (attempt - 1);
      log({ level: "warn", user_id: userId, action: "exception_retry", attempt, backoff_ms: backoff });
      await sleep(backoff);
    }
  }

  counters.failed++;
  await admin.from("migration_password_reset_log").upsert(
    {
      user_id: userId,
      email_hash: emailHash,
      status: "failed",
      attempts: attempt,
      provider,
      error_code: lastErr?.code ?? null,
      error_message: lastErr?.message ?? null,
    },
    { onConflict: "user_id" },
  );
  log({ level: "error", user_id: userId, email_hash: emailHash, action: "failed", attempt, error: lastErr });
}

// ---------------------------------------------------------------- loop paginado
let page = 1;
const perPage = BATCH_SIZE;

log({ level: "info", action: "start", dry_run: DRY_RUN, site_url: SITE_URL });

while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
  if (error) {
    log({ level: "error", action: "list_users_failed", page, error: error.message });
    Deno.exit(1);
  }

  const users = data?.users ?? [];
  if (users.length === 0) break;

  counters.scanned += users.length;

  // Processamento serial dentro do lote com throttle de 10 req/s.
  for (const u of users) {
    const identities = (u.identities ?? []) as Array<{ provider: string }>;
    const hasEmail = identities.some((i) => i.provider === "email");
    if (!hasEmail || !u.email) {
      counters.skipped_no_email_provider++;
      continue;
    }

    const primaryProvider = identities[0]?.provider ?? "email";
    await processUser(u.id, u.email, primaryProvider);
    await sleep(Math.ceil(1_000 / REQS_PER_SEC));
  }

  log({ level: "info", action: "batch_done", page, counters: { ...counters } });

  // Pausa entre batches para respeitar Mailgun (10s)
  await sleep(10_000);
  page++;
}

log({ level: "info", action: "done", counters: { ...counters } });
Deno.exit(counters.failed > 0 ? 2 : 0);