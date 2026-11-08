CREATE OR REPLACE FUNCTION public.sync_interaction_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- =====================
    -- Sincronizar type ↔ channel
    -- =====================
    
    -- Se channel preenchido e type vazio → preencher type
    IF NEW.channel IS NOT NULL AND (NEW.type IS NULL OR NEW.type = '') THEN
        NEW.type := map_channel_to_type(NEW.channel);
    END IF;
    
    -- Se type preenchido e channel vazio → preencher channel (reverso)
    IF NEW.type IS NOT NULL AND NEW.type != '' AND (NEW.channel IS NULL) THEN
        NEW.channel := CASE NEW.type
            WHEN 'call' THEN 'telefone'
            WHEN 'whatsapp' THEN 'whatsapp'
            WHEN 'email' THEN 'email'
            WHEN 'meeting' THEN 'reuniao_presencial'
            WHEN 'video_call' THEN 'reuniao_online'
            WHEN 'social' THEN 'redes_sociais'
            ELSE 'chat_site'
        END;
    END IF;
    
    -- =====================
    -- Sincronizar direction ↔ initiated_by
    -- =====================
    
    IF NEW.direction IS NOT NULL AND (NEW.initiated_by IS NULL OR NEW.initiated_by = '') THEN
        NEW.initiated_by := map_direction_to_initiated(NEW.direction);
    END IF;
    
    IF NEW.initiated_by IS NOT NULL AND NEW.initiated_by != '' AND NEW.direction IS NULL THEN
        NEW.direction := CASE NEW.initiated_by
            WHEN 'us' THEN 'outbound'
            WHEN 'them' THEN 'inbound'
            ELSE 'outbound'
        END;
    END IF;
    
    -- =====================
    -- Sincronizar content ↔ conteudo
    -- =====================
    
    IF NEW.content IS NOT NULL AND NEW.content != '' AND (NEW.conteudo IS NULL OR NEW.conteudo = '') THEN
        NEW.conteudo := NEW.content;
    ELSIF NEW.conteudo IS NOT NULL AND NEW.conteudo != '' AND (NEW.content IS NULL OR NEW.content = '') THEN
        NEW.content := NEW.conteudo;
    END IF;
    
    -- =====================
    -- Sincronizar title ↔ assunto
    -- =====================
    
    IF NEW.title IS NOT NULL AND NEW.title != '' AND (NEW.assunto IS NULL OR NEW.assunto = '') THEN
        NEW.assunto := NEW.title;
    ELSIF NEW.assunto IS NOT NULL AND NEW.assunto != '' AND (NEW.title IS NULL OR NEW.title = '') THEN
        NEW.title := NEW.assunto;
    END IF;
    
    -- =====================
    -- Sincronizar duration ↔ duracao_segundos
    -- =====================
    
    IF NEW.duration IS NOT NULL AND NEW.duracao_segundos IS NULL THEN
        NEW.duracao_segundos := NEW.duration;
    ELSIF NEW.duracao_segundos IS NOT NULL AND NEW.duration IS NULL THEN
        NEW.duration := NEW.duracao_segundos;
    END IF;
    
    -- =====================
    -- Sincronizar follow_up_required ↔ requer_followup
    -- =====================
    
    IF NEW.follow_up_required IS NOT NULL AND NEW.requer_followup IS NULL THEN
        NEW.requer_followup := NEW.follow_up_required;
    ELSIF NEW.requer_followup IS NOT NULL AND NEW.follow_up_required IS NULL THEN
        NEW.follow_up_required := NEW.requer_followup;
    END IF;
    
    -- =====================
    -- Sincronizar follow_up_date ↔ data_followup
    -- =====================
    
    IF NEW.follow_up_date IS NOT NULL AND NEW.data_followup IS NULL THEN
        NEW.data_followup := NEW.follow_up_date::TIMESTAMPTZ;
    ELSIF NEW.data_followup IS NOT NULL AND NEW.follow_up_date IS NULL THEN
        NEW.follow_up_date := NEW.data_followup::DATE;
    END IF;
    
    RETURN NEW;
END;
$function$
