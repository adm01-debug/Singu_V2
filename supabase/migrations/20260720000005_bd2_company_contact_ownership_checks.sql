-- BD-2 / SEC-DB: 21 SECURITY DEFINER functions lacked ownership checks on
-- companies, contacts, and proposals.  These functions bypass RLS, so any
-- authenticated user could mutate another tenant's data via direct RPC calls.
--
-- Guard pattern used throughout:
--   (auth.uid() IS NULL OR user_id = auth.uid())
-- When called with the service-role key (webhook handlers, n8n automations,
-- Edge Functions using SUPABASE_SERVICE_ROLE_KEY), auth.uid() is NULL and
-- the guard is skipped, preserving system-level access.
-- When called with a user JWT, auth.uid() is the caller's UUID and the
-- function silently restricts to rows the caller owns.
--
-- Tier-1 (user must own the target record):
--   add_tag, remove_tag, remove_company_tag, bulk_add_tag
--   update_company_partial, update_company_status, bulk_update_status
--   move_to_pipeline_stage
--   soft_delete_company, restore_company
--   soft_delete_contact, update_contact
--   definir_como_filial, definir_hierarquia_cooperativa, vincular_empresa_grupo
--   respond_to_proposal
--
-- Tier-2 (admin-only when called with a user JWT; service-role bypasses):
--   merge_companies, merge_duplicate_companies
--   merge_contacts, merge_duplicate_contacts
--   bulk_reassign_companies

