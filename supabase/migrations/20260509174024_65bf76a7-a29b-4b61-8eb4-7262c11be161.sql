
-- Índices para Ingestão Rápida (Busca por Telefone no Webhook)
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp ON public.contacts(whatsapp);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(phone);

-- Índices para Timeline e Relatórios
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON public.interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_company_id ON public.interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON public.interactions(created_at DESC);

-- Índice para busca de mensagens de WhatsApp
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_id ON public.whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_msg_id ON public.whatsapp_messages(message_id);

-- Documentar as otimizações
COMMENT ON INDEX idx_contacts_whatsapp IS 'Acelera a identificação de contatos durante a ingestão automática de mensagens.';
COMMENT ON INDEX idx_interactions_contact_id IS 'Otimiza o carregamento da timeline unificada de relacionamento.';
