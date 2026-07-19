# ⚙️ Achados — Edge Functions (Correção & Resiliência)

> Escopo: 106 funções em `supabase/functions/` + `_shared/`. Foco em bugs lógicos e resiliência. Todos os itens verificados por leitura do código.

## Veredito sobre as alegações da documentação

| Alegação da doc | Realidade no código |
|---|---|
| **Circuit breaker** | **NÃO EXISTE.** A string aparece só num *comentário* em `external-data/index.ts:545`. Nenhuma implementação (open/half-open/closed) em `_shared/` nem em função alguma. |
| **Rate limiting** | Existe (34 funções importam `_shared/rate-limit.ts`), mas é **100% in-memory por isolate** (`rate-limit.ts:5-7`). Reseta a cada cold start e não é compartilhado entre isolates → limite efetivo real = `max × nº_isolates`. Garantia fraca. |
| **Zod validation** | **Parcial.** ~30 funções usam Zod; dezenas (crons, webhooks legados, workers de fila) leem `body`/`payload` sem schema. |
| **Resiliência / retries / timeouts** | **Quase inexistente.** Só **4 funções** têm timeout de fetch (`lux-trigger`, `system-health`, `health-aggregate`, `lead-score-threshold-runner`). |

---

## Achados

### [CRÍTICO] EF-1. `evolution-webhook` — `ReferenceError` em todo caminho de sucesso
`evolution-webhook/index.ts:73-78` vs `:18`. `corsHeaders` é declarado **dentro** do callback `Deno.serve` (linha 18), mas `jsonResponse` (escopo de módulo, linha 73) o referencia. Todo handler retorna via `jsonResponse` → `ReferenceError` → capturado no `catch` (linha 63) → **500**. Como as escritas no DB (`whatsapp_messages`, `interactions:411`) ocorrem antes do return, a Evolution API recebe 500 e **re-tenta** → **inserts duplicados de `interactions`** (não idempotente). Webhook central de WhatsApp quebrado + duplicação.

### [CRÍTICO] EF-2. `whatsapp-import` — import inexistente impede boot
`whatsapp-import/index.ts:1`: `import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'`. O pacote **não exporta** `/cors`. Módulo não resolve → função 100% indisponível.

### [ALTO] EF-3. Nenhum timeout em chamadas externas (AI Gateway, Firecrawl, EnrichLayer, Evolution, ElevenLabs, Twilio)
33 funções chamam `ai.gateway.lovable.dev` (ex.: `ai-assistant/index.ts:136`, `generate-insights/index.ts:93`); `firecrawl-scrape:29`; `enrichlayer-linkedin:88`; `evolution-api:377`; `elevenlabs-tts:45`; `send-sms-campaign:125`. Sem `AbortController`/`signal`. Upstream travado → função pende até o limite de plataforma, consome isolates, trava filas.

### [ALTO] EF-4. `evolution-webhook` — sem verificação de assinatura + fallback perigoso de `user_id`
`evolution-webhook/index.ts:17-71,156-163,186-191`. Endpoint público sem `requireWebhookSecret` (que existe em `_shared/auth.ts:182`). Sem contato correspondente, atribui a interação ao **primeiro usuário de `profiles`** (`profiles...limit(1)`). Qualquer um injeta mensagens; vazamento cruzado entre tenants.

### [ALTO] EF-5. `nurturing-runner` — `completed_count` sempre gravado como 1 + duplo incremento
`nurturing-runner/index.ts:40-41` vs `:53-54`. Workflow lido só com `.select("steps")`; depois `completed_count: (wf?.completed_count ?? 0) + 1` → coluna nunca vem → sempre grava **1**. E a linha 53 já chama `rpc("increment_workflow_completed")` → dois mecanismos concorrentes. Métrica permanentemente errada.

### [ALTO] EF-6. Crons/workers sem claim atômico — double-processing sob concorrência
`nurturing-runner:36-91`, `sequence-processor:51-183`, `process-webhook-dlq:42-121`, `validation-queue-worker:35-101`, `process-behavioral-regen-queue:25-81`. Todos: `SELECT status='pending' LIMIT n` → `UPDATE status='processing'` **sem** `.eq('status','pending')` no update nem `FOR UPDATE SKIP LOCKED`. Duas execuções sobrepostas pegam as mesmas linhas. Duplicação de emails/SMS/tarefas (custo real).

### [ALTO] EF-7. `send-sms-campaign` — envio síncrono, sem atomicidade, sem paginação, sem timeout
`send-sms-campaign/index.ts:54-166`. (a) check `status` (59) e set `'sending'` (95) não-atômicos → SMS duplicados; (b) `contacts` sem limite (64); (c) loop sequencial (112) com fetch Twilio sem timeout (125); (d) tudo no request → campanhas grandes estouram e ficam presas em `sending` com envio parcial.

### [MÉDIO] EF-8. `process-webhook-dlq` — `target_entity` desconhecido marca sucesso sem inserir
`process-webhook-dlq/index.ts:85-96`. `TABLE_MAP[webhook.target_entity]` ausente → `else` (94-96): `succeeded = true` sem insert → **perda de dados silenciosa**. Endpoint público, sem cron secret.

### [MÉDIO] EF-9. `process-behavioral-regen-queue` — delete/update por `contact_id` afeta múltiplas linhas
`process-behavioral-regen-queue/index.ts:57,64,70-78`. Sucesso/erro usam `.eq('contact_id', ...)`. Múltiplas entradas do mesmo contato são todas apagadas/sobrescritas numa iteração. Sem auth; sem timeout no fetch (42).

