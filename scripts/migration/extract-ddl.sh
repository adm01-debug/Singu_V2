#!/usr/bin/env bash
# ============================================================================
# extract-ddl.sh — Extrai o schema completo do banco de origem (Lovable Cloud)
# e materializa em arquivos SQL prontos para aplicar em um novo Supabase.
# Somente leitura na origem.
#
# Pré-requisitos:
#   - Variáveis PG* (PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT) configuradas
#     OU SRC_DB_URL (usada quando PGHOST/PGDATABASE não estão definidas)
#   - psql instalado
#
# Saída:
#   scripts/migration/ddl/{00..12}_*.sql  + 99_apply_all.sql
#   (DDL_OUT_DIR=<pasta> grava em outro lugar)
#
# Uso:
#   bash scripts/migration/extract-ddl.sh
#
# A extração é feita numa pasta temporária e só substitui os arquivos de saída
# se TODAS as etapas derem certo — uma falha no meio não deixa o pacote DDL
# pela metade. Exit: 0 ok · 1 falha na extração (saída intacta) · 2 uso/config.
# ============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source-path=SCRIPTDIR source=_lib.sh
source "$HERE/_lib.sh"
MIG_TAG="extract-ddl"

case "${1:-}" in
  -h|--help) mig_help "${BASH_SOURCE[0]}"; exit 0 ;;
  "") ;;
  *) mig_die 2 "argumento desconhecido: $1 (veja --help)" ;;
esac

FINAL_DIR="${DDL_OUT_DIR:-$HERE/ddl}"
mig_need psql
if [[ -z "${PGHOST:-}" && -z "${PGDATABASE:-}" && -z "${PGSERVICE:-}" ]]; then
  mig_load_env "$HERE/.env" "$HERE/env.migration"
  mig_alias SRC_DB_URL SOURCE_DB_URL
  [[ -n "${SRC_DB_URL:-}" ]] || mig_die 2 "defina as variáveis PG* (PGHOST, PGDATABASE, ...) ou SRC_DB_URL"
  mig_pg_split "$SRC_DB_URL"
  [[ -z "$MIG_PG_PASSWORD" ]] || export PGPASSWORD="$MIG_PG_PASSWORD"
  PSQL=(psql -d "$MIG_PG_URL" -X -q -A -t -v ON_ERROR_STOP=1)
  FONTE="$(mig_target "$SRC_DB_URL")"
else
  PSQL=(psql -X -q -A -t -v ON_ERROR_STOP=1)
  FONTE="${PGHOST:-local}/${PGDATABASE:-}"
fi
"${PSQL[@]}" -c "SELECT 1" >/dev/null 2>&1 || mig_die 1 "não consegui conectar na origem ($FONTE)"

mkdir -p "$FINAL_DIR"
OUT_DIR="$(mktemp -d)"
on_exit() {
  local rc=$?
  rm -rf "$TMP_OUT"
  if [[ $rc -ne 0 ]]; then echo "✖ extração falhou — $FINAL_DIR não foi alterado" >&2; fi
}
TMP_OUT="$OUT_DIR"
trap on_exit EXIT
trap 'exit 130' INT TERM

banner() {
  cat <<EOF
-- ============================================================================
-- $1
-- Gerado por scripts/migration/extract-ddl.sh em $(date -u +%FT%TZ)
-- Fonte: $FONTE
-- ============================================================================

EOF
}

