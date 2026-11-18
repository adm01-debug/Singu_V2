-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260418155258
-- nome:   fix_rpcs_instant_kpis_and_duplicate_contacts_v2

-- ============================================================================
-- Fix 1: get_instant_kpis
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_instant_kpis()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'empresas', jsonb_build_object(
      'total',        (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'ativas',       (SELECT COUNT(*) FROM companies WHERE status = 'ativo' AND deleted_at IS NULL),
      'novas_hoje',   (SELECT COUNT(*) FROM companies WHERE created_at::date = CURRENT_DATE AND deleted_at IS NULL),
      'novas_semana', (SELECT COUNT(*) FROM companies WHERE created_at >= date_trunc('week', now()) AND deleted_at IS NULL)
    ),
    'clientes', jsonb_build_object(
      'total',       (SELECT COUNT(*) FROM customers WHERE deleted_at IS NULL),
      'ativados',    (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND deleted_at IS NULL),
      'compradores', (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND deleted_at IS NULL),
      'valor_total', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE deleted_at IS NULL)
    ),
    'interacoes', jsonb_build_object(
      'hoje',   (SELECT COUNT(*) FROM interactions WHERE created_at::date = CURRENT_DATE),
      'semana', (SELECT COUNT(*) FROM interactions WHERE created_at >= date_trunc('week', now())),
      'mes',    (SELECT COUNT(*) FROM interactions WHERE created_at >= date_trunc('month', now()))
    ),
    'alertas', jsonb_build_object(
      'pendentes',       (SELECT COUNT(*) FROM alerts 
                          WHERE status = 'pending' AND dismissed = false),
      'alta_prioridade', (SELECT COUNT(*) FROM alerts 
                          WHERE status = 'pending' AND dismissed = false AND priority = 'high')
    ),
    'followups', jsonb_build_object(
      'pendentes', (SELECT COUNT(*) FROM interactions 
                    WHERE requer_followup = true AND followup_concluido = false),
      'atrasados', (SELECT COUNT(*) FROM interactions 
                    WHERE requer_followup = true AND followup_concluido = false 
                      AND data_followup < now())
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================================
-- Fix 2: get_duplicate_contacts (DEFAULT 100 preservado)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_duplicate_contacts(p_limit integer DEFAULT 100)
RETURNS TABLE(
  contact_id uuid, 
  contact_name text, 
  company_id uuid, 
  email text, 
  duplicate_group integer
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH contact_emails_agg AS (
    SELECT 
      ct.id          AS ct_id,
      ct.full_name   AS ct_full_name,
      ct.company_id  AS ct_company_id,
      (SELECT ce.email 
         FROM contact_emails ce 
        WHERE ce.contact_id = ct.id 
          AND ce.is_primary 
        LIMIT 1) AS ct_email
    FROM contacts ct 
    WHERE ct.deleted_at IS NULL
  ),
  duplicates AS (
    SELECT 
      cea.ct_email AS dup_email,
      DENSE_RANK() OVER (ORDER BY cea.ct_email) AS grp
    FROM contact_emails_agg cea
    WHERE cea.ct_email IS NOT NULL
    GROUP BY cea.ct_email 
    HAVING COUNT(*) > 1
  )
  SELECT 
    c.ct_id                 AS contact_id,
    c.ct_full_name::text    AS contact_name,
    c.ct_company_id         AS company_id,
    c.ct_email::text        AS email,
    d.grp::int              AS duplicate_group
  FROM contact_emails_agg c
  JOIN duplicates d ON c.ct_email = d.dup_email
  ORDER BY d.grp, c.ct_full_name
  LIMIT p_limit;
END;
$$;
