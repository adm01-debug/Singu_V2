CREATE OR REPLACE FUNCTION public.calculate_relationship_metrics_for_contact(p_contact_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Simplesmente dispara a função existente, simulando uma atualização de contato
    -- que ativará o trigger (ou chamando a função diretamente se preferir isolar)
    -- Para este sistema, chamaremos a função calculate_relationship_metrics mockando o trigger
    
    -- Atualiza o contato para forçar o trigger calculate_relationship_metrics()
    -- Mas como o trigger é AFTER, precisamos garantir que ele rode.
    -- Alternativamente, movemos a lógica para uma função que pode ser chamada por ambos.
    
    PERFORM public.calculate_relationship_metrics_internal(p_contact_id);
END;
$function$
