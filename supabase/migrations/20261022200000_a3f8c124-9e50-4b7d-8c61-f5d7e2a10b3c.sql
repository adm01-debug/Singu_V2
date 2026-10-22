-- fix: update_company_fields — search_path fixo + revoga acesso anon/PUBLIC
--
-- Causa raiz: função SECURITY DEFINER sem SET search_path e com EXECUTE
-- concedido a PUBLIC (incluindo anon), violando allowlist e hardening tests.
-- Fix: revoga PUBLIC, recria com SET search_path = public, pg_catalog, pg_temp,
-- reemite grants apenas para authenticated e service_role.
-- Segurança: ownership check (user_id = auth.uid()) garante isolamento entre tenants.
--
-- Bugs adicionais corrigidos nesta versão:
-- Bug 1 (HIGH): auth.uid() retorna NULL para chamadas service_role sem JWT →
--   EXECUTE v_sql com v_sql=NULL lança "query string argument of EXECUTE is null"
--   Fix: guard no início rejeitando chamadas sem auth.uid()
-- Bug 2 (P2): se p_data contiver 'updated_at', loop gerava "updated_at = X" E
--   a linha fixa "updated_at = now()" → "ERROR: multiple assignments to same column"
--   Fix: adicionar 'updated_at' à blocklist
-- Bug 3 (P2): jsonb_each_text para campos array retorna '["a","b"]' (JSON literal),
--   não '{"a","b"}' (PG text[] literal); atribuir isso a uma coluna text[] falha
--   Fix: rejeitar valores jsonb do tipo array ou object (apenas escalares permitidos)

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
BEGIN
  -- Bug 1: auth.uid() é NULL em chamadas service_role sem JWT;
  -- quote_literal(NULL) = NULL → concatenação retorna NULL → EXECUTE NULL explode
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required: auth.uid() is null';
  END IF;

  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_data) LOOP
    -- Bug 2: 'updated_at' adicionado à blocklist para evitar "multiple assignments to same column"
    IF v_key NOT IN ('id', 'created_at', 'user_id', 'updated_at') THEN
      -- Bug 3: rejeitar arrays e objetos JSON — jsonb_each_text retorna '["a","b"]' para arrays,
      -- mas PostgreSQL espera '{"a","b"}' para text[]; atribuição falharia com syntax error
      IF jsonb_typeof(p_data->v_key) IN ('array', 'object') THEN
        RAISE EXCEPTION 'field % must be a scalar value, not a JSON % (use scalar fields only)',
          v_key, jsonb_typeof(p_data->v_key);
      END IF;
      v_sets := array_append(v_sets, format('%I = %L', v_key, v_value));
    END IF;
  END LOOP;
  IF cardinality(v_sets) = 0 THEN
    RETURN jsonb_build_object('error', 'no valid fields');
  END IF;
  v_sql := 'UPDATE public.companies SET ' || array_to_string(v_sets, ', ')
        || ', updated_at = now() WHERE id = ' || quote_literal(p_company_id)
        || ' AND user_id = ' || quote_literal(auth.uid())
        || ' RETURNING id, nome_fantasia';
  EXECUTE v_sql INTO v_row;
  IF v_row IS NULL THEN
    RETURN jsonb_build_object('error', 'not found');
  END IF;
  RETURN jsonb_build_object('ok', true, 'id', v_row.id, 'nome', v_row.nome_fantasia);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_company_fields(uuid, jsonb) TO authenticated, service_role;
