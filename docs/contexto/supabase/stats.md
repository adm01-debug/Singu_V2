# Métricas (voláteis — mudam sem alteração de schema)

Valores aproximados de propósito, para não gerar commits a cada coleta. Fora de `snapshot.json`; o bruto está em `stats.json`.

## Banco

| métrica | valor |
|---|---|
| tamanho | 3.0 GB |
| schema public | 2.8 GB |
| schema zapp_history | 13.4 MB |
| schema _dormant | 4.1 MB |
| schema ops_backup | 344.0 KB |
| schema singu_migration | 96.0 KB |
| schema reporting | 80.0 KB |


## Tabelas (ordenadas por tamanho)

_nenhum_


## Índices nunca usados (candidatos a remoção; ignore PK/UNIQUE)

| índice | tabela | tamanho |
|---|---|---|
| idx_activities_created_at | public.activities | 224.0 KB |
| idx_company_rfm_scores_segment_id | public.company_rfm_scores | 344.0 KB |
| idx_contacts_last_name_trgm | public.contacts | 344.0 KB |
| idx_cds_embedding | zapp_history.conversation_daily_summaries | 1.6 MB |
| idx_cds_embedding_1024 | zapp_history.conversation_daily_summaries | 1.6 MB |
| idx_ma_embedding | zapp_history.message_audio | 1.6 MB |
| idx_ma_embedding_1024 | zapp_history.message_audio | 1.6 MB |
| idx_me_vector | zapp_history.message_embeddings | 1.6 MB |
| idx_me_vector_1024 | zapp_history.message_embeddings | 1.6 MB |


## Storage

| bucket | objetos (~) | tamanho |
|---|---|---|
| logos | ~49.5k | 6.0 GB |


## Auth (agregados)

| métrica | valor |
|---|---|
| usuários (~) | ~20 |
| confirmados (~) | ~20 |
| criados últimos 30d (~) | 1 |

| provider | usuários (~) |
|---|---|
| email | ~20 |


## Consultas mais custosas (pg_stat_statements, desde o último reset)
| role | chamadas (~) | total ms (~) | média ms | query |
|---|---|---|---|---|
| service_role | ~15.7M | ~320.2M | 20.34 | `WITH pgrst_source AS (UPDATE "public"."companies" SET "cnpj_normalizado_em" = "pgrst_body"."cnpj_normalizado_em" FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "cnpj_normalizado_em" FROM json_to_record(pgrs` |
| service_role | ~15.8M | ~308.6M | 19.56 | `WITH pgrst_source AS (UPDATE "public"."companies" SET "address" = "pgrst_body"."address", "city" = "pgrst_body"."city", "email" = "pgrst_body"."email", "phone" = "pgrst_body"."phone", "state" = "pgrst_body"."state" FROM ` |
| postgres | ~23.7k | ~45.2M | 1908.57 | `SELECT pg_advisory_xact_lock(hashtext($1))` |
| postgres | ~654.1k | ~10.8M | 16.47 | `SELECT zapp_history.reconcile_nlp_responses()` |
| postgres | ~5.5k | ~6.4M | 1171.32 | `with f as ( -- CTE with sane arg_modes, arg_names, and arg_types. -- All three are always of the same length. -- All three include all args, including OUT and TABLE args. with functions as ( select *, -- proargmodes is n` |
| service_role | ~4.2k | ~6.1M | 1458.78 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "p_phones" FROM json_to_record(pgrst_payload.json_data) AS _("p_phones" text[]) LIMIT $4) pgrst_body , LAT` |
| postgres | ~5.6k | ~4.9M | 877.68 | `SELECT tbl.schemaname, tbl.tablename, tbl.quoted_name, tbl.is_table, json_agg(a) as columns FROM ( SELECT n.nspname as schemaname, c.relname as tablename, (quote_ident(n.nspname) \|\| $1 \|\| quote_ident(c.relname)) as quote` |
| service_role | ~13.1k | ~3.6M | 273.16 | `WITH pgrst_source AS ( SELECT "public"."companies".* FROM "public"."companies" WHERE "public"."companies"."is_customer" = $1 AND "public"."companies"."deleted_at" IS NULL ORDER BY "public"."companies"."razao_social" ASC ` |
| postgres | ~120 | ~3.4M | 29461.80 | `SELECT string_agg( format($1, id, table_name, record_id, action, CASE WHEN old_data IS NULL THEN $2 ELSE quote_literal(old_data::text) \|\|$3 END, CASE WHEN new_data IS NULL THEN $4 ELSE quote_literal(new_data::text) \|\|$5 ` |
| postgres | ~58.8k | ~2.6M | 44.79 | `WITH rows AS ( SELECT ctid FROM net._http_response WHERE created < now() - $1 ORDER BY created LIMIT $2 ) DELETE FROM net._http_response r USING rows WHERE r.ctid = rows.ctid` |
| service_role | ~11.2k | ~2.4M | 210.75 | `WITH pgrst_source AS ( SELECT "public"."companies"."id", "public"."companies"."razao_social", "public"."companies"."nome_fantasia", "public"."companies"."ramo_atividade", "public"."companies"."cnpj", "public"."companies"` |
| service_role | ~6.3k | ~2.3M | 363.98 | `WITH pgrst_source AS ( SELECT "public"."companies".*, row_to_json("companies_customers_1".*)::jsonb AS "customers", COALESCE( "companies_contacts_1"."companies_contacts_1", $9) AS "contacts" FROM "public"."companies" LEF` |
| service_role | ~64M | ~2M | 0.03 | `select set_config('?', $1, true), set_config($2, $3, true), set_config('?', $4, true), set_config('?', $5, true), set_config('?', $6, true), set_config('?', $7, true)` |
| postgres | ~5.1k | ~1.7M | 340.26 | `with policies as ( select pol.oid :: int8 as id, n.nspname as schema, c.relname as table, c.oid :: int8 as table_id, pol.polname as name, case when pol.polpermissive then $1::text else $2::text end as action, case when p` |
| postgres | ~8.7k | ~1.7M | 197.90 | `SELECT e.name, n.nspname AS schema, e.default_version, x.extversion AS installed_version, e.comment, ev.schema AS default_version_schema FROM pg_available_extensions e LEFT JOIN pg_extension x ON e.name = x.extname LEFT ` |


## Conexões
| usuário | estado | n |
|---|---|---|
| authenticator | idle | 10 |
| pgbouncer | idle | 1 |
| postgres | active | 2 |
| postgres | idle | 1 |
| postgres |  | 1 |
| supabase_admin | active | 1 |
| supabase_admin | idle | 8 |
| supabase_admin |  | 1 |
