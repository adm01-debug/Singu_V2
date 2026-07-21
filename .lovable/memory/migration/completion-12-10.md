---
name: Migration Completion 12/10
description: 8 hardenings finais (rodada 12/10) — CDC lag watch, dual-write divergence, schema freeze guard, secrets scan, storage large-object, sequence heal, DNS multi-region, chaos drill
type: feature
---

Rodada 12/10 — defense-in-depth sobre a base 11/10.

**Scripts adicionados** (todos em `scripts/migration/`):

1. `cdc/lag-watch.sh` — monitora slot lógico; alerta se lag >30s ou >1GiB; `AUTO_DRAIN=1` reanima
2. `verify/dual-write-diverge.ts` — compara janela recente legacy×dest; pausa via `feature_flags` se mismatch >0.1%
3. `verify/schema-freeze-guard.sql` — fingerprint SHA-256 de `information_schema.columns`; falha se schema muda pós-freeze
4. `functions/secrets-leak-scan.sh` — regex para JWT/AKIA/PRIVATE KEY (permite `Deno.env.get`)
5. `storage/copy-large.ts` — chunks 8MB com checkpointing em `storage/large-ckpt/`
6. `sql/heal-sequences.sql` — `setval(seq, MAX(id)+1)` em todas as tabelas de `public`/`auth`
7. `verify/dns-multi-region.sh` — 12 resolvers (Google, Cloudflare, Quad9, OpenDNS, Verisign, Yandex, AliDNS, Baidu)
8. `chaos/inject.sh` + `docs/CHAOS_DRILL.md` — 5 cenários com MTTR alvo

**Padrões preservados**: `set -euo pipefail`, `.env` loading, timestamp UTC, idempotência.
**Alertas reaproveitam infra existente**: `system_alerts`, `feature_flags`.
**Não afeta app em runtime**: apenas scripts de migração/SRE.