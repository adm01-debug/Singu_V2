---
name: Global System Health Check
description: Edge function system-health verifica 5 componentes em paralelo (DB local/externo, WhatsApp, Email, Voice AI) com status page pública em /status e widget admin no header.
type: feature
---
- Edge Function `system-health`: verifica DB local, DB externo, WhatsApp (Evolution API), Email Pipeline (email_logs), Voice AI (ElevenLabs) em paralelo
- Status: up/degraded/down/not_configured por componente, overall: healthy/degraded/unhealthy
- `SystemHealthWidget`: popover no header para admins com dot colorido, auto-refresh 60s
- `/status`: página pública sem auth, estilo status page, mostra componentes com latência e badges
- Configuração: verify_jwt = false para acesso público
- Componentes verificados: database_local, database_external, whatsapp, email_pipeline, voice_ai
