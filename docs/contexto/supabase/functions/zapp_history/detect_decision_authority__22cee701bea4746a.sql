CREATE OR REPLACE FUNCTION zapp_history.detect_decision_authority(p_text text, p_speaker_role text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_text_lower TEXT;
  v_level TEXT;
  v_signals TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('level','indefinido'); END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '(eu decido|decis[ãa]o [ée] minha|sou eu que (aprovo|fecho|libero)|tenho autonomia|posso fechar (agora|hoje)|sou o decisor)' THEN
    v_signals := array_append(v_signals,'decisor_final');
  END IF;
  IF v_text_lower ~ '(preciso (consultar|alinhar com|falar com|apresentar (pro|para))|vou (passar|repassar|levar) (pr[oa]|para)|aguardar aprova[çc][ãa]o|depende do chefe|meu gestor)' THEN
    v_signals := array_append(v_signals,'precisa_aprovacao');
  END IF;
  IF v_text_lower ~ '(comit[êe]|colegiado|diretoria vai decidir|conselho|v[áa]rias pessoas envolvidas)' THEN
    v_signals := array_append(v_signals,'decisao_coletiva');
  END IF;

  v_level := CASE
    WHEN 'decisor_final' = ANY(v_signals) THEN 'total'
    WHEN p_speaker_role = 'decisor_dono' THEN 'total'
    WHEN p_speaker_role IN ('gestor','comprador') THEN 'parcial'
    WHEN 'precisa_aprovacao' = ANY(v_signals) OR p_speaker_role = 'intermediario' THEN 'nenhuma'
    WHEN 'decisao_coletiva' = ANY(v_signals) THEN 'compartilhada'
    ELSE 'indefinido'
  END;

  RETURN jsonb_build_object('level', v_level, 'signals', to_jsonb(v_signals));
END;
$function$
