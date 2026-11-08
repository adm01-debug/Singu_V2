-- Hash de plano de RPC passa a ser estrutural: projeta só os atributos que o
-- planejador escolhe (tipo de nó, relação, índice, junção, condições, filhos).
-- Campos observados no ANALYZE (Sort Method, Sort Space Type, Workers Launched,
-- tempos, linhas, buffers) não marcam mais troca de plano.
-- capture_rpc_plan('get_ai_gateway_partition_stats') passa a explicar o min/max
-- por partição, que é a parte cara da RPC, em vez da listagem do catálogo.

CREATE OR REPLACE FUNCTION public.rpc_plan_structure(_node jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF _node IS NULL OR jsonb_typeof(_node) <> 'object' THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_strip_nulls(jsonb_build_object(
    'node',        _node -> 'Node Type',
    'parent',      _node -> 'Parent Relationship',
    'subplan',     _node -> 'Subplan Name',
    'cte',         _node -> 'CTE Name',
    'strategy',    _node -> 'Strategy',
    'partial',     _node -> 'Partial Mode',
    'parallel',    _node -> 'Parallel Aware',
    'workers',     _node -> 'Workers Planned',
    'async',       _node -> 'Async Capable',
    'join',        _node -> 'Join Type',
    'relation',    _node -> 'Relation Name',
    'index',       _node -> 'Index Name',
    'scan_dir',    _node -> 'Scan Direction',
    'sort_key',    _node -> 'Sort Key',
    'group_key',   _node -> 'Group Key',
    'index_cond',  _node -> 'Index Cond',
    'recheck',     _node -> 'Recheck Cond',
    'hash_cond',   _node -> 'Hash Cond',
    'merge_cond',  _node -> 'Merge Cond',
    'join_filter', _node -> 'Join Filter',
    'filter',      _node -> 'Filter',
    'children',    (SELECT jsonb_agg(public.rpc_plan_structure(c.child) ORDER BY c.ord)
                      FROM jsonb_array_elements(
                             CASE WHEN jsonb_typeof(_node -> 'Plans') = 'array'
                                  THEN _node -> 'Plans' ELSE '[]'::jsonb END
                           ) WITH ORDINALITY AS c(child, ord))
  ));
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_plan_structure(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_plan_structure(jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.capture_rpc_plan(_rpc_name text, _reason text DEFAULT 'scheduled')
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_stmt      text;
  v_plan      jsonb;
  v_hash      text;
  v_last_hash text;
  v_inventory text;
  v_last_inventory text;
  v_new_inventory boolean := false;
  v_id        uuid;
BEGIN
  -- EXPLAIN de uma função plpgsql só mostra "Function Scan": explica a consulta principal de cada RPC
  v_stmt := CASE _rpc_name
    WHEN 'get_ai_gateway_health' THEN $q$
      SELECT function_name, model, status, duration_ms, tokens_in, tokens_out, created_at
        FROM public.ai_gateway_metrics
       WHERE created_at >= now() - interval '24 hours'$q$
    -- a RPC lê min/max de cada partição: esse é o custo que degrada, não a listagem do catálogo
    WHEN 'get_ai_gateway_partition_stats' THEN COALESCE(
      (SELECT string_agg(format('SELECT %L::text AS partition_name, min(created_at), max(created_at) FROM public.%I',
                                c.relname, c.relname), ' UNION ALL ' ORDER BY c.relname)
         FROM pg_inherits i
         JOIN pg_class c ON c.oid = i.inhrelid
        WHERE i.inhparent = 'public.ai_gateway_metrics'::regclass),
      $q$
      SELECT c.oid, c.relname, pg_get_expr(c.relpartbound, c.oid)
        FROM pg_inherits i
        JOIN pg_class c ON c.oid = i.inhrelid
       WHERE i.inhparent = 'public.ai_gateway_metrics'::regclass$q$)
    WHEN 'get_rpc_perf_stats' THEN $q$
      SELECT rpc_name, COUNT(*), percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms), MAX(created_at)
        FROM public.rpc_perf_samples
       WHERE created_at >= now() - interval '24 hours'
       GROUP BY rpc_name$q$
    WHEN 'get_top_slow_rpcs' THEN $q$
      SELECT rpc_name, COUNT(*), percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95
        FROM public.rpc_perf_samples
       WHERE created_at >= now() - interval '24 hours'
       GROUP BY rpc_name
      HAVING COUNT(*) >= 3
       ORDER BY p95 DESC
       LIMIT 5$q$
    WHEN 'get_slow_rpc_trend' THEN $q$
      SELECT rpc_name, COUNT(*), percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)
        FROM public.rpc_perf_samples
       WHERE created_at >= now() - interval '24 hours'
         AND created_at <  now() - interval '1 hour'
       GROUP BY rpc_name$q$
    ELSE NULL
  END;

  IF v_stmt IS NULL THEN
    RAISE EXCEPTION 'RPC % nao esta na allowlist de captura de plano', _rpc_name
      USING ERRCODE = '22023';
  END IF;

  _reason := COALESCE(_reason, 'scheduled');

  BEGIN
    EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || v_stmt INTO v_plan;
  EXCEPTION WHEN OTHERS THEN
    v_plan := NULL;
  END;

  IF v_plan IS NULL THEN
    BEGIN
      EXECUTE 'EXPLAIN (FORMAT JSON) ' || v_stmt INTO v_plan;
      _reason := _reason || '+estimated';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'capture_rpc_plan(%): EXPLAIN falhou (%)', _rpc_name, SQLERRM;
      RETURN NULL;
    END;
  END IF;

  v_hash := md5(public.rpc_plan_structure(v_plan -> 0 -> 'Plan')::text);

  IF _rpc_name = 'get_ai_gateway_partition_stats' THEN
    v_inventory := md5(v_stmt);
    v_plan := jsonb_set(v_plan, '{0,Partition Inventory}', to_jsonb(v_inventory));
  END IF;

  SELECT plan_hash, plan -> 0 ->> 'Partition Inventory' INTO v_last_hash, v_last_inventory
    FROM public.rpc_plan_snapshots
   WHERE rpc_name = _rpc_name
   ORDER BY captured_at DESC, id DESC
   LIMIT 1;

  v_new_inventory := _rpc_name = 'get_ai_gateway_partition_stats'
    AND v_inventory IS DISTINCT FROM v_last_inventory;
  IF v_last_hash IS NOT DISTINCT FROM v_hash AND NOT v_new_inventory THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.rpc_plan_snapshots (rpc_name, plan, plan_hash, total_cost, execution_ms, reason)
  VALUES (_rpc_name, v_plan, v_hash,
          (v_plan -> 0 -> 'Plan' ->> 'Total Cost')::numeric,
          (v_plan -> 0 ->> 'Execution Time')::numeric,
          CASE WHEN v_new_inventory THEN 'baseline' ELSE _reason END)
  RETURNING id INTO v_id;

  IF v_new_inventory THEN
    UPDATE public.rpc_plan_snapshots SET plan_changed = false WHERE id = v_id;
  END IF;
  RETURN v_id;
END;
$$;

-- snapshots existentes no novo formato: hash e plan_changed recalculados na
-- ordem de captura, para o painel e os alertas não contarem trocas falsas
UPDATE public.rpc_plan_snapshots
   SET plan_hash = md5(public.rpc_plan_structure(plan -> 0 -> 'Plan')::text)
 WHERE plan_hash IS DISTINCT FROM md5(public.rpc_plan_structure(plan -> 0 -> 'Plan')::text);

UPDATE public.rpc_plan_snapshots s
   SET plan_changed = r.changed
  FROM (
    SELECT id,
           COALESCE(lag(plan_hash) OVER w IS DISTINCT FROM plan_hash, false)
             AND lag(plan_hash) OVER w IS NOT NULL AND reason NOT LIKE 'baseline%' AS changed
      FROM public.rpc_plan_snapshots
    WINDOW w AS (PARTITION BY rpc_name ORDER BY captured_at, id)
  ) r
 WHERE r.id = s.id
   AND s.plan_changed IS DISTINCT FROM r.changed;

-- a consulta explicada de get_ai_gateway_partition_stats mudou: nova linha de
-- base, que não conta como troca do plano monitorado
DO $$
DECLARE
  v_id uuid;
BEGIN
  v_id := public.capture_rpc_plan('get_ai_gateway_partition_stats', 'baseline');
  IF v_id IS NOT NULL THEN
    UPDATE public.rpc_plan_snapshots SET plan_changed = false WHERE id = v_id;
  END IF;
END $$;

-- DOWN MIGRATION (Rollback manual, na mesma transação)
-- BEGIN;
-- 1. Restaurar SOMENTE a definição de capture_rpc_plan(text,text) da migration
--    20261006140000_ai_gateway_observability.sql (CREATE OR REPLACE ... $$;).
--    Não reaplicar a migration inteira: ela também configura tabelas e jobs.
--    Esse corpo usa o catálogo de partições e o hash legado abaixo.
-- 2. Executar, após restaurar a função:
-- UPDATE public.rpc_plan_snapshots
-- SET plan_hash = md5(regexp_replace(plan::text,
--   '"[^"]+": *-?[0-9.]+(e[-+]?[0-9]+)?', '', 'g'));
-- UPDATE public.rpc_plan_snapshots s
-- SET plan_changed = r.changed
-- FROM (
--   SELECT id, lag(plan_hash) OVER w IS NOT NULL
--     AND lag(plan_hash) OVER w IS DISTINCT FROM plan_hash AS changed
--   FROM public.rpc_plan_snapshots
--   WINDOW w AS (PARTITION BY rpc_name ORDER BY captured_at, id)
-- ) r WHERE r.id = s.id;
-- DO $rollback$
-- DECLARE v_id uuid;
-- BEGIN
--   v_id := public.capture_rpc_plan('get_ai_gateway_partition_stats', 'baseline');
--   IF v_id IS NOT NULL THEN
--     UPDATE public.rpc_plan_snapshots SET plan_changed = false WHERE id = v_id;
--   END IF;
-- END $rollback$;
-- DROP FUNCTION IF EXISTS public.rpc_plan_structure(jsonb);
-- COMMIT;
-- Os planos JSON são preservados; hashes e flags são reconstruídos pelo
-- algoritmo legado, sem apagar snapshots. A volta ao catálogo exige a nova
-- baseline acima para não comparar consultas distintas como regressão.
-- Para recuperar flags exatamente como eram (inclusive falsos positivos),
-- exportar id/plan_hash/plan_changed antes do UP e restaurar por id no DOWN.
