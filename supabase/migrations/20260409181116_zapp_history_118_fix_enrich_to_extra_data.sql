-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409181116
-- nome:   zapp_history_118_fix_enrich_to_extra_data

CREATE OR REPLACE FUNCTION zapp_history.auto_enrich_contact()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE
  v_extra JSONB;
  v_email TEXT;
  v_city TEXT;
  v_state TEXT;
  v_site TEXT;
  v_insta TEXT;
  v_enrichment JSONB := '{}'::jsonb;
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_email := NEW.contact_info_extracted->>'email';
  v_site := NEW.contact_info_extracted->>'site';
  v_insta := NEW.contact_info_extracted->>'instagram';
  v_city := NEW.location_extracted->>'city';
  v_state := NEW.location_extracted->>'state';

  IF v_email IS NOT NULL THEN v_enrichment := v_enrichment || jsonb_build_object('email', v_email); END IF;
  IF v_site  IS NOT NULL THEN v_enrichment := v_enrichment || jsonb_build_object('website', v_site); END IF;
  IF v_insta IS NOT NULL THEN v_enrichment := v_enrichment || jsonb_build_object('instagram', v_insta); END IF;
  IF v_city  IS NOT NULL THEN v_enrichment := v_enrichment || jsonb_build_object('city', v_city); END IF;
  IF v_state IS NOT NULL THEN v_enrichment := v_enrichment || jsonb_build_object('state', v_state); END IF;

  IF v_enrichment <> '{}'::jsonb THEN
    v_enrichment := v_enrichment || jsonb_build_object('enriched_by', 'zapp_history_nlp', 'enriched_at', NOW());

    SELECT extra_data INTO v_extra FROM public.contacts WHERE id = NEW.contact_id;

    UPDATE public.contacts
    SET extra_data = COALESCE(v_extra, '{}'::jsonb) || jsonb_build_object('zapp_enriched', v_enrichment),
        updated_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$fn$;
