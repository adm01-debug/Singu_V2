---
name: Lead Routing Portfolio Rotation
description: Módulo de rodízio de carteira SDR/Closer com round-robin ponderado, handoff BANT, redistribuição automática e Edge Function server-side
type: feature
---

## Arquitetura

### Tabelas (Lovable Cloud)
- `sales_team_members` — Perfil de vendedor (role, weight 1-10, caps diário/total, férias)
- `lead_routing_rules` — Regras priorizadas de distribuição (round_robin, weighted, territory, specialization, load_balanced)
- `lead_assignments` — Atribuições com SLA tracking (sla_deadline, first_contact_at, sla_met)
- `handoff_requests` — Fila SDR→Closer com dados BANT (qualification_data JSON)
- `redistribution_log` — Auditoria de redistribuições (reason, auto_triggered, inactivity_days)

### Functions (DB)
- `reset_daily_lead_counts()` — Zera leads_today para membros com reset_at < today
- `auto_reset_leads_on_update()` — Trigger BEFORE UPDATE que auto-reseta contadores diários

### Edge Function: `lead-routing`
- `distribute` — Round-robin ponderado server-side com filtro de férias e capacidade
- `redistribute` — Redistribuição de leads inativos por N dias (default 7)
- `reset_daily` — Chamada manual para reset de contadores

### Hooks
- `useSalesTeam` / `useCreateTeamMember` / `useUpdateTeamMember` / `useDeleteTeamMember`
- `useRoutingRules` / `useCreateRoutingRule` / `useUpdateRoutingRule` / `useDeleteRoutingRule`
- `useHandoffQueue` / `useCreateHandoff` / `useRespondHandoff` / `usePendingHandoffCount`
- `useLeadAssignments` / `useDistributeLead` (client-side)
- `useServerDistribute` / `useServerRedistribute` / `useResetDailyCounts` (server-side via Edge Function)
- `useRoutingMetrics`

### UI
- Rota: `/rodizio`
- Tabs: Equipe, Regras, Handoff, Métricas
- SalesTeamTab: Cards com barras de capacidade, gestão de férias, confirmação de exclusão, toggle ativo
- RoutingRulesTab: CRUD com switch ativo/inativo, confirmação de exclusão
- HandoffQueueTab: Nomes reais dos membros, BANT badges, DISC profile, SLA hours
- RoutingMetricsTab: Progress bars, labels qualitativos, distribuição por tipo
- Menu admin: Redistribuir inativos, Resetar contadores
