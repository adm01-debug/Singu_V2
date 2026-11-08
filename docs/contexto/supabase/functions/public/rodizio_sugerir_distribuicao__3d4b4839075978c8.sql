CREATE OR REPLACE FUNCTION public.rodizio_sugerir_distribuicao(p_onda integer, p_filtros jsonb DEFAULT '{}'::jsonb, p_criado_por_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_count int := 0;
  v_sugerido_id integer;
BEGIN
  FOR v_customer IN
    SELECT c.id, c.vendedor_id
    FROM public.customers c
    LEFT JOIN public.customer_rotation_state crs ON crs.customer_id = c.id
    WHERE c.deleted_at IS NULL
      AND (NOT (p_filtros ? 'vendedor_id') OR c.vendedor_id = (p_filtros->>'vendedor_id')::integer)
      AND (NOT (p_filtros ? 'uf') OR (SELECT ca.estado
        FROM public.company_addresses ca WHERE ca.company_id = c.company_id
        ORDER BY ca.is_primary DESC NULLS LAST, ca.created_at DESC LIMIT 1
      ) = p_filtros->>'uf')
      AND (NOT (p_filtros ? 'ramo_atividade') OR c.ramo_atividade = p_filtros->>'ramo_atividade')
      AND (NOT (p_filtros ? 'grupo_clientes') OR c.grupo_clientes = p_filtros->>'grupo_clientes')
      AND (NOT (p_filtros ? 'valor_min') OR c.valor_total_compras >= (p_filtros->>'valor_min')::numeric)
      AND (NOT (p_filtros ? 'valor_max') OR c.valor_total_compras <= (p_filtros->>'valor_max')::numeric)
      AND (NOT (p_filtros ? 'segmento') OR COALESCE(crs.segmento, 'NAO_ATIVADO') = p_filtros->>'segmento')
      AND NOT EXISTS (
        SELECT 1 FROM public.rodizio_distribuicao_staging st
        WHERE st.onda = p_onda AND st.customer_id = c.id
      )
    LIMIT COALESCE((p_filtros->>'limit')::integer, 5000)
  LOOP
    v_sugerido_id := public.fn_proximo_closer(v_customer.id);
    INSERT INTO public.rodizio_distribuicao_staging
      (onda, customer_id, closer_destino_id, origem, status, criado_por_id)
    VALUES
      (p_onda, v_customer.id, v_sugerido_id, 'SUGESTAO_MOTOR', 'RASCUNHO', p_criado_por_id)
    ON CONFLICT (onda, customer_id) DO NOTHING;
    v_count := v_count + 1;
  END LOOP;
  RETURN jsonb_build_object('status', 'success', 'onda', p_onda, 'clientes_sugeridos', v_count);
END;
$function$
