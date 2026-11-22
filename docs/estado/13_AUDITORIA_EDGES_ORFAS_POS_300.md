# 13 — Auditoria de edges órfãs consolidada (pós-#300)

> Atualiza `docs/estado/09_VERIFICACAO_ADVERSARIAL_ORFAOS.md` com os religamentos da
> PR #300 (commit 8677d68, main) e a varredura direta de chamadores.
> Inventário: `inventario/estado/edges.json` regenerado em 2026-11-21 (109 total).

## Regra de decisão
Nenhuma edge é deletada. As 14 investigadas se dividem em: religadas (tem chamador), legítimas
(webhook externo / cron invisível / escrito por outra camada) e backend-pronto-sem-UI (feature
inacabada a religar no escopo do 100%). Nada apagado até prova de obsolescência.

## VERDE — religadas / com chamador vivo (4)

| edge | chamador (arquivo:linha) | como |
|---|---|---|
| audit-analytics | `src/hooks/useAuditAnalytics.ts:28` | `supabase.functions.invoke('audit-analytics')`, consumido por `AuditAnalyticsPanel.tsx` montado em `AdminAuditTrail.tsx:192` — religada pela #300 |
| sequence-track | `supabase/functions/send-transactional-email/index.ts:19` | monta URLs de clique/pixel `${trackBase}/functions/v1/sequence-track?a=click/open`; nurturing-runner gera `email_tracking_token` (`nurturing-runner/index.ts:158,214`) — religada pela #300 |
| mcp-server | `src/components/admin/conexoes/McpInstructionsCard.tsx:8` | URL literal `https://${projectId}.functions.supabase.co/mcp-server` — religado pela #300 (gerador não detecta URL literal) |
| submit-signature | `src/pages/PublicSignaturePage.tsx:78` | `fetch(\`${FN_BASE}/submit-signature\`)` com token+action — religado pela #300 |

## AMARELO — legítimas, sem chamador no repo por natureza (5)

| edge | motivo |
|---|---|
| bitrix24-webhook | webhook externo autenticado (`x-bitrix24-secret`); chamador é o Bitrix24, fora do repo |
| evolution-bitrix-connector | auth híbrida; integração externa Evolution/Bitrix |
| auto-rebatch-behavioral | cron-gated (`requireCronSecret`); agenda oficial dos crons lista como deliberadamente fora até ter `LOVABLE_API_KEY` |
| crm-automation-monitor | único escritor de `crm_automation_logs`; alimenta widget da home (doc 09: REFUTADO apagar) |
| attribution-calculator | único caminho vivo usa service_role; `compute_attribution` perdeu EXECUTE de anon/authenticated em `20260723151654` (doc 09: REFUTADO apagar) |

## INCONCLUSIVO (1)

| edge | motivo |
|---|---|
| health-aggregate | chamador externo invisível possível (cron do painel Supabase) — sem evidência de que é lixo |

## LARANJA — backend pronto, sem UI (2 a religar; não deletar)

| edge | estado | religação necessária |
|---|---|---|
| win-loss-record-deal | EF completa autenticada; o front grava `win_loss_records` por **upsert direto** (`useWinLoss.ts:125`, religado pela #300 via DealDetailDrawer) | refatorar o hook para usar a EF (padrão do sistema) — hoje a EF existe mas o dado não passa por ela |
| conversation-coaching-digest | RPC autenticada completa | sem consumidor de negócio ainda |

## Resultado
- `sem_chamador_no_repo`: **14 → 12** na regeneração (4 religadas pela #300); a varredura manual
  confirma mcp-server e submit-signature **com** chamador (URL literal), que o gerador não detecta.
- **Nenhuma edge foi removida.** Toda melhoria/religamento anterior está preservado no main.
- Pendência aberta real: uso da EF `win-loss-record-deal` no hook (consistência) e religação futura
  de `conversation-coaching-digest` conforme demanda de negócio.
