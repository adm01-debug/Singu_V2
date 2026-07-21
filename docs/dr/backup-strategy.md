# Estratégia de Backup e Disaster Recovery

## Objetivos

| Métrica | Alvo |
|---|---|
| RPO (Recovery Point Objective) | menor ou igual a 15 min |
| RTO (Recovery Time Objective) | menor ou igual a 2 h |
| Retenção DB | 30 dias diários + 12 meses mensais |
| Retenção Storage | 30 dias cross-region |

## Camadas de proteção

### 1. Snapshots automáticos do Supabase (nativo)

- Diários mantidos 7 dias no plano padrão.
- Point-in-time recovery (PITR) quando habilitado (Pro+).

### 2. pg_dump agendado (defesa em profundidade)

```bash
# GitHub Action às 03:00 UTC diariamente
pg_dump --format=custom --no-owner --no-privileges \
  --exclude-schema=storage --exclude-schema=auth \
  "$DEST_DB_URL" \
  | gpg --encrypt --recipient dr@empresa.com \
  | aws s3 cp - "s3://dr-backups/db/$(date -u +%Y/%m/%d)/full.dump.gpg"
```

- Bucket S3 com Object Lock (WORM) por 30 dias.
- Cross-region replication para região secundária.

### 3. Storage cross-region

- Buckets críticos replicados via storage/copy-objects.ts diariamente
  para bucket espelho em região distinta.
- Diff diário via verify-counts.ts com alerta se drift maior que 1%.

### 4. Secrets

- Snapshot semanal de secrets.template.env (nomes apenas).
- Valores custodiados no cofre da equipe (1Password / Vault).

## Runbook de restore

### Cenário A — Corrupção lógica (DROP acidental)

1. Identificar timestamp seguro (T-x).
2. PITR do Supabase até T-x (se disponível).
3. Caso contrário: rollback/full-restore.sh --confirm --i-know-what-im-doing.

### Cenário B — Perda de região

1. Provisionar novo projeto Supabase em região secundária.
2. Aplicar DDL: psql ... -f ddl/99_apply_all.sql.
3. pg_restore do dump mais recente de S3.
4. Restore de Storage do bucket espelho.
5. Executar verify/ + smoke-tests.ts.
6. Flip de DNS conforme cutover/dns-flip-checklist.md.

### Cenário C — Ransomware / comprometimento

1. Rotacionar service_role e todos secrets.
2. Restore a partir de backup com Object Lock (imutável).
3. Auditar audit_log para janela suspeita.
4. Postmortem obrigatório.

## Testes de DR

- Trimestral: drill em staging (ver docs/dr-drills/).
- Anual: full failover simulado incluindo DNS flip.
- Métricas: tempo real de restore vs RTO alvo.

## Observabilidade

- system_health_snapshots inclui timestamp do último backup.
- Alerta se age(last_backup) maior que 26h.
- Painel /admin/error-budget exibe status DR na aba Confiabilidade.