CREATE OR REPLACE FUNCTION public.export_report_csv(p_report_type text, p_params jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(csv_line text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_report_type = 'companies' THEN
    RETURN QUERY
    SELECT 'id,nome,cnpj,segmento,status,criado_em'::text
    UNION ALL
    SELECT 
      c.id::text || ',' ||
      COALESCE(c.nome_fantasia, c.nome_crm, '')::text || ',' ||
      COALESCE(c.cnpj, '')::text || ',' ||
      COALESCE(c.ramo_atividade, '')::text || ',' ||
      c.status::text || ',' ||
      c.created_at::text
    FROM companies c WHERE c.deleted_at IS NULL
    LIMIT COALESCE((p_params->>'limit')::int, 1000);
  
  ELSIF p_report_type = 'interactions' THEN
    RETURN QUERY
    SELECT 'id,empresa_id,tipo,canal,data,usuario'::text
    UNION ALL
    SELECT 
      i.id::text || ',' ||
      i.company_id::text || ',' ||
      COALESCE(i.type, '')::text || ',' ||
      COALESCE(i.channel, '')::text || ',' ||
      i.data_interacao::text || ',' ||
      COALESCE(i.user_id::text, '')
    FROM interactions i
    LIMIT COALESCE((p_params->>'limit')::int, 1000);
  END IF;
END;
$function$
