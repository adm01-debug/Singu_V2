
-- Custom Fields definitions
CREATE TABLE public.custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'boolean', 'url', 'email', 'phone')),
  field_options JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, entity_type, field_name)
);

-- Custom Field Values
CREATE TABLE public.custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  custom_field_id UUID REFERENCES public.custom_fields(id) ON DELETE CASCADE NOT NULL,
  entity_id UUID NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(custom_field_id, entity_id)
);

-- RLS
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own custom fields" ON public.custom_fields FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own custom field values" ON public.custom_field_values FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
