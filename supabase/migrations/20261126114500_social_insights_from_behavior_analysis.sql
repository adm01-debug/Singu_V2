-- social_insights era lida por tres consumidores e escrita por nenhum:
--   * generate-offer-suggestions (evidencia do match social na oferta)
--   * useSocialInsights -> SocialIntelligencePanel / SocialMatchDetails
-- A analise que alimenta esses consumidores ja existia em
-- social_behavior_analysis (1.001 linhas), mas nada a convertia em insight.
-- Resultado em producao: tabela com 0 linhas, painel sempre vazio e oferta
-- sempre sem evidencia ("evidence unavailable").

create or replace function public.sync_social_insight_from_analysis()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_content text;
  v_sentiment text;
  v_score numeric;
begin
  v_content := nullif(btrim(concat_ws(
    ' ',
    nullif(array_to_string(coalesce(new.keywords, '{}'::text[]), ' '), ''),
    nullif(array_to_string(coalesce(new.topics, '{}'::text[]), ' '), ''),
    nullif(array_to_string(coalesce(new.interests, '{}'::text[]), ' '), ''),
    nullif(new.executive_summary, '')
  )), '');

  if v_content is null then
    return new;
  end if;

  v_sentiment := case lower(coalesce(new.overall_sentiment, ''))
    when 'positive' then 'positive'
    when 'positivo' then 'positive'
    when 'negative' then 'negative'
    when 'negativo' then 'negative'
    else 'neutral'
  end;

  v_score := greatest(0, least(100, coalesce(new.influence_score, new.confidence * 100, 50)));

  -- Uma linha por contato: a analise mais recente substitui a anterior, para o
  -- painel nao acumular historico duplicado a cada reprocessamento da fila.
  delete from public.social_insights
   where contact_id = new.contact_id
     and insight_type = 'behavior_summary';

  insert into public.social_insights
    (contact_id, user_id, platform, insight_type, content, metadata, indicator_score, sentiment)
  values
    (new.contact_id, new.user_id, 'analysis', 'behavior_summary', v_content,
     jsonb_build_object(
       'analysis_id', new.id,
       'keywords', to_jsonb(coalesce(new.keywords, '{}'::text[])),
       'topics', to_jsonb(coalesce(new.topics, '{}'::text[])),
       'interests', to_jsonb(coalesce(new.interests, '{}'::text[]))
     ),
     v_score, v_sentiment);

  return new;
end;
$$;

comment on function public.sync_social_insight_from_analysis() is
  'Converte social_behavior_analysis em social_insights (uma linha behavior_summary por contato), que e a forma que o motor de ofertas e o painel social consomem.';

drop trigger if exists trg_sync_social_insight on public.social_behavior_analysis;
create trigger trg_sync_social_insight
after insert or update of keywords, topics, interests, executive_summary, influence_score, overall_sentiment
on public.social_behavior_analysis
for each row execute function public.sync_social_insight_from_analysis();

-- Backfill das analises ja existentes. Sem isto o trigger so valeria de hoje em
-- diante e os contatos ja analisados continuariam sem insight.
insert into public.social_insights
  (contact_id, user_id, platform, insight_type, content, metadata, indicator_score, sentiment)
select
  a.contact_id,
  a.user_id,
  'analysis',
  'behavior_summary',
  btrim(concat_ws(
    ' ',
    nullif(array_to_string(coalesce(a.keywords, '{}'::text[]), ' '), ''),
    nullif(array_to_string(coalesce(a.topics, '{}'::text[]), ' '), ''),
    nullif(array_to_string(coalesce(a.interests, '{}'::text[]), ' '), ''),
    nullif(a.executive_summary, '')
  )),
  jsonb_build_object(
    'analysis_id', a.id,
    'keywords', to_jsonb(coalesce(a.keywords, '{}'::text[])),
    'topics', to_jsonb(coalesce(a.topics, '{}'::text[])),
    'interests', to_jsonb(coalesce(a.interests, '{}'::text[]))
  ),
  greatest(0, least(100, coalesce(a.influence_score, a.confidence * 100, 50))),
  case lower(coalesce(a.overall_sentiment, ''))
    when 'positive' then 'positive'
    when 'positivo' then 'positive'
    when 'negative' then 'negative'
    when 'negativo' then 'negative'
    else 'neutral'
  end
from public.social_behavior_analysis a
join auth.users u on u.id = a.user_id
join public.contacts c on c.id = a.contact_id
where btrim(concat_ws(
        ' ',
        nullif(array_to_string(coalesce(a.keywords, '{}'::text[]), ' '), ''),
        nullif(array_to_string(coalesce(a.topics, '{}'::text[]), ' '), ''),
        nullif(array_to_string(coalesce(a.interests, '{}'::text[]), ' '), ''),
        nullif(a.executive_summary, '')
      )) <> ''
  and not exists (
    select 1 from public.social_insights si
     where si.contact_id = a.contact_id
       and si.insight_type = 'behavior_summary'
  );