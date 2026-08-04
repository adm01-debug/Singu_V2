# ADR 019 — Observabilidade Externa e Alerting (Rodada 26/10)

**Status:** Aceito · **Data:** 2026-10-26

## Contexto

66 guards internos (28 FATAL + 38 WARN) rodam via `full-audit.sh`. Sinal
ficava no stdout do cron; sem exportacao externa, alertas nao chegavam ao
on-call e SLO era informal.

## Decisao

1. **Prometheus textfile collector** (node_exporter) em vez de push gateway:
   audit e batch, textfile e idiomatico; push gateway tem semantica errada.
2. **Multi-window multi-burn-rate** (SRE Workbook cap. 5) para SLO 99.5%:
   fast 14.4x/1h -> page, slow 6x/6h -> ticket.
3. **Alertmanager** com routing por severity (page->PagerDuty, ticket->Slack),
   inhibit rules (FATAL suprime WARN; dead-man suprime tudo) e silence via
   label `maintenance`.
4. **Runbook por guard** com CI enforcement.

## Consequencias

- CI exige promtool/amtool validos e cobertura de runbook.
- Cardinalidade ~132 series brutas + 3 recording rules agregadas.
- Encerra loop "detecao -> resposta"; MTTA/MTTR mensuraveis.