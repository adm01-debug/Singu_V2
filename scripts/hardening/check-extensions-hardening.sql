-- check-extensions-hardening.sql — Auditoria hardening 26/11.
-- Confere extensões esperadas para hardening/observabilidade/segurança.
-- Instaladas na produção auditada: pg_stat_statements, pgcrypto, plpgsql,
-- plpgsql_check, supabase_vault, vector, unaccent, uuid-ossp, pg_trgm,
-- pg_net, pg_cron, http.
-- NÃO instaladas (recomendadas para hardening): amcheck (verificação de
-- corrupção física de índices), pg_visibility (visibilidade all-visible),
-- pg_stat_monitor (alternativa/complemento ao pg_stat_statements).
-- Este guard FALHA quando uma extensão OBRIGATÓRIA falta. amcheck/pg_visibility/
-- pg_stat_monitor são recomendadas mas opcionais na plataforma Supabase.
-- Uso:   psql "$SUPABASE_DB_URL" -X -f scripts/hardening/check-extensions-hardening.sql
-- Saída: tabela esperada x instalada; termina com "OK check-extensions-hardening." (código 0)
--   ou "FATAL: ..." no stderr (código 3). Somente leitura.
-- Parâmetros (psql -v):
--   obrigatorias='a,b,c'  lista obrigatória (padrão: as 5 que as migrations do app usam —
--                         pg_stat_statements, pgcrypto, plpgsql, pg_net, pg_cron);
--   opcionais='a,b'       lista recomendada (padrão: amcheck, pg_visibility, pg_stat_monitor);
--   strict_optional=1     trata as opcionais como obrigatórias.
\echo '== check-extensions-hardening =='
\pset pager off
\set ON_ERROR_STOP on
\if :{?obrigatorias}
\else
  \set obrigatorias 'pg_stat_statements,pgcrypto,plpgsql,pg_net,pg_cron'
\endif
\if :{?opcionais}
\else
  \set opcionais 'amcheck,pg_visibility,pg_stat_monitor'
\endif
\if :{?strict_optional}
\else
  \set strict_optional 0
\endif
SELECT lower(:'strict_optional') IN ('1', 'true', 'on', 'yes', 'sim') AS estrito \gset

-- Probe: cada extensão esperada, se está instalada e em qual versão.
WITH esperadas AS (
  SELECT x AS extensao, 'obrigatoria' AS classe
    FROM unnest(regexp_split_to_array(btrim(:'obrigatorias'), '\s*,\s*')) AS x WHERE x <> ''
  UNION ALL
  SELECT x, 'opcional'
    FROM unnest(regexp_split_to_array(btrim(:'opcionais'), '\s*,\s*')) AS x WHERE x <> ''
)
SELECT s.extensao, s.classe, (e.oid IS NOT NULL) AS instalada, e.extversion AS versao
  FROM esperadas s
  LEFT JOIN pg_catalog.pg_extension e ON e.extname = s.extensao
 ORDER BY s.classe, s.extensao;

SELECT count(*) FILTER (WHERE classe = 'obrigatoria') AS faltam_obrigatorias,
       count(*) FILTER (WHERE classe = 'opcional')    AS faltam_opcionais,
       COALESCE(string_agg(extensao, ', ' ORDER BY extensao) FILTER (WHERE classe = 'obrigatoria'), '') AS lista_obrigatorias,
       COALESCE(string_agg(extensao, ', ' ORDER BY extensao) FILTER (WHERE classe = 'opcional'), '')    AS lista_opcionais
  FROM (SELECT x AS extensao, 'obrigatoria' AS classe
          FROM unnest(regexp_split_to_array(btrim(:'obrigatorias'), '\s*,\s*')) AS x WHERE x <> ''
        UNION ALL
        SELECT x, 'opcional'
          FROM unnest(regexp_split_to_array(btrim(:'opcionais'), '\s*,\s*')) AS x WHERE x <> '') s
 WHERE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_extension e WHERE e.extname = s.extensao) \gset
SELECT :faltam_obrigatorias > 0 AS falta_obrigatoria,
       (:faltam_opcionais > 0 AND :'estrito'::boolean) AS falta_opcional_estrita,
       :faltam_opcionais > 0 AS falta_opcional \gset

\if :falta_obrigatoria
  \warn 'FATAL: check-extensions-hardening: extensoes OBRIGATORIAS ausentes:' :lista_obrigatorias
  DO $$ BEGIN RAISE EXCEPTION 'check-extensions-hardening reprovado'; END $$;
\endif
\if :falta_opcional_estrita
  \warn 'FATAL: check-extensions-hardening (strict): extensoes opcionais ausentes:' :lista_opcionais
  DO $$ BEGIN RAISE EXCEPTION 'check-extensions-hardening reprovado'; END $$;
\endif
\if :falta_opcional
  \echo 'AVISO: extensoes opcionais de hardening ausentes:' :lista_opcionais
\endif
\echo 'OK check-extensions-hardening.'
