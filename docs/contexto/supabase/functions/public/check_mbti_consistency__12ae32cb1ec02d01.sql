CREATE OR REPLACE FUNCTION public.check_mbti_consistency()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Only check if both type and relevant scores are present
    IF NEW.mbti_type IS NOT NULL THEN
        IF NEW.mbti_e_i_score IS NOT NULL AND 
           ((NEW.mbti_type LIKE 'E%' AND NEW.mbti_e_i_score < 50) OR (NEW.mbti_type LIKE 'I%' AND NEW.mbti_e_i_score > 50)) THEN
            RAISE EXCEPTION 'MBTI Type % inconsistent with E/I score %', NEW.mbti_type, NEW.mbti_e_i_score;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
