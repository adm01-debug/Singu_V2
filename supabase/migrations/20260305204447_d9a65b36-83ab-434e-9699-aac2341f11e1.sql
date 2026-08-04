
-- WhatsApp messages table for tracking message history and delivery status
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  instance_name text NOT NULL,
  remote_jid text NOT NULL,
  message_id text,
  from_me boolean NOT NULL DEFAULT false,
  message_type text NOT NULL DEFAULT 'text',
  content text,
  media_url text,
  media_mimetype text,
  status text DEFAULT 'pending',
  sender_name text,
  quoted_message_id text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  played_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- WhatsApp instances table for managing connected instances
CREATE TABLE public.whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  instance_name text NOT NULL,
  display_name text,
  phone_number text,
  status text DEFAULT 'disconnected',
  profile_pic_url text,
  webhook_url text,
  auto_read_messages boolean DEFAULT false,
  auto_reply_enabled boolean DEFAULT false,
  auto_reply_message text,
  settings jsonb DEFAULT '{}'::jsonb,
  last_connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, instance_name)
);

-- WhatsApp KPIs table for monitoring
CREATE TABLE public.whatsapp_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  instance_name text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  messages_sent integer DEFAULT 0,
  messages_received integer DEFAULT 0,
  messages_delivered integer DEFAULT 0,
  messages_read integer DEFAULT 0,
  avg_response_time_seconds integer,
  delivery_rate numeric,
  read_rate numeric,
  unique_contacts integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own whatsapp_messages" ON public.whatsapp_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own whatsapp_instances" ON public.whatsapp_instances FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage their own whatsapp_kpis" ON public.whatsapp_kpis FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_contact ON public.whatsapp_messages(user_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_remote_jid ON public.whatsapp_messages(remote_jid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance ON public.whatsapp_messages(instance_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user ON public.whatsapp_instances(user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
