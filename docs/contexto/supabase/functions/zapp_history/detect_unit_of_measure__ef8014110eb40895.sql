CREATE OR REPLACE FUNCTION zapp_history.detect_unit_of_measure(p_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);
  IF v_text_lower ~ '\m(caixa[s]?|cx|cxs)\M' THEN RETURN 'caixa'; END IF;
  IF v_text_lower ~ '\m(d[úu]zia[s]?|dz|dzs)\M' THEN RETURN 'duzia'; END IF;
  IF v_text_lower ~ '\m(pacote[s]?|pct|pcts|pack)\M' THEN RETURN 'pacote'; END IF;
  IF v_text_lower ~ '\m(kit[s]?|kits de)\M' THEN RETURN 'kit'; END IF;
  IF v_text_lower ~ '\m(kg|kilo[s]?|quilo[s]?)\M' THEN RETURN 'kg'; END IF;
  IF v_text_lower ~ '\m(fardo[s]?)\M' THEN RETURN 'fardo'; END IF;
  IF v_text_lower ~ '\m(milheiro[s]?|milheir[ãa]o)\M' THEN RETURN 'milheiro'; END IF;
  IF v_text_lower ~ '\m(unidade[s]?|und|un|pe[çc]a[s]?)\M' THEN RETURN 'unidade'; END IF;
  RETURN NULL;
END;
$function$
