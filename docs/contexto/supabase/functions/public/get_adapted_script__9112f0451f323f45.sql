CREATE OR REPLACE FUNCTION public.get_adapted_script(p_script_id uuid, p_contact_id uuid)
 RETURNS TABLE(script_name character varying, section_name character varying, section_order integer, adapted_content text, delivery_tips text[], estimated_duration integer)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_disc VARCHAR(10); v_vak VARCHAR(20);
BEGIN
    SELECT primary_profile INTO v_disc FROM disc_assessments WHERE contact_id = p_contact_id AND is_current = true;
    SELECT primary_modality INTO v_vak FROM vak_profiles WHERE contact_id = p_contact_id;
    RETURN QUERY SELECT ss.script_name, sec.section_name, sec.section_order,
        COALESCE(CASE v_disc WHEN 'D' THEN sec.content_disc_d WHEN 'I' THEN sec.content_disc_i WHEN 'S' THEN sec.content_disc_s WHEN 'C' THEN sec.content_disc_c ELSE NULL END, CASE v_vak WHEN 'visual' THEN sec.content_vak_visual WHEN 'auditivo' THEN sec.content_vak_auditivo WHEN 'cinestesico' THEN sec.content_vak_cinestesico ELSE NULL END, sec.content_template),
        sec.delivery_tips, sec.estimated_duration_seconds
    FROM sales_scripts ss JOIN script_sections sec ON ss.id = sec.script_id WHERE ss.id = p_script_id AND sec.is_active = true ORDER BY sec.section_order;
END; $function$
