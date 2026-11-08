CREATE OR REPLACE FUNCTION public.aggregate_nlp_to_company(p_company_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    UPDATE public.companies
    SET 
        vak_dominant = (
            SELECT vak_dominant
            FROM public.contacts
            WHERE company_id = p_company_id AND vak_dominant IS NOT NULL
            GROUP BY vak_dominant
            ORDER BY COUNT(*) DESC, vak_dominant ASC
            LIMIT 1
        ),
        motivation_direction = (
            SELECT motivation_direction
            FROM public.contacts
            WHERE company_id = p_company_id AND motivation_direction IS NOT NULL
            GROUP BY motivation_direction
            ORDER BY COUNT(*) DESC, motivation_direction ASC
            LIMIT 1
        ),
        working_style = (
            SELECT working_style
            FROM public.contacts
            WHERE company_id = p_company_id AND working_style IS NOT NULL
            GROUP BY working_style
            ORDER BY COUNT(*) DESC, working_style ASC
            LIMIT 1
        )
    WHERE id = p_company_id;
END;
$function$
