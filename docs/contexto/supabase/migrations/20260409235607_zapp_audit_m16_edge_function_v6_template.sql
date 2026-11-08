CREATE TABLE IF NOT EXISTS zapp_history.edge_function_templates (
  slug TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  deploy_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE zapp_history.edge_function_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY eft_service_all ON zapp_history.edge_function_templates FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY eft_authenticated_read ON zapp_history.edge_function_templates FOR SELECT TO authenticated USING (TRUE);
