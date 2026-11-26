-- Reativação do legado arquivado no schema `_dormant` (22 tabelas).
--
-- CAUSA
-- Um arquivamento em massa levou ~250 tabelas herdadas do Zapp para o schema
-- `_dormant`. O corte foi largo demais e atingiu tabelas que continuam sendo
-- usadas por código vivo do Singu:
--   * 20 views públicas em uso pelo app continuam apontando para essas tabelas
--     (referência por OID, então não dão erro) e passam a devolver 0 linhas;
--   * 8 funções públicas citam essas tabelas POR NOME e rodam com
--     `search_path = public, pg_catalog`, então morrem com
--     `42P01 relation "..." does not exist`.
-- Efeito no negócio: as telas de inteligência emocional (EQ), DISC, rapport,
-- score de fechamento, lembrete inteligente e briefing renderizam vazio e
-- nenhum gerador consegue gravar — o módulo inteiro ficou inerte.
--
-- CORREÇÃO
-- Devolver as tabelas ao schema `public` (mesmo modelo de posse das demais
-- tabelas do Singu: dono do contato / do usuário / da empresa), com RLS
-- habilitado por dono, `anon` sem nenhum acesso e DML concedido a
-- `authenticated`. As views afetadas são todas `security_invoker=true`, então
-- passam a respeitar o RLS das tabelas base automaticamente.
--
-- Três tabelas NÃO são movidas por já existirem em `public` com a geração
-- vigente do schema: `communication_preferences`, `contact_metaprograms` e
-- `notifications`. As versões de `_dormant` são obsoletas e ficam arquivadas.
--
-- Validado em produção: `public.calculate_eq_score(<contato>)` retornava
-- `42P01` antes e passou a retornar linha; `vw_eq_dashboard` deixou de ser
-- sempre vazia quando existe análise gravada.

do $$
declare
  t text;
  tabelas text[] := array[

        'closing_moment_analysis', 'contact_communication_style', 'contact_eq_scores',
        'contact_trigger_preferences', 'contact_values', 'disc_assessments',
        'emotional_trend_snapshots', 'objections', 'pre_contact_briefings',
        'rapport_score_history', 'satisfaction_scores', 'shared_interests',
        'trigger_usage_log', 'vak_profiles', 'digest_history',
        'notification_settings', 'smart_reminders', 'user_disc_profile',
        'user_contacts_link', 'leads', 'pix_accounts',
        'trigger_templates'
  ];
begin
  foreach t in array tabelas loop
    if to_regclass('_dormant.' || quote_ident(t)) is not null then
      execute format('alter table _dormant.%I set schema public', t);
    end if;
  end loop;
end $$;

-- Políticas de negação herdadas do arquivamento bloqueariam tudo (`using false`).
do $$
declare
  t text;
  tabelas text[] := array[

        'closing_moment_analysis', 'contact_communication_style', 'contact_eq_scores',
        'contact_trigger_preferences', 'contact_values', 'disc_assessments',
        'emotional_trend_snapshots', 'objections', 'pre_contact_briefings',
        'rapport_score_history', 'satisfaction_scores', 'shared_interests',
        'trigger_usage_log', 'vak_profiles', 'digest_history',
        'notification_settings', 'smart_reminders', 'user_disc_profile',
        'user_contacts_link', 'leads', 'pix_accounts',
        'trigger_templates'
  ];
begin
  foreach t in array tabelas loop
    execute format('drop policy if exists %I on public.%I', 'dormant_deny_all_' || t, t);
  end loop;
end $$;

