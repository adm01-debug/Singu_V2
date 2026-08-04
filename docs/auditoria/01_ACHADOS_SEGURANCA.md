# 🔐 Achados — Segurança

> Escopo: RLS, edge functions, proxy `external-data`, segredos, rotas públicas, XSS. Método: análise estática de 262 migrations, 106 edge functions, `src/`.
> **Veredito:** a doc ("10/10", "RLS 100%", "CORS restritivo") é **parcialmente verdadeira mas enganosa**. Há controles reais e bons (DOMPurify, search_path hardening, cobertura de RLS, HMAC no `incoming-webhook`), mas convivem com **falhas estruturais graves**: o proxy `external-data` contorna 100% do RLS gated só por "autenticado"; views públicas vazam os próprios tokens-segredo para `anon`; webhooks/crons sensíveis rodam com service_role sem verificação.

> **Nota sobre `verify_jwt`:** `supabase/config.toml` contém **apenas** `project_id` — nenhuma seção `[functions.*]`. Os flags `verify_jwt` **não estão versionados** e não são auditáveis pelo repo; a proteção depende de config externa. Mesmo com `verify_jwt=true`, a anon key é pública e é um JWT válido — funções gated só pelo gateway continuam alcançáveis por qualquer um.

---

## Achados

### [CRÍTICA] SEC-1. Views `*_public` expõem tokens-segredo a `anon` → enumerar e assinar documentos de terceiros
`20260420162044_c08b185e...sql:53-70` (view `document_signatures_public`), `20260522142957_beb532ac...sql:54-57` (recriação) e `:105-106` (política base).
```sql
CREATE VIEW public.document_signatures_public WITH (security_invoker = true) AS
SELECT id, signature_token, signer_name, signer_email, rendered_html, status, ...
FROM public.document_signatures
WHERE signature_token IS NOT NULL AND status <> ALL(ARRAY['declined','expired']);
GRANT SELECT ON public.document_signatures_public TO anon, authenticated;

CREATE POLICY "Anon can view own document signatures" ON public.document_signatures
    FOR SELECT TO anon, authenticated USING (signature_token IS NOT NULL);
```
A política `USING (signature_token IS NOT NULL)` é `true` para toda linha real — **não exige conhecer o token** — e a view **inclui `signature_token` no SELECT**, concedida a `anon`. Um atacante anônimo faz `GET /rest/v1/document_signatures_public?select=*` com a anon key pública e recebe **todos** os documentos pendentes com token + nome + e-mail + HTML. De posse do token, visualiza/assina/recusa em nome de qualquer signatário (`submit-signature` valida só o token). **Mesmo padrão em `csat_surveys_public`** (expõe `public_token`, política `USING (public_token IS NOT NULL)`). O commit `20260416181640` removeu a política `USING(true)` "para forçar acesso via Edge Function que valida token" — mas a reintrodução via view + `token IS NOT NULL` recriou a exposição de forma pior (vaza o token em massa).

### [ALTA] SEC-2. `external-data` concede CRUD total na base externa a qualquer autenticado (RLS 100% contornado)
`external-data/index.ts:155-163,207-208,437-501`. O proxy conecta com `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY` (ignora RLS). Único controle: `withAuth(req)` (207) — só valida que o JWT é de um usuário logado, **sem papel/tenant/ownership**. Expõe `select`/`insert`/`update`/`delete`/`update_with_version`/`rpc`/`schema`/`list_tables`/`distinct` sobre ~60 tabelas e ~50 views (companies, contacts, deals, whatsapp_messages...). Qualquer conta autenticada lê, exporta (`export_contacts_csv`), altera e **deleta** qualquer registro de qualquer empresa/contato/deal. Se houver self-signup, qualquer um obtém acesso total. **Todo o modelo de RLS elogiado na doc é irrelevante para o caminho de dados primário.**
- **SEC-2b [MÉDIA]** — leitura fora da whitelist via embedding: em `select` (388-394) o parâmetro `select` é repassado sem sanitização (`.select(select || '*')`); via resource embedding PostgREST (`select=*,other(*)`) puxa tabelas relacionadas fora de `ALLOWED_TABLES`.
- **SEC-2c [BAIXA]** — filtro dinâmico: `const fn = query[f.type]; fn.call(query, f.column, f.value)` (412-415) invoca qualquer método do builder vindo do cliente; colunas em `search.columns` interpoladas cru no `.or()` (400).

### [ALTA] SEC-3. Webhooks com service_role e SEM verificação de assinatura/segredo
`bitrix24-webhook`, `evolution-webhook`, `lux-webhook`. Os três instanciam `createClient(SUPABASE_URL, SERVICE_ROLE_KEY)` e processam `req.json()` sem `requireWebhookSecret`/HMAC. `lux-webhook` aceita `luxRecordId` + `entityUpdates` arbitrário e grava direto em `lux_intelligence` e na entidade. Qualquer um forja eventos Bitrix, mensagens/contatos WhatsApp e sobrescreve inteligência/campos com privilégio total. O helper `requireWebhookSecret` **existe** (`_shared/auth.ts:182`) mas **nenhuma função o usa**. (`incoming-webhook` é a exceção positiva — HMAC.)

