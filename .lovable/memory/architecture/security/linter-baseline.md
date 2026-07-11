---
name: Supabase Linter Baseline
description: Baseline de findings do supabase linter aceitos com justificativa. Zero CRITICAL/HIGH; apenas 3 WARNs documentados (extension in public + 2 buckets públicos intencionais).
type: constraint
---
**Auditoria executada na Rodada F (Etapa 1) — Excellence 10/10.**
**Revalidada na Rodada O (Ação 3) — tentativa de mover `pg_net` falhou por limitação da extensão.**
**Atualizada na Rodada P (hardening SECURITY DEFINER) — 9 WARNs de `function_search_path_mutable` / execução pública agora são intencionais e restritos.**

**Resultado:** 0 CRITICAL, 0 HIGH, 12 WARN — todos aceitos com justificativa abaixo.

| # | Lint | Severidade | Justificativa |
|---|------|-----------|---------------|
| 1 | `0014_extension_in_public` (`pg_net`) | WARN | A extensão `pg_net` está no schema `public`. Tentativa de `ALTER EXTENSION pg_net SET SCHEMA extensions` falhou com `0A000: extension "pg_net" does not support SET SCHEMA` (Rodada O, Ação 3). DROP+CREATE não é viável pois `pg_net` é utilizada por cron jobs internos do Supabase; remover quebraria automações. Risco: nulo (extensão oficial do Supabase, sem superfície de ataque exposta). |
| 2 | `0025_public_bucket_allows_listing` (bucket `company-logos`) | WARN | Bucket público intencional para servir logos em listagens não autenticadas (cards, /lp/*). Já protegido por RLS de upload por owner em `{userId}/{companyId}/`. Listagem de URLs públicas não vaza dados sensíveis. |
| 3 | `0025_public_bucket_allows_listing` (bucket de avatares/ativos públicos) | WARN | Mesma justificativa: bucket de assets públicos servidos em UI não autenticada. RLS de upload garante owner-only. |
| 4 | `0011_function_search_path_mutable` / execução pública em `public.get_deal_room_by_token(text)` | WARN | Endpoint do **buyer portal** (rota `/deal-room/:token`), consumido sem sessão. `SET search_path=public, pg_temp` aplicado; `GRANT EXECUTE` mantido para `anon`. |
| 5 | idem em `public.record_deal_room_view(text)` | WARN | Contador de views do buyer portal — chamado pelo mesmo fluxo público. Search_path fixo, `anon` autorizado. |
| 6 | idem em `public.get_landing_page_by_slug(text)` | WARN | Renderiza LP pública `/lp/:slug`. Retorna apenas colunas seguras via `landing_pages_public`. `anon` autorizado. |
| 7 | idem em `public.submit_landing_form(uuid, jsonb)` | WARN | Captura de leads públicos em LPs. Valida payload via Zod na Edge Function acima, `anon` autorizado. |
| 8 | idem em `public.increment_form_view(uuid)` | WARN | Métrica de exibição de formulários públicos. `anon` autorizado. |
| 9 | idem em `public.submit_form(uuid, jsonb)` | WARN | Submissão de `forms_public`. Search_path fixo, `anon` autorizado. |
| 10 | idem em `public.increment_magnet_view(uuid)` | WARN | Métrica de exibição de lead magnets públicos. `anon` autorizado. |
| 11 | idem em `public.record_magnet_download(uuid, jsonb)` | WARN | Download rastreado de lead magnets. `anon` autorizado. |
| 12 | idem em `public.submit_csat_response(uuid, jsonb)` | WARN | Coleta de CSAT via link público. `anon` autorizado. |

**Nota Rodada P:** todas as outras ~60 funções `SECURITY DEFINER` sofreram `REVOKE EXECUTE FROM PUBLIC, anon` e ficam disponíveis apenas para `authenticated`/`service_role`. As 9 acima são a superfície pública mínima necessária para buyer portal, landing pages, formulários e CSAT — documentadas aqui para não serem retrabalhadas em auditorias futuras.

**Política:** novos findings CRITICAL/HIGH devem ser corrigidos imediatamente; novos WARN devem ser anexados a esta tabela com justificativa ou corrigidos.

**Comando para revalidação:** `supabase--linter` (sem argumentos).
