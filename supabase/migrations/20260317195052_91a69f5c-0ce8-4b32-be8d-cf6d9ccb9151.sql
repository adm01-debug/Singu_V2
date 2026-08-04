
-- Tabela de regras de automação
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Trigger: o que dispara a regra
  trigger_type TEXT NOT NULL, -- interaction_created, contact_stage_changed, score_changed, tag_added, no_contact_days, sentiment_changed, follow_up_due
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- ex: {"stage_from": "prospect", "stage_to": "customer"}, {"min_days": 30}
  
  -- Condições adicionais (AND)
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb, -- ex: [{"field": "relationship_score", "operator": "lt", "value": 50}]
  
  -- Ações a executar
  actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- ex: [{"type": "create_alert", "config": {"title": "..."}}]
  
  -- Métricas
  execution_count INTEGER NOT NULL DEFAULT 0,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own automation rules"
  ON public.automation_rules FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own automation rules"
  ON public.automation_rules FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation rules"
  ON public.automation_rules FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation rules"
  ON public.automation_rules FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Log de execuções
CREATE TABLE public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  trigger_entity_type TEXT NOT NULL, -- contact, interaction, company
  trigger_entity_id UUID NOT NULL,
  actions_executed JSONB NOT NULL DEFAULT '[]'::jsonb,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own automation logs"
  ON public.automation_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own automation logs"
  ON public.automation_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own automation logs"
  ON public.automation_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
