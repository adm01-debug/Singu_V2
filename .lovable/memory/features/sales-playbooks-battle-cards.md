---
name: Sales Playbooks & Battle Cards
description: Biblioteca de playbooks por cenário (discovery/demo/objeção/closing/winback) e battle cards por concorrente, com geração via IA, recomendação contextual e log de uso.
type: feature
---

# Sales Playbooks & Battle Cards

## Schema
- `sales_playbooks` — name, scenario (discovery|demo|negotiation|objection|closing|winback|onboarding|custom), stage_target, industry_target, persona_target, content jsonb (sections), tags[], usage_count, version
- `battle_cards` — competitor_name, our_strengths/their_strengths/weaknesses (jsonb), pricing_comparison, win_themes[], landmines[], proof_points (jsonb)
- `playbook_usage_log` — playbook_id|battle_card_id, contact_id, deal_id, action (opened|copied|shared|recommended|used_in_deal)
- Trigger `tg_playbook_usage_increment` incrementa usage_count em opened/used_in_deal
- `seed_playbook_defaults` cria 4 playbooks (discovery SPIN, demo, objeção preço, closing) + 2 battle cards exemplo

## Edge Functions
- `playbook-recommender`: ranqueia playbooks por scenario/stage/industry/persona/topics + busca battle card se concorrente mencionado
- `playbook-generator`: usa Lovable AI (gemini-3-flash-preview) com tool calling estruturado para criar playbooks JSON

## Hooks
- `usePlaybooks(filters)`, `usePlaybook(id)`, `useUpsertPlaybook`, `useDeletePlaybook`, `useGeneratePlaybook`, `useRecommendPlaybooks`, `useLogPlaybookUsage`
- `useBattleCards`, `useBattleCard`, `useUpsertBattleCard`, `useDeleteBattleCard`

## UI
- `/playbooks` — hub com tabs Playbooks | Battle Cards | Uso, busca + filtro de cenário
- `/playbooks/:id` — detalhe com seções renderizadas, copiar bloco/tudo
- `/playbooks/battle-cards/:id` — Nós x Eles, win themes, landmines, proof points
- `<PlaybookSuggestionDrawer>` — drawer lateral acionável de PipelineKanban/ContatoDetalhe

## Sidebar
"Playbooks" (ícone BookOpen) abaixo de Conversation Intel em Operacional
