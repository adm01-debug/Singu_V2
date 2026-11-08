CREATE OR REPLACE FUNCTION public.determine_relationship_stage(p_contact_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_score INTEGER;
    v_has_purchase BOOLEAN;
    v_stage TEXT;
BEGIN
    SELECT relationship_score INTO v_score FROM contacts WHERE id = p_contact_id;
    
    SELECT EXISTS (
        SELECT 1 FROM purchase_history WHERE contact_id = p_contact_id
    ) INTO v_has_purchase;
    
    v_stage := CASE
        WHEN v_score >= 80 AND v_has_purchase THEN 'advocate'
        WHEN v_score >= 70 AND v_has_purchase THEN 'loyal_customer'
        WHEN v_has_purchase THEN 'customer'
        WHEN v_score >= 60 THEN 'negotiation'
        WHEN v_score >= 40 THEN 'opportunity'
        WHEN v_score >= 20 THEN 'qualified_lead'
        WHEN v_score > 0 THEN 'prospect'
        ELSE 'unknown'
    END;
    
    UPDATE contacts SET relationship_stage = v_stage WHERE id = p_contact_id;
    
    RETURN v_stage;
END;
$function$