-- RLS por dono. `postgres` (owner) e `service_role` seguem com acesso total.
do $$
declare
  t text;
  -- dono do contato: contato pertence ao usuário
  por_contato text[] := array[

        'closing_moment_analysis', 'contact_communication_style', 'contact_eq_scores',
        'contact_trigger_preferences', 'contact_values', 'disc_assessments',
        'emotional_trend_snapshots', 'objections', 'pre_contact_briefings',
        'rapport_score_history', 'satisfaction_scores', 'shared_interests',
        'trigger_usage_log', 'vak_profiles'
  ];
  -- dono do usuário: a própria linha pertence ao usuário
  por_usuario text[] := array[

        'digest_history', 'notification_settings', 'smart_reminders',
        'user_disc_profile', 'user_contacts_link'
  ];
  -- tabelas de posse indireta (empresa / pipeline), tratadas à parte abaixo
  outras text[] := array['leads','pix_accounts','trigger_templates'];
  expr text;
begin
  foreach t in array (por_contato || por_usuario || outras) loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke all on public.%I from authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('drop policy if exists %I on public.%I', 'service_role_full_' || t, t);
    execute format('create policy %I on public.%I for all to service_role using (true) with check (true)', 'service_role_full_' || t, t);
    execute format('drop policy if exists %I on public.%I', t || '_owner_access', t);
  end loop;

  foreach t in array por_contato loop
    expr := 'contact_id in (select c.id from public.contacts c where c.user_id = (select auth.uid()))';
    execute format('create policy %I on public.%I for all to authenticated using (%s) with check (%s)', t || '_owner_access', t, expr, expr);
  end loop;

  foreach t in array por_usuario loop
    expr := 'user_id = (select auth.uid())';
    execute format('create policy %I on public.%I for all to authenticated using (%s) with check (%s)', t || '_owner_access', t, expr, expr);
  end loop;

  -- leads: dono da carteira ou quem criou
  execute 'create policy leads_owner_access on public.leads for all to authenticated '
       || 'using (owner_id = (select auth.uid()) or created_by_id = (select auth.uid())) '
       || 'with check (owner_id = (select auth.uid()) or created_by_id = (select auth.uid()))';

  -- pix_accounts: pertence à empresa do usuário
  execute 'create policy pix_accounts_owner_access on public.pix_accounts for all to authenticated '
       || 'using (company_id in (select c.id from public.companies c where c.user_id = (select auth.uid()))) '
       || 'with check (company_id in (select c.id from public.companies c where c.user_id = (select auth.uid())))';

  -- trigger_templates: catálogo compartilhado, sem dado pessoal; leitura e
  -- manutenção liberadas para quem está autenticado
  execute 'create policy trigger_templates_owner_access on public.trigger_templates for all to authenticated '
       || 'using (true) with check (true)';
end $$;

-- As funções geradoras gravam sem informar `user_id`; preenchemos o dono a
-- partir do contato para que a posse fique coerente com o resto do sistema.
create or replace function public.set_owner_from_contact()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if new.user_id is null and new.contact_id is not null then
    select c.user_id into new.user_id from public.contacts c where c.id = new.contact_id;
  end if;
  return new;
end $$;

do $$
declare
  t text;
  tabelas text[] := array[

        'closing_moment_analysis', 'contact_communication_style', 'contact_eq_scores',
        'contact_trigger_preferences', 'contact_values', 'disc_assessments',
        'emotional_trend_snapshots', 'objections', 'pre_contact_briefings',
        'rapport_score_history', 'satisfaction_scores', 'shared_interests',
        'trigger_usage_log', 'vak_profiles'
  ];
begin
  foreach t in array tabelas loop
    execute format('drop trigger if exists set_owner_from_contact on public.%I', t);
    execute format('create trigger set_owner_from_contact before insert or update on public.%I for each row execute function public.set_owner_from_contact()', t);
  end loop;
end $$;

-- CREATE FUNCTION concede EXECUTE a PUBLIC por padrao, o que deixa anon executar a
-- funcao de trigger (o teste functions_authenticated_allowlist.sql reprova nisso).
revoke all on function public.set_owner_from_contact() from public;
grant execute on function public.set_owner_from_contact() to authenticated, service_role;

comment on function public.set_owner_from_contact() is
  'Preenche user_id a partir do dono do contato nas tabelas reativadas de _dormant.';
