# Rodada 21/10 — Blindagem Profunda (entrega)

Simulei 1000+ cenarios adicionais sobre rodadas 10–20 (sequence overflow int4,
deadlocks silenciosos, spill to disk sem log_temp_files, checkpoints forcados,
corrupcao btree sem amcheck, HOT updates degradados por fillfactor default,
archive_command intermitente, subscribers logicos com lag crescente) e
entreguei 8 novos guards:

1. **sequence-overflow-guard.sql** (FATAL) — sequences > 90% do max_value.
2. **deadlock-frequency-monitor.sql** (WARN) — deadlocks/hora por database.
3. **temp-file-usage-audit.sql** (WARN) — queries derramando p/ disco.
4. **bgwriter-efficiency-audit.sql** (WARN) — checkpoints forcados + LRU.
5. **index-corruption-amcheck.sql** (FATAL) — bt_index_check top 100 btree public.
6. **fillfactor-hot-audit.sql** (WARN) — tabelas > 100MB com fillfactor default.
7. **archive-command-health.sql** (FATAL) — failure ratio > 5%.
8. **subscription-lag-guard.sql** (WARN) — lag_bytes em pg_stat_subscription.

Integrados ao `full-audit.sh` (3 FATAL + 5 WARN). Scripts idempotentes,
dependencia apenas de psql/DEST_DB_URL. amcheck skip automatico se extensao
ausente.