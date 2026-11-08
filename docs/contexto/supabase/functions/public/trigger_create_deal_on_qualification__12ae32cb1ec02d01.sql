CREATE OR REPLACE FUNCTION public.trigger_create_deal_on_qualification()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'qualificado' AND OLD.status != 'qualificado' THEN
    INSERT INTO deals (company_id, user_id, titulo, pipeline_stage, status)
    VALUES (
      NEW.id, 
      NEW.user_id, 
      'Oportunidade - ' || COALESCE(NEW.nome_fantasia, NEW.nome_crm, 'Nova'),
      'qualificado',
      'aberto'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$
