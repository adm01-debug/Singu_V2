-- Corrige as RPCs usadas pelo frontend (allowlist da edge external-data +
-- chamadas .rpc diretas) que referenciavam colunas/tabelas inexistentes no
-- banco canônico, e cria as 7 RPCs da allowlist que não existiam.
--
-- Mapeamento real (verificado via information_schema/pg_proc no canônico):
--   contacts.telefone          -> contacts.phone        (whatsapp já existe)
--   companies.telefone/email   -> company_phones / company_emails
--   companies.uf/cidade        -> company_addresses.estado / .cidade (is_primary)
--   interactions.tipo_interacao-> interactions.type
--   interactions.resumo_interacao -> interactions.resumo
--   interactions.followup_pendente -> requer_followup AND NOT followup_concluido
--   interactions.usuario_responsavel_id é INTEGER (id legado Bitrix); o nome do
--     vendedor vem de customers.vendedor_nome (salespeople.id é uuid, incompatível)
--   reminders.contact_id/deal_id/due_date -> não existem (reminder_date/is_completed)
--   alerts.resolved_at/tipo_alerta/titulo/prioridade -> status/actioned_at/dismissed,
--     type, title, priority
--   time_analysis -> contact_time_analysis (sem response_rate: calcula de
--     success_count/total_attempts)
--   company_status 'qualificado' -> 'ativo' (labels reais: ativo/inativo/suspenso)
--   contact_emails.observacao -> contact_emails.contexto
--   tasks.notes -> tasks.description
--   similarity()/operador % -> pg_trgm no schema extensions
--
-- Todas as funções continuam SECURITY INVOKER: rodam sob RLS com o JWT do
-- usuário (20261007100000) e os grants existentes são preservados pelo
-- CREATE OR REPLACE (assinaturas inalteradas).

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Enums de domínio existem no canônico mas podem faltar em schemas aplicados
-- só por migrations (preview/CI): garantimos a existência antes das assinaturas.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='email_type') THEN
    CREATE TYPE public.email_type AS ENUM
      ('corporativo','pessoal','financeiro','nfe','marketing','comercial','compras');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='phone_type') THEN
    CREATE TYPE public.phone_type AS ENUM
      ('celular_corporativo','fixo_comercial','celular_pessoal','invalido');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
                 WHERE n.nspname='public' AND t.typname='company_status') THEN
    CREATE TYPE public.company_status AS ENUM ('ativo','inativo','suspenso');
  END IF;
END $$;

