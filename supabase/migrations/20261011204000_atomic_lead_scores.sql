-- A fila só é concluída depois de gravar pontuação e histórico do contato.
CREATE OR REPLACE FUNCTION public.persist_lead_score_results(
  _user_id uuid, _scores jsonb, _history jsonb DEFAULT '[]', _queue_ids uuid[] DEFAULT '{}'
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' OR _user_id IS NULL THEN
    RAISE EXCEPTION 'Operação reservada ao servidor autenticado' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(_scores) IS DISTINCT FROM 'array' OR jsonb_typeof(_history) IS DISTINCT FROM 'array'
    OR jsonb_array_length(_scores) > 200 OR jsonb_array_length(_history) > 200 THEN
    RAISE EXCEPTION 'Lote inválido' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(_scores || _history) r
    WHERE (r->>'user_id')::uuid IS DISTINCT FROM _user_id
      OR NOT EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = (r->>'contact_id')::uuid AND c.user_id = _user_id)
  ) THEN
    RAISE EXCEPTION 'Contato indisponível' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.lead_scores (user_id, contact_id, fit_score, engagement_score, intent_score,
    relationship_score, total_score, grade, factors, previous_score, calculated_at, last_calculated_at)
  SELECT _user_id, r.contact_id, r.fit_score, r.engagement_score, r.intent_score,
    r.relationship_score, r.total_score, r.grade, r.factors, r.previous_score, r.calculated_at, r.last_calculated_at
  FROM jsonb_populate_recordset(NULL::public.lead_scores, _scores) r
  ON CONFLICT (user_id, contact_id) DO UPDATE SET
    fit_score = EXCLUDED.fit_score, engagement_score = EXCLUDED.engagement_score,
    intent_score = EXCLUDED.intent_score, relationship_score = EXCLUDED.relationship_score,
    total_score = EXCLUDED.total_score, grade = EXCLUDED.grade, factors = EXCLUDED.factors,
    previous_score = EXCLUDED.previous_score,
    calculated_at = EXCLUDED.calculated_at, last_calculated_at = EXCLUDED.last_calculated_at;

  INSERT INTO public.lead_score_history (user_id, contact_id, company_id, total_score, grade,
    fit_score, engagement_score, intent_score, relationship_score, factors, recorded_at)
  SELECT _user_id, r.contact_id, NULL, r.total_score, r.grade, r.fit_score,
    r.engagement_score, r.intent_score, r.relationship_score, r.factors, r.recorded_at
  FROM jsonb_populate_recordset(NULL::public.lead_score_history, _history) r;

  UPDATE public.lead_score_recompute_queue q SET processed_at = now()
  WHERE q.user_id = _user_id AND q.id = ANY(_queue_ids)
    AND EXISTS (SELECT 1 FROM jsonb_array_elements(_scores) r WHERE (r->>'contact_id')::uuid = q.contact_id);
END;
$function$;
REVOKE ALL ON FUNCTION public.persist_lead_score_results(uuid, jsonb, jsonb, uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.persist_lead_score_results(uuid, jsonb, jsonb, uuid[]) TO service_role;

-- DOWN MIGRATION (Rollback): reimplantar primeiro o produtor anterior compatível com o schema.
-- DROP FUNCTION IF EXISTS public.persist_lead_score_results(uuid, jsonb, jsonb, uuid[]);
-- Pontuações e históricos existentes permanecem intactos; a fila não processada pode ser reexecutada.
