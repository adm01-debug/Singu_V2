-- O RBAC estava desligado na pratica: 1 de 18 usuarios tinha papel (adm01, admin) e, sem
-- papel, RequirePermission e fail-open — `if (isLoading || userRoles.length === 0) return
-- <>{children}</>`. Ou seja, 17 usuarios passavam por todas as rotas guardadas.
--
-- Popular papeis sem completar a matriz BLOQUEARIA telas que esses usuarios usam hoje:
-- `salesperson` nao tem view_analytics nem view_audit, e as 7 rotas guardadas em
-- src/lib/routePermissions.ts cobrem /analytics, /nlp-analytics, /intelligence/auditoria
-- e /intelligence/relacionamento/auditoria. Por isso o grant vem na mesma migration.

-- 1) salesperson ja acessa /analytics, /nlp-analytics e as duas rotas de auditoria via
--    fail-open. Sem view_analytics e view_audit o papel bloquearia essas 4 telas.
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'salesperson'::public.app_role, p.id
FROM public.permissions p
WHERE p.name IN ('view_analytics', 'view_audit')
ON CONFLICT (role, permission_id) DO NOTHING;

-- 2) manager tambem nao tem view_audit e passa por fail-open nas rotas de auditoria.
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager'::public.app_role, p.id
FROM public.permissions p
WHERE p.name = 'view_audit'
ON CONFLICT (role, permission_id) DO NOTHING;

-- 3) Papeis por usuario. ti@ vira admin; a operacao comercial vira salesperson, que ja
--    cobre view_settings (/configuracoes), view_goals (/metas), view_cadences (/sequencias)
--    e view_playbooks (/playbooks e subrotas) sem grant adicional.
--    As identidades sinteticas de QA (qa-rls-baseline, qa.agente.ia, sentinel-deny-*,
--    e2e@, qa-nav-*) ficam SEM papel de proposito: continuam fail-open como hoje, para
--    nao alterar o comportamento dos testes de negacao.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
       CASE
         WHEN u.email IN ('adm01@promobrindes.com.br', 'ti@promobrindes.com.br')
           THEN 'admin'::public.app_role
         ELSE 'salesperson'::public.app_role
       END
FROM auth.users u
WHERE u.email ~ '^(adm01|ti|comercial[0-9]{2}|cad01|teste)@promobrindes\.com\.br$'
ON CONFLICT (user_id, role) DO NOTHING;