-- ── Dashboard & KPIs ────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_daily_summary(p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  today_start timestamptz := date_trunc('day', now());
BEGIN
  SELECT jsonb_build_object(
    'data', today_start::date,
    'vendedor_id', p_vendedor_id,
    'hoje', jsonb_build_object(
      'interacoes', (
        SELECT COUNT(*) FROM interactions
        WHERE created_at >= today_start
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      ),
      'empresas_contatadas', (
        SELECT COUNT(DISTINCT company_id) FROM interactions
        WHERE created_at >= today_start
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      ),
      'novos_contatos', (
        SELECT COUNT(*) FROM contacts
        WHERE created_at >= today_start
        AND deleted_at IS NULL
      )
    ),
    'pendencias', jsonb_build_object(
      'followups_hoje', (
        SELECT COUNT(*) FROM interactions
        WHERE requer_followup = true
        AND COALESCE(followup_concluido, false) = false
        AND data_followup::date = CURRENT_DATE
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      ),
      'followups_atrasados', (
        SELECT COUNT(*) FROM interactions
        WHERE requer_followup = true
        AND COALESCE(followup_concluido, false) = false
        AND data_followup < now()
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      ),
      'alertas_pendentes', (
        SELECT COUNT(*) FROM alerts a
        LEFT JOIN customers cu ON cu.company_id = a.company_id
        WHERE a.status = 'pending'
        AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
      )
    ),
    'meta_diaria', jsonb_build_object(
      'meta_interacoes', 5,
      'realizado', (
        SELECT COUNT(*) FROM interactions
        WHERE created_at >= today_start
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      ),
      'percentual', (
        SELECT LEAST(ROUND(COUNT(*)::numeric / 5 * 100, 0), 100) FROM interactions
        WHERE created_at >= today_start
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      )
    )
  ) INTO result;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_conversion_funnel(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_leads int;
  v_contacted int;
  v_qualified int;
  v_proposal int;
  v_won int;
BEGIN
  SELECT COUNT(*) INTO v_leads
  FROM companies WHERE created_at >= NOW() - (p_days || ' days')::interval AND deleted_at IS NULL;

  SELECT COUNT(DISTINCT company_id) INTO v_contacted
  FROM interactions WHERE data_interacao >= NOW() - (p_days || ' days')::interval;

  -- company_status no canônico: ativo/inativo/suspenso
  SELECT COUNT(*) INTO v_qualified
  FROM companies WHERE status = 'ativo' AND updated_at >= NOW() - (p_days || ' days')::interval;

  SELECT COUNT(*) INTO v_proposal
  FROM deals WHERE created_at >= NOW() - (p_days || ' days')::interval;

  SELECT COUNT(*) INTO v_won
  FROM deals WHERE status = 'ganho' AND updated_at >= NOW() - (p_days || ' days')::interval;

  v_result := jsonb_build_object(
    'period_days', p_days,
    'stages', jsonb_build_array(
      jsonb_build_object('stage', 'leads', 'count', v_leads, 'pct', 100),
      jsonb_build_object('stage', 'contacted', 'count', v_contacted, 'pct', CASE WHEN v_leads > 0 THEN ROUND((v_contacted::numeric/v_leads)*100,1) ELSE 0 END),
      jsonb_build_object('stage', 'qualified', 'count', v_qualified, 'pct', CASE WHEN v_leads > 0 THEN ROUND((v_qualified::numeric/v_leads)*100,1) ELSE 0 END),
      jsonb_build_object('stage', 'proposal', 'count', v_proposal, 'pct', CASE WHEN v_leads > 0 THEN ROUND((v_proposal::numeric/v_leads)*100,1) ELSE 0 END),
      jsonb_build_object('stage', 'won', 'count', v_won, 'pct', CASE WHEN v_leads > 0 THEN ROUND((v_won::numeric/v_leads)*100,1) ELSE 0 END)
    ),
    'overall_conversion', CASE WHEN v_leads > 0 THEN ROUND((v_won::numeric/v_leads)*100,2) ELSE 0 END,
    'calculated_at', NOW()
  );

  RETURN v_result;
END;
$function$;

-- ── Contacts ────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_contact(p_company_id uuid, p_full_name text, p_email text DEFAULT NULL::text, p_telefone text DEFAULT NULL::text, p_cargo text DEFAULT NULL::text, p_whatsapp text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  new_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  -- Verificar se empresa existe
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_company_id AND deleted_at IS NULL) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Empresa não encontrada');
  END IF;

  -- full_name é GENERATED (first_name + last_name): dividimos o nome recebido
  INSERT INTO contacts (company_id, first_name, last_name, email, phone, cargo, whatsapp, user_id)
  VALUES (
    p_company_id,
    split_part(TRIM(p_full_name), ' ', 1),
    NULLIF(TRIM(regexp_replace(TRIM(p_full_name), '^\S*\s*', '')), ''),
    p_email, p_telefone, p_cargo, p_whatsapp, auth.uid()
  )
  RETURNING id INTO new_id;

  SELECT jsonb_build_object(
    'success', true,
    'contact_id', new_id,
    'company_id', p_company_id,
    'message', 'Contato criado com sucesso'
  ) INTO result;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_contact(p_contact_id uuid, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result   jsonb;
  affected int;
BEGIN
  -- full_name é GENERATED: aceitamos 'full_name' (divide) ou 'first_name'/'last_name' diretos
  UPDATE contacts SET
    first_name = COALESCE(
      CASE WHEN p_data ? 'full_name'
           THEN split_part(TRIM(p_data->>'full_name'), ' ', 1)
           ELSE p_data->>'first_name' END,
      first_name),
    last_name  = COALESCE(
      CASE WHEN p_data ? 'full_name'
           THEN NULLIF(TRIM(regexp_replace(TRIM(p_data->>'full_name'), '^\S*\s*', '')), '')
           ELSE p_data->>'last_name' END,
      last_name),
    email      = COALESCE(p_data->>'email',     email),
    phone      = COALESCE(p_data->>'telefone',  phone),
    cargo      = COALESCE(p_data->>'cargo',     cargo),
    whatsapp   = COALESCE(p_data->>'whatsapp',  whatsapp),
    updated_at = now()
  WHERE id = p_contact_id
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Contato não encontrado ou acesso negado');
  ELSE
    result := jsonb_build_object('success', true, 'contact_id', p_contact_id, 'message', 'Contato atualizado');
  END IF;
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_contact_email(p_contact_id uuid, p_email character varying, p_email_type email_type DEFAULT NULL::email_type, p_is_primary boolean DEFAULT NULL::boolean, p_fonte character varying DEFAULT NULL::character varying, p_observacao text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO contact_emails (contact_id, email, email_type, is_primary, fonte, contexto)
  VALUES (p_contact_id, p_email, p_email_type, p_is_primary, p_fonte, p_observacao)
  ON CONFLICT (contact_id, LOWER(email)) DO UPDATE SET
    updated_at = NOW(),
    fonte = COALESCE(EXCLUDED.fonte, contact_emails.fonte),
    contexto = COALESCE(EXCLUDED.contexto, contact_emails.contexto),
    is_primary = COALESCE(EXCLUDED.is_primary, contact_emails.is_primary)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_relationship_consistency(p_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_contact RECORD;
    v_int_count INTEGER;
    v_last_int TIMESTAMP WITH TIME ZONE;
    v_issues JSONB := '[]'::jsonb;
BEGIN
    SELECT * INTO v_contact FROM public.contacts WHERE id = p_contact_id;

    IF NOT FOUND THEN
        v_issues := v_issues || jsonb_build_object('type', 'contact_not_found');
        RETURN jsonb_build_object(
            'contact_id', p_contact_id,
            'consistent', false,
            'issues', v_issues,
            'timestamp', now()
        );
    END IF;

    -- contadores denormalizados (interactions_count/last_interaction_at) não
    -- existem no canônico: reporta os valores reais computados das interações
    SELECT count(*), max(data_interacao) INTO v_int_count, v_last_int
    FROM public.interactions WHERE contact_id = p_contact_id;

    RETURN jsonb_build_object(
        'contact_id', p_contact_id,
        'consistent', jsonb_array_length(v_issues) = 0,
        'issues', v_issues,
        'interactions_count', v_int_count,
        'last_interaction_at', v_last_int,
        'timestamp', now()
    );
END;
$function$;

-- ── Contact Search ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.find_contacts_by_role(p_role_pattern text, p_limit integer DEFAULT 50)
 RETURNS TABLE(contact_id uuid, contact_name text, role text, company_name text, email text, phone text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ct.id as contact_id,
    COALESCE(ct.full_name, ct.first_name)::text as contact_name,
    ct.cargo::text as role,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as company_name,
    (SELECT ce.email FROM contact_emails ce WHERE ce.contact_id = ct.id AND ce.is_primary LIMIT 1)::text as email,
    (SELECT cp.numero FROM contact_phones cp WHERE cp.contact_id = ct.id AND cp.is_primary LIMIT 1)::text as phone
  FROM contacts ct
  JOIN companies c ON c.id = ct.company_id
  WHERE ct.deleted_at IS NULL
    AND ct.cargo ILIKE '%' || p_role_pattern || '%'
  ORDER BY ct.full_name
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_contacts_by_role()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'total_contatos', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
    'por_cargo', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT
          COALESCE(NULLIF(TRIM(cargo), ''), 'Não informado') as cargo,
          COUNT(*) as total,
          ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL), 0) * 100, 2) as percentual
        FROM contacts
        WHERE deleted_at IS NULL
        GROUP BY COALESCE(NULLIF(TRIM(cargo), ''), 'Não informado')
        ORDER BY COUNT(*) DESC
        LIMIT 20
      ) t
    ),
    'cargos_decisores', (
      SELECT COUNT(*) FROM contacts
      WHERE deleted_at IS NULL
      AND LOWER(cargo) SIMILAR TO '%(diretor|gerente|presidente|ceo|cfo|cto|owner|proprietário|sócio|dono)%'
    ),
    'com_email', (SELECT COUNT(*) FROM contacts WHERE email IS NOT NULL AND email != '' AND deleted_at IS NULL),
    'com_telefone', (SELECT COUNT(*) FROM contacts WHERE phone IS NOT NULL AND phone != '' AND deleted_at IS NULL),
    'com_whatsapp', (SELECT COUNT(*) FROM contacts WHERE whatsapp IS NOT NULL AND whatsapp != '' AND deleted_at IS NULL)
  ) INTO result;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_contacts_fuzzy(search_term text, limit_results integer DEFAULT 20)
 RETURNS TABLE(id uuid, full_name text, company_id uuid, similarity_score real)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT c.id, c.full_name, c.company_id,
         GREATEST(
           similarity(COALESCE(c.full_name, ''), search_term),
           similarity(COALESCE(c.first_name, ''), search_term),
           similarity(COALESCE(c.last_name, ''), search_term),
           similarity(COALESCE(c.apelido, '')::text, search_term)
         ) as similarity_score
  FROM contacts c
  WHERE c.deleted_at IS NULL
  AND (
    c.full_name % search_term OR
    c.first_name % search_term OR
    c.last_name % search_term OR
    c.apelido::text % search_term
  )
  ORDER BY similarity_score DESC
  LIMIT limit_results;
