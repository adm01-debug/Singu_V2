-- 🏁 MIGRATION
-- Description: RPC get_contact_sidebar_by_phone — payload único do painel
--              "Detalhes do Contato" do Zapp Web V2 (3 seções: Profissional,
--              Pessoal, Perfil Singu). Contrato: docs/design do Zapp_Web_V2
--              PLANO_SIDEBAR_CONTATO_3_SECOES_100_ETAPAS_2026-10-02.md §3.1.
-- Author: Devin (sessão ZAPP WEB V2 - DETALHES CONTATO)
-- Date: 2026-10-02
--
-- Read-only (STABLE), SECURITY DEFINER, execução exclusiva de service_role
-- (a edge crm-integration do Zapp chama com a service key do projeto
--  pgxfvjmuubtbowutlide). Sem CPF, endereço, notas internas nem assigned_by_id.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_contact_sidebar_by_phone(p_phone text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_digits   text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_national text;
  v_contact  public.contacts%ROWTYPE;
  v_behavior jsonb;
  v_prof     jsonb;
  v_pers     jsonb;
  v_singu    jsonb;
  v_assessed timestamptz;
BEGIN
  IF v_digits = '' THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  -- Normalização igual a get_contact_intelligence_by_phone: dígitos, sem DDI 55.
  -- '5511...' -> '11...'; cobre ambos os formatos com o terceiro candidato.
  v_national := CASE
    WHEN v_digits LIKE '55%' AND length(v_digits) > 11 THEN substr(v_digits, 3)
    ELSE v_digits
  END;

  -- contact_phones é a fonte canônica (numero_normalizado / numero_e164 / numero).
  SELECT c.* INTO v_contact
  FROM public.contact_phones cp
  JOIN public.contacts c ON c.id = cp.contact_id
  WHERE cp.numero_normalizado IN (v_digits, v_national, '55' || v_national)
     OR replace(coalesce(cp.numero_e164, ''), '+', '') IN (v_digits, v_national, '55' || v_national)
     OR regexp_replace(coalesce(cp.numero, ''), '\D', '', 'g') IN (v_digits, v_national, '55' || v_national)
  ORDER BY cp.is_whatsapp DESC NULLS LAST,
           cp.is_primary DESC NULLS LAST,
           cp.confiabilidade DESC NULLS LAST
  LIMIT 1;

  -- Fallback: colunas legadas phone/whatsapp do próprio contacts
  -- (contatos importados que ainda não têm linha em contact_phones).
  IF v_contact.id IS NULL THEN
    SELECT c.* INTO v_contact
    FROM public.contacts c
    WHERE regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') IN (v_digits, v_national, '55' || v_national)
       OR regexp_replace(coalesce(c.whatsapp, ''), '\D', '', 'g') IN (v_digits, v_national, '55' || v_national)
    ORDER BY c.created_at ASC
    LIMIT 1;
  END IF;

  -- Duplicata aponta para o canônico (1 hop); apagado não responde.
  IF v_contact.id IS NOT NULL
     AND v_contact.deleted_at IS NULL
     AND v_contact.is_duplicate IS TRUE
     AND v_contact.duplicate_of IS NOT NULL THEN
    SELECT c.* INTO v_contact
    FROM public.contacts c
    WHERE c.id = v_contact.duplicate_of;
  END IF;

  IF v_contact.id IS NULL
     OR v_contact.deleted_at IS NOT NULL
     OR v_contact.is_duplicate IS TRUE THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  v_behavior := coalesce(v_contact.behavior, '{}'::jsonb);

  SELECT jsonb_build_object(
    'whatsapp', (
      SELECT jsonb_build_object(
        'numero_e164', cp.numero_e164,
        'numero', cp.numero,
        'phone_type', cp.phone_type
      )
      FROM public.contact_phones cp
      WHERE cp.contact_id = v_contact.id AND cp.is_whatsapp IS TRUE
      ORDER BY cp.is_primary DESC NULLS LAST, cp.confiabilidade DESC NULLS LAST
      LIMIT 1
    ),
    'email_corporativo', (
      SELECT jsonb_build_object('email', ce.email, 'is_verified', ce.is_verified)
      FROM public.contact_emails ce
      WHERE ce.contact_id = v_contact.id AND ce.email_type = 'corporativo'
      ORDER BY ce.is_primary DESC NULLS LAST, ce.is_verified DESC NULLS LAST
      LIMIT 1
    ),
    'empresa', (
      SELECT jsonb_build_object(
        'id', co.id,
        'nome', coalesce(co.nome_fantasia, co.nome_crm, co.name),
        'logo_url', co.logo_url
      )
      FROM public.companies co
      WHERE co.id = v_contact.company_id AND co.deleted_at IS NULL
    ),
    'departamento', v_contact.departamento,
    'cargo', coalesce(v_contact.cargo, v_contact.role_title)
  ) INTO v_prof;

  SELECT jsonb_build_object(
    'social', coalesce((
      SELECT jsonb_agg(
        jsonb_build_object('plataforma', s.plataforma, 'handle', s.handle, 'url', s.url)
        ORDER BY s.plataforma
      )
      FROM (
        SELECT DISTINCT ON (sm.plataforma) sm.plataforma, sm.handle, sm.url
        FROM public.contact_social_media sm
        WHERE sm.contact_id = v_contact.id
          AND sm.is_active IS TRUE
          AND sm.plataforma IN ('instagram', 'linkedin', 'facebook', 'x')
        ORDER BY sm.plataforma, sm.updated_at DESC NULLS LAST
      ) s
    ), '[]'::jsonb),
    'data_nascimento', coalesce(v_contact.data_nascimento::text, v_contact.birthday::text)
  ) INTO v_pers;

  SELECT max(x.updated_at) INTO v_assessed
  FROM (
    SELECT max(updated_at) AS updated_at FROM public.contact_behavior WHERE contact_id = v_contact.id
    UNION ALL SELECT max(updated_at) FROM public.contact_personality WHERE contact_id = v_contact.id
    UNION ALL SELECT max(updated_at) FROM public.contact_metaprograms WHERE contact_id = v_contact.id
    UNION ALL SELECT max(updated_at) FROM public.contact_rapport_strategy WHERE contact_id = v_contact.id
    UNION ALL SELECT max(updated_at) FROM public.contact_objection_scripts WHERE contact_id = v_contact.id
    UNION ALL SELECT max(updated_at) FROM public.contact_decision_making WHERE contact_id = v_contact.id
    UNION ALL SELECT max(updated_at) FROM public.contact_influence WHERE contact_id = v_contact.id
    UNION ALL SELECT max(updated_at) FROM public.contact_business_context WHERE contact_id = v_contact.id
  ) x;

  SELECT jsonb_build_object(
    'disc', CASE
      WHEN cb.disc_primary IS NOT NULL OR v_behavior->>'discProfile' IS NOT NULL THEN
        jsonb_build_object(
          'primary', coalesce(cb.disc_primary, v_behavior->>'discProfile'),
          'blend', v_behavior->>'discBlend',
          'confidence', coalesce(cb.disc_confidence, CASE WHEN v_behavior->>'discConfidence' ~ '^\d{1,3}$' THEN (v_behavior->>'discConfidence')::int END),
          'notes', cb.disc_notes
        )
    END,
    'vak', CASE
      WHEN coalesce(cb.vak_primary, v_behavior->'vakProfile'->>'primary') IS NOT NULL THEN
        jsonb_build_object(
          'primary', coalesce(cb.vak_primary, v_behavior->'vakProfile'->>'primary'),
          'visual', coalesce(rs.visual_preference_score,
                             CASE WHEN v_behavior->'vakProfile'->'scores'->>'visual' ~ '^\d{1,3}$' THEN (v_behavior->'vakProfile'->'scores'->>'visual')::int END),
          'auditory', coalesce(rs.auditory_preference_score,
                               CASE WHEN v_behavior->'vakProfile'->'scores'->>'auditory' ~ '^\d{1,3}$' THEN (v_behavior->'vakProfile'->'scores'->>'auditory')::int END,
                                    CASE WHEN v_behavior->'vakProfile'->'scores'->>'auditivo' ~ '^\d{1,3}$' THEN (v_behavior->'vakProfile'->'scores'->>'auditivo')::int END),
          'kinesthetic', coalesce(rs.kinesthetic_preference_score,
                                  CASE WHEN v_behavior->'vakProfile'->'scores'->>'kinesthetic' ~ '^\d{1,3}$' THEN (v_behavior->'vakProfile'->'scores'->>'kinesthetic')::int END,
                                       CASE WHEN v_behavior->'vakProfile'->'scores'->>'cinestesico' ~ '^\d{1,3}$' THEN (v_behavior->'vakProfile'->'scores'->>'cinestesico')::int END)
        )
    END,
    'big_five', CASE
      WHEN cpers.id IS NOT NULL AND (
        cpers.big_five_openness IS NOT NULL OR cpers.big_five_conscientiousness IS NOT NULL OR
        cpers.big_five_extraversion IS NOT NULL OR cpers.big_five_agreeableness IS NOT NULL OR
        cpers.big_five_neuroticism IS NOT NULL OR cpers.big_five_confidence IS NOT NULL
      ) THEN
        jsonb_build_object(
          'openness', cpers.big_five_openness,
          'conscientiousness', cpers.big_five_conscientiousness,
          'extraversion', cpers.big_five_extraversion,
          'agreeableness', cpers.big_five_agreeableness,
          'neuroticism', cpers.big_five_neuroticism,
          'confidence', cpers.big_five_confidence
        )
    END,
    'mbti', CASE
      WHEN cpers.mbti_type IS NOT NULL OR cpers.mbti_e_i_score IS NOT NULL OR
           cpers.mbti_s_n_score IS NOT NULL OR cpers.mbti_t_f_score IS NOT NULL OR
           cpers.mbti_j_p_score IS NOT NULL THEN
        jsonb_build_object(
          'type', cpers.mbti_type,
          'e_i', cpers.mbti_e_i_score,
          's_n', cpers.mbti_s_n_score,
          't_f', cpers.mbti_t_f_score,
          'j_p', cpers.mbti_j_p_score
        )
    END,
    'enneagram', CASE
      WHEN cpers.enneagram_type IS NOT NULL OR cpers.enneagram_scores IS NOT NULL THEN
        jsonb_build_object(
          'type', cpers.enneagram_type,
          'wing', cpers.enneagram_wing,
          'scores', cpers.enneagram_scores
        )
    END,
    'temperament', CASE
      WHEN coalesce(cpers.temperament_primary, v_behavior->'temperamentProfile'->>'primary') IS NOT NULL THEN
        jsonb_build_object(
          'primary', coalesce(cpers.temperament_primary, v_behavior->'temperamentProfile'->>'primary'),
          'secondary', coalesce(cpers.temperament_secondary, v_behavior->'temperamentProfile'->>'secondary'),
          'notes', cpers.temperament_notes
        )
    END,
    'metaprograms', CASE
      WHEN cm.id IS NOT NULL THEN
        jsonb_build_object(
          'toward', cm.toward_score,
          'away_from', cm.away_from_score,
          'internal', cm.internal_score,
          'external', cm.external_score,
          'options', cm.options_score,
          'procedures', cm.procedures_score,
          'proactive', cm.proactive_score,
          'reactive', cm.reactive_score,
          'global', cm.global_score,
          'detail', cm.detail_score,
          'notes', cm.notes
        )
    END,
    'fears_motivation', CASE
      WHEN cb.main_fear IS NOT NULL OR cb.motivation_primary IS NOT NULL OR
           cb.current_pressure IS NOT NULL OR cb.professional_goals IS NOT NULL THEN
        jsonb_build_object(
          'main_fear', cb.main_fear,
          'motivation_primary', cb.motivation_primary,
          'current_pressure', cb.current_pressure,
          'professional_goals', cb.professional_goals
        )
    END,
    'decision', CASE
      WHEN cdm.id IS NOT NULL OR v_behavior->>'decisionCriteria' IS NOT NULL OR
           v_behavior->>'needsApproval' IS NOT NULL THEN
        jsonb_build_object(
          'speed', cdm.decision_speed,
          'criteria', coalesce(
            to_jsonb(cdm.decision_criteria),
            CASE WHEN jsonb_typeof(v_behavior->'decisionCriteria') = 'array' THEN v_behavior->'decisionCriteria' END
          ),
          'needs_approval', coalesce(
            cdm.needs_approval,
            CASE WHEN jsonb_typeof(v_behavior->'needsApproval') = 'boolean' THEN (v_behavior->>'needsApproval')::boolean END
          ),
          'approver_name', (SELECT coalesce(c2.full_name, nullif(trim(concat_ws(' ', c2.first_name, c2.last_name)), '')) FROM public.contacts c2 WHERE c2.id = cdm.approver_id)
        )
    END,
    'budget', CASE
      WHEN cdm.budget_authority IS NOT NULL OR cinf.decision_role IS NOT NULL OR
           cinf.decision_power IS NOT NULL OR v_behavior->>'decisionPower' IS NOT NULL THEN
        jsonb_build_object(
          'authority', cdm.budget_authority,
          'decision_role', cinf.decision_role,
          'decision_power', coalesce(
            cinf.decision_power,
            CASE WHEN v_behavior->>'decisionPower' ~ '^\d{1,2}$' THEN (v_behavior->>'decisionPower')::int END
          )
        )
    END,
    'influencers', coalesce((
      SELECT jsonb_agg(jsonb_build_object('contact_id', i.contact_id, 'name', i.name, 'cargo', i.cargo))
      FROM (
        SELECT ic.id AS contact_id,
               coalesce(ic.full_name, nullif(trim(concat_ws(' ', ic.first_name, ic.last_name)), '')) AS name,
               ic.cargo AS cargo
        FROM (SELECT unnest(cinf.influencer_ids) AS id) ids
        JOIN public.contacts ic ON ic.id = ids.id AND ic.deleted_at IS NULL
        LIMIT 5
      ) i
    ), '[]'::jsonb),
    'rapport', CASE
      WHEN rs.id IS NOT NULL THEN
        jsonb_build_object(
          'pacing_speed', rs.pacing_speed,
          'voice_tone_preferred', rs.voice_tone_preferred,
          'mirroring_technique', rs.mirroring_technique,
          'preferred_triggers', coalesce(to_jsonb(rs.preferred_triggers), '[]'::jsonb),
          'emotional_anchors', coalesce(to_jsonb(rs.emotional_anchors), '[]'::jsonb),
          'resistance_triggers', coalesce(to_jsonb(rs.resistance_triggers), '[]'::jsonb),
          'notes', rs.notes,
          'channel_scores', jsonb_build_object(
            'visual', rs.visual_preference_score,
            'auditory', rs.auditory_preference_score,
            'kinesthetic', rs.kinesthetic_preference_score,
            'digital', rs.digital_preference_score
          )
        )
    END,
    'objection_scripts', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'objection_type', o.objection_type,
        'script_content', o.script_content,
        'neurological_bias', o.neurological_bias,
        'effectiveness_score', o.effectiveness_score
      ))
      FROM (
        SELECT os.objection_type, os.script_content, os.neurological_bias, os.effectiveness_score
        FROM public.contact_objection_scripts os
        WHERE os.contact_id = v_contact.id
        ORDER BY os.effectiveness_score DESC NULLS LAST, os.created_at DESC
        LIMIT 10
      ) o
    ), '[]'::jsonb),
    'assessed_at', v_assessed
  ) INTO v_singu
  FROM (SELECT v_contact.id AS contact_id) base
  LEFT JOIN public.contact_behavior cb ON cb.contact_id = base.contact_id
  LEFT JOIN public.contact_personality cpers ON cpers.contact_id = base.contact_id
  LEFT JOIN public.contact_metaprograms cm ON cm.contact_id = base.contact_id
  LEFT JOIN public.contact_rapport_strategy rs ON rs.contact_id = base.contact_id
  LEFT JOIN public.contact_decision_making cdm ON cdm.contact_id = base.contact_id
  LEFT JOIN public.contact_influence cinf ON cinf.contact_id = base.contact_id;

  RETURN jsonb_build_object(
    'found', true,
    'contact_id', v_contact.id,
    'professional', v_prof,
    'personal', v_pers,
    'singu_profile', v_singu
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_contact_sidebar_by_phone(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_contact_sidebar_by_phone(text) FROM anon;
REVOKE ALL ON FUNCTION public.get_contact_sidebar_by_phone(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_contact_sidebar_by_phone(text) TO service_role;

COMMIT;

-- DOWN MIGRATION (Rollback)
/*
BEGIN;
DROP FUNCTION IF EXISTS public.get_contact_sidebar_by_phone(text);
COMMIT;
*/
