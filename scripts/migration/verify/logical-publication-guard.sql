-- logical-publication-guard.sql — Garante que a publicação lógica usada pelo CDC
-- contém tabelas. Publicação vazia = CDC silenciosamente sem eventos.
-- Classe   : GUARD manual (parametrizado; fora do full-audit)
-- Limiar   : publicacao :pub inexistente, ou sem tabelas e sem FOR ALL TABLES.
-- Variaveis: -v pub=singu_cdc (default singu_cdc)
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Uso: psql "$SRC_DB_URL" -v ON_ERROR_STOP=1 -v pub=singu_cdc -f verify/logical-publication-guard.sql
\set ON_ERROR_STOP on
\pset pager off
\if :{?pub}
\else
  \set pub singu_cdc
\endif
-- psql nao interpola :'pub' dentro de $BODY$...$BODY$; o valor vai por GUC de sessao.
SELECT set_config('guard.pub', :'pub', false) AS _cfg \gset

SELECT p.pubname, p.puballtables, p.pubinsert, p.pubupdate, p.pubdelete, p.pubtruncate
  FROM pg_publication p
 WHERE p.pubname = :'pub';

SELECT schemaname, tablename
  FROM pg_publication_tables
 WHERE pubname = :'pub'
 ORDER BY schemaname, tablename;

DO $BODY$
DECLARE
  v_pub    text := current_setting('guard.pub');
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
