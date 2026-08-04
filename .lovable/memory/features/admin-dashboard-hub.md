---
name: Admin Dashboard Hub
description: Dashboard administrativo unificado em /admin com status cards, quick actions, alertas e grid de ferramentas com sidebar de navegação.
type: feature
---
- Rota `/admin` como hub central com RequireAdmin
- 4 Status Cards: Sistema (health check), Banco Externo (latência), Integrações, Segurança (secrets)
- AdminQuickActions: Verificar Saúde, Limpar Cache, Exportar Logs (audit_log), Rodar Testes
- Alertas ativos: conta de alerts não-dismissed + secrets com rotação pendente
- Grid de 8 ferramentas admin com links diretos
- AdminSidebar: navegação lateral em desktop, nav horizontal em mobile
- AdminLayout: wrapper que aplica sidebar em todas as páginas /admin/*
- Componentes: AdminDashboard.tsx, AdminQuickActions.tsx, AdminSidebar.tsx, AdminLayout.tsx
