# Migration Master Runbook — Supabase → Supabase

Runbook mestre para a janela de migração. Encadeia:
DDL → Data → Auth → Edge Functions → Storage → Cutover → Smoke.

> Pré-requisito: `scripts/migration/.env` preenchido a partir de `env.example`.
> Todos os comandos rodam do diretório `scripts/migration/`.

## Timing estimado (janela 4h)

| Fase | Estimativa | Bloqueante |
|---|---|---|
| DDL apply + verify-extensions | 10 min | ✅ |
| Data export (\COPY paralelo) | 40 min | ✅ |
| Data import + FK integrity + row-diff | 45 min | ✅ |
| Auth users + identities | 5 min | ✅ |
| Edge Functions (preflight + deploy 108) | 25 min | ✅ |
| Cron rewrite URLs | 2 min | ✅ |
| Storage copy | 60 min | ✅ |
| Cutover DNS/env | 5 min | ✅ |
| Smoke tests | 10 min | ✅ |
| Password reset dispatch | 15 min | assíncrono |
| Buffer | 23 min | — |

## Passo a passo

### 1. DDL

```bash
psql "$DEST_DB_URL" -f ddl/99_apply_all.sql
./ddl/verify-extensions.sh                # P0.5
```

### 2. Data

```bash
./export-data.sh                          # dump por tabela → ./data-out/
DATA_DIR=./data-out ./import-data-parallel.sh   # P1.8
./compare-counts.sh
psql "$DEST_DB_URL" -f verify/fk-integrity.sql  # P0.2
# Row diff (amostragem hash)
deno run --allow-env --allow-read --allow-write verify/row-diff.ts   # gera SQL
psql "$SRC_DB_URL"  -f verify/row-diff.sql > verify/row-diff-out/src.json
psql "$DEST_DB_URL" -f verify/row-diff.sql > verify/row-diff-out/dest.json
deno run --allow-read verify/row-diff.ts --compare                   # P0.1
```

### 3. Auth

```bash
# Users (via scripts existentes de DDL/data — auth.users está incluído)
# Identities:
./auth/export-identities.sh               # P1.7
./auth/import-identities.sh
psql "$DEST_DB_URL" -f sql/mark-must-reset.sql  # marca provider=email
```

### 4. Edge Functions

```bash
./functions/preflight-secrets.sh          # P0.3 — falha se faltar secret
./functions/set-secrets.sh                # aplica secrets.env no destino
./functions/deploy-all.sh                 # 108 funções
./functions/verify-deploy.sh
OLD_REF=$OLD_REF NEW_REF=$NEW_REF ./functions/rewrite-cron-urls.sh > /tmp/cron.sql
psql "$DEST_DB_URL" -f /tmp/cron.sql      # P0.4
```

### 5. Storage

```bash
cd storage && ./run.sh                    # list→create→copy→verify
# Ajuste: RATE_LIMIT_BPS=10485760 ./run.sh --step copy  (P3.13)
cd ..
```

### 6. Cutover

1. Atualizar `.env` do projeto Lovable com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do destino.
2. Republicar app.
3. Se domínio custom: atualizar DNS/CNAME.

### 7. Smoke tests

```bash
deno run --allow-env --allow-net cutover/smoke-tests.ts   # P2.12
```

### 8. Reset de senhas (assíncrono)

```bash
./reset-passwords.sh                      # dispara emails de recovery
```

### 9. Observabilidade durante a janela

Em terminal paralelo:

```bash
WINDOW_MIN=240 ./dashboard.sh             # P2.10
```

## Rollback

```bash
./rollback.sh                             # dry-run
./rollback.sh --i-know-what-im-doing      # executa passos automáticos
```

Ver `MIGRATION_PASSWORD_RESET.md` para o impacto de rollback sobre usuários que já resetaram.

## Índice de runbooks

- `MIGRATION_DDL.md` — schema
- `MIGRATION_DATA.md` — dados
- `MIGRATION_EDGE_FUNCTIONS.md` — funções
- `MIGRATION_STORAGE.md` — buckets/objetos
- `MIGRATION_PASSWORD_RESET.md` — reset forçado
- `MIGRATION_MASTER_RUNBOOK.md` — este arquivo

## Checklist final (10/10)

- [ ] `verify-extensions.sh` verde
- [ ] `compare-counts.sh` sem divergências
- [ ] `fk-integrity.sql` retorna vazio
- [ ] `row-diff.ts --compare` retorna 0 mismatches
- [ ] `preflight-secrets.sh` verde antes do deploy
- [ ] `verify-deploy.sh` 108/108 healthy
- [ ] `cron.job` sem referências a `$OLD_REF`
- [ ] Storage `verify-counts` verde + ETag amostrado
- [ ] `auth.identities` count equivale à origem
- [ ] `must_reset_password` apenas em `provider='email'`
- [ ] `smoke-tests.ts` 100% pass
- [ ] Dashboard mostra progresso encerrado
- [ ] Rollback documentado e revisado
