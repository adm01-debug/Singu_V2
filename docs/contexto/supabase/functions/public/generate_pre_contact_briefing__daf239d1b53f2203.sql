CREATE OR REPLACE FUNCTION public.generate_pre_contact_briefing(p_contact_id uuid, p_contact_type character varying DEFAULT 'call'::character varying, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(briefing_id uuid, contact_name text, company_name text, disc_profile character varying, approach_tips text[], rapport_points text[], key_questions text[], anticipated_objections text[], recommended_approach text)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_id        UUID;
  v_name      TEXT;
  v_company   TEXT;
  v_disc      VARCHAR(10);
  v_tips      TEXT[] := ARRAY[]::TEXT[];
  v_rapport   TEXT[] := ARRAY[]::TEXT[];
  v_questions TEXT[];
  v_objections TEXT[];
  v_approach  TEXT;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
  PERFORM public.assert_self_user_id(p_user_id);

  SELECT COALESCE(c.full_name, c.first_name || ' ' || c.last_name),
         COALESCE(co.nome_fantasia, co.razao_social, co.nome_crm)
  INTO v_name, v_company
  FROM contacts c
  LEFT JOIN companies co ON c.company_id = co.id
  WHERE c.id = p_contact_id;

  SELECT primary_profile INTO v_disc
  FROM disc_assessments WHERE contact_id = p_contact_id AND is_current = true;

  IF v_disc = 'D' THEN
    v_tips := ARRAY['Seja direto', 'Foque em resultados', 'Evite detalhes'];
    v_approach := 'Direto, focado em resultados.';
  ELSIF v_disc = 'I' THEN
    v_tips := ARRAY['Seja entusiasta', 'Use histórias', 'Permita que fale'];
    v_approach := 'Social e entusiasta.';
  ELSIF v_disc = 'S' THEN
    v_tips := ARRAY['Seja paciente', 'Construa confiança', 'Não pressione'];
    v_approach := 'Calma e paciente.';
  ELSIF v_disc = 'C' THEN
    v_tips := ARRAY['Traga dados', 'Seja preciso', 'Documente'];
    v_approach := 'Analítica com dados.';
  ELSE
    v_tips := ARRAY['Observe as reações', 'Adapte conforme feedback'];
    v_approach := 'Observe e adapte.';
  END IF;

  SELECT array_agg(DISTINCT si.interest_name) INTO v_rapport
  FROM shared_interests si
  WHERE si.contact_id = p_contact_id AND si.is_active = true LIMIT 5;

  IF v_rapport IS NULL THEN v_rapport := ARRAY['Pergunte sobre o dia']; END IF;

  v_questions := ARRAY[
    'Qual o principal desafio atual?',
    'O que seria ideal?',
    'Qual o timeline?',
    'Quem mais decide?'
  ];

  SELECT array_agg(DISTINCT o.objection_text) INTO v_objections
  FROM objections o
  WHERE o.contact_id = p_contact_id AND o.is_resolved IS NOT TRUE LIMIT 3;

  IF v_objections IS NULL THEN v_objections := ARRAY['Preço', 'Prazo', 'Aprovação']; END IF;

  INSERT INTO pre_contact_briefings (
      contact_id, user_id, planned_contact_type, contact_summary,
      disc_profile, disc_approach_tips, rapport_points, key_questions,
      anticipated_objections, recommended_approach, primary_objective
  ) VALUES (
      p_contact_id, p_user_id, p_contact_type,
      'Contato: ' || v_name || ' | ' || v_company,
      v_disc, v_tips, v_rapport, v_questions,
      v_objections, v_approach, 'Avançar relacionamento'
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_name, v_company, v_disc,
                      v_tips, v_rapport, v_questions, v_objections, v_approach;
END;
$function$
