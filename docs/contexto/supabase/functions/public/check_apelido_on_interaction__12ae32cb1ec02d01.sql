CREATE OR REPLACE FUNCTION public.check_apelido_on_interaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_apelido TEXT;
    v_nome TEXT;
BEGIN
    IF NEW.contact_id IS NOT NULL THEN
        SELECT ct.apelido, ct.full_name
        INTO v_apelido, v_nome
        FROM contacts ct
        WHERE ct.id = NEW.contact_id AND ct.deleted_at IS NULL;

        IF v_apelido IS NULL AND v_nome IS NOT NULL THEN
            IF NEW.metadata IS NULL THEN
                NEW.metadata := '{}'::jsonb;
            END IF;

            NEW.metadata := NEW.metadata || jsonb_build_object(
                '_sem_apelido', true,
                '_lembrete', 'Contato "' || v_nome || '" não tem apelido. Preencha para automações mais pessoais!'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$function$
