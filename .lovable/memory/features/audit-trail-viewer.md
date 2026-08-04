---
name: Audit Trail Viewer
description: UI completa para visualizar, filtrar, buscar e exportar registros do audit_log com diff colorido side-by-side.
type: feature
---
- Página `/admin/audit-trail` protegida por RequireAdmin
- Filtros: entidade, operação (INSERT/UPDATE/DELETE), período, busca textual
- AuditDiffViewer: diff side-by-side com vermelho/verde, collapse unchanged, copy button
- Exportação CSV e JSON
- Edge Function `audit-analytics`: top entidades, operações por tipo, atividade por hora (30 dias)
- Link no AdminSidebar e ADMIN_TOOLS grid
