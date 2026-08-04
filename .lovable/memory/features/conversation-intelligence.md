---
name: Conversation Intelligence
description: Análise IA profunda de conversas/calls com talk ratio, sentiment timeline, tópicos, objeções, key moments e coaching score automático.
type: feature
---

Módulo Conversation Intelligence em `/conversation-intelligence` (hub) e `/conversation-intelligence/setup`.

## Schema
- `conversation_analyses` — análise estruturada por interação (talk_ratio_rep/customer, sentiment_overall + timeline jsonb, topics, objections, action_items, key_moments, coaching_score 0-100, coaching_tips, next_best_action). UNIQUE(user_id, interaction_id), FK em interactions com ON DELETE CASCADE. Audit trigger ativo.
- `conversation_topics_catalog` — biblioteca de tópicos rastreados (topic_key UNIQUE por user, label, category enum, keywords[]). Seedável via RPC `seed_conversation_topics(_user_id)` que cria 12 tópicos padrão.
- `coaching_scorecards` — templates de avaliação (criteria jsonb com {key,label,weight}).
RLS por user_id em todas. Migration `20260417_*`.

## Edge Functions (verify_jwt=false em config.toml, JWT validado em código)
- `conversation-analyzer` — recebe `{interaction_id, force?}`, lê transcrição em `interactions.content`, invoca Lovable AI (gemini-3-flash-preview) com tool calling estruturado `submit_conversation_analysis`, faz upsert em conversation_analyses. Rate limit 20/min/user. Mínimo 80 chars de conteúdo. Trata 429/402 do gateway.
- `conversation-coaching-digest` — agrega últimos N dias (default 7), gera narrativa executiva via IA. Rate limit 10/min.

## Hooks (`src/hooks/useConversationIntel.ts`)
`useConversationAnalysis(interactionId)`, `useConversationAnalyses({sentiment,minScore,days})`, `useAnalyzeConversation`, `useTopicsCatalog`, `useUpsertTopic`, `useDeleteTopic`, `useSeedTopics`, `useCoachingScorecards`, `useUpsertScorecard`, `useCoachingMetrics(periodDays)`.

## UI
- Hub: 4 KPIs (conversas analisadas, coaching score médio, talk ratio rep, objeções não tratadas), tabs Conversas/Tópicos/Coaching com bar charts e line trend.
- Setup: TopicsEditor (CRUD + seed 12 padrão) e ScorecardEditor.
- Componentes em `src/components/conversation-intel/`: CoachingScoreBadge, TalkRatioBar (warning quando rep>65% ou <35%), SentimentTimeline (recharts area com gradient), TopicsChart (donut por categoria), ObjectionsList (handled/unhandled + suggested response), KeyMomentsTimeline (ícones por moment_type), ConversationAnalysesTable, AnalyzeButton, ConversationAnalysisCard.

## Integração
- `ContactInteractionsTab`: ConversationAnalysisCard renderizado em cada interação com conteúdo ≥80 chars (coexiste com MeetingSummaryCard que faz resumo rápido).
- Sidebar: "Conversation Intel" (ícone Brain) na seção Operacional, abaixo de Win/Loss.
- Rotas: `/conversation-intelligence` e `/conversation-intelligence/setup`.

## Coexistência com meeting-summary
MeetingSummaryCard (resumo rápido + action items) permanece. ConversationAnalysisCard adiciona análise estruturada profunda com coaching. Ambos aparecem nas interações.

## Não fazer
- Não substituir meeting-summary
- Não implementar STT/gravação ao vivo (usa transcrição já existente)
