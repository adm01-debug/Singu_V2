CREATE OR REPLACE FUNCTION public.get_proposal_details(p_proposal_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'proposal_id', p.id,
    'numero', p.numero,
    'titulo', p.titulo,
    'descricao', p.descricao,
    'valor_total', p.valor_total,
    'desconto_percentual', p.desconto_percentual,
    'valor_final', p.valor_final,
    'status', p.status,
    'validade_dias', p.validade_dias,
    'data_envio', p.data_envio,
    'data_resposta', p.data_resposta,
    'itens', p.itens,
    'company', jsonb_build_object(
      'id', c.id,
      'name', COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)
    ),
    'contact', jsonb_build_object(
      'id', ct.id,
      'name', COALESCE(ct.full_name, ct.first_name)
    ),
    'created_by', pr.full_name,
    'created_at', p.created_at
  ) INTO v_result
  FROM proposals p
  LEFT JOIN companies c ON c.id = p.company_id
  LEFT JOIN contacts ct ON ct.id = p.contact_id
  LEFT JOIN profiles pr ON pr.id = p.user_id
  WHERE p.id = p_proposal_id;
  
  RETURN v_result;
END;
$function$
