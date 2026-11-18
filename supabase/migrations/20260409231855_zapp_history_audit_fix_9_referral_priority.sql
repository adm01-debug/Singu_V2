-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409231855
-- nome:   zapp_history_audit_fix_9_referral_priority

CREATE OR REPLACE FUNCTION zapp_history.detect_referral_source(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
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
$fn$;

-- Backfill teste E2E
UPDATE zapp_history.messages m
SET referral_source = zapp_history.detect_referral_source(m.content)
FROM public.contacts ct
WHERE ct.id = m.contact_id AND ct.first_name = 'Audit E2E 01';

SELECT ct.first_name, m.referral_source, m.lead_score
FROM zapp_history.messages m
JOIN public.contacts ct ON ct.id = m.contact_id
WHERE ct.first_name = 'Audit E2E 01';
