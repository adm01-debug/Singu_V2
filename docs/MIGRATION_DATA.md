# Migração de Dados — Runbook (psql + \COPY)

Complementa `docs/MIGRATION_DDL.md`. O DDL cria a **estrutura** no destino;
este runbook copia os **dados** do schema `public` da origem para o destino
usando `\COPY` client-side (não precisa de acesso ao filesystem do servidor
Supabase, funciona pelo pooler ou direct URL).

## Estratégia big-bang

```
┌─ ORIGEM ─────────────┐          ┌─ DESTINO ────────────┐
│                      │          │  DDL 00..05 aplicado │
│  export-data.sh  ────┼──CSVs────┼─►  import-data.sh    │
│                      │          │  DDL 06,07,09,10     │
└──────────────────────┘          │  compare-counts.sh   │
                                  └──────────────────────┘
```

1. Aplique `00..05` no destino (extensões, schemas, enums, tabelas, partições,
   índices, FKs, grants). RLS/policies/triggers/views ficam de fora.
2. `export-data.sh` na origem → gera `scripts/migration/data/NNN_<tabela>.csv.gz`.
3. `import-data.sh` no destino → uma sessão psql com `session_replication_role=replica`
   (desliga triggers e checagem de FK durante o load) + `\COPY ... FROM PROGRAM 'gunzip -c ...'`.
4. Aplique `06_rls_enable.sql`, `07_policies.sql`, `09_triggers.sql`, `10_views.sql`.
5. `compare-counts.sh` valida contagem origem × destino (exit 1 se divergir fora da skip-list).

## Pré-requisitos

- `psql` >= 14 e `gzip` no ambiente onde os scripts rodam.
- Duas URLs de conexão Postgres — de preferência as **direct** (porta 5432, não pooler).
  O pooler transaction-mode não sustenta bem sessões `\COPY` longas.
- Espaço em disco: estime ~1.2× o tamanho `pg_database_size` da origem.

## Setup

```bash
cp scripts/migration/env.example scripts/migration/env.migration
$EDITOR scripts/migration/env.migration       # preencha SOURCE_DB_URL e TARGET_DB_URL
source scripts/migration/env.migration
```

`env.migration` está no `.gitignore` de `scripts/migration/`.

## Execução — passo a passo

### 1. Aplicar DDL parcial no destino

```bash
cd scripts/migration/ddl
for f in 00_extensions.sql 01_schemas_and_enums.sql 02_tables.sql \
         11_partitions.sql 03_indexes.sql 04_foreign_keys.sql \
         05_grants.sql 08_functions.sql; do
  psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f "$f"
done
```

### 2. Exportar da origem

```bash
bash scripts/migration/export-data.sh
```

- Descobre a ordem topológica com `table-order.sql` (Kahn sobre `pg_constraint`).
- Pula tabelas da `skip-tables.txt` (audit_log, caches, filas, logs voláteis).
- Paraleliza em `MIGRATION_PARALLEL` workers (default 4).
- Manifesto em `data/_manifest.tsv` (linhas × bytes por tabela).
- Flags: `--only <tabela>`, `--resume` (pula CSVs já gerados).

### 3. Importar no destino

```bash
bash scripts/migration/import-data.sh
```

- Uma única sessão psql, uma única transação.
- `SET session_replication_role = replica` = triggers e FK checks desligados durante o load.
- Ao final, re-alinha todas as sequences de `public` com `MAX(id)` da coluna dona.
- Flags: `--only <tabela>`, `--truncate` (limpa antes de cada COPY — útil em re-runs).

### 4. Ligar RLS, policies, triggers, views

```bash
psql "$TARGET_DB_URL" -f scripts/migration/ddl/06_rls_enable.sql
psql "$TARGET_DB_URL" -f scripts/migration/ddl/07_policies.sql
psql "$TARGET_DB_URL" -f scripts/migration/ddl/09_triggers.sql
psql "$TARGET_DB_URL" -f scripts/migration/ddl/10_views.sql
```

### 5. Validar

```bash
bash scripts/migration/compare-counts.sh
```

Saída colorida por tabela: verde = igual, amarelo = divergência na skip-list
(esperado), vermelho = divergência inesperada (o script sai com 1).

## Rollback

O destino é um projeto novo e vazio: rollback = destruir o projeto no painel
Supabase e recriar. Nunca aplique este runbook sobre um projeto com dados de
produção.

## Limitações conhecidas

- `\COPY` client-side é mais lento que `pg_dump -Fc` server-side. Para tabelas
  muito grandes (> 10M linhas), particione o export por janela de `created_at`.
- Colunas `bytea` grandes inflam o CSV; cheque `media_attachments` antes e, se
  necessário, migre por Storage separado.
- Extensões que geram dados próprios (`cron.job_run_details`,
  `pg_stat_statements`) não são copiadas — regeneram no destino.
- Tabelas em ciclo mútuo de FK saem no fim da ordem topológica (nível 999).
  Com `session_replication_role=replica` não é problema; confira em
  `compare-counts.sh`.

## Fora do escopo

- **Migração de `auth.users`** — script separado (Opção B decidida antes).
- **Storage buckets** — sincronize via `rclone` ou API do Storage.
- **Edge Function secrets** — recadastre via UI ou `supabase secrets set`.
- **Sincronização incremental / CDC** — este runbook é big-bang.

## Checklist final

- [ ] `env.migration` preenchido.
- [ ] DDL 00..05 + 08 aplicados no destino.
- [ ] `export-data.sh` concluído sem erro (manifest existe).
- [ ] `import-data.sh` terminou com `COMMIT`.
- [ ] DDL 06, 07, 09, 10 aplicados.
- [ ] `compare-counts.sh` verde.
- [ ] Edge functions publicadas no destino.
- [ ] `12_cron_jobs.sql` aplicado (ver `MIGRATION_DDL.md`).
- [ ] `.env` do frontend apontado para o novo `VITE_SUPABASE_URL`.
## Ver também

- [Master Runbook](./MIGRATION_MASTER_RUNBOOK.md) — orquestra todas as fases
- [DDL](./MIGRATION_DDL.md) · [Data](./MIGRATION_DATA.md) · [Edge Functions](./MIGRATION_EDGE_FUNCTIONS.md) · [Storage](./MIGRATION_STORAGE.md) · [Password Reset](./MIGRATION_PASSWORD_RESET.md)
