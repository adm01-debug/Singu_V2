CREATE OR REPLACE FUNCTION public.multiplix_validate_scope_signature(p_scope_permissions text[], p_scope_vendedor_email text)
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
-- F22: as RPCs de audiencia confiavam no chamador para dizer o proprio escopo.
-- Com a EXTERNAL_SUPABASE_SERVICE_ROLE_KEY (que vive nas edges) qualquer um
-- pedia p_scope_permissions=['admin'] e lia o publico inteiro. Agora o escopo
-- so vale acompanhado de um HMAC-SHA256 que a edge assina com o segredo que
-- existe em apenas dois lugares: a env das edges do Zapp e o vault do Singu
-- (MULTIPLIX_SCOPE_HMAC_SECRET). Contrato v1, identico nos dois lados:
--   payload    = 'v1|<permissoes ordenadas asc, unidas por ",">|<email ou "">|<exp_unix>'
--   assinatura = HMAC-SHA256 hex
-- A assinatura viaja em CABECALHO (x-multiplix-scope-hmac / -exp), nao em
-- parametro: parametro novo muda a assinatura da funcao e o PostgREST passaria
-- a devolver 404 nas chamadas do outro lado (medido: PGRST202).
DECLARE
  v_headers jsonb;
  v_hmac text;
  v_exp bigint;
  v_secret text;
  v_perms text;
  v_payload text;
  v_esperado text;
BEGIN
  -- sem escopo pedido nao ha o que assinar (a RPC devolveria vazio de qualquer forma)
  IF p_scope_permissions IS NULL OR cardinality(p_scope_permissions) = 0 THEN
    RETURN;
  END IF;
  v_headers := coalesce(current_setting('request.headers', true)::jsonb, '{}'::jsonb);
  v_hmac := nullif(v_headers ->> 'x-multiplix-scope-hmac', '');
  v_exp := nullif(v_headers ->> 'x-multiplix-scope-exp', '')::bigint;
  IF v_hmac IS NULL OR v_exp IS NULL THEN
    RAISE EXCEPTION 'escopo sem assinatura: cabecalhos x-multiplix-scope-hmac/x-multiplix-scope-exp ausentes' USING ERRCODE = '42501';
  END IF;
  IF v_exp < (extract(epoch FROM now()))::bigint THEN
    RAISE EXCEPTION 'assinatura de escopo expirada em %', to_timestamp(v_exp) USING ERRCODE = '42501';
  END IF;
  SELECT s.decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets s
  WHERE s.name = 'MULTIPLIX_SCOPE_HMAC_SECRET';
  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE EXCEPTION 'MULTIPLIX_SCOPE_HMAC_SECRET ausente no vault' USING ERRCODE = '42501';
  END IF;
  SELECT string_agg(p, ',' ORDER BY p COLLATE "C") INTO v_perms FROM unnest(p_scope_permissions) AS p;
  v_payload := 'v1|' || coalesce(v_perms, '') || '|' || coalesce(p_scope_vendedor_email, '') || '|' || v_exp::text;
  -- extensions.hmac e nao hmac: no Supabase o pgcrypto vive no schema
  -- 'extensions'. Sem qualificar, o nome nao resolve dentro desta funcao
  -- (SET search_path TO 'public') e o guard cairia com 42883 em TODA chamada.
  v_esperado := encode(extensions.hmac(v_payload, v_secret, 'sha256'), 'hex');
  IF v_esperado IS DISTINCT FROM lower(v_hmac) THEN
    RAISE EXCEPTION 'assinatura de escopo invalida' USING ERRCODE = '42501';
  END IF;
END;
$function$
