CREATE OR REPLACE FUNCTION public.create_campaign(p_name text, p_description text DEFAULT NULL::text, p_campaign_type text DEFAULT 'email'::text, p_target_segment jsonb DEFAULT '{}'::jsonb, p_start_date date DEFAULT CURRENT_DATE, p_end_date date DEFAULT NULL::date, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_campaign_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO campaigns (name, description, campaign_type, target_segment, start_date, end_date, user_id, status)
  VALUES (p_name, p_description, p_campaign_type, p_target_segment, p_start_date, p_end_date, p_user_id, 'draft')
  RETURNING id INTO v_campaign_id;
  
  RETURN v_campaign_id;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    campaign_type text DEFAULT 'email',
    target_segment jsonb DEFAULT '{}'::jsonb,
    start_date date,
    end_date date,
    status text DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed', 'cancelled'
    user_id uuid REFERENCES profiles(id),
    total_targets int DEFAULT 0,
    contacted int DEFAULT 0,
    responded int DEFAULT 0,
    converted int DEFAULT 0,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
  );
  
  INSERT INTO campaigns (name, description, campaign_type, target_segment, start_date, end_date, user_id, status)
  VALUES (p_name, p_description, p_campaign_type, p_target_segment, p_start_date, p_end_date, p_user_id, 'draft')
  RETURNING id INTO v_campaign_id;
  
  RETURN v_campaign_id;
END;
$function$