END;
$function$;

CREATE OR REPLACE FUNCTION public.export_contacts_csv(p_limit integer DEFAULT 1000)
 RETURNS TABLE(id text, full_name text, email text, telefone text, cargo text, company_name text, created_at text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ct.id::text,
    COALESCE(ct.full_name, ct.first_name)::text as full_name,
    (SELECT ce.email FROM contact_emails ce WHERE ce.contact_id = ct.id AND ce.is_primary LIMIT 1)::text as email,
    (SELECT cp.numero FROM contact_phones cp WHERE cp.contact_id = ct.id AND cp.is_primary LIMIT 1)::text as telefone,
    ct.cargo::text,
    COALESCE(co.nome_fantasia, co.nome_crm, co.razao_social)::text as company_name,
    ct.created_at::text
  FROM contacts ct
  LEFT JOIN companies co ON co.id = ct.company_id
  WHERE ct.deleted_at IS NULL
  ORDER BY ct.created_at DESC
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.export_contacts_csv(p_company_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(nome text, cargo text, email text, telefone text, whatsapp text, empresa text, criado_em timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT COALESCE(ct.full_name, ct.first_name)::text as nome,
         ct.cargo::text,
         (SELECT ce.email FROM contact_emails ce WHERE ce.contact_id = ct.id AND ce.is_primary LIMIT 1)::text as email,
         (SELECT cp.numero FROM contact_phones cp WHERE cp.contact_id = ct.id AND cp.is_primary LIMIT 1)::text as telefone,
         (SELECT cp.numero FROM contact_phones cp WHERE cp.contact_id = ct.id AND cp.is_whatsapp LIMIT 1)::text as whatsapp,
         COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as empresa,
         ct.created_at as criado_em
  FROM contacts ct
  JOIN companies c ON c.id = ct.company_id
  WHERE ct.deleted_at IS NULL
    AND (p_company_id IS NULL OR ct.company_id = p_company_id)
  ORDER BY COALESCE(ct.full_name, ct.first_name);
END;
$function$;

-- ── Companies ───────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_company(p_nome_crm text, p_cnpj text DEFAULT NULL::text, p_email text DEFAULT NULL::text, p_telefone text DEFAULT NULL::text, p_endereco text DEFAULT NULL::text, p_cidade text DEFAULT NULL::text, p_uf text DEFAULT NULL::text, p_cep text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  result jsonb;
  new_id uuid;
BEGIN
  INSERT INTO companies (nome_crm, cnpj, status, user_id)
  VALUES (p_nome_crm, p_cnpj, 'ativo', auth.uid())
  RETURNING id INTO new_id;

  -- dados de contato/endereço vivem em tabelas normalizadas no canônico
  IF p_email IS NOT NULL THEN
    INSERT INTO company_emails (company_id, email, email_type, is_primary)
    VALUES (new_id, p_email, 'corporativo', true);
  END IF;
  IF p_telefone IS NOT NULL THEN
    INSERT INTO company_phones (company_id, numero, phone_type, is_primary)
    VALUES (new_id, p_telefone, 'fixo_comercial', true);
  END IF;
  IF p_endereco IS NOT NULL OR p_cidade IS NOT NULL OR p_uf IS NOT NULL OR p_cep IS NOT NULL THEN
    INSERT INTO company_addresses (company_id, tipo, is_primary, logradouro, cidade, estado, cep)
    VALUES (new_id, 'principal', true, p_endereco, p_cidade, p_uf, p_cep);
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'company_id', new_id,
    'nome_crm', p_nome_crm,
    'message', 'Empresa criada com sucesso'
  ) INTO result;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.advanced_company_search(p_query text DEFAULT NULL::text, p_status text DEFAULT NULL::text, p_uf text DEFAULT NULL::text, p_cidade text DEFAULT NULL::text, p_vendedor_id integer DEFAULT NULL::integer, p_has_interaction boolean DEFAULT NULL::boolean, p_cliente_ativado boolean DEFAULT NULL::boolean, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, nome_crm text, razao_social text, cnpj text, uf text, cidade text, status company_status, vendedor_nome text, ultima_interacao timestamp with time zone, total_interacoes bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.nome_crm,
    c.razao_social,
    c.cnpj,
    ca.estado::text AS uf,
    ca.cidade::text,
    c.status,
    cu.vendedor_nome,
    (SELECT MAX(i.created_at) FROM interactions i WHERE i.company_id = c.id) as ultima_interacao,
    (SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id) as total_interacoes
  FROM companies c
  LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
  LEFT JOIN company_addresses ca ON ca.company_id = c.id AND ca.is_primary
  WHERE c.deleted_at IS NULL
  AND (p_query IS NULL OR (
    c.nome_crm ILIKE '%' || p_query || '%' OR
    c.razao_social ILIKE '%' || p_query || '%' OR
    c.cnpj ILIKE '%' || p_query || '%'
  ))
  AND (p_status IS NULL OR c.status::text = p_status)
  AND (p_uf IS NULL OR ca.estado = p_uf)
  AND (p_cidade IS NULL OR ca.cidade ILIKE '%' || p_cidade || '%')
  AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
  AND (p_cliente_ativado IS NULL OR cu.cliente_ativado = p_cliente_ativado)
  AND (p_has_interaction IS NULL OR (
    (p_has_interaction = true AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id)) OR
    (p_has_interaction = false AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id))
  ))
  ORDER BY c.nome_crm
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.autocomplete_companies(p_query text, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, nome_crm text, cnpj text, cidade text, uf text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT c.id, c.nome_crm, c.cnpj, ca.cidade::text, ca.estado::text AS uf
  FROM companies c
  LEFT JOIN company_addresses ca ON ca.company_id = c.id AND ca.is_primary
  WHERE c.deleted_at IS NULL
  AND (c.nome_crm ILIKE p_query || '%' OR c.nome_crm ILIKE '%' || p_query || '%')
  ORDER BY
    CASE WHEN c.nome_crm ILIKE p_query || '%' THEN 0 ELSE 1 END,
    c.nome_crm
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.fuzzy_search_companies(p_query text, p_limit integer DEFAULT 20)
 RETURNS TABLE(company_id uuid, nome_crm text, cnpj text, cidade text, uf text, similarity_score real)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id as company_id,
    c.nome_crm,
    c.cnpj,
    ca.cidade::text,
    ca.estado::text AS uf,
    GREATEST(
      similarity(LOWER(c.nome_crm), LOWER(p_query)),
      similarity(COALESCE(c.cnpj, ''), p_query)
    ) as similarity_score
  FROM companies c
  LEFT JOIN company_addresses ca ON ca.company_id = c.id AND ca.is_primary
  WHERE c.deleted_at IS NULL
  AND (
    c.nome_crm ILIKE '%' || p_query || '%'
    OR c.cnpj LIKE '%' || p_query || '%'
    OR similarity(LOWER(c.nome_crm), LOWER(p_query)) > 0.3
  )
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_company_360_view(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'company', (SELECT to_jsonb(c) - 'deleted_at' FROM companies c WHERE id = p_company_id),
    'contacts', (SELECT COALESCE(jsonb_agg(to_jsonb(ct) ORDER BY ct.created_at), '[]'::jsonb) FROM contacts ct WHERE company_id = p_company_id),
    'addresses', (SELECT COALESCE(jsonb_agg(to_jsonb(a)), '[]'::jsonb) FROM company_addresses a WHERE company_id = p_company_id),
    'recent_interactions', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', i.id, 'date', i.data_interacao, 'type', i.type,
        'notes', COALESCE(i.resumo, i.content), 'sentiment', i.sentiment
      ) ORDER BY i.data_interacao DESC), '[]'::jsonb)
      FROM (SELECT * FROM interactions WHERE company_id = p_company_id ORDER BY data_interacao DESC LIMIT 10) i
    ),
    'stats', jsonb_build_object(
      'total_interactions', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id),
      'total_contacts', (SELECT COUNT(*) FROM contacts WHERE company_id = p_company_id),
      'days_as_client', EXTRACT(DAY FROM NOW() - (SELECT created_at FROM companies WHERE id = p_company_id))::int,
      'last_contact', (SELECT MAX(data_interacao) FROM interactions WHERE company_id = p_company_id)
    ),
    'scores', jsonb_build_object(
      'engagement', calculate_engagement_score(p_company_id),
      'priority', calculate_priority_score(p_company_id),
      'health', get_company_health_score(p_company_id)
    ),
    'workflow', get_company_workflow_state(p_company_id),
    'generated_at', NOW()
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_company_timeline(p_company_id uuid, p_limit integer DEFAULT 50)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_to_json(t) ORDER BY t.data DESC)
  INTO result
  FROM (
    SELECT 'interacao' as tipo, id, type as subtipo, resumo as descricao, created_at as data
    FROM interactions WHERE company_id = p_company_id
    UNION ALL
    SELECT 'alerta' as tipo, id, type as subtipo, message as descricao, created_at as data
    FROM alerts WHERE company_id = p_company_id
    UNION ALL
    SELECT 'contato_criado' as tipo, id, 'novo_contato' as subtipo, full_name as descricao, created_at as data
    FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL
    ORDER BY data DESC
    LIMIT p_limit
  ) t;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;

