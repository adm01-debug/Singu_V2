-- Remove o trigger duplicado que chama set_updated_at() duas vezes por UPDATE.
-- contact_phones tinha dois triggers BEFORE UPDATE chamando a mesma função:
--   - set_updated_at   (antigo, sem prefixo trg_)
--   - trg_set_updated_at (correto, mantido)
DROP TRIGGER IF EXISTS set_updated_at ON public.contact_phones;

-- Índices para subconsultas correlacionadas em get_birthday_contacts() e
-- get_duplicate_contacts(), que filtravam contact_id + is_primary sem índice.
-- Sem esses índices, cada chamada dessas funções faz seq scan em contact_phones
-- e contact_emails por contato → timeout 57014 em carga alta.
--
-- ATENÇÃO: CREATE INDEX sem CONCURRENTLY toma ShareLock durante a criação.
-- Em produção com alto volume, prefira executar fora desta migration com CONCURRENTLY.
CREATE INDEX IF NOT EXISTS idx_contact_phones_primary
  ON public.contact_phones (contact_id)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_contact_emails_primary
  ON public.contact_emails (contact_id)
  WHERE is_primary = true;
