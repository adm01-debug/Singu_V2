---
name: Rodada 26/10 — Observabilidade Externa & Alerting
description: Exporter Prometheus, SLO burn-rate multi-window, Alertmanager, runbooks e CI de cobertura.
type: feature
---

# Rodada 26/10

Fecha o loop **detecao -> resposta**: guards internos emitem sinal externo
com SLO explicito e runbook por alerta.

## Entregas

1. `scripts/migration/verify/exporter/full-audit-exporter.sh` — parseia
   full-audit e emite metricas Prometheus textfile.
2. `scripts/migration/verify/exporter/README.md` — instalacao cron.
3. `monitoring/prometheus/rules/db-guards.yml` — 5 alertas + 3 recording rules.
4. `monitoring/prometheus/rules/slo-burn-rate.yml` — SLO 99.5% multi-window.
5. `monitoring/alertmanager/alertmanager.yml` — routing + inhibit + silence.
6. `docs/runbooks/db-guards.md` — 34 secoes (28 FATAL + 6 meta).
7. `scripts/monitoring/check-runbook-coverage.sh` + workflow
   `.github/workflows/monitoring-lint.yml`.
8. 6 regressores em `scripts/migration/verify/tests/scenarios/26-*.sh`.

## ADR

`docs/adr/019-external-observability-alerting.md`.

## Cardinalidade

~132 series brutas + 3 recording rules; <2% do teto operacional.