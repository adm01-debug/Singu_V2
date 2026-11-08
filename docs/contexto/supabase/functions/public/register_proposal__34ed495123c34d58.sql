CREATE OR REPLACE FUNCTION public.register_proposal(p_company_id uuid, p_contact_id uuid DEFAULT NULL::uuid, p_proposal_number text DEFAULT NULL::text, p_total_value numeric DEFAULT 0, p_items jsonb DEFAULT '[]'::jsonb, p_valid_until date DEFAULT (CURRENT_DATE + 30), p_notes text DEFAULT NULL::text, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_proposal_id uuid;
  v_proposal_number text;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Gera número se não fornecido
  v_proposal_number := COALESCE(p_proposal_number, 'PROP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((random() * 9999)::int::text, 4, '0'));
  
  INSERT INTO proposals (company_id, contact_id, proposal_number, total_value, items, valid_until, notes, user_id, status)
  VALUES (p_company_id, p_contact_id, v_proposal_number, p_total_value, p_items, p_valid_until, p_notes, p_user_id, 'draft')
  RETURNING id INTO v_proposal_id;
  
  -- Log da criação
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
  VALUES (p_user_id, 'create_proposal', 'company', p_company_id, jsonb_build_object(
    'proposal_id', v_proposal_id,
    'proposal_number', v_proposal_number,
    'value', p_total_value
  ));
  
  RETURN v_proposal_id;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS proposals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES companies(id),
    contact_id uuid REFERENCES contacts(id),
    proposal_number text UNIQUE,
    total_value numeric DEFAULT 0,
    items jsonb DEFAULT '[]'::jsonb,
    valid_until date,
    status text DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'rejected', 'expired'
    notes text,
    user_id uuid REFERENCES profiles(id),
    sent_at timestamptz,
    responded_at timestamptz,
    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_proposals_company ON proposals(company_id);
  CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
  
  INSERT INTO proposals (company_id, contact_id, proposal_number, total_value, items, valid_until, notes, user_id, status)
  VALUES (p_company_id, p_contact_id, v_proposal_number, p_total_value, p_items, p_valid_until, p_notes, p_user_id, 'draft')
  RETURNING id INTO v_proposal_id;
  
  RETURN v_proposal_id;
END;
$function$