### [MÉDIO] EF-10. `validation-queue-worker` — itens presos em `processing` (sem visibility timeout)
`validation-queue-worker/index.ts:52-101`. Marca `processing` (54); se crashar antes do update final, linhas ficam `processing` e o SELECT só pega `pending` (38) → nunca reclamadas. Poison/stuck permanente.

### [MÉDIO] EF-11. `external-data` — erros de RPC/upstream retornam HTTP 200
`external-data/index.ts:374-379,542-546`. Erro de RPC → `jsonOk({data:null,error})` (200). Falha de gateway → `jsonOk({error:'SERVICE_UNAVAILABLE',fallback:true,data:[]})` (200). Clientes que checam só o status HTTP tratam falha como sucesso.

### [MÉDIO] EF-12. `lead-score-cron` / `forecast-snapshot-cron` — batch sem paginação, `NaN`, sem checagem de erro
`lead-score-cron/index.ts:20-38`: `interactions...limit(5000)` → excedente ignorado silenciosamente; insert na fila (36) não verificado. `forecast-snapshot-cron/index.ts:15-34`: `Number(f.forecasted_amount)`/`f.confidence_score/100` sem guardas → `null` vira `NaN` poluindo `weighted_total`; throw no loop aborta períodos restantes.

### [MÉDIO] EF-13. Parsing de saída de IA inconsistente — alguns lançam, outros degradam
`objection-handler:88`, `abm-whitespace-analyzer:88`, `demand-forecast:105`, `playbook-generator:112`, `next-best-action:109`, `territory-optimization:184`, `semantic-search:77`, `visual-search:84` fazem `JSON.parse(toolCall.function.arguments)` assumindo que existe → `TypeError`/500 quando o modelo não retorna tool call. Outras (`generate-insights:128-137`, `conversation-analyzer:237`, etc.) protegem com try/fallback. Código copiado com divergências.

### [MÉDIO] EF-14. `evolution-webhook` `handleContactsUpsert` — filtro invertido vs. comentário
`evolution-webhook/index.ts:529-537`. Comentário diz "só atualiza quem **não** tem avatar", mas `.not('avatar_url','is',null)` = "onde avatar_url IS NOT NULL" (o oposto). E `|| undefined` omite o campo → na prática só mexe em `updated_at`.

### [BAIXO] EF-15. Inconsistência de CORS/imports/auth entre funções
CORS: umas usam `scopedCorsHeaders`; outras hardcodam `"*"` (`nurturing-runner:4`, `sequence-processor:6`, `process-webhook-dlq:4`, `validation-queue-worker:5`, `send-sms-campaign:4`). Supabase-js: `npm:@supabase/supabase-js@2` vs `https://esm.sh/@supabase/supabase-js@2.45.0` (versões divergentes). Cron auth: uns exigem `x-cron-secret`, vários não exigem nada (públicos), um exige `x-cron-key`. Sem padrão.

### [BAIXO] EF-16. `bulk-revalidate` — teto de 5000 contatos silencioso
`bulk-revalidate/index.ts:71-78`: `.limit(5000)`; excedente ignorado sem aviso. (No geral a função é boa: Zod, rate limit, paginação em chunks de 500.)

### [BAIXO] EF-17. Fire-and-forget pode ser descartado
`evolution-webhook/index.ts:352-376`: `voice-to-text`/`social-behavior-analyzer` via `.then()/.catch()` não-aguardados, sem `EdgeRuntime.waitUntil` → promessas podem ser encerradas ao retornar a resposta.

---

## Controles que realmente funcionam (verificados)
1. **`incoming-webhook`** — padrão-ouro: Zod (limite 256KB), **HMAC SHA-256 com comparação de tempo constante** (24-53), anti-replay (127), rate limit, quota mensal, **fallback para DLQ** (232-239), logging com latência.
2. **`lux-trigger`** — único com `fetchWithTimeout` + `retryFetch` backoff exponencial (cap 16s) genuínos (27-65).
3. **`external-data`** — allowlist rígida de tabelas/RPCs, clamp `MAX_PAGE_SIZE=500`, `x-statement-timeout`, `withRetry`, optimistic locking (`assertVersionMatch`), detecção de schema-drift. (Ressalva: mascara erros como 200 — EF-11.)
4. **`auto-regen-behavioral-profiles`** / **`auto-rebatch-behavioral`** — SLA/debounce, `MAX_BATCH`, incremento correto de `attempts`, alerta de erro deduplicado; o segundo valida `x-cron-key`.
5. **`retry-behavioral-profile`** — checa role `admin` via `has_role`, cooldown 5min, consome corpo da resposta.
6. **`lead-score-threshold-runner`** — timeout no webhook do usuário (`AbortSignal.timeout(5000)`, 137), dedup, cooldown.
7. **`evolution-api`** — Zod + allowlist `ALLOWED_ACTIONS` + `encodeURIComponent`. (Sem timeout — EF-3.)
8. **`_shared/auth.ts`** — helpers de CORS scoped, `requireCronSecret`, `requireWebhookSecret`, `withAuthOrServiceRole`, `jsonConflict`. Bem projetado; problema é **adoção inconsistente**.
9. **Workers de fila** — apesar de EF-6/8/9/10, têm backoff exponencial persistido e teto de tentativas (anti-loop).

## Resumo
- **2 bugs que quebram funções inteiras** (EF-1, EF-2).
- Circuit breaker é ficção; rate limiting é in-memory frágil; Zod/timeouts esparsos.
- Padrão sistêmico: filas/crons sem claim atômico (double-processing → custo real em SMS/email), upstreams sem timeout, auth inconsistente, erros mascarados como 200.
- Há ilhas de excelência (`incoming-webhook`, `lux-trigger`, `external-data`), mas os padrões não foram propagados; muito copy-paste divergente.
