-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409211202
-- nome:   zapp_history_161_speaker_role

CREATE OR REPLACE FUNCTION zapp_history.detect_speaker_role(p_text TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- Decisor / dono
  IF v_text_lower ~ '(eu sou (o |a )?(dono|dona|s[óo]ci[oa]|ceo|diretor|presidente|propriet[áa]ri[oa]|fundad[oa]r))' THEN RETURN 'decisor_dono'; END IF;
  IF v_text_lower ~ '\m(decis[ãa]o (final )?[ée] minha|sou eu que (decido|aprovo|fecho)|tomo a decis[ãa]o)\M' THEN RETURN 'decisor_dono'; END IF;

  -- Gestor / gerente
  IF v_text_lower ~ '(sou (o |a )?(gerente|coordenad[oa]r|supervis[oa]r|head|l[íi]der|chefe))' THEN RETURN 'gestor'; END IF;

  -- Comprador / compras
  IF v_text_lower ~ '(setor de compras|departamento de compras|sou do (?:setor )?compras|comprador(a)?|procurement|suprimentos)' THEN RETURN 'comprador'; END IF;

  -- RH
  IF v_text_lower ~ '(setor de rh|departamento de rh|sou do rh|recursos humanos|gente e gest[ãa]o)' THEN RETURN 'rh'; END IF;

  -- Marketing
  IF v_text_lower ~ '(setor de marketing|departamento de marketing|sou do marketing|equipe de mkt|time de marca)' THEN RETURN 'marketing'; END IF;

  -- Técnico / TI
  IF v_text_lower ~ '(sou da ti|departamento t[ée]cnico|engenharia|desenvolvedor|projetista|designer)' THEN RETURN 'tecnico'; END IF;

  -- Secretária / assistente (intermediário, não decide)
  IF v_text_lower ~ '(secret[áa]ri[oa]|assistente|estou pedindo (em nome|pelo|pela)|meu chefe|minha chefe|meu gestor|sob orienta[çc][ãa]o)' THEN RETURN 'intermediario'; END IF;

  -- Influenciador (vai consultar alguém)
  IF v_text_lower ~ '(preciso (consultar|falar com|alinhar com)|aguardar aprova[çc][ãa]o|vou repassar|levar pra equipe)' THEN RETURN 'influenciador'; END IF;

  RETURN NULL;
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS speaker_role TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_speaker_role ON zapp_history.messages(speaker_role) WHERE speaker_role IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_speaker_role(TEXT) TO authenticated, service_role;
