---
name: Custom Reports Engine
description: Sistema de relatórios customizáveis com builder visual (entidade, campos, filtros, agrupamento, métricas) e exportação CSV.
type: feature
---
- `src/lib/reports/reportEngine.ts`: motor com ENTITIES (contacts/companies/interactions/deals/tickets), aplicação client-side de filtros, agregações (count/sum/avg/min/max), agrupamento e CSV export.
- `src/hooks/useSavedReports.ts`: persistência por usuário em localStorage (chave `singu-custom-reports-${userId}`).
- `src/components/reports/ReportConfigPanel.tsx`: builder visual em 5 etapas (fonte, colunas, filtros, agrupamento, métricas).
- `src/components/reports/ReportResultView.tsx`: tabela com 200 linhas visíveis + totals e grupos.
- `src/pages/CustomReports.tsx`: página rota `/relatorios-customizaveis`.
- Operadores: eq/neq/gt/gte/lt/lte/contains/starts_with/is_null/is_not_null.
- Limite de 1000 registros por execução; exportação CSV inclui todos.
- Complementar ao `ReportBuilder.tsx` (dashboard de widgets) — este é tabular/analítico.
