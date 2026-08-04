-- ============================================================================
-- Ordem topológica de tabelas do schema public via Kahn sobre pg_constraint.
-- Saída: uma tabela por linha, no formato "NN\tnome_tabela" (NN = 3 dígitos).
-- Uso:   psql "$SOURCE_DB_URL" -Atq -f scripts/migration/table-order.sql
-- ----------------------------------------------------------------------------
-- Tabelas em ciclo (FK auto-referente ou mútua) aparecem no final, marcadas
-- com prefixo "999" — o import as processa com session_replication_role=replica
-- então a ordem exata deixa de importar para elas.
-- ============================================================================

WITH RECURSIVE
base_tables AS (
  SELECT c.oid, c.relname
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r','p')          -- tabelas comuns + particionadas
    AND NOT c.relispartition            -- partições vêm do DDL
),
fk_edges AS (
  -- aresta: dependente -> referenciada (dependente precisa vir DEPOIS)
  SELECT DISTINCT
    con.conrelid   AS dependent_oid,
    con.confrelid  AS referenced_oid
  FROM pg_constraint con
  WHERE con.contype = 'f'
    AND con.conrelid  IN (SELECT oid FROM base_tables)
    AND con.confrelid IN (SELECT oid FROM base_tables)
    AND con.conrelid <> con.confrelid   -- ignora auto-referência
),
kahn AS (
  -- nível 0: tabelas sem dependência de FK
  SELECT bt.oid, bt.relname, 0 AS level
  FROM base_tables bt
  WHERE NOT EXISTS (SELECT 1 FROM fk_edges e WHERE e.dependent_oid = bt.oid)
  UNION ALL
  -- nível N+1: dependente cujo pai já entrou em nível <= N
  SELECT bt.oid, bt.relname, k.level + 1
  FROM base_tables bt
  JOIN fk_edges e ON e.dependent_oid = bt.oid
  JOIN kahn k     ON k.oid = e.referenced_oid
  WHERE k.level < 20                    -- guarda contra ciclo mútuo
),
ranked AS (
  SELECT relname, MAX(level) AS depth
  FROM kahn
  GROUP BY relname
),
missing AS (
  -- tabelas em ciclo mútuo (não atingidas pela recursão) — vão pro fim
  SELECT bt.relname, 999 AS depth
  FROM base_tables bt
  WHERE NOT EXISTS (SELECT 1 FROM ranked r WHERE r.relname = bt.relname)
),
ordered AS (
  SELECT relname, depth FROM ranked
  UNION ALL
  SELECT relname, depth FROM missing
)
SELECT lpad((row_number() OVER (ORDER BY depth, relname))::text, 3, '0')
       || E'\t' || relname
FROM ordered
ORDER BY depth, relname;