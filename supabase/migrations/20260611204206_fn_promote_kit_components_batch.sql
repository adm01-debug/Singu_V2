-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260611204206
-- nome:   fn_promote_kit_components_batch

CREATE OR REPLACE FUNCTION public.fn_promote_kit_components_batch(
  p_batch_size INTEGER DEFAULT 500
)
RETURNS TABLE(
  total_approved INTEGER,
  total_promoted INTEGER,
  total_errors   INTEGER,
  errors_sample  JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_pad_id   UUID;
  v_promoted INTEGER := 0;
  v_errors   INTEGER := 0;
  v_err_list JSONB   := '[]'::JSONB;
  v_total    INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM kit_component_padronizacao
  WHERE padronizacao_status = 'approved';

  FOR v_pad_id IN
    SELECT id
    FROM kit_component_padronizacao
    WHERE padronizacao_status = 'approved'
    ORDER BY created_at
    LIMIT p_batch_size
  LOOP
    BEGIN
      PERFORM fn_promote_kit_component_padronizacao(v_pad_id);
      v_promoted := v_promoted + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      IF jsonb_array_length(v_err_list) < 10 THEN
        v_err_list := v_err_list || jsonb_build_object(
          'pad_id', v_pad_id,
          'error',  SQLERRM
        );
      END IF;
    END;
  END LOOP;

  total_approved := v_total;
  total_promoted := v_promoted;
  total_errors   := v_errors;
  errors_sample  := v_err_list;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_promote_kit_components_batch(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_promote_kit_components_batch(INTEGER) TO service_role;
