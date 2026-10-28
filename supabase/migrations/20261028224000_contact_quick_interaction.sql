-- A sobrecarga JSON mantém intactos a assinatura e os defaults da RPC por empresa,
-- inclusive chamadas posicionais; o proxy já permite este nome de RPC.
CREATE OR REPLACE FUNCTION public.create_quick_interaction(p_contact_interaction jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  actor_id uuid := auth.uid();
  target_id uuid;
  interaction_type text;
  summary text;
  new_id uuid;
BEGIN
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_contact_interaction) IS DISTINCT FROM 'object'
     OR jsonb_typeof(p_contact_interaction -> 'contact_id') IS DISTINCT FROM 'string'
     OR jsonb_typeof(p_contact_interaction -> 'tipo') IS DISTINCT FROM 'string'
     OR jsonb_typeof(p_contact_interaction -> 'resumo') IS DISTINCT FROM 'string' THEN
    RAISE EXCEPTION 'Invalid interaction' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_contact_interaction) AS k(key)
             WHERE key NOT IN ('contact_id', 'tipo', 'resumo')) THEN
    RAISE EXCEPTION 'Invalid interaction' USING ERRCODE = '22023';
  END IF;
  target_id := (p_contact_interaction ->> 'contact_id')::uuid;
  interaction_type := p_contact_interaction ->> 'tipo';
  summary := btrim(p_contact_interaction ->> 'resumo');
  IF interaction_type NOT IN ('call', 'email', 'whatsapp', 'meeting', 'note')
     OR length(summary) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Invalid interaction' USING ERRCODE = '22023';
  END IF;

  PERFORM 1 FROM public.contacts c
    WHERE c.id = target_id AND c.user_id = actor_id AND c.deleted_at IS NULL
    FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact unavailable' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.interactions (
    contact_id, type, channel, direction, title, content, resumo,
    user_id, created_by, data_interacao
  ) VALUES (
    target_id, interaction_type, interaction_type, 'outbound', left(summary, 200),
    summary, summary, actor_id, actor_id, now()
  ) RETURNING id INTO new_id;

  RETURN jsonb_build_object('success', true, 'interaction_id', new_id, 'contact_id', target_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.create_quick_interaction(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_quick_interaction(jsonb) TO authenticated;

-- DOWN MIGRATION: remove apenas o contrato por contato, preservando a RPC por empresa.
-- DROP FUNCTION public.create_quick_interaction(jsonb);
