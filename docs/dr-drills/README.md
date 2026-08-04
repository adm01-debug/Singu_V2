# DR Drills & Game Days — Índice

> Calendário de exercícios de resiliência e protocolos de verificação. Toda execução gera evidência em arquivo dedicado.

## 📅 Calendário Anual de Game Days

| Trimestre | Cenário | Owner | Duração | Status |
|---|---|---|---|---|
| **Q1** | Matar `external-data` durante horário comercial; validar circuit breaker + UI fallback | @eng-lead | 1h | _agendar_ |
| **Q2** | Revogar `EVOLUTION_API_KEY`; validar `whatsapp: down` no health, banner no módulo Conversas | @ops | 45min | _agendar_ |
| **Q3** | Simular schema drift externo (renomear coluna `companies.cnpj`); validar logs em `/admin/schema-drift` e graceful degradation | @dba | 1h | _agendar_ |
| **Q4** | Load test 2× pico via k6 (`tests/load/external-data.js`); validar SLOs | @eng-lead | 2h | _agendar_ |

Cada execução: criar `docs/dr-drills/AAAA-Q{N}-{cenario}.md` com timeline, sinais observados, falhas encontradas e action items.

## 🔁 Protocolo de Verificação de Backup (Mensal)

**Frequência**: 1ª terça-feira de cada mês, janela 10h-12h BRT.
**Owner**: @dba
**Evidência**: `docs/dr-drills/AAAA-MM-restore.md`

### Passos

1. **Selecionar PITR** — timestamp de 24h atrás (cobertura RPO=1h, mas testamos margem maior).
2. **Restaurar em projeto staging** — via painel Lovable Cloud → Backups → Restore to new project.
3. **Validar conectividade** — `curl /functions/v1/system-health` no staging deve retornar `healthy` (componentes externos podem ficar `not_configured` — OK).
4. **Validar contagem de rows** em 5 tabelas críticas:
   ```sql
   SELECT 'profiles' AS t, COUNT(*) FROM profiles
   UNION ALL SELECT 'contacts', COUNT(*) FROM contacts
   UNION ALL SELECT 'deals', COUNT(*) FROM deals
   UNION ALL SELECT 'interactions', COUNT(*) FROM interactions
   UNION ALL SELECT 'audit_log', COUNT(*) FROM audit_log;
   ```
   Comparar com snapshot do mês anterior — desvio >5% requer investigação.
5. **Validar integridade de RLS** — listar policies, conferir que `has_role` está presente em tabelas sensíveis.
6. **Documentar** — preencher template abaixo.
7. **Destruir** o projeto staging para evitar custo.

### Template do relatório mensal

```markdown
# Restore Drill — AAAA-MM

- **Executado por**: @nome
- **Data/hora**: AAAA-MM-DD HH:MM BRT
- **PITR alvo**: AAAA-MM-DD HH:MM BRT (24h atrás)
- **Tempo total de restore**: Xmin
- **Health check pós-restore**: healthy / degraded / unhealthy
- **Contagens validadas**: ✅ ou ❌ (detalhar diffs)
- **RLS íntegra**: ✅ ou ❌
- **Issues encontradas**: nenhuma / lista com action items
- **Projeto staging destruído**: ✅
```

## 📊 Métricas de Maturidade

| Métrica | Alvo |
|---|---|
| Game days executados/ano | 4 (100% do calendário) |
| Restore drills executados/ano | 12 (mensal) |
| MTTD (Mean Time To Detect) em drills | < 2 min |
| MTTR (Mean Time To Recover) em drills | < 30 min |
| Action items de drills resolvidos | ≥ 80% no trimestre seguinte |

## 🔗 Referências

- [`../RUNBOOK.md`](../RUNBOOK.md) — runbook operacional
- [`../DISASTER_RECOVERY.md`](../DISASTER_RECOVERY.md) — RTO/RPO, on-call
- [`../LOAD_TESTING.md`](../LOAD_TESTING.md) — k6 scripts para Q4
- [`../postmortem-template.md`](../postmortem-template.md) — template para incidentes reais
