CREATE OR REPLACE FUNCTION public.sync_social_insight_from_analysis()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
