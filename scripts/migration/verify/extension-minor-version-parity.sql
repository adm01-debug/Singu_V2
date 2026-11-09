-- extension-minor-version-parity.sql — Rodada 20/10
-- Proposito: snapshot das versoes instaladas x versao padrao disponivel no servidor,
--            para diff entre SRC e DEST.
-- Classe   : AUDIT (informativo; nunca falha por achado)
-- Variaveis: nenhuma
-- Saida    : 0.
-- Nota     : usa default_version (alvo de CREATE/ALTER EXTENSION UPDATE). MAX(version)
--            textual erra a ordem ('1.9' > '1.10').
\set ON_ERROR_STOP on
\pset pager off
\echo '== extension-minor-version-parity =='
SELECT e.extname, e.extversion AS installed,
       a.default_version AS latest_available
  FROM pg_extension e
  LEFT JOIN pg_available_extensions a ON a.name = e.extname
 ORDER BY e.extname;
\echo 'REC: rodar em SRC e DEST; diff em extversion pode alterar planner.'
