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
   ./cdc/drain.sh    # roda em background durante toda a janela
   ```
3. **Replay idempotente** no destino após import base:
   ```bash
   deno run --allow-env --allow-net --allow-read cdc/replay.ts
   ```
4. **Checkpoint**: tabela `public._migration_cdc_checkpoint(lsn text pk, applied_at)`.
   O replayer pula LSNs já aplicados.
5. **Encerramento**: após smoke-tests OK, `SELECT pg_drop_replication_slot('migration_slot')`.

## Pré-requisitos

- `wal_level=logical` na origem (Supabase Pro suporta).
- `wal2json` disponível (extensão presente em Supabase managed).
- Espaço em disco no diretório de drain (~1GB/h em cargas médias).

## Rollback

Se replay divergir, use `full-restore.sh`. O slot lógico segura WAL, então
**não esqueça** de dropar o slot ao final para liberar espaço na origem.