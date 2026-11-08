CREATE OR REPLACE FUNCTION public.predict_next_interaction(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
  v_avg_days_between NUMERIC;
  v_last_interaction TIMESTAMPTZ;
  v_preferred_channel TEXT;
  v_best_day INT;
  v_best_hour INT;
BEGIN
  -- Calcular intervalo médio entre interações
  WITH intervals AS (
    SELECT 
      created_at,
      LAG(created_at) OVER (ORDER BY created_at) as prev,
      EXTRACT(DAY FROM created_at - LAG(created_at) OVER (ORDER BY created_at)) as days_diff
    FROM interactions WHERE company_id = p_company_id
  )
  SELECT AVG(days_diff), MAX(created_at)
  INTO v_avg_days_between, v_last_interaction
  FROM intervals WHERE days_diff IS NOT NULL;
  
  -- Canal preferido
  SELECT channel INTO v_preferred_channel
  FROM interactions WHERE company_id = p_company_id
  GROUP BY channel ORDER BY COUNT(*) DESC LIMIT 1;
  
  -- Melhor dia da semana
  SELECT EXTRACT(DOW FROM created_at)::INT INTO v_best_day
  FROM interactions WHERE company_id = p_company_id AND sentiment = 'positivo'
  GROUP BY EXTRACT(DOW FROM created_at) ORDER BY COUNT(*) DESC LIMIT 1;
  
  -- Melhor hora
  SELECT EXTRACT(HOUR FROM created_at)::INT INTO v_best_hour
  FROM interactions WHERE company_id = p_company_id AND sentiment = 'positivo'
  GROUP BY EXTRACT(HOUR FROM created_at) ORDER BY COUNT(*) DESC LIMIT 1;
  
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'predicted_ideal_date', CASE 
      WHEN v_last_interaction IS NOT NULL AND v_avg_days_between IS NOT NULL 
      THEN v_last_interaction + (COALESCE(v_avg_days_between, 14) || ' days')::INTERVAL
      ELSE NOW() + INTERVAL '7 days'
    END,
    'avg_contact_interval_days', ROUND(COALESCE(v_avg_days_between, 14), 1),
    'preferred_channel', COALESCE(v_preferred_channel, 'whatsapp'),
    'best_day_of_week', v_best_day,
    'best_hour', v_best_hour,
    'days_since_last', EXTRACT(DAY FROM NOW() - v_last_interaction)::INT,
    'is_overdue', (NOW() - v_last_interaction) > (COALESCE(v_avg_days_between, 14) || ' days')::INTERVAL
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
