CREATE OR REPLACE FUNCTION public.get_company_360(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'company', jsonb_build_object(
        'id', c.id, 'nome', COALESCE(c.nome_fantasia, c.nome_crm), 'cnpj', c.cnpj,
        'status', c.status, 'is_customer', c.is_customer, 'lead_score', c.lead_score,
        'uf', c.uf, 'cidade', c.cidade
      ),
      'contacts', (SELECT jsonb_agg(jsonb_build_object('id', ct.id, 'name', ct.full_name, 'email', ct.email)) FROM contacts ct WHERE ct.company_id = c.id),
      'deals', (SELECT jsonb_agg(jsonb_build_object('id', d.id, 'titulo', d.titulo, 'valor', d.valor, 'status', d.status)) FROM deals d WHERE d.company_id = c.id),
      'recent_interactions', (SELECT jsonb_agg(jsonb_build_object('id', i.id, 'type', i.type, 'date', i.data_interacao, 'resumo', i.resumo)) FROM (SELECT * FROM interactions WHERE company_id = c.id ORDER BY data_interacao DESC LIMIT 5) i),
      'total_revenue', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE company_id = c.id AND status = 'ganho'),
      'total_interactions', (SELECT COUNT(*) FROM interactions WHERE company_id = c.id),
      'days_since_last_contact', EXTRACT(DAY FROM NOW() - COALESCE((SELECT MAX(data_interacao) FROM interactions WHERE company_id = c.id), c.created_at))
    )
    FROM companies c WHERE c.id = p_company_id
  );
END;
$function$
