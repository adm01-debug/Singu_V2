CREATE OR REPLACE FUNCTION public.trg_fn_prevent_evaluation_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RAISE EXCEPTION 'Avaliações de fornecedor são imutáveis. Não é possível alterar registros existentes. Crie uma nova avaliação.';
  RETURN NULL;
END;
$function$