-- ── Tier-1 ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.add_tag(p_company_id uuid, p_tag text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  UPDATE companies
  SET tags_array = array_append(COALESCE(tags_array, '{}'), p_tag)
  WHERE id = p_company_id
    AND NOT (p_tag = ANY(COALESCE(tags_array, '{}')))
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_tag(p_company_id uuid, p_tag text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  UPDATE companies
  SET tags_array = array_remove(tags_array, p_tag)
  WHERE id = p_company_id
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_company_tag(p_company_id uuid, p_tag text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  UPDATE companies
  SET tags_array = array_remove(tags_array, LOWER(TRIM(p_tag))),
      updated_at = NOW()
  WHERE id = p_company_id
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_add_tag(p_company_ids uuid[], p_tag text)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_count int;
BEGIN
  UPDATE companies
  SET tags_array = array_append(COALESCE(tags_array, '{}'), p_tag)
  WHERE id = ANY(p_company_ids)
    AND NOT (p_tag = ANY(COALESCE(tags_array, '{}')))
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_company_partial(p_company_id uuid, p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result   jsonb;
  affected int;
BEGIN
  UPDATE companies SET
    nome_crm      = COALESCE(p_data->>'nome_crm',      nome_crm),
    razao_social  = COALESCE(p_data->>'razao_social',  razao_social),
    nome_fantasia = COALESCE(p_data->>'nome_fantasia',  nome_fantasia),
    cnpj          = COALESCE(p_data->>'cnpj',           cnpj),
    email         = COALESCE(p_data->>'email',          email),
    telefone      = COALESCE(p_data->>'telefone',       telefone),
    endereco      = COALESCE(p_data->>'endereco',       endereco),
    cidade        = COALESCE(p_data->>'cidade',         cidade),
    uf            = COALESCE(p_data->>'uf',             uf),
    cep           = COALESCE(p_data->>'cep',            cep),
    updated_at    = now()
  WHERE id = p_company_id
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Empresa não encontrada ou acesso negado');
  ELSE
    result := jsonb_build_object('success', true, 'company_id', p_company_id, 'message', 'Empresa atualizada');
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_company_status(p_company_id uuid, p_status text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result   jsonb;
  affected int;
BEGIN
  IF p_status NOT IN ('ativo', 'inativo', 'suspenso') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Status inválido. Use: ativo, inativo, suspenso');
  END IF;

  UPDATE companies
  SET status     = p_status::company_status,
      updated_at = now()
  WHERE id = p_company_id
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Empresa não encontrada ou acesso negado');
  ELSE
    result := jsonb_build_object('success', true, 'company_id', p_company_id, 'novo_status', p_status);
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_update_status(p_company_ids uuid[], p_status text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result   jsonb;
  affected int := 0;
BEGIN
  IF p_status NOT IN ('ativo', 'inativo', 'suspenso') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Status inválido');
  END IF;

  UPDATE companies
  SET status     = p_status::company_status,
      updated_at = now()
  WHERE id = ANY(p_company_ids)
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  RETURN jsonb_build_object(
    'success',             true,
    'novo_status',         p_status,
    'empresas_atualizadas', affected
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.move_to_pipeline_stage(p_company_id uuid, p_stage_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result    jsonb;
  affected  int;
  old_stage text;
  new_stage text;
BEGIN
  SELECT ps.name INTO old_stage
  FROM   companies c
  LEFT   JOIN pipeline_stages ps ON ps.id = c.pipeline_stage_id
  WHERE  c.id = p_company_id
    AND  (auth.uid() IS NULL OR c.user_id = auth.uid());

  SELECT name INTO new_stage FROM pipeline_stages WHERE id = p_stage_id;

  UPDATE companies
  SET pipeline_stage_id = p_stage_id
  WHERE id = p_company_id
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Empresa não encontrada ou acesso negado');
  ELSE
    result := jsonb_build_object(
      'success',    true,
      'company_id', p_company_id,
      'old_stage',  old_stage,
      'new_stage',  new_stage
    );
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_company(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result   jsonb;
  affected int;
BEGIN
  UPDATE companies
  SET deleted_at = now()
  WHERE id = p_company_id
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Empresa não encontrada ou acesso negado');
  ELSE
    -- Cascade: contacts/customers belong to this company; no extra auth check needed
    UPDATE contacts  SET deleted_at = now() WHERE company_id = p_company_id AND deleted_at IS NULL;
    UPDATE customers SET deleted_at = now() WHERE company_id = p_company_id AND deleted_at IS NULL;
    result := jsonb_build_object('success', true, 'company_id', p_company_id,
                                 'message', 'Empresa e registros relacionados removidos');
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_company(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result   jsonb;
  affected int;
BEGIN
  UPDATE companies
  SET deleted_at = NULL
  WHERE id = p_company_id
    AND deleted_at IS NOT NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Empresa não encontrada ou acesso negado');
  ELSE
    UPDATE contacts  SET deleted_at = NULL WHERE company_id = p_company_id;
    UPDATE customers SET deleted_at = NULL WHERE company_id = p_company_id;
    result := jsonb_build_object('success', true, 'company_id', p_company_id,
                                 'message', 'Empresa e registros restaurados');
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.soft_delete_contact(p_contact_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result   jsonb;
  affected int;
BEGIN
  UPDATE contacts
  SET deleted_at = now()
  WHERE id = p_contact_id
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Contato não encontrado ou acesso negado');
  ELSE
    result := jsonb_build_object('success', true, 'contact_id', p_contact_id, 'message', 'Contato removido');
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_contact(p_contact_id uuid, p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  result   jsonb;
  affected int;
BEGIN
  UPDATE contacts SET
    full_name  = COALESCE(p_data->>'full_name', full_name),
    email      = COALESCE(p_data->>'email',     email),
    telefone   = COALESCE(p_data->>'telefone',  telefone),
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
$$;

CREATE OR REPLACE FUNCTION public.definir_como_filial(p_filial_id uuid, p_matriz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  IF p_filial_id = p_matriz_id THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Empresa não pode ser filial de si mesma');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_filial_id) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Empresa filial não encontrada');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_matriz_id) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Empresa matriz não encontrada');
  END IF;

  UPDATE companies
  SET matriz_id  = p_matriz_id,
      updated_at = NOW()
  WHERE id = p_filial_id
    AND (auth.uid() IS NULL OR user_id = auth.uid());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Acesso negado ou empresa não encontrada');
  END IF;

  RETURN jsonb_build_object(
    'status',    'success',
    'message',   'Empresa definida como filial',
    'filial_id', p_filial_id,
    'matriz_id', p_matriz_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.definir_hierarquia_cooperativa(
  p_company_id       uuid,
  p_tipo_cooperativa text,
  p_central_id       uuid DEFAULT NULL,
  p_singular_id      uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  IF p_tipo_cooperativa NOT IN ('CENTRAL', 'SINGULAR', 'PAC') THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Tipo deve ser CENTRAL, SINGULAR ou PAC');
  END IF;

  UPDATE companies SET
    tipo_cooperativa = p_tipo_cooperativa,
    central_id       = p_central_id,
    singular_id      = p_singular_id,
    updated_at       = NOW()
  WHERE id = p_company_id
    AND (auth.uid() IS NULL OR user_id = auth.uid());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Empresa não encontrada ou acesso negado');
  END IF;

  RETURN jsonb_build_object(
    'status',     'success',
    'message',    'Hierarquia de cooperativa definida',
    'company_id', p_company_id,
    'tipo',       p_tipo_cooperativa
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.vincular_empresa_grupo(p_company_id uuid, p_grupo_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  UPDATE companies SET
    grupo_economico_id = p_grupo_id,
    updated_at         = NOW()
  WHERE id = p_company_id
    AND (auth.uid() IS NULL OR user_id = auth.uid());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Empresa não encontrada ou acesso negado');
  END IF;

  RETURN jsonb_build_object(
    'status',     'success',
    'message',    'Empresa vinculada ao grupo',
    'company_id', p_company_id,
    'grupo_id',   p_grupo_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_proposal(
  p_proposal_id uuid,
  p_accepted    boolean,
  p_motivo      text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  UPDATE proposals SET
    status          = CASE WHEN p_accepted THEN 'aceita' ELSE 'rejeitada' END,
    data_resposta   = NOW(),
    motivo_rejeicao = CASE WHEN NOT p_accepted THEN p_motivo ELSE NULL END,
    updated_at      = NOW()
  WHERE id = p_proposal_id
    AND status IN ('enviada', 'visualizada')
    AND (auth.uid() IS NULL OR user_id = auth.uid());

  IF p_accepted AND FOUND THEN
    UPDATE deals
    SET status     = 'ganho',
        closed_at  = NOW(),
        updated_at = NOW()
    WHERE id = (SELECT deal_id FROM proposals WHERE id = p_proposal_id)
      AND (auth.uid() IS NULL OR user_id = auth.uid());
  END IF;

  RETURN FOUND;
END;
$$;

-- ── Tier-2: admin-only (user JWT callers need the 'admin' role) ──────────────
-- Service-role callers (auth.uid() IS NULL) are allowed through so that
-- n8n automations and webhook handlers can continue to work.

CREATE OR REPLACE FUNCTION public.bulk_reassign_companies(
  p_company_ids uuid[],
  p_new_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_count int;
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
     )
  THEN
    RAISE EXCEPTION 'bulk_reassign_companies: admin role required';
  END IF;

  UPDATE companies
  SET user_id    = p_new_user_id,
      updated_at = NOW()
  WHERE id = ANY(p_company_ids)
    AND deleted_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.merge_companies(
  p_company_keep   uuid,
  p_company_remove uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  contacts_moved     int := 0;
  interactions_moved int := 0;
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
     )
  THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin role required');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_company_keep   AND deleted_at IS NULL) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Empresa principal não encontrada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_company_remove AND deleted_at IS NULL) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Empresa a remover não encontrada');
  END IF;

  UPDATE contacts     SET company_id = p_company_keep, updated_at = now() WHERE company_id = p_company_remove;
  GET DIAGNOSTICS contacts_moved = ROW_COUNT;
  UPDATE interactions SET company_id = p_company_keep WHERE company_id = p_company_remove;
  GET DIAGNOSTICS interactions_moved = ROW_COUNT;
  UPDATE alerts       SET company_id = p_company_keep WHERE company_id = p_company_remove;
  UPDATE companies    SET deleted_at = now()           WHERE id = p_company_remove;

  RETURN jsonb_build_object(
    'success',            true,
    'company_kept',       p_company_keep,
    'company_removed',    p_company_remove,
    'contacts_moved',     contacts_moved,
    'interactions_moved', interactions_moved,
    'message',            'Merge realizado com sucesso'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.merge_duplicate_companies(
  p_keep_id  uuid,
  p_merge_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  contacts_moved     int := 0;
  interactions_moved int := 0;
  customers_updated  int := 0;
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
     )
  THEN
    RETURN jsonb_build_object('error', 'Admin role required');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_keep_id  AND deleted_at IS NULL) THEN
    RETURN jsonb_build_object('error', 'Empresa principal não encontrada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_merge_id AND deleted_at IS NULL) THEN
    RETURN jsonb_build_object('error', 'Empresa a ser mesclada não encontrada');
  END IF;

  UPDATE contacts     SET company_id = p_keep_id WHERE company_id = p_merge_id;
  GET DIAGNOSTICS contacts_moved = ROW_COUNT;
  UPDATE interactions SET company_id = p_keep_id WHERE company_id = p_merge_id;
  GET DIAGNOSTICS interactions_moved = ROW_COUNT;
  UPDATE customers    SET company_id = p_keep_id WHERE company_id = p_merge_id;
  GET DIAGNOSTICS customers_updated = ROW_COUNT;
  UPDATE companies    SET deleted_at = now()      WHERE id = p_merge_id;

  RETURN jsonb_build_object(
    'success',            true,
    'keep_id',            p_keep_id,
    'merge_id',           p_merge_id,
    'contacts_moved',     contacts_moved,
    'interactions_moved', interactions_moved,
    'customers_updated',  customers_updated
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.merge_contacts(
  p_keep_contact_id  uuid,
  p_merge_contact_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE
  v_interactions_moved int;
  v_emails_moved       int;
  v_phones_moved       int;
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
     )
  THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin role required');
  END IF;

  UPDATE interactions SET contact_id = p_keep_contact_id WHERE contact_id = p_merge_contact_id;
  GET DIAGNOSTICS v_interactions_moved = ROW_COUNT;

  INSERT INTO contact_emails (contact_id, email, email_type, is_primary)
  SELECT p_keep_contact_id, email, email_type, false
  FROM   contact_emails WHERE contact_id = p_merge_contact_id
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_emails_moved = ROW_COUNT;

  INSERT INTO contact_phones (contact_id, numero, phone_type, is_primary)
  SELECT p_keep_contact_id, numero, phone_type, false
  FROM   contact_phones WHERE contact_id = p_merge_contact_id
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_phones_moved = ROW_COUNT;

  UPDATE contacts SET deleted_at = NOW() WHERE id = p_merge_contact_id;

  RETURN jsonb_build_object(
    'success',           true,
    'kept_contact_id',   p_keep_contact_id,
    'merged_contact_id', p_merge_contact_id,
    'interactions_moved', v_interactions_moved,
    'emails_moved',      v_emails_moved,
    'phones_moved',      v_phones_moved
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.merge_duplicate_contacts(
  p_keep_id  uuid,
  p_merge_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_interactions_moved int;
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
     )
  THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin role required');
  END IF;

  UPDATE interactions SET contact_id = p_keep_id WHERE contact_id = p_merge_id;
  GET DIAGNOSTICS v_interactions_moved = ROW_COUNT;

  UPDATE contacts SET
    deleted_at   = NOW(),
    is_duplicate = TRUE,
    duplicate_of = p_keep_id
  WHERE id = p_merge_id;

  RETURN jsonb_build_object(
    'success',           TRUE,
    'kept_contact_id',   p_keep_id,
    'merged_contact_id', p_merge_id,
    'interactions_moved', v_interactions_moved
  );
END;
$$;