CREATE OR REPLACE FUNCTION public.export_companies_csv(p_limit integer DEFAULT 1000)
 RETURNS TABLE(id text, nome_crm text, razao_social text, cnpj text, email text, telefone text, status text, created_at text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id::text,
    c.nome_crm,
    c.razao_social,
    c.cnpj,
    (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id AND ce.is_primary LIMIT 1)::text AS email,
    (SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id AND cp.is_primary LIMIT 1)::text AS telefone,
    c.status::text,
    c.created_at::text
  FROM companies c
  WHERE c.deleted_at IS NULL
  ORDER BY c.created_at DESC
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.export_companies_csv(p_filters jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(cnpj text, razao_social text, nome_fantasia text, email text, telefone text, uf text, cidade text, status text, lead_score integer, ultima_interacao date)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.cnpj::text,
    c.razao_social::text,
    c.nome_fantasia::text,
    (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id LIMIT 1)::text,
    (SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id LIMIT 1)::text,
    (SELECT ca.estado FROM company_addresses ca WHERE ca.company_id = c.id AND ca.is_primary LIMIT 1)::text,
    (SELECT ca.cidade FROM company_addresses ca WHERE ca.company_id = c.id AND ca.is_primary LIMIT 1)::text,
    c.status::text,
    0,
    (SELECT MAX(i.data_interacao)::date FROM interactions i WHERE i.company_id = c.id)
  FROM companies c
  WHERE c.deleted_at IS NULL
    AND (p_filters->>'status' IS NULL OR c.status = (p_filters->>'status')::company_status)
    AND (p_filters->>'uf' IS NULL OR EXISTS (
      SELECT 1 FROM company_addresses ca
      WHERE ca.company_id = c.id AND ca.is_primary AND ca.estado = p_filters->>'uf'))
    AND (p_filters->>'is_customer' IS NULL OR c.is_customer = (p_filters->>'is_customer')::boolean)
  ORDER BY c.nome_fantasia;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_incomplete_companies(p_limit integer DEFAULT 100)
 RETURNS TABLE(company_id uuid, company_name text, missing_fields text[], completeness_pct integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    COALESCE(c.nome_fantasia, c.nome_crm)::text,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN c.cnpj IS NULL OR c.cnpj = '' THEN 'CNPJ' END,
      CASE WHEN NOT EXISTS (SELECT 1 FROM company_emails ce WHERE ce.company_id = c.id) THEN 'Email' END,
      CASE WHEN NOT EXISTS (SELECT 1 FROM company_phones cp WHERE cp.company_id = c.id) THEN 'Telefone' END,
      CASE WHEN NOT EXISTS (SELECT 1 FROM contacts ct WHERE ct.company_id = c.id) THEN 'Contato' END
    ], NULL)::text[],
    (100 - (
      (CASE WHEN c.cnpj IS NULL OR c.cnpj = '' THEN 1 ELSE 0 END +
       CASE WHEN NOT EXISTS (SELECT 1 FROM company_emails ce WHERE ce.company_id = c.id) THEN 1 ELSE 0 END +
       CASE WHEN NOT EXISTS (SELECT 1 FROM company_phones cp WHERE cp.company_id = c.id) THEN 1 ELSE 0 END +
       CASE WHEN NOT EXISTS (SELECT 1 FROM contacts ct WHERE ct.company_id = c.id) THEN 1 ELSE 0 END
      ) * 100 / 4
    ))::int
  FROM companies c
  WHERE c.deleted_at IS NULL
  ORDER BY 4 ASC
  LIMIT p_limit;
END;
$function$;

-- ── Interactions ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_quick_interaction(p_company_id uuid, p_tipo text, p_resumo text, p_vendedor_id integer DEFAULT NULL::integer, p_followup_dias integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  INSERT INTO interactions (company_id, type, resumo, usuario_responsavel_id,
                            requer_followup, data_followup, user_id, created_by)
  VALUES (p_company_id, p_tipo, p_resumo, p_vendedor_id,
          p_followup_dias IS NOT NULL,
          CASE WHEN p_followup_dias IS NOT NULL THEN now() + (p_followup_dias || ' days')::interval END,
          auth.uid(), auth.uid())
  RETURNING id INTO new_id;

  RETURN jsonb_build_object('success', true, 'interaction_id', new_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_interaction_history(p_company_id uuid, p_tipo text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, tipo_interacao text, canal text, resumo text, created_at timestamp with time zone, usuario_responsavel_id integer, vendedor_nome text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.type AS tipo_interacao,
    i.channel AS canal,
    i.resumo,
    i.created_at,
    i.usuario_responsavel_id,
    cu.vendedor_nome
  FROM interactions i
  LEFT JOIN customers cu ON cu.company_id = i.company_id AND cu.deleted_at IS NULL
  WHERE i.company_id = p_company_id
  AND (p_tipo IS NULL OR i.type = p_tipo)
  ORDER BY i.created_at DESC
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_pending_followups(p_vendedor_id integer DEFAULT NULL::integer, p_limit integer DEFAULT 50)
 RETURNS TABLE(interaction_id uuid, company_id uuid, nome_crm text, tipo_interacao text, data_followup timestamp with time zone, dias_restantes integer, atrasado boolean, vendedor_nome text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    i.id as interaction_id,
    i.company_id,
    c.nome_crm,
    i.type AS tipo_interacao,
    i.data_followup,
    EXTRACT(DAY FROM i.data_followup - now())::int as dias_restantes,
    i.data_followup < now() as atrasado,
    cu.vendedor_nome
  FROM interactions i
  JOIN companies c ON c.id = i.company_id
  LEFT JOIN customers cu ON cu.company_id = i.company_id AND cu.deleted_at IS NULL
  WHERE i.requer_followup = true
  AND COALESCE(i.followup_concluido, false) = false
  AND i.data_followup IS NOT NULL
  AND (p_vendedor_id IS NULL OR i.usuario_responsavel_id = p_vendedor_id)
  ORDER BY i.data_followup ASC
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.complete_followup(p_interaction_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  affected int;
BEGIN
  PERFORM public.assert_interaction_access(p_interaction_id);
  UPDATE interactions SET followup_concluido = true, updated_at = now()
  WHERE id = p_interaction_id
    AND requer_followup = true
    AND COALESCE(followup_concluido, false) = false;
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    SELECT jsonb_build_object('success', false, 'message', 'Followup não encontrado ou já concluído') INTO result;
  ELSE
    SELECT jsonb_build_object('success', true, 'interaction_id', p_interaction_id, 'message', 'Followup concluído') INTO result;
  END IF;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_channel_analysis(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  start_date timestamptz := now() - (p_days || ' days')::interval;
BEGIN
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'por_canal', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT
          COALESCE(channel, 'não informado') as canal,
          COUNT(*) as total,
          ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM interactions WHERE created_at >= start_date)) * 100, 2) as percentual,
          COUNT(DISTINCT company_id) as empresas_unicas
        FROM interactions
        WHERE created_at >= start_date
        GROUP BY channel
      ) t
    ),
    'por_tipo', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.total DESC)
      FROM (
        SELECT
          COALESCE(type, 'outros') as tipo,
          COUNT(*) as total,
          ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM interactions WHERE created_at >= start_date)) * 100, 2) as percentual
        FROM interactions
        WHERE created_at >= start_date
        GROUP BY type
      ) t
    ),
    'totais', jsonb_build_object(
      'total_interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= start_date),
      'empresas_alcancadas', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE created_at >= start_date),
      'media_diaria', ROUND((SELECT COUNT(*)::numeric FROM interactions WHERE created_at >= start_date) / p_days, 2)
    )
  ) INTO result;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_best_contact_times(p_contact_id uuid)
 RETURNS TABLE(day_of_week integer, hour_of_day integer, response_rate numeric)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        ta.day_of_week,
        ta.hour_of_day,
        ROUND(ta.success_count::numeric / NULLIF(ta.total_attempts, 0), 3) AS response_rate
    FROM contact_time_analysis ta
    WHERE ta.contact_id = p_contact_id
    ORDER BY response_rate DESC
    LIMIT 3;
