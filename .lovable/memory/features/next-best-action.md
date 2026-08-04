---
name: Next-Best-Action por Contato
description: Card no ContatoDetalhe que sugere próxima ação ideal via IA, com canal, urgência, script e botão para criar tarefa
type: feature
---

# Next-Best-Action (NBA) por Contato

## Visão geral
Card no topo da aba "Resumo" de `ContatoDetalhe` que gera, via Lovable AI Gateway (`google/gemini-2.5-flash`), a **próxima melhor ação** acionável para o contato com base em sinais agregados.

## Arquitetura

### Backend
- Edge Function `next-best-action`
- Auth via JWT (`withAuth`), rate limit 30 req/min por IP
- Input: `{ contact_id }` (Zod)
- Agrega: contact + company, últimas 10 interações, lead_score, sentiment trend (recent5 vs prev5), dias desde última interação
- IA retorna JSON: `{ action, reason, channel, urgency, suggested_script, expected_outcome }`
- Upsert em `contact_next_actions` (unique `(user_id, contact_id)`)

### Tabela `contact_next_actions`
- Cache por contato (1 sugestão ativa)
- `signals_snapshot` jsonb registra os sinais usados na geração
- RLS por `user_id`, índice `(user_id, contact_id)` + `(user_id, generated_at DESC)`

### Frontend
- Hook `useNextBestAction(contactId)` — `useQuery` (lê cache, staleTime 24h) + `useMutation` (gera/regenera)
- Componente `NextBestActionCard.tsx`:
  - Empty state com CTA "Gerar sugestão IA"
  - Header com urgência (badge semântica) e canal sugerido
  - Ação principal + justificativa
  - Script collapsible com botão copiar
  - Resultado esperado em rodapé
  - Botões: Regenerar + Criar tarefa (usa `useCreateTask` existente)
- Integrado em `ContatoDetalhe.tsx` no topo da aba "Resumo"

## Sinais agregados
- `lead_score` (score + grade)
- `sentiment_trend`: up | stable | down | unknown
- `days_since_last_interaction`
- `last_interaction` (tipo, sentiment, summary, direção)
- `relationship_score`, `relationship_stage`

## UX
- Generation < 8s (Gemini Flash)
- "Criar tarefa" reusa `useCreateTask` com prioridade derivada de urgência e `task_type` = canal
- Toasts: 🎯 sucesso, mensagem clara em 429/402
