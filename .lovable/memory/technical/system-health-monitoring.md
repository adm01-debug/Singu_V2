---
name: System Health Monitoring
description: Edge function /system-health verifica 5 componentes (DB local, DB externo, WhatsApp, Email, Voice AI) com status page pública /status e widget admin no header.
type: feature
---
- Endpoint público: `/functions/v1/system-health` (sem JWT, verify_jwt=false)
- Componentes: `database_local`, `database_external`, `whatsapp`, `email_pipeline`, `voice_ai`
- Status por componente: `up | degraded | down | not_configured`
- Overall: `healthy | degraded | unhealthy` (HTTP 200 ou 503)
- Widget `SystemHealthWidget` no header (admin), auto-refresh 60s
- Página pública `/status` (status page)
- Função legada `/health` ainda existe mas é deprecated — usar `system-health`
- Referência canônica: `docs/RUNBOOK.md` seção Health Check
