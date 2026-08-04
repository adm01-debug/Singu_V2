# Migração DDL — Runbook

Pacote de scripts para reconstruir o schema `public` do CRM em um novo projeto Supabase.

## Origem

- Host: `aws-1-us-east-2.pooler.supabase.com`
- Extraído em: 2026-07-21
- Método: `scripts/migration/extract-ddl.sh` (leituras via `information_schema` + `pg_catalog`; sem `pg_dump`)

## Conteúdo do pacote (`scripts/migration/ddl/`)

| Arquivo | Objetos | Linhas |
|---|---|---|
| `00_extensions.sql` | Extensões (pgcrypto, pg_net, vector, etc.) | 14 |
| `01_schemas_and_enums.sql` | Schema `public` + enums (`app_role`) | 16 |
| `02_tables.sql` | 258 tabelas com colunas, defaults, PK/UK/CHECK | 4 790 |
| `03_indexes.sql` | 380 índices não implícitos | 382 |
| `04_foreign_keys.sql` | FKs (aplicadas em passo separado para evitar ciclos) | 261 |
| `05_grants.sql` | GRANTs padrão (authenticated + service_role; anon condicional) | 523 |
| `06_rls_enable.sql` | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` | 260 |
| `07_policies.sql` | 725 policies RLS | 871 |
| `08_functions.sql` | 118 functions (plpgsql/sql) — `SECURITY DEFINER` e `search_path` preservados | 3 980 |
| `09_triggers.sql` | 202 triggers (audit, updated_at, enfileiramento) | 204 |
| `10_views.sql` | Views com `security_invoker=on` + materialized views | 150 |
| `11_partitions.sql` | Partições `audit_log_YYYY_MM` (attach) | 30 |
| `12_cron_jobs.sql` | Cron jobs — **ver aviso abaixo** | 3 |
| `99_apply_all.sql` | Orquestrador `\i` na ordem correta | — |

## Ordem de aplicação (obrigatória)

```
00 → 01 → 02 → 11 → 03 → 04 → 05 → 08 → 06 → 07 → 09 → 10
```

Motivos-chave:
- **02 antes de 04**: tabelas primeiro; FKs depois evita ciclos.
- **08 antes de 07**: policies chamam `public.has_role(...)`.
- **06 antes de 07**: policy sem RLS enable é no-op.
- **11 imediatamente após 02**: partições dependem do pai particionado.

## Execução

```bash
# 1. Configure a conexão do DESTINO
export TARGET_DB_URL="postgresql://postgres:<senha>@db.<ref-destino>.supabase.co:5432/postgres"

# 2. Rode o pacote completo (exceto cron)
cd scripts/migration/ddl
psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f 99_apply_all.sql

# 3. (Depois das edge functions estarem publicadas no destino) rode o cron
psql "$TARGET_DB_URL" -f 12_cron_jobs.sql
```

## ⚠ Limitações conhecidas desta extração

1. **`12_cron_jobs.sql` está vazio.** O usuário Supabase padrão do pooler não tem
   permissão de `SELECT` em `cron.job` no plano gerenciado. Para preencher, rode
   a extração via conexão superuser/direct (não pooler), ou recrie os jobs
   manualmente a partir de `.lovable/memory/features/*.md` (já documentam os
   crons `mtta-*`, `nurturing-runner`, `mql-evaluator`, `lead-score-cron`, etc.).
2. **Contagem de functions (118)** é menor do que o histórico
   (`docs/HARDENING_FINAL_10_10.md` cita 400) porque foram excluídas todas as
   functions pertencentes a extensões (`pg_depend deptype='e'`) — comportamento
   intencional, senão o script duplica definições que a `CREATE EXTENSION` já
   instala.
3. **`auth.*`, `storage.*`, `realtime.*`, `vault.*` são ignorados** — schemas
   gerenciados pelo Supabase; recriar via UI/API do destino.
4. **Grants a `anon`** só são emitidos onde existe policy que lista `anon` em
   `pg_policies.roles`. Se você adicionar policies novas no destino que
   dependam de `anon`, complemente o GRANT manualmente.

## Rollback

Um rollback big-bang é `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
seguido de reimportação de um snapshot anterior. Como o pacote é aplicado num
projeto Supabase **novo e vazio**, o rollback recomendado é **destruir o
projeto destino** e recriar antes de tentar de novo — nunca aplicar por cima
de um projeto com dados de produção.

## Reextração

```bash
bash scripts/migration/extract-ddl.sh
```

O script sobrescreve os arquivos em `scripts/migration/ddl/`. Comite o diff
para revisar mudanças de schema entre extrações.

## Checklist de validação pós-aplicação

No destino, após `99_apply_all.sql`:

```sql
-- Contagens esperadas (± drift natural)
SELECT 'tables' AS obj, COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p') AND NOT c.relispartition;
-- → 258

SELECT 'policies', COUNT(*) FROM pg_policies WHERE schemaname='public';
-- → 725

SELECT 'functions', COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 LEFT JOIN pg_depend d ON d.objid=p.oid AND d.deptype='e'
 WHERE n.nspname='public' AND d.objid IS NULL;
-- → 118

-- RLS ativo em toda tabela sensível
SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity;
-- → 0 linhas (idealmente)
```

Rode também o linter do Supabase no destino para confirmar baseline.

## Próximas fases (fora deste pacote)

1. **Dados** — export/import via `COPY` por tabela, respeitando ordem de FKs.
2. **Edge functions** — `supabase functions deploy` no destino.
3. **Secrets** — recadastrar via UI ou `supabase secrets set`.
4. **`auth.users`** — decisão pendente (opção A/B/C do plano de migração).
5. **Storage buckets** — recriar buckets + copiar objetos.
## Ver também

- [Master Runbook](./MIGRATION_MASTER_RUNBOOK.md) — orquestra todas as fases
- [DDL](./MIGRATION_DDL.md) · [Data](./MIGRATION_DATA.md) · [Edge Functions](./MIGRATION_EDGE_FUNCTIONS.md) · [Storage](./MIGRATION_STORAGE.md) · [Password Reset](./MIGRATION_PASSWORD_RESET.md)
