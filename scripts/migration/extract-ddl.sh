#!/usr/bin/env bash
# ============================================================================
# extract-ddl.sh — Extrai o schema completo do banco de origem (Lovable Cloud)
# e materializa em arquivos SQL prontos para aplicar em um novo Supabase.
#
# Pré-requisitos:
#   - Variáveis PG* (PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT) configuradas
#   - psql instalado
#
# Saída:
#   scripts/migration/ddl/{00..12}_*.sql  + 99_apply_all.sql
#
# Uso:
#   bash scripts/migration/extract-ddl.sh
# ============================================================================
set -euo pipefail

OUT_DIR="$(dirname "$0")/ddl"
mkdir -p "$OUT_DIR"

PSQL=(psql -X -q -A -t -v ON_ERROR_STOP=1)

banner() {
  cat <<EOF
-- ============================================================================
-- $1
-- Gerado por scripts/migration/extract-ddl.sh em $(date -u +%FT%TZ)
-- Fonte: $PGHOST/$PGDATABASE
-- ============================================================================

EOF
}

# ── 00 extensions ──────────────────────────────────────────────────────────
echo "▶ 00_extensions.sql"
{
  banner "EXTENSIONS"
  "${PSQL[@]}" -c "
    SELECT 'CREATE EXTENSION IF NOT EXISTS ' || quote_ident(extname)
           || ' WITH SCHEMA ' || quote_ident(n.nspname) || ';'
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE extname <> 'plpgsql'
    ORDER BY extname;"
} > "$OUT_DIR/00_extensions.sql"

# ── 01 schemas & enums ─────────────────────────────────────────────────────
echo "▶ 01_schemas_and_enums.sql"
{
  banner "SCHEMAS + ENUM TYPES"
  echo "CREATE SCHEMA IF NOT EXISTS public;"
  echo ""
  "${PSQL[@]}" -c "
    SELECT 'CREATE TYPE public.' || quote_ident(t.typname) || ' AS ENUM ('
           || string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder)
           || ');'
    FROM pg_type t
    JOIN pg_enum e     ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname;"
  echo ""
  # composite / domain types (raros, mas incluímos)
  "${PSQL[@]}" -c "
    SELECT 'CREATE DOMAIN public.' || quote_ident(t.typname) || ' AS '
           || format_type(t.typbasetype, t.typtypmod)
           || COALESCE(' DEFAULT ' || t.typdefault, '')
           || CASE WHEN t.typnotnull THEN ' NOT NULL' ELSE '' END
           || ';'
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'd'
    ORDER BY t.typname;"
} > "$OUT_DIR/01_schemas_and_enums.sql"

