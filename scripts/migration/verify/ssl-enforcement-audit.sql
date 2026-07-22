-- ssl-enforcement-audit.sql — Rodada 24/10 (gap 24)
-- Conexoes sem SSL em prod = credenciais em texto claro na rede.
\echo '== ssl-enforcement-audit =='
SELECT name, setting FROM pg_settings
 WHERE name IN ('ssl','ssl_min_protocol_version','ssl_ciphers');
SELECT COUNT(*) FILTER (WHERE ssl = false) AS plaintext_conns,
       COUNT(*) FILTER (WHERE ssl = true)  AS tls_conns
  FROM pg_stat_ssl s
  JOIN pg_stat_activity a ON a.pid = s.pid
 WHERE a.backend_type = 'client backend';
DO $$
DECLARE v_ssl text; v_plain int;
BEGIN
  SELECT setting INTO v_ssl FROM pg_settings WHERE name='ssl';
  IF v_ssl <> 'on' THEN
    RAISE EXCEPTION 'FATAL: ssl=%. Habilitar TLS obrigatoriamente em prod.', v_ssl;
  END IF;
  SELECT COUNT(*) INTO v_plain
    FROM pg_stat_ssl s JOIN pg_stat_activity a ON a.pid=s.pid
   WHERE a.backend_type='client backend' AND s.ssl=false;
  IF v_plain > 0 THEN
    RAISE EXCEPTION 'FATAL: % conexoes cliente sem TLS.', v_plain;
  END IF;
END $$;
\echo 'OK TLS enforced.'