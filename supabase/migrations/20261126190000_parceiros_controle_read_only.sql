-- Controle de homologação (fornecedor/transportadora) é leitura pura na UI de /parceiros.
-- As views são security_invoker=true, mas herdaram DML de grants antigos: revoga para
-- não permitir escrita via PostgREST em cima de uma view sem INSTEAD OF trigger.
do $$
declare
  v_view text;
begin
  foreach v_view in array array['vw_supplier_homologation_control', 'vw_carrier_homologation_control']
  loop
    if to_regclass('public.' || v_view) is null then
      continue;
    end if;
    execute format('revoke insert, update, delete, truncate, references, trigger on public.%I from authenticated', v_view);
    execute format('revoke all on public.%I from anon', v_view);
    execute format('grant select on public.%I to authenticated', v_view);
  end loop;
end $$;