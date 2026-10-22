-- fix: update_company_fields — search_path fixo + revoga acesso anon/PUBLIC
--
-- Causa raiz: função SECURITY DEFINER sem SET search_path e com EXECUTE
-- concedido a PUBLIC (incluindo anon), violando allowlist e hardening tests.
-- Fix: revoga PUBLIC, recria com SET search_path = public, pg_catalog, pg_temp,
-- reemite grants apenas para authenticated e service_role.
-- Segurança: chamadas authenticated filtram por user_id (isolamento tenant);
-- chamadas service_role (auth.uid() IS NULL) operam por p_company_id sem filtro de tenant.
--
-- Bug corrigido (P2): se p_data contiver 'updated_at', loop gerava "updated_at = X" E
--   a linha fixa "updated_at = now()" → "ERROR: multiple assignments to same column"
--   Fix: adicionar 'updated_at' à blocklist

REVOKE EXECUTE ON FUNCTION public.update_company_fields(p_company_id uuid, p_data jsonb) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.update_company_fields(p_company_id uuid, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_catalog, pg_temp
AS $$
DECLARE
  v_key   text;
  v_value text;
  v_sets  text[] := ARRAY[]::text[];
  v_sql   text;
  v_row   record;
  v_uid   uuid := auth.uid();
BEGIN
  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_data) LOOP
    -- 'updated_at' na blocklist evita "multiple assignments to same column"
    IF v_key NOT IN ('id', 'created_at', 'user_id', 'updated_at') THEN
      v_sets := array_append(v_sets, format('%I = %L', v_key, v_value));
    END IF;
  END LOOP;

  IF cardinality(v_sets) = 0 THEN
    RETURN jsonb_build_object('error', 'no valid fields');
  END IF;

  -- authenticated: filtra pela empresa do próprio usuário (isolamento tenant)
  -- service_role (v_uid IS NULL): atualiza por p_company_id sem restrição de tenant
  IF v_uid IS NOT NULL THEN
    v_sql := 'UPDATE public.companies SET ' || array_to_string(v_sets, ', ')
          || ', updated_at = now() WHERE id = ' || quote_literal(p_company_id)
          || ' AND user_id = ' || quote_literal(v_uid)
          || ' RETURNING id, nome_fantasia';
  ELSE
    v_sql := 'UPDATE public.companies SET ' || array_to_string(v_sets, ', ')
          || ', updated_at = now() WHERE id = ' || quote_literal(p_company_id)
          || ' RETURNING id, nome_fantasia';
  END IF;

  EXECUTE v_sql INTO v_row;
  IF v_row IS NULL THEN
    RETURN jsonb_build_object('error', 'not found');
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', v_row.id, 'nome', v_row.nome_fantasia);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_company_fields(uuid, jsonb) TO authenticated, service_role;
