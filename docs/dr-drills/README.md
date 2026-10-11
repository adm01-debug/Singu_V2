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

O workflow `restore-drill.yml` cria um dump lógico do banco canônico no momento da execução, restaura em PostgreSQL isolado e destrói a instância. Isso valida a restauração dessa cópia lógica, mas não comprova que os snapshots diários do provedor podem ser recuperados. Em 11/10/2026, o PITR do projeto canônico estava desabilitado; os passos abaixo que exigem PITR continuam pendentes até sua ativação e um exercício efetivo com um ponto histórico.

As contagens são capturadas em uma transação `REPEATABLE READ READ ONLY` que exporta o snapshot para `pg_dump --snapshot`; a transação permanece aberta até o dump terminar. O manifesto `SOURCE_COUNTS_FILE` contém esse snapshot, as contagens e o SHA-256 do dump. O restore exige o manifesto correspondente e compara o destino com ele, sem recontar a produção. A tolerância padrão é zero.

A credencial de origem precisa de leitura nas tabelas exportadas e `EXECUTE` em `pg_catalog.pg_control_system()`. Se for uma conta dedicada `backup_reader`, o administrador pode conceder somente `GRANT EXECUTE ON FUNCTION pg_catalog.pg_control_system() TO backup_reader;`, mantendo a conta sem privilégios de escrita. Sem essa permissão, o preflight encerra com diagnóstico explícito antes de qualquer restore. Não conceder `pg_monitor` inteiro somente para obter o identificador do cluster.

O container usa senha aleatória, não publica portas e é removido pelo trap e por um passo independente `if: always()`. O dump e o log bruto são excluídos; somente diagnóstico categorizado e nomes de objetos válidos entram no relatório. URLs de conexão não são registradas. Em encerramentos abruptos que impeçam qualquer cleanup, a VM hospedada e efêmera do GitHub é descartada ao final do job.

O restore usa o superusuário `supabase_admin` exclusivamente no destino descartável; `postgres` nessa imagem não é superusuário e não pode substituir todos os objetos do provedor. O preflight espera conectividade TCP, evitando confundir o servidor temporário do bootstrap com a instância pronta. A execução mantém um relatório desde a preparação, inclusive se falharem secrets, dump ou verificação. `bash tests/dr/restore-drill.integration.sh` exercita dois clusters locais, gravação posterior ao snapshot, ausência do privilégio de identidade, recusa do mesmo cluster e falha de restore com diagnóstico sanitizado. Esse teste local usa somente registros sintéticos.

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
