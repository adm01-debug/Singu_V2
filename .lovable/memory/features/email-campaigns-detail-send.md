---
name: Email Campaigns Detail & Send
description: Drawer de detalhe de campanha com métricas reais e ação de envio que materializa campaign_recipients a partir dos contatos com email
type: feature
---
- Hook `useCampaignRecipients(campaignId)` lista destinatários de uma campanha
- Mutation `sendCampaign` em `useEmailCampaigns` materializa `campaign_recipients` para todos os contatos do user com email válido (idempotente — checa existentes), atualiza `total_recipients` e seta status `sending` → `sent`
- Componente `CampaignDetailDrawer` (Sheet) abre ao clicar em um card de campanha:
  - 4 métricas: destinatários, taxa abertura, taxa cliques, taxa bounces
  - Lista paginada (até 500) de destinatários com badge semântico de status
  - CTA "Materializar & Enviar" só para drafts
- Página `/campanhas` integra o drawer via state `selectedCampaign`
- Não dispara emails reais — entrega é responsabilidade do pipeline de email já existente
