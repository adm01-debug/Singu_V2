-- sequences-gap-check.sql — Audita colisão iminente de PK.
-- Compara sequence.last_value com MAX(coluna) da tabela dona.
-- Falha (exit != 0) se qualquer sequence tem last_value <= MAX(col).
-- Uso: psql "$DEST_DB_URL" -v ON_ERROR_STOP=1 -f verify/sequences-gap-check.sql
\set ON_ERROR_STOP on
\pset pager off

CREATE TEMP TABLE _seq_gap_report(
  seq text, tbl text, col text, seq_last bigint, col_max bigint, gap bigint
) ON COMMIT DROP;

DO $BODY$
DECLARE
  r record;
  v_seq_last bigint;
  v_col_max  bigint;
BEGIN
  FOR r IN
    SELECT n.nspname AS ns, c.relname AS seq_name,
           tn.nspname AS tns, tbl.relname AS tbl_name, a.attname AS col_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_depend d ON d.objid = c.oid AND d.deptype IN ('a','i')
      JOIN pg_class tbl ON tbl.oid = d.refobjid
      JOIN pg_namespace tn ON tn.oid = tbl.relnamespace
      JOIN pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = d.refobjsubid
     WHERE c.relkind = 'S' AND tn.nspname = 'public'
  LOOP
    EXECUTE format('SELECT last_value FROM %I.%I', r.ns, r.seq_name) INTO v_seq_last;
    EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I.%I', r.col_name, r.tns, r.tbl_name) INTO v_col_max;
    IF v_seq_last <= v_col_max THEN
      INSERT INTO _seq_gap_report VALUES(
        r.ns || '.' || r.seq_name, r.tns || '.' || r.tbl_name,
        r.col_name, v_seq_last, v_col_max, v_col_max - v_seq_last
      );
    END IF;
  END LOOP;
END
$BODY$;

SELECT * FROM _seq_gap_report ORDER BY gap DESC;

DO $BODY$
DECLARE v_n int;
BEGIN
  SELECT COUNT(*) INTO v_n FROM _seq_gap_report;
  IF v_n > 0 THEN
    RAISE EXCEPTION '🚨 SEQUENCE GAP: % sequence(s) com last_value <= MAX(col)', v_n;
  END IF;
  RAISE NOTICE '✔ Todas as sequences à frente do MAX(col)';
END
$BODY$;