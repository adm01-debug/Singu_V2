CREATE OR REPLACE FUNCTION public.create_competitor(p_name text, p_website text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_strengths text[] DEFAULT NULL::text[], p_weaknesses text[] DEFAULT NULL::text[], p_pricing_tier text DEFAULT 'medium'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_competitor_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO competitors (name, website, description, strengths, weaknesses, pricing_tier)
  VALUES (p_name, p_website, p_description, p_strengths, p_weaknesses, p_pricing_tier)
  RETURNING id INTO v_competitor_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'competitor_id', v_competitor_id
  );
END;
$function$
