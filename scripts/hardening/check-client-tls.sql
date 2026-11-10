-- check-client-tls.sql — Auditoria hardening 26/11.
-- Garante que toda conexão remota de CLIENTE (backend_type='client backend')
-- use TLS. Exceções legítimas de monitoramento local do provedor
-- (postgres_exporter via localhost) são ignoradas — não transportam dado
-- de cliente, e o próprio ssl=on força TLS para qualquer host remoto.
-- Produção auditada: 10 conexões em TLSv1.3; a única sem TLS é o
-- postgres_exporter local (::1), que este guard ignora.
-- "Remota" = veio por TCP de um IP fora de `ips_locais`. Conexão por socket Unix
-- (client_addr nulo) é local e não usa TLS por natureza — a versão antiga a acusava.
-- Sem o papel pg_read_all_stats o PostgreSQL esconde o endereço/TLS das sessões de outros
-- usuários: nesse caso o guard FALHA dizendo que não consegue auditar, em vez de dar OK às cegas.
-- Uso:   psql "$SUPABASE_DB_URL" -X -f scripts/hardening/check-client-tls.sql
-- Saída: resumo por TLS; termina com "OK check-client-tls." (código 0) ou "FATAL: ..." (código 3).
--   Somente leitura.
-- Parâmetros (psql -v): ips_locais='127.0.0.1,::1' (IPs tratados como locais; '' = nenhum);
--   ignorar_apps='postgres_exporter' (application_name ignorados).
\echo '== check-client-tls =='
\pset pager off
\set ON_ERROR_STOP on
\if :{?ips_locais}
\else
  \set ips_locais '127.0.0.1,::1'
\endif
\if :{?ignorar_apps}
\else
  \set ignorar_apps 'postgres_exporter'
\endif
SELECT set_config('singu.ips_locais', :'ips_locais', false),
       set_config('singu.ignorar_apps', :'ignorar_apps', false) \gset _cfg_

-- Probe: conexões remotas de cliente por TLS e versão de protocolo.
SELECT a.backend_type,
       count(*) FILTER (WHERE s.ssl)     AS com_tls,
       count(*) FILTER (WHERE NOT s.ssl) AS sem_tls,
       string_agg(DISTINCT s.version, ', ' ORDER BY s.version) AS versoes_tls
  FROM pg_catalog.pg_stat_ssl s
  JOIN pg_catalog.pg_stat_activity a ON a.pid = s.pid
 WHERE a.backend_type = 'client backend'
   AND COALESCE(a.application_name, '') <> ALL (regexp_split_to_array(btrim(:'ignorar_apps'), '\s*,\s*'))
   AND a.client_addr IS NOT NULL
   AND host(a.client_addr) <> ALL (regexp_split_to_array(btrim(:'ips_locais'), '\s*,\s*'))
 GROUP BY a.backend_type;

DO $BODY$
DECLARE
  v_sem_tls int;
  v_ocultas int := 0;
  v_ssl     text;
BEGIN
  SELECT setting INTO v_ssl FROM pg_catalog.pg_settings WHERE name = 'ssl';
  IF v_ssl <> 'on' THEN
    RAISE EXCEPTION 'FATAL: ssl=% — servidor aceitando conexoes sem TLS.', v_ssl;
  END IF;

  IF NOT (SELECT rolsuper FROM pg_catalog.pg_roles WHERE rolname = current_user)
     AND NOT pg_catalog.pg_has_role(current_user, 'pg_read_all_stats', 'USAGE') THEN
    SELECT count(*) INTO v_ocultas
      FROM pg_catalog.pg_stat_activity a
     WHERE a.backend_type IS NULL  -- sem o papel, o tipo/endereço/TLS das sessões alheias vêm nulos
       AND a.usesysid IS DISTINCT FROM (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = current_user);
  END IF;
  IF v_ocultas > 0 THEN
    RAISE EXCEPTION 'FATAL: sem permissao para auditar % sessao(oes) de outros usuarios (conceda pg_read_all_stats a %).',
                    v_ocultas, current_user;
  END IF;

  SELECT count(*) INTO v_sem_tls
    FROM pg_catalog.pg_stat_ssl s
    JOIN pg_catalog.pg_stat_activity a ON a.pid = s.pid
   WHERE a.backend_type = 'client backend' AND NOT s.ssl
     AND COALESCE(a.application_name, '') <> ALL (regexp_split_to_array(btrim(current_setting('singu.ignorar_apps')), '\s*,\s*'))
     AND a.client_addr IS NOT NULL
     AND host(a.client_addr) <> ALL (regexp_split_to_array(btrim(current_setting('singu.ips_locais')), '\s*,\s*'));

  IF v_sem_tls > 0 THEN
    RAISE EXCEPTION 'FATAL: % conexao(oes) remota(s) de cliente SEM TLS.', v_sem_tls;
  END IF;
  RAISE NOTICE 'OK: todos os client backends remotos com TLS.';
END
$BODY$;
\echo 'OK check-client-tls.'
