-- sequences-gap-check.sql — Audita colisão iminente de PK.
-- Proposito: depois de import/restore a sequence pode ficar atras do MAX(coluna); o proximo
--            INSERT colide com uma linha existente (duplicate key).
-- Classe   : GUARD WARN (sai != 0; no full-audit conta como WARN)
-- Limiar   : sequence (incremento positivo) de coluna em public cujo PROXIMO valor
--            (last_value, ou last_value + incremento se ja usada) e <= MAX(coluna).
-- Variaveis: nenhuma
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Uso: psql "$DEST_DB_URL" -v ON_ERROR_STOP=1 -f verify/sequences-gap-check.sql
\set ON_ERROR_STOP on
\pset pager off

-- Tabela temporaria de sessao (sem ON COMMIT DROP: em autocommit ela sumiria antes do SELECT).
DROP TABLE IF EXISTS pg_temp._seq_gap_report;
CREATE TEMP TABLE _seq_gap_report(
  seq text, tbl text, col text, seq_next bigint, col_max bigint, gap bigint
);

DO $BODY$
DECLARE
  r record;
  v_last   bigint;
  v_called boolean;
  v_next   bigint;
  v_col_max bigint;
BEGIN
  FOR r IN
    SELECT n.nspname AS ns, c.relname AS seq_name,
           tn.nspname AS tns, tbl.relname AS tbl_name, a.attname AS col_name,
           sq.seqincrement AS inc
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_sequence sq ON sq.seqrelid = c.oid
      JOIN pg_depend d ON d.objid = c.oid AND d.deptype IN ('a','i')
                      AND d.classid = 'pg_class'::regclass AND d.refclassid = 'pg_class'::regclass
      JOIN pg_class tbl ON tbl.oid = d.refobjid
      JOIN pg_namespace tn ON tn.oid = tbl.relnamespace
      JOIN pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = d.refobjsubid
     WHERE c.relkind = 'S' AND tn.nspname = 'public' AND sq.seqincrement > 0
  LOOP
    EXECUTE format('SELECT last_value, is_called FROM %I.%I', r.ns, r.seq_name) INTO v_last, v_called;
    EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I.%I', r.col_name, r.tns, r.tbl_name) INTO v_col_max;
    v_next := CASE WHEN v_called THEN v_last + r.inc ELSE v_last END;
    IF v_next <= v_col_max THEN
      INSERT INTO _seq_gap_report VALUES(
        r.ns || '.' || r.seq_name, r.tns || '.' || r.tbl_name,
        r.col_name, v_next, v_col_max, v_col_max - v_next + 1
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
    RAISE EXCEPTION '🚨 SEQUENCE GAP: % sequence(s) com proximo valor <= MAX(col)', v_n;
  END IF;
  RAISE NOTICE '✔ Todas as sequences à frente do MAX(col)';
END
$BODY$;