END;
$function$;

-- ── Tasks & Reminders ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.complete_task(p_task_id uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_task_access(p_task_id);
  UPDATE tasks SET
    status = 'completed',
    completed_at = NOW(),
    description = COALESCE(p_notes, description),
    updated_at = NOW()
  WHERE id = p_task_id;

  RETURN jsonb_build_object('success', true, 'task_id', p_task_id, 'completed_at', NOW());
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_reminder(p_user_id uuid, p_title text, p_reminder_date timestamp with time zone, p_company_id uuid DEFAULT NULL::uuid, p_contact_id uuid DEFAULT NULL::uuid, p_deal_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  PERFORM public.assert_self_user_id(p_user_id);
  -- o canônico não tem contact_id/deal_id em reminders; os ids opcionais ficam em notes
  -- priority precisa vir de chk_reminders_priority (alta/media/baixa/urgente); o default 'medium' viola o check
  INSERT INTO reminders (user_id, title, reminder_date, company_id, priority, notes)
  VALUES (p_user_id, p_title, p_reminder_date, p_company_id, 'media',
          concat_ws(' ',
            CASE WHEN p_contact_id IS NOT NULL THEN 'contact_id=' || p_contact_id END,
            CASE WHEN p_deal_id IS NOT NULL THEN 'deal_id=' || p_deal_id END))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_overdue_tasks(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50)
 RETURNS TABLE(task_type text, task_id uuid, company_id uuid, company_name text, due_date date, days_overdue integer, priority text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Follow-ups atrasados
  RETURN QUERY
  SELECT
    'follow_up'::text as task_type,
    i.id as task_id,
    i.company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as company_name,
    i.follow_up_date as due_date,
    (CURRENT_DATE - i.follow_up_date)::int as days_overdue,
    CASE WHEN CURRENT_DATE - i.follow_up_date > 7 THEN 'critical' ELSE 'high' END::text as priority
  FROM interactions i
  JOIN companies c ON c.id = i.company_id
  WHERE i.follow_up_date < CURRENT_DATE
    AND COALESCE(i.followup_concluido, false) = false
    AND (p_user_id IS NULL OR i.created_by = p_user_id)

  UNION ALL

  -- Lembretes atrasados
  SELECT
    'reminder'::text as task_type,
    r.id as task_id,
    r.company_id,
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as company_name,
    r.reminder_date::date,
    (CURRENT_DATE - r.reminder_date::date)::int as days_overdue,
    CASE WHEN CURRENT_DATE - r.reminder_date::date > 7 THEN 'critical' ELSE 'high' END::text as priority
  FROM reminders r
  LEFT JOIN companies c ON c.id = r.company_id
  WHERE r.reminder_date::date < CURRENT_DATE AND COALESCE(r.is_completed, false) = false
    AND (p_user_id IS NULL OR r.user_id = p_user_id)

  ORDER BY days_overdue DESC
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_pending_tasks(p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'vendedor_id', p_vendedor_id,
    'followups_pendentes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          i.id as interaction_id,
          i.company_id,
          c.nome_crm,
          i.data_followup,
          i.type AS tipo_interacao,
          EXTRACT(DAY FROM i.data_followup - now())::int as dias_restantes
        FROM interactions i
        JOIN companies c ON c.id = i.company_id
        WHERE i.requer_followup = true
        AND COALESCE(i.followup_concluido, false) = false
        AND (p_vendedor_id IS NULL OR i.usuario_responsavel_id = p_vendedor_id)
        AND i.data_followup IS NOT NULL
        ORDER BY i.data_followup ASC
        LIMIT 20
      ) t
    ),
    'alertas_nao_resolvidos', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          a.id as alert_id,
          a.company_id,
          c.nome_crm,
          a.type AS tipo_alerta,
          a.title AS titulo,
          a.priority AS prioridade,
          a.created_at
        FROM alerts a
        JOIN companies c ON c.id = a.company_id
        LEFT JOIN customers cu ON cu.company_id = a.company_id
        WHERE a.status = 'pending'
        AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
        ORDER BY
          CASE a.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
          a.created_at DESC
        LIMIT 20
      ) t
    ),
    'clientes_sem_interacao_30d', (
      SELECT COUNT(*)
      FROM customers cu
      WHERE cu.cliente_ativado = true
      AND cu.deleted_at IS NULL
      AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
      AND NOT EXISTS (
        SELECT 1 FROM interactions i
        WHERE i.company_id = cu.company_id
        AND i.created_at >= now() - interval '30 days'
      )
    )
  ) INTO result;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_pending_tasks(p_user_id uuid, p_include_overdue boolean DEFAULT true)
 RETURNS TABLE(task_id uuid, title text, company_name text, task_type text, priority text, due_date date, is_overdue boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT
    t.id as task_id,
    t.title::text,
    COALESCE(c.nome_fantasia, c.nome_crm)::text as company_name,
    t.task_type::text,
    t.priority::text,
    t.due_date,
    (t.due_date < CURRENT_DATE) as is_overdue
  FROM tasks t
  LEFT JOIN companies c ON c.id = t.company_id
  WHERE t.user_id = p_user_id
    AND t.status = 'pending'
    AND (p_include_overdue OR t.due_date >= CURRENT_DATE)
  ORDER BY
    CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
    t.due_date NULLS LAST;
END;
$function$;

-- ── Reports & Analytics ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_seasonality_analysis(p_months integer DEFAULT 12)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo_meses', p_months,
    'por_mes', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.mes_numero)
      FROM (
        SELECT
          EXTRACT(MONTH FROM c.created_at)::int as mes_numero,
          TO_CHAR(c.created_at, 'Month') as mes_nome,
          COUNT(*) as empresas_criadas,
          (SELECT COUNT(*) FROM interactions i
           WHERE EXTRACT(MONTH FROM i.created_at) = EXTRACT(MONTH FROM MIN(c.created_at))
           AND i.created_at >= now() - (p_months || ' months')::interval) as interacoes
        FROM companies c
        WHERE c.created_at >= now() - (p_months || ' months')::interval AND c.deleted_at IS NULL
        GROUP BY EXTRACT(MONTH FROM c.created_at)::int, TO_CHAR(c.created_at, 'Month')
      ) t
    ),
    'melhor_mes_empresas', (
      SELECT TO_CHAR(created_at, 'Month')
      FROM companies
      WHERE created_at >= now() - (p_months || ' months')::interval AND deleted_at IS NULL
      GROUP BY TO_CHAR(created_at, 'Month')
      ORDER BY COUNT(*) DESC
      LIMIT 1
    )
  ) INTO result;

  RETURN result;
