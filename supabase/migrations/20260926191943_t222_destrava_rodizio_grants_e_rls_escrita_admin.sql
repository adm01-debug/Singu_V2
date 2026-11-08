-- Nenhuma das 7 RPCs que a tela /rodizio chama direto via supabase.rpc() (rodizioRpc.ts)
-- tinha GRANT EXECUTE para authenticated, e 3 tabelas que elas escrevem só tinham policy de
-- SELECT admin -- zero policy de escrita, nem pra admin. Resultado: nenhum botão da tela
-- funcionava, nem para admin. Fecha GRANT nas RPCs + funções internas que elas chamam, e
-- policy de escrita admin nas tabelas que faltavam (mesmo padrão has_role já usado em
-- customers/contact_phones/company_phones).

DO $migration$
DECLARE
  function_signature text;
  table_definition record;
BEGIN
  FOREACH function_signature IN ARRAY ARRAY[
    'rodizio_sugerir_distribuicao(integer,jsonb,integer)',
    'rodizio_aplicar_onda(integer,text,integer)',
    'rodizio_bloquear_cliente(uuid,integer,text,integer)',
    'rodizio_aprovar_bloqueio(uuid,integer)',
    'rodizio_reverter_execucao(uuid,integer)',
    'rodizio_closer_executar(text,integer,integer)',
    'rodizio_sdr_executar(text,integer,integer)',
    'rodizio_closer_rotacionar_cliente(uuid,uuid,text)',
    'rodizio_sdr_rotacionar_cliente(uuid,uuid)',
    'fn_proximo_closer(uuid)',
    'fn_proximo_sdr(uuid)',
    'fn_carga_atual_closer(integer)'
  ]
  LOOP
    IF to_regprocedure('public.' || function_signature) IS NOT NULL THEN
      EXECUTE format(
        'GRANT EXECUTE ON FUNCTION public.%s TO authenticated',
        function_signature
      );
    END IF;
  END LOOP;

  FOR table_definition IN
    SELECT *
    FROM (VALUES
      ('customer_rotation_state', true),
      ('rodizio_distribuicao_staging', true),
      ('rodizio_execucoes', true),
      ('customer_ownership_history', true),
      ('customer_events', false),
      ('customer_sdr_history', true)
    ) AS tables(table_name, create_update_policy)
  LOOP
    IF to_regclass(format('public.%I', table_definition.table_name)) IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_policy
        WHERE polrelid = to_regclass(format('public.%I', table_definition.table_name))
          AND polname = 'admin_insert'
      )
      THEN
        EXECUTE format(
          'CREATE POLICY admin_insert ON public.%I
           FOR INSERT TO authenticated
           WITH CHECK (has_role(auth.uid(), ''admin''::app_role))',
          table_definition.table_name
        );
      END IF;

      IF table_definition.create_update_policy
        AND NOT EXISTS (
          SELECT 1
          FROM pg_policy
          WHERE polrelid = to_regclass(format('public.%I', table_definition.table_name))
            AND polname = 'admin_update'
        )
      THEN
        EXECUTE format(
          'CREATE POLICY admin_update ON public.%I
           FOR UPDATE TO authenticated
           USING (has_role(auth.uid(), ''admin''::app_role))
           WITH CHECK (has_role(auth.uid(), ''admin''::app_role))',
          table_definition.table_name
        );
      END IF;
    END IF;
  END LOOP;
END;
$migration$;
