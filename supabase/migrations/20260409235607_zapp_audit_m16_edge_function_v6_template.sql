-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409235607
-- nome:   zapp_audit_m16_edge_function_v6_template

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
