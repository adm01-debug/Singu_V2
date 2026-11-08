CREATE OR REPLACE FUNCTION public.rpc_plan_structure(_node jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
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
$function$
