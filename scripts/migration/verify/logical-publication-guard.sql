-- logical-publication-guard.sql — Garante que a publicação lógica usada pelo CDC
-- contém tabelas. Publicação vazia = CDC silenciosamente sem eventos.
-- Uso: psql "$SRC_DB_URL" -v ON_ERROR_STOP=1 -v pub=singu_cdc -f verify/logical-publication-guard.sql
\set ON_ERROR_STOP on
\pset pager off

SELECT p.pubname, p.puballtables, p.pubinsert, p.pubupdate, p.pubdelete, p.pubtruncate
  FROM pg_publication p
 WHERE p.pubname = :'pub';

SELECT schemaname, tablename
  FROM pg_publication_tables
 WHERE pubname = :'pub'
 ORDER BY schemaname, tablename;

DO $BODY$
DECLARE
  v_pub    text := :'pub';
  v_exists boolean;
  v_all    boolean;
  v_count  int;
BEGIN
  SELECT EXISTS(SELECT 1 FROM pg_publication WHERE pubname = v_pub) INTO v_exists;
  IF NOT v_exists THEN
    RAISE EXCEPTION 'publicacao % nao existe', v_pub;
  END IF;
  SELECT puballtables INTO v_all FROM pg_publication WHERE pubname = v_pub;
  SELECT COUNT(*) INTO v_count FROM pg_publication_tables WHERE pubname = v_pub;
  IF NOT v_all AND v_count = 0 THEN
    RAISE EXCEPTION 'publicacao % sem tabelas - CDC drenaria vazio', v_pub;
  END IF;
  RAISE NOTICE 'OK Publicacao % (all=% count=%)', v_pub, v_all, v_count;
END
$BODY$;