# ── 02 tables (colunas + PK/UK/CHECK; sem FKs) ────────────────────────────
echo "▶ 02_tables.sql"
{
  banner "TABLES (sem FKs — ver 04_foreign_keys.sql)"
  # Lista de tabelas ordenadas (particionadas incluem o pai; filhas ficam em 11_partitions.sql)
  TABLES=$("${PSQL[@]}" -c "
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r','p')
      AND c.relispartition = false
    ORDER BY c.relkind DESC, c.relname;")

  for t in $TABLES; do
    echo "-- ─── public.$t ───"
    "${PSQL[@]}" -c "
      WITH cols AS (
        SELECT a.attname,
               format_type(a.atttypid, a.atttypmod) AS coltype,
               a.attnotnull,
               pg_get_expr(d.adbin, d.adrelid) AS coldef,
               a.attnum
        FROM pg_attribute a
        LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
        WHERE a.attrelid = 'public.$t'::regclass
          AND a.attnum > 0 AND NOT a.attisdropped
        ORDER BY a.attnum
      ),
      col_lines AS (
        SELECT '  ' || quote_ident(attname) || ' ' || coltype
               || COALESCE(' DEFAULT ' || coldef, '')
               || CASE WHEN attnotnull THEN ' NOT NULL' ELSE '' END AS line,
               attnum
        FROM cols
      ),
      cons AS (
        SELECT '  CONSTRAINT ' || quote_ident(conname) || ' ' || pg_get_constraintdef(oid) AS line,
               CASE contype WHEN 'p' THEN 1 WHEN 'u' THEN 2 WHEN 'c' THEN 3 ELSE 9 END AS ord,
               conname
        FROM pg_constraint
        WHERE conrelid = 'public.$t'::regclass
          AND contype IN ('p','u','c')  -- FKs saem em 04
      )
      SELECT 'CREATE TABLE public.' || quote_ident('$t') || ' (' || chr(10)
             || string_agg(line, ',' || chr(10) ORDER BY sort_key)
             || chr(10) || ')'
             || COALESCE(
                  (SELECT ' PARTITION BY ' || pg_get_partkeydef(oid)
                   FROM pg_class WHERE oid = 'public.$t'::regclass AND relkind='p'),
                  ''
                )
             || ';'
      FROM (
        SELECT line, attnum::text AS sort_key FROM col_lines
        UNION ALL
        SELECT line, ('10000' || ord::text || conname) FROM cons
      ) x;"

    # Comentários (tabela + colunas)
    "${PSQL[@]}" -c "
      SELECT 'COMMENT ON TABLE public.' || quote_ident('$t') || ' IS '
             || quote_literal(description) || ';'
      FROM pg_description d
      JOIN pg_class c ON c.oid = d.objoid
      WHERE c.oid = 'public.$t'::regclass AND d.objsubid = 0;"
    "${PSQL[@]}" -c "
      SELECT 'COMMENT ON COLUMN public.' || quote_ident('$t') || '.' || quote_ident(a.attname)
             || ' IS ' || quote_literal(d.description) || ';'
      FROM pg_description d
      JOIN pg_class c ON c.oid = d.objoid
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.objsubid
      WHERE c.oid = 'public.$t'::regclass AND d.objsubid > 0
      ORDER BY a.attnum;"
    echo ""
  done
} > "$OUT_DIR/02_tables.sql"

# ── 03 indexes (exceto PK/UK que já vieram nas tabelas) ───────────────────
echo "▶ 03_indexes.sql"
{
  banner "INDEXES (não implícitos de PK/UK)"
  "${PSQL[@]}" -c "
    SELECT pg_get_indexdef(i.indexrelid) || ';'
    FROM pg_index i
    JOIN pg_class c   ON c.oid = i.indexrelid
    JOIN pg_class t   ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND NOT i.indisprimary
      AND NOT i.indisunique  -- unique constraints já saíram na tabela
      AND NOT EXISTS (
        SELECT 1 FROM pg_constraint co WHERE co.conindid = i.indexrelid
      )
    ORDER BY t.relname, c.relname;"
} > "$OUT_DIR/03_indexes.sql"

# ── 04 foreign keys ────────────────────────────────────────────────────────
echo "▶ 04_foreign_keys.sql"
{
  banner "FOREIGN KEYS"
  "${PSQL[@]}" -c "
    SELECT 'ALTER TABLE public.' || quote_ident(t.relname)
           || ' ADD CONSTRAINT ' || quote_ident(c.conname)
           || ' ' || pg_get_constraintdef(c.oid) || ';'
    FROM pg_constraint c
    JOIN pg_class t     ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND c.contype = 'f'
    ORDER BY t.relname, c.conname;"
} > "$OUT_DIR/04_foreign_keys.sql"

# ── 05 grants ──────────────────────────────────────────────────────────────
echo "▶ 05_grants.sql"
{
  banner "GRANTS (authenticated + service_role; anon apenas se houver policy anon)"
  "${PSQL[@]}" -c "
    WITH t AS (
      SELECT c.relname
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind IN ('r','p')
        AND c.relispartition = false
    ),
    anon_tables AS (
      SELECT DISTINCT tablename FROM pg_policies
      WHERE schemaname='public' AND 'anon' = ANY(roles)
    )
    SELECT
      'GRANT SELECT, INSERT, UPDATE, DELETE ON public.' || quote_ident(t.relname) || ' TO authenticated;' || chr(10)
      || 'GRANT ALL ON public.' || quote_ident(t.relname) || ' TO service_role;'
      || CASE WHEN a.tablename IS NOT NULL
              THEN chr(10)||'GRANT SELECT ON public.'||quote_ident(t.relname)||' TO anon;'
              ELSE '' END
    FROM t LEFT JOIN anon_tables a ON a.tablename = t.relname
    ORDER BY t.relname;"
  echo ""
  # Sequence grants
  "${PSQL[@]}" -c "
    SELECT 'GRANT USAGE, SELECT ON SEQUENCE public.' || quote_ident(c.relname)
           || ' TO authenticated, service_role;'
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='S'
    ORDER BY c.relname;"
} > "$OUT_DIR/05_grants.sql"

# ── 06 RLS enable ──────────────────────────────────────────────────────────
echo "▶ 06_rls_enable.sql"
{
  banner "ENABLE ROW LEVEL SECURITY"
  "${PSQL[@]}" -c "
    SELECT 'ALTER TABLE public.' || quote_ident(c.relname) || ' ENABLE ROW LEVEL SECURITY;'
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p')
      AND c.relispartition = false
      AND c.relrowsecurity = true
    ORDER BY c.relname;"
} > "$OUT_DIR/06_rls_enable.sql"

# ── 07 policies ────────────────────────────────────────────────────────────
echo "▶ 07_policies.sql"
{
  banner "RLS POLICIES"
  "${PSQL[@]}" -c "
    SELECT 'CREATE POLICY ' || quote_ident(policyname)
           || ' ON public.' || quote_ident(tablename)
           || ' AS ' || permissive
           || ' FOR ' || cmd
           || ' TO ' || array_to_string(roles, ', ')
           || COALESCE(' USING ('     || qual      || ')', '')
           || COALESCE(' WITH CHECK (' || with_check || ')', '')
           || ';'
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;"
} > "$OUT_DIR/07_policies.sql"

# ── 08 functions ───────────────────────────────────────────────────────────
echo "▶ 08_functions.sql"
{
  banner "FUNCTIONS (plpgsql/sql) — inclui SECURITY DEFINER e search_path"
  "${PSQL[@]}" -c "
    SELECT pg_get_functiondef(p.oid) || ';'
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
    WHERE n.nspname = 'public'
      AND d.objid IS NULL   -- exclui funções que pertencem a extensões
      AND p.prokind IN ('f','p')
    ORDER BY p.proname, p.oid;"
} > "$OUT_DIR/08_functions.sql"

# ── 09 triggers ────────────────────────────────────────────────────────────
echo "▶ 09_triggers.sql"
{
  banner "TRIGGERS"
  "${PSQL[@]}" -c "
    SELECT pg_get_triggerdef(t.oid, true) || ';'
    FROM pg_trigger t
    JOIN pg_class c    ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND NOT t.tgisinternal
    ORDER BY c.relname, t.tgname;"
} > "$OUT_DIR/09_triggers.sql"

# ── 10 views ───────────────────────────────────────────────────────────────
echo "▶ 10_views.sql"
{
  banner "VIEWS + MATERIALIZED VIEWS (security_invoker=on)"
  "${PSQL[@]}" -c "
    SELECT 'CREATE OR REPLACE VIEW public.' || quote_ident(c.relname)
           || ' WITH (security_invoker=on) AS ' || chr(10)
           || pg_get_viewdef(c.oid, true)
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='v'
    ORDER BY c.relname;"
  echo ""
  "${PSQL[@]}" -c "
    SELECT 'CREATE MATERIALIZED VIEW public.' || quote_ident(c.relname)
           || ' AS ' || chr(10) || pg_get_viewdef(c.oid, true)
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='m'
    ORDER BY c.relname;"
} > "$OUT_DIR/10_views.sql"

# ── 11 partitions (audit_log_YYYY_MM, etc.) ───────────────────────────────
echo "▶ 11_partitions.sql"
{
  banner "PARTIÇÕES (attach às tabelas particionadas do passo 02)"
  "${PSQL[@]}" -c "
    SELECT 'CREATE TABLE public.' || quote_ident(child.relname)
           || ' PARTITION OF public.' || quote_ident(parent.relname)
           || ' ' || pg_get_expr(child.relpartbound, child.oid) || ';'
    FROM pg_inherits i
    JOIN pg_class child    ON child.oid  = i.inhrelid
    JOIN pg_class parent   ON parent.oid = i.inhparent
    JOIN pg_namespace np   ON np.oid = parent.relnamespace
    WHERE np.nspname = 'public'
    ORDER BY parent.relname, child.relname;"
} > "$OUT_DIR/11_partitions.sql"

# ── 12 cron jobs ───────────────────────────────────────────────────────────
echo "▶ 12_cron_jobs.sql"
{
  banner "CRON JOBS — aplicar APENAS após deploy das edge functions no destino"
  echo "-- Requer extensão pg_cron habilitada (ver 00_extensions.sql)."
  echo ""
  if "${PSQL[@]}" -c "SELECT to_regclass('cron.job')" | grep -q cron.job; then
    "${PSQL[@]}" -c "
      SELECT 'SELECT cron.schedule('
             || quote_literal(jobname) || ', '
             || quote_literal(schedule) || ', '
             || quote_literal(command)  || ');'
      FROM cron.job
      ORDER BY jobname;"
  else
    echo "-- Extensão pg_cron ausente na origem — nenhum job para exportar."
  fi
} > "$OUT_DIR/12_cron_jobs.sql"

# ── 99 apply_all ───────────────────────────────────────────────────────────
echo "▶ 99_apply_all.sql"
cat > "$OUT_DIR/99_apply_all.sql" <<'SQL'
-- ============================================================================
-- APPLY ALL — ordem obrigatória de aplicação no destino.
-- Uso: psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f 99_apply_all.sql
-- ============================================================================
\echo '── 00 extensions'          \i 00_extensions.sql
\echo '── 01 schemas + enums'     \i 01_schemas_and_enums.sql
\echo '── 02 tables'              \i 02_tables.sql
\echo '── 11 partitions'          \i 11_partitions.sql
\echo '── 03 indexes'             \i 03_indexes.sql
\echo '── 04 foreign keys'        \i 04_foreign_keys.sql
\echo '── 05 grants'              \i 05_grants.sql
\echo '── 08 functions (antes de policies porque policies chamam has_role)'
\i 08_functions.sql
\echo '── 06 RLS enable'          \i 06_rls_enable.sql
\echo '── 07 policies'            \i 07_policies.sql
\echo '── 09 triggers'            \i 09_triggers.sql
\echo '── 10 views'               \i 10_views.sql
\echo ''
\echo '⚠ 12_cron_jobs.sql deve ser aplicado SEPARADAMENTE após as edge functions'
\echo '  estarem publicadas no destino. Rode manualmente:'
\echo '     psql "$TARGET_DB_URL" -f 12_cron_jobs.sql'
SQL

# ── Relatório ──────────────────────────────────────────────────────────────
echo ""
echo "=================================================="
echo "  Extração concluída — $OUT_DIR"
echo "=================================================="
wc -l "$OUT_DIR"/*.sql | sort -n
echo ""
echo "Contagens na origem:"
"${PSQL[@]}" -c "
  SELECT 'extensions'  AS obj, COUNT(*) FROM pg_extension WHERE extname<>'plpgsql'
  UNION ALL SELECT 'enums',      COUNT(*) FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typtype='e'
  UNION ALL SELECT 'tables',     COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p') AND c.relispartition=false
  UNION ALL SELECT 'partitions', COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relispartition=true
  UNION ALL SELECT 'indexes',    COUNT(*) FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT i.indisprimary
  UNION ALL SELECT 'fks',        COUNT(*) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND c.contype='f'
  UNION ALL SELECT 'policies',   COUNT(*) FROM pg_policies WHERE schemaname='public'
  UNION ALL SELECT 'functions',  COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public'
  UNION ALL SELECT 'triggers',   COUNT(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND NOT t.tgisinternal
  UNION ALL SELECT 'views',      COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='v'
  UNION ALL SELECT 'matviews',   COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='m'
  ORDER BY obj;"