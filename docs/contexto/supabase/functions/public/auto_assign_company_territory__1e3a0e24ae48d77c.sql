CREATE OR REPLACE FUNCTION public.auto_assign_company_territory(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uf text;
  v_territory_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  SELECT uf INTO v_uf FROM companies WHERE id = p_company_id;
  IF v_uf IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Empresa sem UF');
  END IF;
  
  SELECT id INTO v_territory_id FROM territories WHERE v_uf = ANY(states) AND is_active = true LIMIT 1;
  IF v_territory_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum território para UF ' || v_uf);
  END IF;
  
  INSERT INTO company_territories (company_id, territory_id)
  VALUES (p_company_id, v_territory_id)
  ON CONFLICT (company_id) DO UPDATE SET territory_id = EXCLUDED.territory_id, assigned_at = NOW();
  
  RETURN jsonb_build_object('success', true, 'territory_id', v_territory_id);
END;
$function$
