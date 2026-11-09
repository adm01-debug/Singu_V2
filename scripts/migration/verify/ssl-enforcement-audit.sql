-- ssl-enforcement-audit.sql — Rodada 24/10 (gap 24)
-- Proposito: conexoes sem SSL em prod = credenciais em texto claro na rede.
-- Classe   : GUARD FATAL
-- Limiar   : ssl <> on; ou qualquer client backend conectado por TCP sem TLS.
--            Conexoes por unix socket (client_addr nulo) nao trafegam na rede e nao contam.
-- Variaveis: nenhuma
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Requer   : config de cluster (ssl) — lado "ok" so e testavel em sandbox Docker.
\set ON_ERROR_STOP on
\pset pager off
\echo '== ssl-enforcement-audit =='
SELECT name, setting FROM pg_settings
 WHERE name IN ('ssl','ssl_min_protocol_version','ssl_ciphers');
SELECT COUNT(*) FILTER (WHERE ssl = false AND a.client_addr IS NOT NULL) AS plaintext_conns,
       COUNT(*) FILTER (WHERE ssl = true)  AS tls_conns,
       COUNT(*) FILTER (WHERE ssl = false AND a.client_addr IS NULL) AS socket_conns
  FROM pg_stat_ssl s
  JOIN pg_stat_activity a ON a.pid = s.pid
 WHERE a.backend_type = 'client backend';
DO $$
DECLARE v_ssl text; v_plain int;
BEGIN
  SELECT setting INTO v_ssl FROM pg_settings WHERE name='ssl';
  IF v_ssl IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'FATAL: ssl=%. Habilitar TLS obrigatoriamente em prod.', COALESCE(v_ssl, '<desconhecido>');
  END IF;
  SELECT COUNT(*) INTO v_plain
    FROM pg_stat_ssl s JOIN pg_stat_activity a ON a.pid=s.pid
   WHERE a.backend_type='client backend' AND s.ssl=false
     AND a.client_addr IS NOT NULL;
  IF v_plain > 0 THEN
    RAISE EXCEPTION 'FATAL: % conexoes cliente TCP sem TLS.', v_plain;
  END IF;
END $$;
\echo 'OK TLS enforced.'
