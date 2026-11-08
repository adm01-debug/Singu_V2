CREATE OR REPLACE FUNCTION public.simulate_redistribution(p_from_user_id uuid, p_batch_size integer DEFAULT 5000)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_target_users uuid[];
  v_total_available int;
  v_per_user int;
BEGIN
  SELECT ARRAY_AGG(id) INTO v_target_users
  FROM profiles WHERE is_active = true AND id != p_from_user_id;
  
  SELECT COUNT(*) INTO v_total_available
  FROM companies WHERE user_id = p_from_user_id AND deleted_at IS NULL;
  
  v_per_user := CEIL(LEAST(p_batch_size, v_total_available)::numeric / NULLIF(array_length(v_target_users, 1), 0));
  
  RETURN jsonb_build_object(
    'simulation', true,
    'from_user', p_from_user_id,
    'total_available', v_total_available,
    'target_users_count', array_length(v_target_users, 1),
    'batch_size', p_batch_size,
    'companies_per_user_approx', v_per_user,
    'batches_needed', CEIL(v_total_available::numeric / p_batch_size),
    'target_users', (
      SELECT jsonb_agg(jsonb_build_object('id', p.id, 'name', COALESCE(p.full_name, p.email)))
      FROM profiles p WHERE p.id = ANY(v_target_users)
    )
  );
END;
$function$
