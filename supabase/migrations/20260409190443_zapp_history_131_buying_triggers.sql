-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409190443
-- nome:   zapp_history_131_buying_triggers

CREATE OR REPLACE FUNCTION zapp_history.detect_buying_triggers(p_text TEXT)
RETURNS TEXT[] LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_triggers TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_text IS NULL THEN RETURN v_triggers; END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '(deadline|prazo apertado|pra ontem|preciso urgente|tem como (entregar|ser) (rapido|rápido))' THEN v_triggers := array_append(v_triggers, 'deadline_apertado'); END IF;
  IF v_text_lower ~ '(verba aprovada|or[çc]amento aprovado|j[áa] tenho or[çc]amento|tenho budget|budget liberado)' THEN v_triggers := array_append(v_triggers, 'budget_aprovado'); END IF;
  IF v_text_lower ~ '(decis[ãa]o tomada|j[áa] decidimos|definimos|estamos decididos|j[áa] escolhemos)' THEN v_triggers := array_append(v_triggers, 'decisao_tomada'); END IF;
  IF v_text_lower ~ '(comprou ano passado|fizemos ano passado|sempre fa[çc]emos|todo ano|recompra|tradi[çc][ãa]o)' THEN v_triggers := array_append(v_triggers, 'recorrente'); END IF;
  IF v_text_lower ~ '(black friday|natal|fim de ano|p[áa]scoa|dia das m[ãa]es|dia dos pais|festas?)' THEN v_triggers := array_append(v_triggers, 'sazonal'); END IF;
  IF v_text_lower ~ '(precisamos urgente|n[ãa]o pode atrasar|projeto crítico|crítico|vai atrasar)' THEN v_triggers := array_append(v_triggers, 'projeto_critico'); END IF;
  IF v_text_lower ~ '(novo cliente|primeira compra|primeira vez|nunca compramos|conhecendo voc[êe]s)' THEN v_triggers := array_append(v_triggers, 'primeira_compra'); END IF;
  IF v_text_lower ~ '(expandindo|crescendo|abrindo (filial|loja|unidade)|nova sede|mudan[çc]a)' THEN v_triggers := array_append(v_triggers, 'expansao'); END IF;
  IF v_text_lower ~ '(troquei de fornecedor|fornecedor anterior|antigo fornecedor (n[ãa]o|n)|sa[íi] da empresa)' THEN v_triggers := array_append(v_triggers, 'troca_fornecedor'); END IF;
  IF v_text_lower ~ '(licita[çc][ãa]o|pregão|edital|processo licitat[óo]rio)' THEN v_triggers := array_append(v_triggers, 'licitacao'); END IF;

  RETURN v_triggers;
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS buying_triggers TEXT[];

CREATE INDEX IF NOT EXISTS idx_messages_buying_triggers ON zapp_history.messages USING GIN (buying_triggers)
  WHERE buying_triggers IS NOT NULL AND array_length(buying_triggers, 1) > 0;

GRANT EXECUTE ON FUNCTION zapp_history.detect_buying_triggers(TEXT) TO authenticated, service_role;
