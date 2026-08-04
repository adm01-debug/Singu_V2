---
name: SMS Marketing Module
description: Módulo completo de campanhas SMS com templates, opt-outs LGPD, materialização de destinatários e envio via Twilio gateway (provider-agnostic)
type: feature
---
- Tabelas: `sms_campaigns`, `sms_campaign_recipients` (FK contact), `sms_templates` (variáveis auto-extraídas `{{var}}`), `sms_opt_outs` (LGPD)
- RLS: cada usuário acessa apenas seus próprios registros; recipients são gated via subquery na campanha
- Hook `useSmsCampaigns`/`useSmsCampaignRecipients`/`useSmsTemplates` em `src/hooks/useSmsCampaigns.ts`
- Edge Function `send-sms-campaign`: materializa contatos com telefone (normalização BR +55), exclui opt-outs, renderiza variáveis (`first_name`, `last_name`, `full_name`), envia via Twilio gateway (`POST /Messages.json`); se Twilio não conectado marca recipients como `failed` com mensagem clara — UI avisa e sugere conectar provedor
- Página `/sms-marketing` (`src/pages/SmsMarketing.tsx`): tabs Campanhas + Templates, contador de chars/segmentos (160/SMS), drawer de detalhe com 4 métricas (destinatários, enviados, falhas, custo R$ 0,05/SMS estimado) e lista paginada de recipients com badges semânticos
- Sidebar: item "SMS Marketing" na seção Análise, ícone MessageSquare
- Provedor configurável depois: requer connector Twilio + `sender_id` na campanha (telefone E.164 ou alfanumérico)