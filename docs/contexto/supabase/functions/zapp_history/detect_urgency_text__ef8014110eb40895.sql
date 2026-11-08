CREATE OR REPLACE FUNCTION zapp_history.detect_urgency_text(p_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE v_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_lower := lower(p_text);

  IF v_lower ~ '(socorro|urgent[íi]ssimo|pra ontem|prazo apertad|apertado|pra amanh[ãa]|deadline)' THEN RETURN 'imediato'; END IF;
  IF v_lower ~ '(amanh[ãa]|hoje|agora|urgente|r[áa]pido)' THEN RETURN 'proximo_dia'; END IF;
  IF v_lower ~ '(esta semana|nesta semana|at[ée] sexta|at[ée] s[áa]bado|essa semana)' THEN RETURN 'semana'; END IF;
  IF v_lower ~ '(pr[óo]xima semana|semana que vem)' THEN RETURN 'proxima_semana'; END IF;
  IF v_lower ~ '(sem pressa|tranquilo|sem correria|quando der)' THEN RETURN 'sem_pressa'; END IF;

  RETURN NULL;
END;
$function$
