-- statement-timeout-audit.sql — Rodada 17/10
-- Timeouts por role: statement, idle_in_transaction, lock. Roles publicas
-- sem timeout expoem o banco a queries longas que exaurem pool.
\echo '== statement-timeout-audit =='
SELECT r.rolname,
       COALESCE((SELECT option_value FROM pg_options_to_table(r.rolconfig)
                 WHERE option_name = 'statement_timeout'), 'unset') AS statement_timeout,
       COALESCE((SELECT option_value FROM pg_options_to_table(r.rolconfig)
                 WHERE option_name = 'idle_in_transaction_session_timeout'), 'unset') AS idle_tx_timeout,
       COALESCE((SELECT option_value FROM pg_options_to_table(r.rolconfig)
                 WHERE option_name = 'lock_timeout'), 'unset') AS lock_timeout
  FROM pg_roles r
 WHERE r.rolname IN ('anon','authenticated','service_role','authenticator')
 ORDER BY r.rolname;
\echo 'WARN: anon/authenticated devem ter statement_timeout <= 8s e idle_tx_timeout <= 60s.'