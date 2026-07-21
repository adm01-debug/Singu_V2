-- role-membership-parity.sql — Rodada 17/10
-- Snapshot canonico da hierarquia de roles para diff src vs dest.
\echo '== role-membership-parity =='
SELECT r.rolname AS role,
       array_agg(m.rolname ORDER BY m.rolname) FILTER (WHERE m.rolname IS NOT NULL) AS members
  FROM pg_roles r
  LEFT JOIN pg_auth_members am ON am.roleid = r.oid
  LEFT JOIN pg_roles m ON m.oid = am.member
 WHERE r.rolname NOT LIKE 'pg\_%'
   AND r.rolname NOT IN ('postgres','supabase_admin','supabase_auth_admin','supabase_storage_admin','supabase_realtime_admin','supabase_replication_admin','dashboard_user')
 GROUP BY r.rolname
 ORDER BY r.rolname;
\echo 'INFO: exportar src/dest e diff. Divergencia = escalonamento silencioso.'