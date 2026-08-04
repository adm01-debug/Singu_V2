-- sequence-overflow-guard.sql — Rodada 21/10
-- Sequences serial/smallserial proximas do teto causam INSERT failure.
\echo '== sequence-overflow-guard =='
SELECT schemaname, sequencename, last_value, max_value,
       ROUND(100.0 * last_value / NULLIF(max_value,0), 2) AS pct_used
  FROM pg_sequences
 WHERE last_value IS NOT NULL
   AND (100.0 * last_value / NULLIF(max_value,0)) > 50
 ORDER BY pct_used DESC;
DO $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_sequences
   WHERE last_value IS NOT NULL
     AND (100.0 * last_value / NULLIF(max_value,0)) > 90;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % sequences > 90%% do teto. Migrar para bigint urgente.', v_count;
  END IF;
END $$;
\echo 'OK sequences abaixo de 90%.'