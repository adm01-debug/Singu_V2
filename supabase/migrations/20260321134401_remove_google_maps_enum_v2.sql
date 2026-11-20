-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321134401
-- nome:   remove_google_maps_enum_v2

-- ============================================================
-- MELHORIA 4: Remover google_maps do enum (3 views + 5 functions)
-- ============================================================

-- PASSO 1: Dropar TODAS as views dependentes
DROP VIEW IF EXISTS vw_company_social_media;
DROP VIEW IF EXISTS vw_contact_social_media;
DROP VIEW IF EXISTS vw_social_media_stats;

-- PASSO 2: Dropar functions dependentes
DROP FUNCTION IF EXISTS deactivate_social_media(varchar, uuid, social_media_platform);
DROP FUNCTION IF EXISTS get_company_social_media(uuid);
DROP FUNCTION IF EXISTS get_contact_social_media(uuid);
DROP FUNCTION IF EXISTS upsert_company_social_media(uuid, social_media_platform, varchar, varchar, varchar, boolean, text, uuid);
DROP FUNCTION IF EXISTS upsert_contact_social_media(uuid, social_media_platform, varchar, varchar, varchar, boolean, text, uuid);

-- PASSO 3: Swap do tipo
ALTER TYPE social_media_platform RENAME TO social_media_platform_old;

CREATE TYPE social_media_platform AS ENUM (
  'linkedin', 'instagram', 'facebook', 'x', 
  'youtube', 'tiktok', 'whatsapp', 'google_business', 'website'
);

ALTER TABLE company_social_media 
  ALTER COLUMN plataforma TYPE social_media_platform 
  USING plataforma::text::social_media_platform;

ALTER TABLE contact_social_media 
  ALTER COLUMN plataforma TYPE social_media_platform 
  USING plataforma::text::social_media_platform;

DROP TYPE social_media_platform_old;

-- PASSO 4: Recriar functions
CREATE OR REPLACE FUNCTION public.deactivate_social_media(
  p_entity_type varchar, p_entity_id uuid, p_plataforma social_media_platform
) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
    IF p_entity_type = 'company' THEN
        UPDATE company_social_media SET is_active = FALSE, updated_at = NOW()
        WHERE company_id = p_entity_id AND plataforma = p_plataforma;
    ELSIF p_entity_type = 'contact' THEN
        UPDATE contact_social_media SET is_active = FALSE, updated_at = NOW()
        WHERE contact_id = p_entity_id AND plataforma = p_plataforma;
    ELSE
        RAISE EXCEPTION 'entity_type inválido: %', p_entity_type;
    END IF;
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_company_social_media(p_company_id uuid)
RETURNS TABLE(plataforma social_media_platform, handle varchar, url varchar, nome_perfil varchar, is_verified boolean, is_active boolean, seguidores integer)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY SELECT csm.plataforma, csm.handle, csm.url, csm.nome_perfil, csm.is_verified, csm.is_active, csm.seguidores
    FROM company_social_media csm WHERE csm.company_id = p_company_id ORDER BY csm.plataforma;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_contact_social_media(p_contact_id uuid)
