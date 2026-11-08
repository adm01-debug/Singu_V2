CREATE OR REPLACE FUNCTION public.get_nomes_automacao_batch(p_contact_ids uuid[], p_canal text DEFAULT 'whatsapp'::text)
 RETURNS TABLE(contact_id uuid, nome text, saudacao text, tem_apelido boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        CASE p_canal
            WHEN 'whatsapp' THEN COALESCE(c.apelido, c.nome_tratamento, c.first_name, split_part(c.full_name, ' ', 1))
            WHEN 'email' THEN COALESCE(c.nome_tratamento, c.first_name, split_part(c.full_name, ' ', 1))
            WHEN 'formal' THEN COALESCE(c.assinatura_contato, c.nome_tratamento, c.full_name)
            ELSE COALESCE(c.apelido, c.nome_tratamento, c.first_name, split_part(c.full_name, ' ', 1))
        END,
        CASE p_canal
            WHEN 'whatsapp' THEN 'Olá, ' || COALESCE(c.apelido, c.nome_tratamento, c.first_name, split_part(c.full_name, ' ', 1)) || '!'
            WHEN 'email' THEN 'Prezado(a) ' || COALESCE(c.nome_tratamento, c.first_name, split_part(c.full_name, ' ', 1)) || ','
            WHEN 'formal' THEN 'Prezado(a) Sr(a). ' || COALESCE(c.assinatura_contato, c.nome_tratamento, c.full_name) || ','
            ELSE 'E aí, ' || COALESCE(c.apelido, c.nome_tratamento, c.first_name, split_part(c.full_name, ' ', 1)) || '! Tudo bem?'
        END,
        (c.apelido IS NOT NULL)
    FROM contacts c
    WHERE c.id = ANY(p_contact_ids) AND c.deleted_at IS NULL;
END;
$function$
