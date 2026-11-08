CREATE OR REPLACE FUNCTION public.get_best_practices()
 RETURNS TABLE(practice text, impact text, adoption_rate numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 'Follow-up em até 24h'::text, 'Alto'::text, 
    ROUND((SELECT COUNT(*) FROM interactions WHERE data_interacao >= NOW() - interval '90 days' AND follow_up_date IS NOT NULL)::numeric / NULLIF((SELECT COUNT(*) FROM interactions WHERE data_interacao >= NOW() - interval '90 days'), 0) * 100, 1)
  UNION ALL
  SELECT 'Registrar todas interações', 'Alto',
    ROUND((SELECT COUNT(DISTINCT user_id) FROM interactions WHERE data_interacao >= NOW() - interval '7 days')::numeric / NULLIF((SELECT COUNT(*) FROM profiles WHERE is_active = true), 0) * 100, 1)
  UNION ALL
  SELECT 'Atualizar probabilidade do deal', 'Médio',
    ROUND((SELECT COUNT(*) FROM deals WHERE probabilidade IS NOT NULL AND probabilidade != 50)::numeric / NULLIF((SELECT COUNT(*) FROM deals), 0) * 100, 1);
$function$
