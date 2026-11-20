-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408195933
-- nome:   zapp_history_02_base_tables

-- ============================================================================
-- zapp_history MIGRATION 02 — Tabelas base: whatsapp_connections, conversations, messages
-- Estas são as fundações operacionais. Não existem no SINGU — criadas do zero.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- whatsapp_connections: cada instância Evolution conectada
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zapp_history.whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL UNIQUE,
  display_name TEXT,
  phone_number TEXT,
  evolution_base_url TEXT,
  owner_user_id UUID,                                  -- user responsável
  status TEXT NOT NULL DEFAULT 'disconnected'
    CHECK (status IN ('connected','disconnected','qr_pending','error','banned')),
  qr_code TEXT,
  last_connected_at TIMESTAMPTZ,
  webhook_url TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_status
  ON zapp_history.whatsapp_connections(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_owner
  ON zapp_history.whatsapp_connections(owner_user_id);

DROP TRIGGER IF EXISTS trg_whatsapp_connections_updated_at ON zapp_history.whatsapp_connections;
CREATE TRIGGER trg_whatsapp_connections_updated_at
  BEFORE UPDATE ON zapp_history.whatsapp_connections
  FOR EACH ROW EXECUTE FUNCTION zapp_history.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- conversations: agrupamento lógico de mensagens (uma por contato × instância)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zapp_history.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  whatsapp_connection_id UUID REFERENCES zapp_history.whatsapp_connections(id) ON DELETE SET NULL,

  remote_jid TEXT NOT NULL,                            -- ex: 5511999999999@s.whatsapp.net
  is_group BOOLEAN NOT NULL DEFAULT FALSE,
  group_subject TEXT,
  group_participants JSONB,

  -- Estado operacional
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','pending','resolved','archived','spam')),
  assigned_to UUID,                                    -- agente atribuído
  queue TEXT,                                          -- fila/departamento
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),

  -- Métricas (denormalizadas para performance)
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_type TEXT,
  unread_count INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,

  -- Auditoria
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  first_response_time_seconds INTEGER,

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_contact_connection UNIQUE (contact_id, whatsapp_connection_id, remote_jid)
);

CREATE INDEX IF NOT EXISTS idx_conversations_contact
  ON zapp_history.conversations(contact_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_company
  ON zapp_history.conversations(company_id, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned
  ON zapp_history.conversations(assigned_to, status, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_status
  ON zapp_history.conversations(status, last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conversations_remote_jid
  ON zapp_history.conversations(remote_jid);

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON zapp_history.conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON zapp_history.conversations
  FOR EACH ROW EXECUTE FUNCTION zapp_history.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- messages: cada mensagem individual (texto, mídia, áudio, etc)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zapp_history.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  conversation_id UUID NOT NULL REFERENCES zapp_history.conversations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,

  -- IDs externos
  whatsapp_message_id TEXT UNIQUE,                     -- ID do WhatsApp (dedupe)
  evolution_message_id TEXT,

  -- Direção e autoria
  direction TEXT NOT NULL CHECK (direction IN ('inbound','outbound','system')),
  sent_by_user_id UUID,                                -- agente, se outbound
  from_me BOOLEAN NOT NULL DEFAULT FALSE,

  -- Tipo e conteúdo
  message_type TEXT NOT NULL CHECK (message_type IN (
    'text','image','video','audio','document','sticker','location',
    'contact','reaction','system','unknown'
  )),
  content TEXT,                                        -- texto da mensagem
  quoted_message_id UUID REFERENCES zapp_history.messages(id) ON DELETE SET NULL,

  -- Flags rápidas (preenchidas pelo webhook)
  has_media BOOLEAN NOT NULL DEFAULT FALSE,
  has_audio BOOLEAN NOT NULL DEFAULT FALSE,
  has_links BOOLEAN NOT NULL DEFAULT FALSE,
  link_count INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER,
  language TEXT DEFAULT 'pt-BR',

  -- Análise
  message_intent TEXT,
  sentiment_score NUMERIC(3,2),
  embedding_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (embedding_status IN ('pending','processing','done','failed','skipped')),

  -- Estado de entrega
  delivery_status TEXT,                                -- sent, delivered, read, failed
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_reason TEXT,

  -- Raw payload original (debug/audit)
  raw_payload JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON zapp_history.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_contact_created
  ON zapp_history.messages(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_direction
  ON zapp_history.messages(direction, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_type
  ON zapp_history.messages(message_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_pending_embedding
  ON zapp_history.messages(created_at)
  WHERE embedding_status = 'pending' AND content IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_content_fts
  ON zapp_history.messages USING GIN (to_tsvector('portuguese', coalesce(content, '')));
CREATE INDEX IF NOT EXISTS idx_messages_with_media
  ON zapp_history.messages(contact_id, created_at DESC)
  WHERE has_media = TRUE;

DROP TRIGGER IF EXISTS trg_messages_updated_at ON zapp_history.messages;
CREATE TRIGGER trg_messages_updated_at
  BEFORE UPDATE ON zapp_history.messages
  FOR EACH ROW EXECUTE FUNCTION zapp_history.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Trigger: atualiza conversation.last_message_at / total_messages ao inserir mensagem
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION zapp_history.bump_conversation_on_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $fn$
BEGIN
  UPDATE zapp_history.conversations
  SET last_message_at = NEW.created_at,
      last_message_preview = CASE
        WHEN NEW.content IS NOT NULL THEN LEFT(NEW.content, 200)
        WHEN NEW.message_type = 'image' THEN '[imagem]'
        WHEN NEW.message_type = 'video' THEN '[vídeo]'
        WHEN NEW.message_type = 'audio' THEN '[áudio]'
        WHEN NEW.message_type = 'document' THEN '[documento]'
        WHEN NEW.message_type = 'sticker' THEN '[figurinha]'
        ELSE '[' || NEW.message_type || ']'
      END,
      last_message_type = NEW.message_type,
      total_messages = total_messages + 1,
      unread_count = CASE
        WHEN NEW.direction = 'inbound' THEN unread_count + 1
        ELSE unread_count
      END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_bump_conversation_on_message ON zapp_history.messages;
CREATE TRIGGER trg_bump_conversation_on_message
  AFTER INSERT ON zapp_history.messages
  FOR EACH ROW EXECUTE FUNCTION zapp_history.bump_conversation_on_message();
