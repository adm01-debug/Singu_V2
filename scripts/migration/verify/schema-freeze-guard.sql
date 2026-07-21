-- Schema Drift Guardrail — snapshot no freeze + comparação durante janela.
-- Uso:
--   psql "$SRC_DB_URL" -v action=snapshot -f verify/schema-freeze-guard.sql
--   psql "$SRC_DB_URL" -v action=check    -f verify/schema-freeze-guard.sql
\set ON_ERROR_STOP on

CREATE TABLE IF NOT EXISTS public._migration_schema_snapshot (
  taken_at   timestamptz PRIMARY KEY DEFAULT now(),
  fingerprint text NOT NULL,
  detail     jsonb NOT NULL
);

CREATE OR REPLACE FUNCTION public._migration_schema_fingerprint()
RETURNS TABLE (fingerprint text, detail jsonb)
LANGUAGE sql STABLE SET search_path = public AS $$
  WITH cols AS (
    SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
     WHERE table_schema IN ('public','auth','storage')
     ORDER BY 1,2,3
  ),
  agg AS (
    SELECT jsonb_agg(to_jsonb(c.*)) AS d FROM cols c
  )
  SELECT encode(digest(d::text, 'sha256'), 'hex'), d FROM agg;
$$;

DO $$
DECLARE
  v_action text := current_setting('psql.action', true);
  v_fp text; v_detail jsonb; v_last text;
BEGIN
  IF v_action IS NULL THEN
    v_action := 'check';
  END IF;

  SELECT fingerprint, detail INTO v_fp, v_detail FROM public._migration_schema_fingerprint();

  IF v_action = 'snapshot' THEN
    INSERT INTO public._migration_schema_snapshot (fingerprint, detail) VALUES (v_fp, v_detail);
    RAISE NOTICE '✔ Snapshot registrado: fingerprint=%', left(v_fp, 16);
  ELSIF v_action = 'check' THEN
    SELECT fingerprint INTO v_last
      FROM public._migration_schema_snapshot ORDER BY taken_at DESC LIMIT 1;
    IF v_last IS NULL THEN
      RAISE EXCEPTION 'Nenhum snapshot prévio — rode com -v action=snapshot antes do freeze';
    ELSIF v_last <> v_fp THEN
      RAISE EXCEPTION '🚨 SCHEMA DRIFT detectado após freeze: baseline=% atual=%', left(v_last,16), left(v_fp,16);
    ELSE
      RAISE NOTICE '✔ Schema íntegro (fingerprint=%)', left(v_fp, 16);
    END IF;
  ELSE
    RAISE EXCEPTION 'action desconhecida: % (use snapshot|check)', v_action;
  END IF;
END $$;