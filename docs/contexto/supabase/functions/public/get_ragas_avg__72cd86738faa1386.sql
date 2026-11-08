CREATE OR REPLACE FUNCTION public.get_ragas_avg(p_agent_id uuid)
 RETURNS TABLE(avg_faithfulness double precision, avg_relevancy double precision, avg_precision double precision, avg_recall double precision, avg_correctness double precision, avg_overall double precision, total_evaluations bigint)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    AVG(faithfulness)::FLOAT,
    AVG(answer_relevancy)::FLOAT,
    AVG(context_precision)::FLOAT,
    AVG(context_recall)::FLOAT,
    AVG(answer_correctness)::FLOAT,
    AVG(overall_score)::FLOAT,
    COUNT(*)
  FROM ragas_scores
  WHERE agent_id = p_agent_id;
END;
$function$
