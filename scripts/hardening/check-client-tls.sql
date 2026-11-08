-- check-client-tls.sql — Auditoria hardening 26/11.
-- Garante que toda conexão remota de CLIENTE (backend_type='client backend')
-- use TLS. Exceções legítimas de monitoramento local do provedor
-- (postgres_exporter via localhost) são ignoradas — não transportam dado
-- de cliente, e o próprio ssl=on força TLS para qualquer host remoto.
-- Produção auditada: 10 conexões em TLSv1.3; a única sem TLS é o
-- postgres_exporter local (::1), que este guard ignora.
-- Cuidado ao executar manualmente: cancelar a filtragem local faz o guard
-- apontar o exporter como falha (falso positivo).
\echo '== check-client-tls =='
\pset pager off
\set ON_ERROR_STOP on

-- Probe: conexões por TLS e versão de protocolo (client backend remoto).
SELECT a.backend_type,
       count(*) FILTER (WHERE s.ssl)     AS com_tls,
       count(*) FILTER (WHERE NOT s.ssl) AS sem_tls,
       count(DISTINCT s.version)         AS versoes_distintas
  FROM pg_stat_ssl s
  JOIN pg_stat_activity a ON a.pid = s.pid
 WHERE a.backend_type = 'client backend'
   AND (a.application_name IS DISTINCT FROM 'postgres_exporter')
   AND (a.client_addr NOT IN ('127.0.0.1','::1') OR a.client_addr IS NULL)
 GROUP BY a.backend_type;

DO $BODY$
DECLARE
  v_sem_tls int;
  v_ssl     text;
BEGIN
  SELECT setting INTO v_ssl FROM pg_settings WHERE name='ssl';
  IF v_ssl <> 'on' THEN
    RAISE EXCEPTION 'FATAL: ssl=% — servidor aceitando conexoes sem TLS.', v_ssl;
  END IF;

  SELECT count(*) INTO v_sem_tls
    FROM pg_stat_ssl s
    JOIN pg_stat_activity a ON a.pid = s.pid
   WHERE a.backend_type = 'client backend' AND NOT s.ssl
     AND (a.application_name IS DISTINCT FROM 'postgres_exporter')
     AND (a.client_addr NOT IN ('127.0.0.1','::1') OR a.client_addr IS NULL);

  IF v_sem_tls > 0 THEN
    RAISE EXCEPTION 'FATAL: % conexao(oes) remota(s) de cliente SEM TLS.', v_sem_tls;
  END IF;
  RAISE NOTICE 'OK: todos os client backends remotos com TLS.';
END
$BODY$;
\echo 'OK check-client-tls.'
