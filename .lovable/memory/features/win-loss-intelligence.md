---
name: win-loss-intelligence
description: Análise estruturada de deals ganhos/perdidos com motivos categorizados, concorrentes e insights de IA via win-loss-analyzer.
type: feature
---

Win/Loss Intelligence registra resultado de cada deal (won/lost/no_decision/pending) com motivo primário (catálogo `win_loss_reasons` por categoria), motivos secundários, concorrente (`competitors`), valor, ciclo e lições aprendidas em `win_loss_records`. Função `seed_win_loss_defaults(_user_id)` popula 18 motivos padrão.

Edge Function `win-loss-analyzer` agrega 90/180 dias, calcula win rate, ticket médio, top motivos e win rate por concorrente, depois invoca Lovable AI (gemini-3-flash-preview) com tool calling para gerar 3-5 insights (pattern/recommendation/alert) persistidos em `win_loss_insights`.

UI:
- `/win-loss`: hub com 4 KPIs (Win Rate, Ticket Won, Top Loss Reason, Concorrentes), tabs Records (filtros outcome/competitor/período) + Charts (LossReasonsChart horizontal bar + CompetitorWinRateChart donut) + Insights (cards de IA com botão "Gerar")
- `/win-loss/setup`: ReasonsEditor (CRUD + seed) e CompetitorEditor (nome, website, strengths, weaknesses, faixa de preço)
- `WinLossCaptureDialog`: dialog reutilizável para capturar resultado quando deal fecha (chamável de PipelineKanban)

Hook `useWinLoss.ts`: useWinLossRecords, useWinLossRecordByDeal, useUpsertWinLossRecord, useWinLossReasons, useUpsertReason, useDeleteReason, useSeedReasons, useCompetitors, useUpsertCompetitor, useDeleteCompetitor, useWinLossMetrics(period), useWinLossInsights, useGenerateInsights, useDeleteInsight.

Sidebar: "Win/Loss" (TrendingUp) na seção Operacional abaixo de Lead Scoring. Rotas /win-loss e /win-loss/setup. Edge functions registradas em config.toml com verify_jwt=false (validação JWT em código).
