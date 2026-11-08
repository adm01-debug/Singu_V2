CREATE OR REPLACE FUNCTION public.set_sales_goal(p_user_id uuid, p_goal_type text, p_target_value integer, p_period_start date DEFAULT (date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone))::date, p_period_end date DEFAULT ((date_trunc('month'::text, (CURRENT_DATE)::timestamp with time zone) + '1 mon -1 days'::interval))::date)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_goal_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Verifica se já existe meta para o período
  DELETE FROM sales_goals 
  WHERE user_id = p_user_id 
    AND goal_type = p_goal_type 
    AND period_start = p_period_start;
  
  INSERT INTO sales_goals (user_id, goal_type, target_value, period_start, period_end)
  VALUES (p_user_id, p_goal_type, p_target_value, p_period_start, p_period_end)
  RETURNING id INTO v_goal_id;
  
  RETURN v_goal_id;
EXCEPTION WHEN undefined_table THEN
  -- Cria tabela se não existir
  CREATE TABLE IF NOT EXISTS sales_goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    goal_type text NOT NULL,
    target_value int NOT NULL,
    current_value int DEFAULT 0,
    period_start date NOT NULL,
    period_end date NOT NULL,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
  );
  
  INSERT INTO sales_goals (user_id, goal_type, target_value, period_start, period_end)
  VALUES (p_user_id, p_goal_type, p_target_value, p_period_start, p_period_end)
  RETURNING id INTO v_goal_id;
  
  RETURN v_goal_id;
END;
$function$
