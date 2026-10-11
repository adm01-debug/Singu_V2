BEGIN;

DO $$
DECLARE
  base jsonb := '{"Node Type":"Sort","Sort Key":["created_at"],"Plans":[{"Node Type":"Seq Scan","Relation Name":"rpc_perf_samples"}]}'::jsonb;
  runtime jsonb := '{"Sort Method":"external merge","Sort Space Type":"Disk","Sort Space Used":128,"Actual Rows":40,"Actual Total Time":5,"Workers Launched":4}'::jsonb;
  children jsonb := '{"Node Type":"Append","Plans":[{"Node Type":"Seq Scan","Relation Name":"a"},{"Node Type":"Index Scan","Relation Name":"b"}]}'::jsonb;
  parallel jsonb := '{"Node Type":"Gather","Workers Planned":2,"Plans":[{"Node Type":"Seq Scan","Parallel Aware":true,"Relation Name":"rpc_perf_samples"}]}'::jsonb;
  first_id uuid;
BEGIN
  IF public.rpc_plan_structure(base) IS DISTINCT FROM public.rpc_plan_structure(base || runtime) THEN
    RAISE EXCEPTION 'Métricas de execução alteraram o hash estrutural';
  END IF;
  IF public.rpc_plan_structure(base) IS NOT DISTINCT FROM public.rpc_plan_structure(
       jsonb_set(base, '{Plans,0,Node Type}', '"Index Scan"')) THEN
    RAISE EXCEPTION 'Troca de varredura não alterou a estrutura';
  END IF;
  IF public.rpc_plan_structure(parallel) IS NOT DISTINCT FROM public.rpc_plan_structure(
       jsonb_set(parallel, '{Workers Planned}', '4')) THEN
    RAISE EXCEPTION 'Workers planejados não alteraram a estrutura';
  END IF;
  IF public.rpc_plan_structure(parallel) IS NOT DISTINCT FROM public.rpc_plan_structure(
       jsonb_set(parallel, '{Plans,0,Parallel Aware}', 'false')) THEN
    RAISE EXCEPTION 'Paralelismo do filho não alterou a estrutura';
  END IF;
  IF public.rpc_plan_structure(children) IS NOT DISTINCT FROM public.rpc_plan_structure(
       jsonb_set(children, '{Plans}', jsonb_build_array(children->'Plans'->1, children->'Plans'->0))) THEN
    RAISE EXCEPTION 'Ordem dos filhos não foi preservada';
  END IF;
  IF has_function_privilege('anon', 'public.rpc_plan_structure(jsonb)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.rpc_plan_structure(jsonb)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.rpc_plan_structure(jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Grants da projeção estrutural fora do contrato';
  END IF;
  IF EXISTS (SELECT 1 FROM public.rpc_plan_snapshots
             WHERE plan_hash IS DISTINCT FROM md5(public.rpc_plan_structure(plan->0->'Plan')::text)) THEN
    RAISE EXCEPTION 'Hashes históricos fora do formato estrutural';
  END IF;
  IF EXISTS (SELECT 1 FROM public.rpc_plan_snapshots
             WHERE rpc_name='get_ai_gateway_partition_stats' AND reason='baseline' AND plan_changed) THEN
    RAISE EXCEPTION 'Baseline de partições marcada como troca';
  END IF;
  DELETE FROM public.rpc_plan_snapshots WHERE rpc_name = 'get_ai_gateway_partition_stats';
  first_id := public.capture_rpc_plan('get_ai_gateway_partition_stats', 'test');
  IF first_id IS NULL THEN
    RAISE EXCEPTION 'Primeira captura não produziu snapshot';
  END IF;
  IF public.capture_rpc_plan('get_ai_gateway_partition_stats', 'test') IS NOT NULL THEN
    RAISE EXCEPTION 'Recaptura idêntica não foi deduplicada';
  END IF;
  UPDATE public.rpc_plan_snapshots SET plan = jsonb_set(plan, '{0,Partition Inventory}', '"inventário anterior"')
    WHERE id = first_id;
  first_id := public.capture_rpc_plan('get_ai_gateway_partition_stats', 'test');
  IF first_id IS NULL OR EXISTS (SELECT 1 FROM public.rpc_plan_snapshots
      WHERE id = first_id AND (plan_changed OR reason <> 'baseline')) THEN
    RAISE EXCEPTION 'Mudança de inventário não criou baseline estável';
  END IF;
END $$;

ROLLBACK;
