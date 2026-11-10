-- Sequence Gap Auto-Heal — realinha as sequences pós-import paralelo.
-- Uso: psql "$DEST_DB_URL" -f sql/heal-sequences.sql
--      psql "$DEST_DB_URL" -v schemas=public,auth,meu_schema -f sql/heal-sequences.sql
--      psql "$DEST_DB_URL" -v dry_run=1 -f sql/heal-sequences.sql      (só mostra o que faria)
--
-- O que faz: para cada coluna alimentada por sequence (serial, identity ou DEFAULT
-- nextval('...') de sequence compartilhada) nos schemas pedidos (padrão: public,auth),
-- garante que o próximo valor da sequence seja > MAX(coluna). Inclui tabela particionada.
-- Só AVANÇA: sequence já adiantada fica como está (recuar poderia repetir id de linha
-- apagada ou colidir com outra tabela que usa a mesma sequence). Tabela vazia é ignorada.
-- Idempotente: rodar de novo não muda nada.
-- Saída: 0 = tudo alinhado; ≠0 (com ON_ERROR_STOP, já ligado abaixo) se ALGUMA sequence
-- não pôde ser corrigida (ex.: sem permissão, MAX acima do limite da sequence) — as
-- demais são corrigidas mesmo assim (setval não é desfeito pelo erro).
\set ON_ERROR_STOP on
\if :{?schemas}
\else
  \set schemas 'public,auth'
\endif
\if :{?dry_run}
\else
  \set dry_run 0
\endif
SELECT set_config('heal.schemas', :'schemas', false) AS heal_schemas,
       set_config('heal.dry_run', :'dry_run', false) AS heal_dry_run \gset

DO $$
DECLARE
  r RECORD;
  alvo text[] := string_to_array(replace(current_setting('heal.schemas'), ' ', ''), ',');
  simular boolean := current_setting('heal.dry_run') NOT IN ('0', '', 'off', 'false');
  max_id bigint;
  proximo bigint;
  fixed int := 0;
  ok int := 0;
  vazias int := 0;
  falhas int := 0;
BEGIN
  FOR r IN
    WITH cols AS (
      -- serial (OWNED BY) e identity
      SELECT c.oid AS tbl, a.attname AS col,
             pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname)::regclass AS seq
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
       WHERE c.relkind IN ('r', 'p') AND n.nspname = ANY (alvo)
         AND pg_get_serial_sequence(format('%I.%I', n.nspname, c.relname), a.attname) IS NOT NULL
      UNION
      -- DEFAULT nextval('seq') de sequence que não pertence à coluna (ex.: compartilhada)
      SELECT c.oid, a.attname, s.oid::regclass
        FROM pg_attrdef d
        JOIN pg_class c ON c.oid = d.adrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum AND NOT a.attisdropped
        JOIN pg_depend dep ON dep.classid = 'pg_attrdef'::regclass AND dep.objid = d.oid
                          AND dep.refclassid = 'pg_class'::regclass
        JOIN pg_class s ON s.oid = dep.refobjid AND s.relkind = 'S'
       WHERE c.relkind IN ('r', 'p') AND n.nspname = ANY (alvo)
    )
    SELECT cols.tbl::regclass AS tbl, cols.col, cols.seq, q.seqincrement AS inc
      FROM cols JOIN pg_sequence q ON q.seqrelid = cols.seq
     -- partição-filha é coberta pela tabela-pai
     WHERE NOT EXISTS (SELECT 1 FROM pg_inherits i WHERE i.inhrelid = cols.tbl)
     ORDER BY cols.seq::text, cols.tbl::text, cols.col
  LOOP
    BEGIN
      IF r.inc <= 0 THEN
        RAISE EXCEPTION 'sequence decrescente (increment=%) não é suportada', r.inc;
      END IF;
      EXECUTE format('SELECT MAX(%I)::bigint FROM %s', r.col, r.tbl) INTO max_id;
      IF max_id IS NULL THEN
        vazias := vazias + 1;
        CONTINUE;
      END IF;
      EXECUTE format('SELECT CASE WHEN is_called THEN last_value + %s ELSE last_value END FROM %s', r.inc, r.seq) INTO proximo;
      IF proximo > max_id THEN
        ok := ok + 1;
      ELSIF simular THEN
        RAISE NOTICE '[dry_run] %.% → setval(%, %) (próximo hoje: %)', r.tbl, r.col, r.seq, max_id + 1, proximo;
        fixed := fixed + 1;
      ELSE
        PERFORM setval(r.seq, max_id + 1, false);
        RAISE NOTICE '✔ %.% → setval(%, %) (próximo era %)', r.tbl, r.col, r.seq, max_id + 1, proximo;
        fixed := fixed + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '⚠ %.% (%) falhou: %', r.tbl, r.col, r.seq, SQLERRM;
      falhas := falhas + 1;
    END;
  END LOOP;
  RAISE NOTICE 'Sequences%: corrigidas=% já_alinhadas=% tabelas_vazias=% falhas=% (schemas: %)',
    CASE WHEN simular THEN ' [dry_run]' ELSE '' END, fixed, ok, vazias, falhas, array_to_string(alvo, ',');
  IF falhas > 0 THEN
    RAISE EXCEPTION 'heal-sequences: % sequence(s) não puderam ser corrigidas — veja os WARNING acima', falhas;
  END IF;
END $$;
