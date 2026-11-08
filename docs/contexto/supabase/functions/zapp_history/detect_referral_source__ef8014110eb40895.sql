CREATE OR REPLACE FUNCTION zapp_history.detect_referral_source(p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_text_lower TEXT;
  v_source TEXT := NULL;
  v_referrer TEXT := NULL;
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('source',null); END IF;
  v_text_lower := lower(p_text);

  -- 1º PRIORIDADE: Indicação pessoal (converte 5-8x mais, precisa pegar antes)
  IF v_text_lower ~ '(indica[çc][ãa]o d[aeo]|me indicou|fui indicad[oa]|indicado pel|amigo (me )?(falou|indicou)|colega (indicou|falou))' THEN
    v_source := 'indicacao_pessoa';
    v_referrer := substring(v_text_lower FROM '(?:indica[çc][ãa]o d[aeo]|indicou|indicado pelo?)\s+([a-záéêç]+(?:\s+[a-záéêç]+)?)');
  -- 2º: cliente recorrente declarado
  ELSIF v_text_lower ~ '(j[áa] comprei aqui|sou cliente|cliente antig[oa]|j[áa] fiz pedido)' THEN v_source := 'cliente_recorrente';
  -- 3º: Canais digitais específicos
  ELSIF v_text_lower ~ '(instagram|insta|perfil de voc[êe]s)' THEN v_source := 'instagram';
  ELSIF v_text_lower ~ '(linkedin)' THEN v_source := 'linkedin';
  ELSIF v_text_lower ~ '(tiktok|tik tok)' THEN v_source := 'tiktok';
  ELSIF v_text_lower ~ '(youtube|canal de)' THEN v_source := 'youtube';
  ELSIF v_text_lower ~ '(facebook|\mface\M)' THEN v_source := 'facebook';
  -- 4º: Pesquisa
  ELSIF v_text_lower ~ '(google|pesquisei no google|busca do google)' THEN v_source := 'google_organico';
  ELSIF v_text_lower ~ '(an[úu]ncio|anuncio|vi o an[úu]ncio|propaganda)' THEN v_source := 'ads_pago';
  ELSIF v_text_lower ~ '(site de voc[êe]s|seu site)' THEN v_source := 'site_proprio';
  -- 5º (último): evento físico só se não bateu em nada acima
  ELSIF v_text_lower ~ '(encontrei (voc[êe]s )?(na )?feira|(estive|estava) na feira|expo|congresso|stand de voc[êe]s)' THEN v_source := 'evento_fisico';
  END IF;

  IF v_source IS NULL THEN RETURN jsonb_build_object('source', null); END IF;
  RETURN jsonb_build_object('source', v_source, 'referrer', v_referrer);
END;
$function$
