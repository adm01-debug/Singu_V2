-- logical-replica-identity.sql — Rodada 25/10 (FATAL)
-- Proposito: tabelas publicadas sem identidade de replica nao replicam UPDATE/DELETE
--            via logical decoding: o CDC perde eventos em silencio.
-- Classe   : GUARD FATAL
-- Limiar   : tabela em publicacao com REPLICA IDENTITY NOTHING, ou DEFAULT sem PK.
--            (FULL e USING INDEX sao aceitos.)
-- Variaveis: nenhuma
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
\set ON_ERROR_STOP on
\pset pager off
\echo '== logical-replica-identity =='
SELECT p.pubname, pt.schemaname, pt.tablename, c.relreplident
  FROM pg_publication_tables pt
  JOIN pg_publication p ON p.pubname = pt.pubname
  JOIN pg_class c ON c.oid = (quote_ident(pt.schemaname)||'.'||quote_ident(pt.tablename))::regclass
  LEFT JOIN pg_index i ON i.indrelid = c.oid AND i.indisprimary
 WHERE c.relreplident = 'n'
    OR (c.relreplident = 'd' AND i.indexrelid IS NULL)
 ORDER BY pt.schemaname, pt.tablename;
DO $$
DECLARE v_bad int;
BEGIN
  SELECT count(DISTINCT c.oid) INTO v_bad
    FROM pg_publication_tables pt
    JOIN pg_class c ON c.oid = (quote_ident(pt.schemaname)||'.'||quote_ident(pt.tablename))::regclass
    LEFT JOIN pg_index i ON i.indrelid = c.oid AND i.indisprimary
   WHERE c.relreplident = 'n'
      OR (c.relreplident = 'd' AND i.indexrelid IS NULL);
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'FATAL: % tabela(s) publicada(s) sem PK nem REPLICA IDENTITY FULL/USING INDEX. CDC perde UPDATE/DELETE.', v_bad;
  END IF;
END $$;
\echo 'OK replica identity adequada em todas as publicacoes.'
