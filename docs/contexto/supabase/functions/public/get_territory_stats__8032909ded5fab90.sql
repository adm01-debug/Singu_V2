CREATE OR REPLACE FUNCTION public.get_territory_stats(p_territory_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_territory territories%ROWTYPE;
  v_company_count int;
  v_with_interaction int;
  v_total_value numeric;
BEGIN
  SELECT * INTO v_territory FROM territories WHERE id = p_territory_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Território não encontrado'); END IF;
  
  SELECT COUNT(*), COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id))
  INTO v_company_count, v_with_interaction
  FROM companies c
  JOIN company_addresses ca ON ca.company_id = c.id
  WHERE ca.estado = ANY(v_territory.states) OR ca.cidade = ANY(v_territory.cities);
  
  SELECT COALESCE(SUM(d.valor), 0) INTO v_total_value
  FROM deals d
  JOIN companies c ON c.id = d.company_id
  JOIN company_addresses ca ON ca.company_id = c.id
  WHERE (ca.estado = ANY(v_territory.states) OR ca.cidade = ANY(v_territory.cities))
    AND d.status = 'ganho';
  
  RETURN jsonb_build_object(
    'territory_id', p_territory_id,
    'name', v_territory.name,
    'states', v_territory.states,
    'cities', v_territory.cities,
    'total_companies', v_company_count,
    'with_interactions', v_with_interaction,
    'total_revenue', v_total_value
  );
END;
$function$
