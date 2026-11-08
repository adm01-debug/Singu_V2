CREATE OR REPLACE FUNCTION public.move_to_pipeline_stage(p_company_id uuid, p_stage_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result    jsonb;
  affected  int;
  old_stage text;
  new_stage text;
BEGIN
  SELECT ps.name INTO old_stage
  FROM   companies c
  LEFT   JOIN pipeline_stages ps ON ps.id = c.pipeline_stage_id
  WHERE  c.id = p_company_id
    AND  (auth.uid() IS NULL OR c.user_id = auth.uid());

  SELECT name INTO new_stage FROM pipeline_stages WHERE id = p_stage_id;

  UPDATE companies
  SET pipeline_stage_id = p_stage_id
  WHERE id = p_company_id
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Empresa não encontrada ou acesso negado');
  ELSE
    result := jsonb_build_object(
      'success',    true,
      'company_id', p_company_id,
      'old_stage',  old_stage,
      'new_stage',  new_stage
    );
  END IF;
  RETURN result;
END;
$function$