RETURNS TABLE(plataforma social_media_platform, handle varchar, url varchar, nome_perfil varchar, is_verified boolean, is_active boolean)
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY SELECT csm.plataforma, csm.handle, csm.url, csm.nome_perfil, csm.is_verified, csm.is_active
    FROM contact_social_media csm WHERE csm.contact_id = p_contact_id ORDER BY csm.plataforma;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_company_social_media(
  p_company_id uuid, p_plataforma social_media_platform, p_handle varchar DEFAULT NULL, p_url varchar DEFAULT NULL,
  p_nome_perfil varchar DEFAULT NULL, p_is_verified boolean DEFAULT false, p_observacoes text DEFAULT NULL, p_updated_by uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id UUID;
BEGIN
    INSERT INTO company_social_media (company_id, plataforma, handle, url, nome_perfil, is_verified, observacoes, created_by, updated_by)
    VALUES (p_company_id, p_plataforma, p_handle, p_url, p_nome_perfil, p_is_verified, p_observacoes, p_updated_by, p_updated_by)
    ON CONFLICT (company_id, plataforma) DO UPDATE SET
        handle = COALESCE(EXCLUDED.handle, company_social_media.handle),
        url = COALESCE(EXCLUDED.url, company_social_media.url),
        nome_perfil = COALESCE(EXCLUDED.nome_perfil, company_social_media.nome_perfil),
        is_verified = EXCLUDED.is_verified, is_active = TRUE,
        observacoes = COALESCE(EXCLUDED.observacoes, company_social_media.observacoes),
        updated_by = p_updated_by, updated_at = NOW()
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_contact_social_media(
  p_contact_id uuid, p_plataforma social_media_platform, p_handle varchar DEFAULT NULL, p_url varchar DEFAULT NULL,
  p_nome_perfil varchar DEFAULT NULL, p_is_verified boolean DEFAULT false, p_observacoes text DEFAULT NULL, p_updated_by uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE v_id UUID;
BEGIN
    INSERT INTO contact_social_media (contact_id, plataforma, handle, url, nome_perfil, is_verified, observacoes, created_by, updated_by)
    VALUES (p_contact_id, p_plataforma, p_handle, p_url, p_nome_perfil, p_is_verified, p_observacoes, p_updated_by, p_updated_by)
    ON CONFLICT (contact_id, plataforma) DO UPDATE SET
        handle = COALESCE(EXCLUDED.handle, contact_social_media.handle),
        url = COALESCE(EXCLUDED.url, contact_social_media.url),
        nome_perfil = COALESCE(EXCLUDED.nome_perfil, contact_social_media.nome_perfil),
        is_verified = EXCLUDED.is_verified, is_active = TRUE,
        observacoes = COALESCE(EXCLUDED.observacoes, contact_social_media.observacoes),
        updated_by = p_updated_by, updated_at = NOW()
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- PASSO 5: Recriar 3 views
CREATE OR REPLACE VIEW vw_company_social_media AS
SELECT c.id AS company_id, c.nome_fantasia, c.razao_social, c.status AS company_status,
    max(CASE WHEN csm.plataforma = 'linkedin' THEN csm.url::text END) AS linkedin_url,
    max(CASE WHEN csm.plataforma = 'linkedin' THEN csm.handle::text END) AS linkedin_handle,
    max(CASE WHEN csm.plataforma = 'instagram' THEN csm.url::text END) AS instagram_url,
    max(CASE WHEN csm.plataforma = 'instagram' THEN csm.handle::text END) AS instagram_handle,
    max(CASE WHEN csm.plataforma = 'facebook' THEN csm.url::text END) AS facebook_url,
    max(CASE WHEN csm.plataforma = 'facebook' THEN csm.handle::text END) AS facebook_handle,
    max(CASE WHEN csm.plataforma = 'x' THEN csm.url::text END) AS x_url,
    max(CASE WHEN csm.plataforma = 'x' THEN csm.handle::text END) AS x_handle,
    count(csm.id) AS total_redes_cadastradas
FROM companies c
LEFT JOIN company_social_media csm ON csm.company_id = c.id AND csm.is_active = true
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.nome_fantasia, c.razao_social, c.status;

CREATE OR REPLACE VIEW vw_contact_social_media AS
SELECT ct.id AS contact_id, ct.full_name, ct.cargo, ct.company_id, co.nome_fantasia AS empresa,
    max(CASE WHEN csm.plataforma = 'linkedin' THEN csm.url::text END) AS linkedin_url,
    max(CASE WHEN csm.plataforma = 'linkedin' THEN csm.handle::text END) AS linkedin_handle,
    max(CASE WHEN csm.plataforma = 'instagram' THEN csm.url::text END) AS instagram_url,
    max(CASE WHEN csm.plataforma = 'instagram' THEN csm.handle::text END) AS instagram_handle,
    max(CASE WHEN csm.plataforma = 'facebook' THEN csm.url::text END) AS facebook_url,
    max(CASE WHEN csm.plataforma = 'facebook' THEN csm.handle::text END) AS facebook_handle,
    max(CASE WHEN csm.plataforma = 'x' THEN csm.url::text END) AS x_url,
    max(CASE WHEN csm.plataforma = 'x' THEN csm.handle::text END) AS x_handle,
    count(csm.id) AS total_redes_cadastradas
FROM contacts ct
LEFT JOIN contact_social_media csm ON csm.contact_id = ct.id AND csm.is_active = true
LEFT JOIN companies co ON co.id = ct.company_id
WHERE ct.deleted_at IS NULL
GROUP BY ct.id, ct.full_name, ct.cargo, ct.company_id, co.nome_fantasia;

CREATE OR REPLACE VIEW vw_social_media_stats AS
SELECT 'companies'::text AS entidade, count(DISTINCT c.id) AS total_registros,
    count(DISTINCT CASE WHEN csm.plataforma = 'linkedin' THEN csm.company_id END) AS com_linkedin,
    count(DISTINCT CASE WHEN csm.plataforma = 'instagram' THEN csm.company_id END) AS com_instagram,
    count(DISTINCT CASE WHEN csm.plataforma = 'facebook' THEN csm.company_id END) AS com_facebook,
    count(DISTINCT CASE WHEN csm.plataforma = 'x' THEN csm.company_id END) AS com_x,
    round((count(DISTINCT CASE WHEN csm.id IS NOT NULL THEN csm.company_id END)::numeric / NULLIF(count(DISTINCT c.id),0)::numeric) * 100, 1) AS pct_com_alguma_rede
FROM companies c LEFT JOIN company_social_media csm ON csm.company_id = c.id AND csm.is_active = true
WHERE c.deleted_at IS NULL
UNION ALL
SELECT 'contacts'::text, count(DISTINCT ct.id),
    count(DISTINCT CASE WHEN csm.plataforma = 'linkedin' THEN csm.contact_id END),
    count(DISTINCT CASE WHEN csm.plataforma = 'instagram' THEN csm.contact_id END),
    count(DISTINCT CASE WHEN csm.plataforma = 'facebook' THEN csm.contact_id END),
    count(DISTINCT CASE WHEN csm.plataforma = 'x' THEN csm.contact_id END),
    round((count(DISTINCT CASE WHEN csm.id IS NOT NULL THEN csm.contact_id END)::numeric / NULLIF(count(DISTINCT ct.id),0)::numeric) * 100, 1)
FROM contacts ct LEFT JOIN contact_social_media csm ON csm.contact_id = ct.id AND csm.is_active = true
WHERE ct.deleted_at IS NULL;
