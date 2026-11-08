CREATE OR REPLACE FUNCTION public.atualizar_apelido(p_contact_id uuid, p_apelido text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_nome TEXT;
    v_apelido_antigo TEXT;
BEGIN
    IF p_contact_id IS NULL THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'contact_id é obrigatório');
    END IF;

    IF TRIM(COALESCE(p_apelido, '')) = '' THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Apelido não pode ser vazio');
    END IF;

    SELECT ct.full_name, ct.apelido
    INTO v_nome, v_apelido_antigo
    FROM contacts ct
    WHERE ct.id = p_contact_id AND ct.deleted_at IS NULL;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Contato não encontrado');
    END IF;

    UPDATE contacts ct
    SET apelido = TRIM(p_apelido),
        updated_at = NOW()
    WHERE ct.id = p_contact_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'contact_id', p_contact_id,
        'full_name', v_nome,
        'apelido_antigo', v_apelido_antigo,
        'apelido_novo', TRIM(p_apelido),
        'message', 'Apelido atualizado! Automações agora usarão "' || TRIM(p_apelido) || '".'
    );
END;
$function$