### [ALTA] SEC-4. Crons sensíveis (envio de mensagens / massa) sem `CRON_SECRET`, com service_role
Sem guarda: `nurturing-runner`, `sequence-processor`, `auto-rebatch-behavioral`, `auto-regen-behavioral-profiles`, `process-behavioral-regen-queue`, `process-webhook-dlq`, `validation-queue-worker`, `mql-evaluator`, `smart-notify`, `sync-social-interests`. Ex.: `nurturing-runner/index.ts:15-22` cria client service_role e processa até 100 execuções **enviando e-mail/WhatsApp e criando tarefas** sem `withAuth`/`requireCronSecret`. Invocação repetida por qualquer um (anon key) → disparo de mensagens, esgotamento de quota, spam, DoS de custo. O controle **existe e funciona** em 11 crons (`check-health-alerts`, `check-notifications`, `forecast-snapshot-cron`, `lead-score-cron`, `weekly-digest`...) — aplicação **inconsistente**: os que mutam estado/enviam ficaram de fora.

### [MÉDIA] SEC-5. CORS aberto a qualquer subdomínio `*.lovable.app`/`*.lovableproject.com`, e `*` literal em ~35 funções
`_shared/auth.ts:9-25`: `ALLOWED_ORIGIN_SUFFIXES = [".lovable.app",".lovableproject.com"]` com `origin.endsWith(suffix)` refletindo a origin. 35 funções usam `"Access-Control-Allow-Origin": "*"`. Qualquer app hospedado em `*.lovable.app` (de outros usuários da plataforma) é origin permitida. Risco moderado (auth por header `Authorization`, sem `Allow-Credentials`), mas viola allowlist restritiva. "CORS restritivo" é impreciso.

### [MÉDIA] SEC-6. SSRF autenticado em `connection-tester`
`connection-tester/index.ts:85-120`. Exige JWT, mas faz `fetch` a URLs controladas pelo cliente (`config.url`/`webhook_url`/`server_url`) e retorna latência/status → sonda serviços internos/metadata (169.254.169.254). Também atualiza `connection_id` sem checar ownership (122-140). Requer auth (reduz severidade), mas é SSRF explorável.

### [BAIXA] SEC-7. Injeção de filtro PostgREST no `mcp-server`
`mcp-server/index.ts:49-51`: `.or('first_name.ilike.%${q}%,...')` com `q` só truncado em 200 chars, sem escapar `,`/`)`. Portador de X-MCP-Token válido injeta filtros e lê outras colunas de `contacts`.

---

## O que está BOM (controles reais e verificados)
1. **XSS bem tratado.** `src/lib/sanitize.ts` usa **DOMPurify** com allowlist restritiva. Os **2** `dangerouslySetInnerHTML` (`PublicSignaturePage.tsx:147`, `PlaybookSectionRenderer.tsx:57`) passam por `sanitizeHtml`. `sanitizeUrl` bloqueia `javascript:`/`data:`. Sem `eval`/`new Function`/`innerHTML` cru. **A alegação "sem XSS" confere** (corrige a suspeita inicial sobre `PlaybookSectionRenderer`).
2. **Sem segredos hardcoded.** Nenhuma JWT/`sk-`/senha/service_role literal em `src/` ou `functions/`. Client usa `import.meta.env`; `.env.example` só placeholders; `.gitignore` cobre `.env*`.
3. **`search_path` hardening abrangente.** `20260522142751` e `20260711145934` aplicam `ALTER FUNCTION ... SET search_path` a todas as `SECURITY DEFINER` e revogam `EXECUTE` de PUBLIC/anon. Funções criadas após o hardening já vêm corretas. (Ressalva: BD-3 lista 10 sem `SET` na definição — o hardening por `ALTER` mitiga, mas a definição segue frágil se recriada.)
4. **Cobertura de RLS em tabelas base é real** (~255 com RLS; os "sem RLS" são falsos positivos: partição herda RLS, etc.). Verdade **no schema** — a ressalva é SEC-2 (o proxy contorna).
5. **`cron_secrets` protegida** (`20260712223208`): sem grants a anon/authenticated, política `TO service_role`, segredo com `gen_random_bytes(32)`.
6. **`incoming-webhook`** faz HMAC SHA-256 com comparação em tempo constante — modelo que os outros webhooks deveriam seguir.
7. **`external-data`** tem defesas parciais boas (whitelist de RPCs/tabelas, rate limit, validação de UUID, optimistic locking, statement timeout, sem RPC arbitrário) — o problema é o **modelo de autorização** (SEC-2), não injeção de RPC.

---

## Resumo de severidade
| # | Sev | Achado |
|---|-----|--------|
| SEC-1 | **CRÍTICA** | Views `*_public` vazam tokens-segredo (assinaturas/CSAT) a `anon` |
| SEC-2 | **ALTA** | `external-data` = CRUD total via service_role gated só por "autenticado" |
| SEC-3 | **ALTA** | Webhooks Bitrix/Evolution/Lux sem verificação de assinatura |
| SEC-4 | **ALTA** | ~10 crons de envio/processamento sem `CRON_SECRET` |
| SEC-5 | **MÉDIA** | CORS reflete `*.lovable.app`; `*` em ~35 funções |
| SEC-6 | **MÉDIA** | SSRF autenticado em `connection-tester` |
| SEC-7 | **BAIXA** | Injeção de filtro PostgREST em `mcp-server` |

**Padrão recorrente:** os controles corretos existem (HMAC, CRON_SECRET, RLS por-usuário, DOMPurify, search_path), mas são aplicados de forma **inconsistente**, e o caminho de dados central (proxy `external-data` + views públicas) **neutraliza** o RLS que a doc apresenta como principal garantia.
