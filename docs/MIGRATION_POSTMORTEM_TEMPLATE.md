# Postmortem — Migração Origem para Destino

Data da janela: YYYY-MM-DD HH:MM–HH:MM UTC
Autores: nomes
Status: rascunho | revisado | publicado
Severidade: SEV-1 | SEV-2 | SEV-3 | sem incidentes

## 1. Resumo executivo

Um parágrafo. O que foi migrado, resultado, impacto.

## 2. Timeline (UTC)

| Hora | Evento |
|---|---|
| T-24h | Redução de TTL DNS |
| T-1h  | Freeze da origem |
| T-0   | Export iniciado |
| T+1h  | Smoke tests OK |
| T+24h | Watch encerrado |

## 3. O que foi bem

- ...

## 4. O que foi mal

- ...

## 5. Incidentes durante a janela

| # | Descrição | Detectado por | MTTA | MTTR | Impacto |
|---|---|---|---|---|---|
| 1 | | | | | |

## 6. Métricas

| Métrica | Alvo | Realizado |
|---|---|---|
| Duração total | 4h | |
| Downtime efetivo | 0 | |
| Row-diff mismatches | 0 | |
| FK integrity errors | 0 | |
| RLS parity | 100% | |
| Trigger parity | 100% | |
| Sequences realinhadas | N/A | |
| Edge functions saudáveis | 108/108 | |
| Storage objects copiados | 100% | |
| Smoke tests | 100% | |

## 7. Root cause analysis

Use os 5 porquês para incidentes SEV-1/SEV-2.

## 8. Lições aprendidas

- ...

## 9. Action items

| # | Ação | Responsável | Prazo | Status |
|---|---|---|---|---|
| 1 | | | | |

## 10. Anexos

- Logs: logs/watch-timestamp.log
- Freeze snapshot: freeze-state/timestamp/
- Row-diff report: verify/row-diff-out/
- Dashboard screenshots.