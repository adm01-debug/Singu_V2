CREATE OR REPLACE FUNCTION public.validate_behavioral_consistency(p_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
    v_issues TEXT[] := '{}';
    v_behavior RECORD;
    v_influence RECORD;
BEGIN
    SELECT * INTO v_behavior FROM public.contact_behavior WHERE contact_id = p_contact_id;
    SELECT * INTO v_influence FROM public.contact_influence WHERE contact_id = p_contact_id;

    IF v_behavior.id IS NOT NULL THEN
        IF v_behavior.disc_primary IS NOT NULL AND (v_behavior.disc_confidence IS NULL OR v_behavior.disc_confidence = 0) THEN
            v_issues := array_append(v_issues, 'Perfil DISC definido mas confiança é zero ou nula');
        END IF;
    END IF;

    IF v_influence.id IS NOT NULL THEN
        IF v_influence.decision_power > 8 AND (v_influence.support_level IS NULL) THEN
            v_issues := array_append(v_issues, 'Alto poder de decisão mas nível de suporte não mapeado');
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'contact_id', p_contact_id,
        'is_consistent', array_length(v_issues, 1) IS NULL,
        'issues', v_issues,
        'timestamp', now()
    );
END;
$function$