# ── 00 extensions ──────────────────────────────────────────────────────────
echo "▶ 00_extensions.sql"
{
  banner "EXTENSIONS"
  # schemas onde as extensões vivem precisam existir antes do CREATE EXTENSION
  "${PSQL[@]}" -c "
    SELECT DISTINCT 'CREATE SCHEMA IF NOT EXISTS ' || quote_ident(n.nspname) || ';'
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE extname <> 'plpgsql' AND n.nspname NOT IN ('public', 'pg_catalog')
    ORDER BY 1;"
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
           || COALESCE((SELECT string_agg(' CONSTRAINT ' || quote_ident(c.conname) || ' ' || pg_get_constraintdef(c.oid), '' ORDER BY c.conname)
                        FROM pg_constraint c WHERE c.contypid = t.oid), '')
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
  # Sequences de colunas serial (as de IDENTITY nascem junto com a coluna).
  "${PSQL[@]}" -c "
    SELECT format('CREATE SEQUENCE IF NOT EXISTS public.%I AS %s INCREMENT BY %s MINVALUE %s MAXVALUE %s START WITH %s CACHE %s%s;',
                  c.relname, format_type(s.seqtypid, NULL), s.seqincrement, s.seqmin, s.seqmax, s.seqstart, s.seqcache,
                  CASE WHEN s.seqcycle THEN ' CYCLE' ELSE '' END)
    FROM pg_sequence s
    JOIN pg_class c     ON c.oid = s.seqrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'i')
    ORDER BY c.relname;"
  echo ""
  # Uma consulta só para todas as tabelas (qualquer nome, inclusive com espaço/maiúscula);
  # particionadas incluem o pai; filhas ficam em 11_partitions.sql.
  "${PSQL[@]}" -c "
    SELECT '-- ─── public.' || c.relname || ' ───' || chr(10)
           || 'CREATE TABLE public.' || quote_ident(c.relname) || ' (' || chr(10)
           || (SELECT string_agg(x.line, ',' || chr(10) ORDER BY x.grp, x.ord, x.name)
               FROM (
                 SELECT '  ' || quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod)
                        || CASE
                             WHEN a.attidentity = 'a' THEN ' GENERATED ALWAYS AS IDENTITY'
                             WHEN a.attidentity = 'd' THEN ' GENERATED BY DEFAULT AS IDENTITY'
                             WHEN a.attgenerated = 's' THEN ' GENERATED ALWAYS AS (' || pg_get_expr(d.adbin, d.adrelid) || ') STORED'
                             ELSE COALESCE(' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid), '')
                           END
                        || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END AS line,
                        1 AS grp, a.attnum::int AS ord, '' AS name
                 FROM pg_attribute a
                 LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
                 WHERE a.attrelid = c.oid AND a.attnum > 0 AND NOT a.attisdropped
                 UNION ALL
                 SELECT '  CONSTRAINT ' || quote_ident(co.conname) || ' ' || pg_get_constraintdef(co.oid),
                        2, CASE co.contype WHEN 'p' THEN 1 WHEN 'u' THEN 2 ELSE 3 END, co.conname
                 FROM pg_constraint co
                 WHERE co.conrelid = c.oid AND co.contype IN ('p','u','c')   -- FKs saem em 04
               ) x)
           || chr(10) || ')'
           || CASE WHEN c.relkind = 'p' THEN ' PARTITION BY ' || pg_get_partkeydef(c.oid) ELSE '' END
           || ';'
           || COALESCE(chr(10) || (SELECT 'COMMENT ON TABLE public.' || quote_ident(c.relname) || ' IS ' || quote_literal(de.description) || ';'
                                   FROM pg_description de WHERE de.objoid = c.oid AND de.classoid = 'pg_class'::regclass AND de.objsubid = 0), '')
           || COALESCE(chr(10) || (SELECT string_agg('COMMENT ON COLUMN public.' || quote_ident(c.relname) || '.' || quote_ident(a.attname)
                                                     || ' IS ' || quote_literal(de.description) || ';', chr(10) ORDER BY a.attnum)
                                   FROM pg_description de
                                   JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = de.objsubid
                                   WHERE de.objoid = c.oid AND de.classoid = 'pg_class'::regclass AND de.objsubid > 0), '')
           || chr(10)
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r','p')
      AND c.relispartition = false
    ORDER BY c.relkind DESC, c.relname;"
  # Devolve a posse das sequences serial às colunas (DROP TABLE leva a sequence junto).
  "${PSQL[@]}" -c "
    SELECT format('ALTER SEQUENCE public.%I OWNED BY public.%I.%I;', s.relname, t.relname, a.attname)
    FROM pg_depend d
    JOIN pg_class s     ON s.oid = d.objid AND s.relkind = 'S'
    JOIN pg_class t     ON t.oid = d.refobjid
    JOIN pg_namespace n ON n.oid = s.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
    WHERE n.nspname = 'public' AND d.deptype = 'a' AND d.classid = 'pg_class'::regclass
    ORDER BY s.relname;"
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
  # Índice de tabela particionada sai como CREATE INDEX ... ON ONLY (pai INVALID até todas as
  # partições serem anexadas): sem estas linhas o pai fica INVALID no destino.
  "${PSQL[@]}" -c "
    SELECT format('ALTER INDEX public.%I ATTACH PARTITION public.%I;', pi.relname, ci.relname)
    FROM pg_inherits inh
    JOIN pg_class ci      ON ci.oid = inh.inhrelid  AND ci.relkind = 'i'
    JOIN pg_class pi      ON pi.oid = inh.inhparent AND pi.relkind = 'I'
    JOIN pg_index xi      ON xi.indexrelid = ci.oid
    JOIN pg_class tc      ON tc.oid = xi.indrelid
    JOIN pg_namespace n   ON n.oid = tc.relnamespace
    WHERE n.nspname = 'public'
      AND NOT xi.indisprimary AND NOT xi.indisunique
      AND NOT EXISTS (SELECT 1 FROM pg_constraint co WHERE co.conindid = ci.oid)
    ORDER BY tc.relname, pi.relname, ci.relname;"
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
  banner "GRANTS (tabelas: authenticated + service_role, anon só com policy anon; funções: EXECUTE como na origem)"
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
  echo ""
  # EXECUTE das funções (mesmo conjunto de 08_functions.sql). Sem isto o destino herda o padrão do
  # Postgres — EXECUTE para PUBLIC — e toda SECURITY DEFINER fica chamável por anon. O estado da
  # origem (pg_proc.proacl; NULL = padrão do dono) é replicado: zera as roles da API e concede de volta.
  echo "-- EXECUTE das funções de public (espelha pg_proc.proacl da origem)"
  "${PSQL[@]}" -c "
    SELECT 'REVOKE ALL ON ROUTINE ' || f.sig || ' FROM PUBLIC, anon, authenticated, service_role;'
           || COALESCE(chr(10) || 'GRANT EXECUTE ON ROUTINE ' || f.sig || ' TO ' || f.grantees || ';', '')
    FROM (
      SELECT 'public.' || quote_ident(p.proname) || '(' || oidvectortypes(p.proargtypes) || ')' AS sig,
             (SELECT string_agg(CASE a.grantee WHEN 0 THEN 'PUBLIC' ELSE quote_ident(r.rolname) END, ', '
                                ORDER BY a.grantee <> 0, r.rolname)
              FROM aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner))) a
              LEFT JOIN pg_roles r ON r.oid = a.grantee
              WHERE a.privilege_type = 'EXECUTE'
                AND (a.grantee = 0 OR r.rolname IN ('anon', 'authenticated', 'service_role'))) AS grantees
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
      WHERE n.nspname = 'public'
        AND d.objid IS NULL
        AND p.prokind IN ('f','p')
    ) f
    ORDER BY f.sig;"
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
    ORDER BY c.oid;  -- ordem de criação: uma view só depende de views mais antigas"
  echo ""
  "${PSQL[@]}" -c "
    SELECT 'CREATE MATERIALIZED VIEW public.' || quote_ident(c.relname)
           || ' AS ' || chr(10) || pg_get_viewdef(c.oid, true)
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='m'
    ORDER BY c.oid;"
  # Comentários de views/materialized views e de suas colunas (o tipo do objeto vem de relkind:
  # COMMENT ON TABLE em view dá 42809). Ficam aqui, depois do CREATE VIEW.
  "${PSQL[@]}" -c "
    SELECT format('COMMENT ON %s public.%I IS %L;',
                  CASE c.relkind WHEN 'm' THEN 'MATERIALIZED VIEW' ELSE 'VIEW' END, c.relname, de.description)
    FROM pg_description de
    JOIN pg_class c     ON c.oid = de.objoid AND de.classoid = 'pg_class'::regclass AND de.objsubid = 0
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('v','m')
    ORDER BY c.oid;"
  "${PSQL[@]}" -c "
    SELECT format('COMMENT ON COLUMN public.%I.%I IS %L;', c.relname, a.attname, de.description)
    FROM pg_description de
    JOIN pg_class c     ON c.oid = de.objoid AND de.classoid = 'pg_class'::regclass AND de.objsubid > 0
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = de.objsubid
    WHERE n.nspname = 'public' AND c.relkind IN ('v','m')
    ORDER BY c.oid, a.attnum;"
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
--      (pode ser chamado de qualquer diretório: os \ir são relativos a este arquivo)
--
-- NÃO É IDEMPOTENTE: os arquivos 01–11 são dump (CREATE TYPE/TABLE/POLICY sem
-- IF NOT EXISTS) para um projeto Supabase NOVO E VAZIO. Rodar duas vezes no mesmo
-- banco para no primeiro "already exists" — recrie o projeto destino antes de repetir.
--
-- Ordem: 00 → 01 → 02 → 11 → 10 → 08 → 03 → 04 → 05 → 06 → 07 → 09
--   10 antes de 08: search_contacts_by_nlp() RETURNS SETOF vw_contacts_nlp (tipo da view);
--                   as views só usam tabelas e funções nativas.
--   08 antes de 03: 4 índices GIN usam public.immutable_unaccent().
--   08 antes de 07: policies chamam public.has_role() e afins.
--   08 antes de 05: 05_grants.sql termina com REVOKE/GRANT EXECUTE de cada função de public
--                   (sem isso toda SECURITY DEFINER fica executável por PUBLIC/anon).
--   check_function_bodies=off em 08 (como o pg_dump faz): há função SQL que referencia
--   objeto criado depois / fora do search_path dela; o corpo é validado só na chamada.
-- ============================================================================
\echo '── 00 extensions'
\ir 00_extensions.sql
\echo '── 01 schemas + enums'
\ir 01_schemas_and_enums.sql
\echo '── 02 tables (sem FKs)'
\ir 02_tables.sql
\echo '── 11 partitions'
\ir 11_partitions.sql
\echo '── 10 views (antes das functions: há função que retorna SETOF de view)'
\ir 10_views.sql
\echo '── 08 functions (antes de índices e policies: ambos chamam funções de public)'
SET check_function_bodies = off;
\ir 08_functions.sql
RESET check_function_bodies;
\echo '── 03 indexes'
\ir 03_indexes.sql
\echo '── 04 foreign keys'
\ir 04_foreign_keys.sql
\echo '── 05 grants'
\ir 05_grants.sql
\echo ''
\echo '⏸ PONTO DE PAUSA RECOMENDADO PARA MIGRAÇÃO DE DADOS'
\echo '   Se o destino for receber dados via scripts/migration/import-data.sh:'
\echo '     1. deixe rodar até 05_grants.sql (functions e views já foram criadas acima)'
\echo '     2. INTERROMPA antes de 06_rls_enable.sql'
\echo '     3. rode export-data.sh na origem e import-data.sh no destino'
\echo '     4. rode 06/07/09 manualmente'
\echo '     5. bash scripts/migration/compare-counts.sh'
\echo '   Ver docs/MIGRATION_DATA.md.'
\echo ''
\echo '── 06 RLS enable'
\ir 06_rls_enable.sql
\echo '── 07 policies'
\ir 07_policies.sql
\echo '── 09 triggers'
\ir 09_triggers.sql
\echo ''
\echo '⚠ 12_cron_jobs.sql deve ser aplicado SEPARADAMENTE, após:'
\echo '   (1) edge functions publicadas no destino'
\echo '   (2) extensão pg_cron habilitada'
\echo '   psql "$TARGET_DB_URL" -f 12_cron_jobs.sql'
SQL

# ── Publica: só agora os arquivos de saída são substituídos ────────────────
for f in "$OUT_DIR"/*.sql; do
  cp "$f" "$FINAL_DIR/$(basename "$f").new.$$"
done
for f in "$OUT_DIR"/*.sql; do
  mv -f "$FINAL_DIR/$(basename "$f").new.$$" "$FINAL_DIR/$(basename "$f")"
done
OUT_DIR="$FINAL_DIR"

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