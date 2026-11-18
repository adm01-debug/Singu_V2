-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330121857
-- nome:   create_fn_carrier_bulk_recalc

CREATE OR REPLACE FUNCTION fn_carrier_bulk_recalc()
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_rec RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_rec IN
    SELECT DISTINCT ce.carrier_id
    FROM carrier_evaluations ce
  LOOP
    PERFORM fn_recalcular_carrier_score(v_rec.carrier_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN json_build_object('recalculated', v_count, 'executed_at', NOW());
END;
$function$;

COMMENT ON FUNCTION fn_carrier_bulk_recalc() IS 'Recalcula scores de todas as transportadoras que possuem avaliações. Usar após mudança de pesos.';
