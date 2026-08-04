-- pg-hba-permissive-audit.sql — Rodada 22/10
\echo '== pg-hba-permissive-audit =='
SELECT line_number, type, database, user_name, address, netmask, auth_method
  FROM pg_hba_file_rules
 WHERE error IS NULL
 ORDER BY line_number;
SELECT COUNT(*) AS permissive_rules
  FROM pg_hba_file_rules
 WHERE address IN ('0.0.0.0/0','::0/0','all')
   AND auth_method IN ('trust','password');
\echo 'REC: evitar 0.0.0.0/0 + trust/password. Preferir scram-sha-256 + CIDR restrito.'