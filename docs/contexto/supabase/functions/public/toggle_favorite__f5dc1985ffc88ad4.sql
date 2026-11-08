CREATE OR REPLACE FUNCTION public.toggle_favorite(p_entity_type text, p_entity_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_exists boolean;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Verifica se já é favorito
  SELECT EXISTS(
    SELECT 1 FROM favorites 
    WHERE user_id = p_user_id 
      AND entity_type = p_entity_type 
      AND entity_id = p_entity_id
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Remove favorito
    DELETE FROM favorites 
    WHERE user_id = p_user_id 
      AND entity_type = p_entity_type 
      AND entity_id = p_entity_id;
    RETURN jsonb_build_object('action', 'removed', 'is_favorite', false);
  ELSE
    -- Adiciona favorito
    INSERT INTO favorites (user_id, entity_type, entity_id)
    VALUES (p_user_id, p_entity_type, p_entity_id);
    RETURN jsonb_build_object('action', 'added', 'is_favorite', true);
  END IF;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    created_at timestamptz DEFAULT NOW(),
    UNIQUE(user_id, entity_type, entity_id)
  );
  CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
  
  INSERT INTO favorites (user_id, entity_type, entity_id)
  VALUES (p_user_id, p_entity_type, p_entity_id);
  RETURN jsonb_build_object('action', 'added', 'is_favorite', true);
END;
$function$
