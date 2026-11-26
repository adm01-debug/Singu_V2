CREATE OR REPLACE FUNCTION public.analyze_loss_patterns()
 RETURNS TABLE(pattern text, occurrences bigint, total_lost_value numeric, recommendation text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT 
    CASE 
      WHEN motivo_perda ILIKE '%preço%' OR motivo_perda ILIKE '%valor%' THEN 'Preço'
      WHEN motivo_perda ILIKE '%concorrente%' OR motivo_perda ILIKE '%competidor%' THEN 'Concorrência'
      WHEN motivo_perda ILIKE '%prazo%' OR motivo_perda ILIKE '%tempo%' THEN 'Prazo'
      WHEN motivo_perda ILIKE '%orçamento%' OR motivo_perda ILIKE '%budget%' THEN 'Orçamento do Cliente'
      ELSE 'Outros'
    END,
    COUNT(*), SUM(valor),
    CASE 
      WHEN motivo_perda ILIKE '%preço%' THEN 'Revisar política de descontos'
      WHEN motivo_perda ILIKE '%concorrente%' THEN 'Análise competitiva necessária'
      WHEN motivo_perda ILIKE '%prazo%' THEN 'Melhorar tempo de resposta'
      ELSE 'Investigar casos individuais'
    END
  FROM deals WHERE status = 'perdido' AND motivo_perda IS NOT NULL
  GROUP BY 1, 4 ORDER BY 2 DESC;
$function$
