# ADR 017: IA nas Conexões, Self-Healing & Detecção de Anomalias

**Status:** Accepted
**Date:** 2026-04-20
**Context:** Mapping de webhooks externos é manual e propenso a erro. Mudanças de schema na origem (drift) só são percebidas após acúmulo de erros. Anomalias de latência/erro só são vistas em dashboards reativos.

## Decisão

Introduzir 3 capacidades de IA no módulo de Conexões:

1. **`ai-suggest-mapping`** — Edge function autenticada (admin) que recebe `example_payload + target_entity` e devolve `field_mapping` com confiança por campo. Usa `google/gemini-2.5-flash` via Lovable AI Gateway. Fallback determinístico (matching por nome dos campos) quando IA indisponível.
2. **`connection-anomaly-detector`** — Edge function (cron diário ou manual) que agrega `incoming_webhook_logs` últimos 7d em série temporal diária e usa IA para detectar `error_spike`, `latency_degradation`, `volume_drop/spike`, `suspicious_window`. Resultados em `connection_anomalies` (RLS admin). Fallback determinístico (3× média).
3. **Self-healing por schema drift** — Quando `incoming-webhook` falha com erro de coluna/tipo, dispara `ai-suggest-mapping` em background. Se confiança ≥ 0.8, cria `smart_notification` (canal `mapping_drift`) com mapping sugerido. **Sempre human-in-the-loop** — admin precisa aceitar.

## Política human-in-the-loop

Mudanças destrutivas (alterar `field_mapping`) NUNCA são aplicadas automaticamente. IA apenas **propõe** via notificação; admin valida e aceita.

## Thresholds

- **Confiança IA mínima para self-healing:** 0.8
- **Janela de detecção de anomalias:** 7 dias
- **Severidade `high`:** erro 3× acima da média semanal
- **Severidade `medium`:** p95 2× acima da média

## Tabelas extras

- `connection_anomalies` (RLS admin only; INSERT restrito a `service_role`)

## Chat conversacional

`ask-crm` foi estendido para aceitar perguntas sobre tabelas de integrações (`connection_*`, `incoming_webhook_*`, `mcp_tool_calls`). Validação extra: papel `admin` obrigatório quando query menciona tabelas de integrações.

## Consequências

**Positivas:** onboarding de webhook desconhecido cai de minutos para 5s; drift detectado proativamente; observabilidade conversacional.
**Negativas:** dependência de Lovable AI (mitigada por fallback determinístico em 100% dos paths críticos); custo de tokens por scan diário.
