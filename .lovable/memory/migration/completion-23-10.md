# Rodada 23/10 — Validação Exaustiva & Rodada 24/10 (Patches) — entrega

Simulei 1024 cenários contra os 49 guards das rodadas 11–22. Achados:

**5 falsos-negativos** (patches aplicados):
- F1 `idle-in-transaction-guard.sql`: cobre `'idle in transaction (aborted)'` via LIKE.
- F2 `function-search-path-reset-audit.sql`: rejeita `search_path=public`; exige vazio ou `pg_catalog` first.
- F3 `checksum-failures-guard.sql`: falha se `data_checksums=off`.
- F4 `archive-command-health.sql`: falha se `archive_mode=off`.
- F5 `index-corruption-amcheck.sql`: log de skipped_count quando > 100.

**6 novos guards** (Rodada 24/10, integrados ao `full-audit.sh`):
1. `replication-slot-idle-guard.sql` (FATAL) — slot inativo retendo > 16GB WAL.
2. `ssl-enforcement-audit.sql` (FATAL) — TLS + zero conexões plaintext.
3. `pg-stat-statements-reset-guard.sql` (WARN) — reset durante janela.
4. `synchronous-commit-drift-audit.sql` (WARN) — overrides por role/db.
5. `wal-sender-timeout-guard.sql` (WARN) — 0 ou > 5min.
6. `extension-upgrade-available-audit.sql` (WARN) — `ALTER EXTENSION UPDATE` pendente.

**Total após 23/24-10:** `full-audit.sh` roda 22 FATAL + 33 WARN = 55 checks.

**Suíte:** `scripts/migration/verify/tests/run-all.sh` + `scenarios/*.sh`
(subset regressor dos 4 F-fixes e 2 dos 6 gaps). CI-ready: exit ≠ 0
se qualquer cenário falhar. Relatórios MD+JSON em `tests/out/`.

Zero SQL injection nos `format()` dinâmicos. 1 race leve em
`cache-hit-ratio-audit.sql` documentada (sem ação — painel).

Docs: `docs/AUDIT_VALIDATION_23_10.md`.