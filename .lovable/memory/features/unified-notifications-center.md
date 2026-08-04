---
name: Centro de Notificações Unificado
description: Sino global no header agrega alertas, riscos de churn e pesquisas NPS pendentes em popover único com priorização automática.
type: feature
---
- Hook `useUnifiedNotifications` consulta em paralelo: `alerts` (não dispensados), `churn_risk_scores` (high/critical) e `csat_surveys` (status=sent)
- Ordenação por prioridade (critical>high>medium>low) e depois por recência
- Componente `UnifiedNotificationsBell` (popover shadcn) substitui o link estático no Header
- Badge no sino: vermelho se houver criticais, primário caso contrário; mostra "99+" acima de 99
- Cada item tem ícone por origem (AlertTriangle/TrendingDown/Star), badge de origem, timestamp relativo (date-fns ptBR) e link direto
- Refetch automático a cada 60s; staleTime 30s
- Empty state amigável com Inbox icon
