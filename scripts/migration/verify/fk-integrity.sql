-- Lista FKs órfãs em todas as tabelas public. Rode no DESTINO após import.
-- Proposito: import com triggers/FKs desligados (session_replication_role=replica) pode
--            deixar linhas filhas apontando para pais inexistentes.
-- Classe   : GUARD manual (varre todas as tabelas com FK — pesado; fora do full-audit)
-- Limiar   : qualquer linha com todas as colunas da FK preenchidas e sem linha-pai.
--            (FK composta e avaliada inteira; MATCH SIMPLE ignora linhas com NULL.)
-- Variaveis: nenhuma
-- Saida    : 0 = ok; 3 = orfas encontradas (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Uso: psql "$DEST_DB_URL" -v ON_ERROR_STOP=1 -f verify/fk-integrity.sql
\set ON_ERROR_STOP on
\pset pager off
\timing off

DROP TABLE IF EXISTS pg_temp._fk_orphans;
CREATE TEMP TABLE _fk_orphans(
  table_name text, constraint_name text, fk_cols text, ref_table text, orphans bigint
);

DO $BODY$
DECLARE
  r record;
  v_join text; v_notnull text; v_cols text;
  v_n bigint;
BEGIN
  FOR r IN
    SELECT c.conname, c.conrelid, c.confrelid, c.conkey, c.confkey,
           format('%I.%I', n.nspname, t.relname)   AS tbl,
           format('%I.%I', rn.nspname, rt.relname) AS ref
      FROM pg_constraint c
      JOIN pg_class t      ON t.oid = c.conrelid
      JOIN pg_namespace n  ON n.oid = t.relnamespace
      JOIN pg_class rt     ON rt.oid = c.confrelid
      JOIN pg_namespace rn ON rn.oid = rt.relnamespace
     WHERE c.contype = 'f' AND n.nspname = 'public'
       AND c.conparentid = 0   -- FK herdada por particao ja e coberta pela da tabela-pai
     ORDER BY 6, 1
  LOOP
    SELECT string_agg(format('r.%I = t.%I', ra.attname, ta.attname), ' AND ' ORDER BY k.ord),
           string_agg(format('t.%I IS NOT NULL', ta.attname), ' AND ' ORDER BY k.ord),
           string_agg(ta.attname, ',' ORDER BY k.ord)
      INTO v_join, v_notnull, v_cols
      FROM unnest(r.conkey, r.confkey) WITH ORDINALITY AS k(a, b, ord)
      JOIN pg_attribute ta ON ta.attrelid = r.conrelid  AND ta.attnum = k.a
      JOIN pg_attribute ra ON ra.attrelid = r.confrelid AND ra.attnum = k.b;
    EXECUTE format('SELECT count(*) FROM %s t WHERE %s AND NOT EXISTS (SELECT 1 FROM %s r WHERE %s)',
                   r.tbl, v_notnull, r.ref, v_join) INTO v_n;
    IF v_n > 0 THEN
      INSERT INTO _fk_orphans VALUES (r.tbl, r.conname, v_cols, r.ref, v_n);
    END IF;
  END LOOP;
END
$BODY$;

SELECT * FROM _fk_orphans ORDER BY orphans DESC, table_name;

DO $BODY$
DECLARE v_fks int; v_rows bigint;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(orphans), 0) INTO v_fks, v_rows FROM _fk_orphans;
  IF v_fks > 0 THEN
    RAISE EXCEPTION '🚨 FK ORFA: % constraint(s) violada(s), % linha(s) sem pai', v_fks, v_rows;
  END IF;
  RAISE NOTICE '✔ nenhuma FK órfã detectada';
END
$BODY$;
