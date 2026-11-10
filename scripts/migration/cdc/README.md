# CDC / Replay Layer — RPO=0

Captura mudanças na ORIGEM entre `freeze-origin.sh` (parcial) e o flip de DNS,
e reaplica idempotentemente no DESTINO. Objetivo: zero perda para escritas de
última hora que escaparem do dump inicial.

## Estratégia

1. **Slot lógico** com `wal2json` na origem (pré-freeze):
   ```sql
   SELECT pg_create_logical_replication_slot('migration_slot', 'wal2json');
   ```
2. **Drain contínuo** via `pg_recvlogical` para arquivos JSON:
   ```bash
   ./cdc/drain.sh --dry-run   # confere slot/plugin e mostra o comando
   ./cdc/drain.sh             # foreground; `nohup ./cdc/drain.sh &` para a janela toda
   ```
   O drain recusa começar se o slot não existir, for de outro plugin ou já
   estiver em uso (drain duplicado). Arquivos saem com permissão 600.
   Em paralelo, vigie o lag:
   ```bash
   AUTO_DRAIN=1 ./cdc/lag-watch.sh    # alerta por bytes retidos e por slot parado
   ./cdc/lag-watch.sh --once          # medição única (exit 1 = crítico) para cron/CI
   ```
3. **Replay idempotente** no destino após import base:
   ```bash
   deno run --allow-env --allow-net --allow-read cdc/replay.ts
   ```
4. **Checkpoint**: tabela `public._migration_cdc_checkpoint(lsn text pk, applied_at)`.
   O replayer pula LSNs já aplicados.
5. **Encerramento**: após smoke-tests OK, `SELECT pg_drop_replication_slot('migration_slot')`.

## Ensaio em staging

```bash
CDC_DRY_RUN_SEC=60 SYNTHETIC_WRITES=1 ./cdc/dry-run.sh
```

Sai com código 1 se algum gate reprovar (WAL capturado, checkpoint avançou,
2ª passada do replay aplicou 0, canário origem = destino). O slot criado pelo
ensaio e as tabelas canário são removidos sempre — inclusive em falha ou
Ctrl+C — para não deixar WAL retido na origem.

## Pré-requisitos

- `wal_level=logical` na origem (Supabase Pro suporta).
- `wal2json` disponível (plugin presente em Supabase managed). Outro plugin
  (ex.: `test_decoding` em laboratório): `CDC_PLUGIN=<nome>`.
- `checkpoint.sql` aplicado no destino (idempotente; o dry-run aplica sozinho).
- Espaço em disco no diretório de drain (~1GB/h em cargas médias).

## Rollback

Se replay divergir, use `rollback/full-restore.sh`. O slot lógico segura WAL, então
**não esqueça** de dropar o slot ao final para liberar espaço na origem.
## Variáveis

`SRC_DB_URL`, `DEST_DB_URL`, `CDC_SLOT`, `CDC_PLUGIN`, `CDC_OUT_DIR`,
`LAG_MAX_BYTES`, `LAG_MAX_SEC`, `POLL_SEC`, `AUTO_DRAIN` — ver `../env.example`.
Todos os scripts aceitam `--help`; a senha da URL não aparece em `ps`.
