CREATE OR REPLACE FUNCTION public.get_channel_effectiveness_analysis(p_user_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN (
    SELECT jsonb_build_object(
      'channels', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object(
          'channel', channel,
          'total', total,
          'positive', positive,
          'negative', negative,
          'neutral', total - positive - negative,
          'positive_rate', ROUND(positive::numeric / NULLIF(total, 0) * 100, 2),
          'effectiveness_score', ROUND((positive::numeric * 2 - negative::numeric) / NULLIF(total, 0) * 50 + 50, 2)
        ) ORDER BY total DESC), '[]'::jsonb)
        FROM (
          SELECT 
            channel,
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE sentiment = 'positive') as positive,
            COUNT(*) FILTER (WHERE sentiment = 'negative') as negative
          FROM interactions
          WHERE channel IS NOT NULL
            AND created_at >= NOW() - (p_days || ' days')::interval
            AND (p_user_id IS NULL OR user_id = p_user_id)
          GROUP BY channel
        ) t
      ),
      'best_channel', (
        SELECT channel
        FROM interactions
        WHERE channel IS NOT NULL AND sentiment = 'positive'
          AND created_at >= NOW() - (p_days || ' days')::interval
          AND (p_user_id IS NULL OR user_id = p_user_id)
        GROUP BY channel
        ORDER BY COUNT(*) DESC
        LIMIT 1
      ),
      'period_days', p_days
    )
  );
END;
$function$
