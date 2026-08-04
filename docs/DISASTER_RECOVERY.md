# SINGU CRM — Disaster Recovery Plan

> Procedimentos de recuperação para cenários de falha catastrófica.

## 🎯 Objetivos

| Métrica | Meta |
|---------|------|
| **RTO** (Recovery Time Objective) | **4 horas** |
| **RPO** (Recovery Point Objective) | **1 hora** |
| **MTTR** (Mean Time To Recovery) | **< 2 horas** |

## 🔥 Cenários cobertos

### 1. Banco de dados corrompido / drop acidental

**Detecção:** queries falhando com erro de schema; dados ausentes inesperadamente.

**Recuperação:**
1. Acessar painel Lovable Cloud → Backups
2. Identificar último backup íntegro (PITR — Point In Time Recovery)
3. Restaurar para timestamp anterior à corrupção
4. Validar com health check: `POST /functions/v1/health`
5. Comunicar stakeholders sobre janela de dados perdidos

**Tempo estimado:** 30–90min

### 2. Edge Function quebrada após deploy

**Detecção:** alertas de 5xx em `edge_function_logs`; usuários reportando erros.

**Recuperação:**
1. Identificar função afetada via logs
2. Reverter código no histórico do Lovable
3. Re-deploy automático
4. Validar com curl: `supabase--curl_edge_functions`

**Tempo estimado:** 5–15min

### 3. Vazamento de secret / credencial comprometida

**Detecção:** alerta de segurança, atividade suspeita em logs.

**Recuperação:**
1. Rotacionar secret comprometido imediatamente:
   - Lovable Cloud → Secrets → atualizar
   - Provedor externo (Evolution, ElevenLabs, etc.) → regenerar
2. Forçar logout global: `auth.admin.signOut(null, 'global')` se necessário
3. Auditar `audit_log` para identificar uso indevido
4. Comunicar usuários afetados (LGPD se PII exposta)

**Tempo estimado:** 1–4h

### 4. Frontend completamente inacessível

**Detecção:** monitoramento externo (UptimeRobot) reportando down.

**Recuperação:**
1. Verificar status do Lovable: https://status.lovable.dev
2. Reverter última versão via histórico Lovable
3. Se DNS, validar registros do domínio customizado
4. Página de manutenção temporária via Cloudflare se necessário

**Tempo estimado:** 5–30min

### 5. Banco externo (Supabase legado) inacessível

**Detecção:** circuit breaker abrindo em `external-data`; cards `ExternalDataCard` em estado de erro.

**Recuperação:**
1. Verificar status do projeto externo
2. Aguardar reabertura natural do circuit breaker (60s default)
3. Se prolongado: ativar feature flag `external_data_fallback` (modo cache-only)
4. Notificar usuários via banner global

**Tempo estimado:** automático (1–5min) ou 30min com fallback manual

## 🗂️ Backups

| Tipo | Frequência | Retenção | Local |
|------|-----------|----------|-------|
 | **Full DB snapshot** | Diário | 7 dias | Lovable Cloud (automático, Cross-Region) |
 | **PITR** | Contínuo (WAL) | 7 dias | Lovable Cloud (automático, Cross-Region) |
| **Storage objects** | Replicação automática | Indefinido | Lovable Cloud |
| **Code (Git)** | A cada commit | Indefinido | GitHub + Lovable |

## 📞 Cadeia de escalation

| Ordem | Quem | Quando |
|-------|------|--------|
| 1 | Engenheiro de plantão | Imediato (P0/P1) |
| 2 | Tech Lead | Após 15min sem resolução |
| 3 | CTO | Após 1h ou se PII exposta |
| 4 | Suporte Lovable | Se infraestrutura externa |

## 🧪 Drills (testes de DR)

**Frequência:** trimestral.

**Cenários a simular:**
- Restore de backup em ambiente staging
- Rotação de secret crítico
- Failover de Edge Function

**Documentar resultado em** `docs/dr-drills/YYYY-MM-DD.md`.

## 📋 Checklist pós-incidente

- [ ] Sistema validado e estável (health check verde por 30min)
- [ ] Stakeholders comunicados sobre resolução
- [ ] Post-mortem agendado em até 48h (template em `docs/RUNBOOK.md`)
- [ ] Ações preventivas registradas como issues
- [ ] Runbook atualizado com aprendizados