END;
$function$;

-- ── Territories ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.assign_territory(p_user_id uuid, p_ufs text[])
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_updated INT := 0;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Atualiza empresas no território para o vendedor
  UPDATE companies
  SET user_id = p_user_id,
      updated_at = NOW()
  WHERE id IN (
    SELECT c.id
    FROM companies c
    JOIN company_addresses ca ON ca.company_id = c.id
    WHERE ca.tipo = 'principal'
      AND ca.estado = ANY(p_ufs)
      AND c.user_id IS NULL
      AND c.deleted_at IS NULL
  );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$function$;

-- ── RPCs que a allowlist referencia mas não existiam no canônico ────────────

CREATE OR REPLACE FUNCTION public.get_all_tasks()
 RETURNS SETOF tasks
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT * FROM tasks
  WHERE user_id = auth.uid()
  ORDER BY due_date ASC NULLS LAST, created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_tasks_by_contact(p_contact_id uuid)
 RETURNS SETOF tasks
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
  RETURN QUERY
  SELECT * FROM tasks
  WHERE contact_id = p_contact_id AND user_id = auth.uid()
  ORDER BY due_date ASC NULLS LAST, created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reopen_task(p_task_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_task_access(p_task_id);
  UPDATE tasks SET status = 'pending', completed_at = NULL, updated_at = NOW()
  WHERE id = p_task_id AND status = 'completed';
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_territory(p_territory_id uuid, p_name text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_states text[] DEFAULT NULL::text[], p_cities text[] DEFAULT NULL::text[], p_is_active boolean DEFAULT NULL::boolean, p_manager_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  affected int;
BEGIN
  UPDATE territories SET
    name        = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    states      = COALESCE(p_states, states),
    cities      = COALESCE(p_cities, cities),
    is_active   = COALESCE(p_is_active, is_active),
    manager_id  = COALESCE(p_manager_id, manager_id)
  WHERE id = p_territory_id;
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Território não encontrado');
  END IF;
  RETURN jsonb_build_object('success', true, 'territory_id', p_territory_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_follow_up(p_approval_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  affected int;
BEGIN
  UPDATE follow_up_approvals
  SET status = 'approved', approved_at = NOW(), updated_at = NOW()
  WHERE id = p_approval_id
    AND user_id = auth.uid()
    AND status = 'pending';
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Aprovação não encontrada ou já decidida');
  END IF;
  RETURN jsonb_build_object('success', true, 'approval_id', p_approval_id, 'status', 'approved');
END;
$function$;

CREATE OR REPLACE FUNCTION public.reject_follow_up(p_approval_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  affected int;
BEGIN
  UPDATE follow_up_approvals
  SET status = 'rejected', updated_at = NOW()
  WHERE id = p_approval_id
    AND user_id = auth.uid()
    AND status = 'pending';
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Aprovação não encontrada ou já decidida');
  END IF;
  RETURN jsonb_build_object('success', true, 'approval_id', p_approval_id, 'status', 'rejected');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_ai_recommendation_logs(p_limit integer DEFAULT 50)
 RETURNS SETOF ai_recommendation_audit_logs
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT * FROM ai_recommendation_audit_logs
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT p_limit;
$function$;

-- Grants das funções novas: o default do Supabase dá EXECUTE a PUBLIC/anon;
-- essas RPCs são só para usuários autenticados (service_role mantém acesso).
DO $$
DECLARE
  sig text;
  f regprocedure;
BEGIN
  FOREACH sig IN ARRAY ARRAY[
    'public.get_all_tasks()',
    'public.get_tasks_by_contact(uuid)',
    'public.reopen_task(uuid)',
    'public.update_territory(uuid,text,text,text[],text[],boolean,uuid)',
    'public.approve_follow_up(uuid)',
    'public.reject_follow_up(uuid)',
    'public.get_ai_recommendation_logs(integer)'
  ] LOOP
    f := to_regprocedure(sig);
    CONTINUE WHEN f IS NULL;
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f);
  END LOOP;
END $$;
