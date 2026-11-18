CREATE OR REPLACE FUNCTION public.get_activity_overview(
  p_from timestamptz,
  p_to timestamptz,
  p_bucket text DEFAULT 'week'
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $fn$
WITH par AS (
  SELECT CASE lower(p_bucket) WHEN 'day' THEN 'day' WHEN 'month' THEN 'month' ELSE 'week' END AS b
),
base AS (
  SELECT i.channel, i.sentiment, i.direction, i.contact_id, i.data_interacao
    FROM public.interactions i
   WHERE i.user_id = auth.uid()
     AND i.data_interacao >= p_from
     AND i.data_interacao <  p_to
),
serie AS (
  SELECT date_trunc((SELECT b FROM par), data_interacao) AS inicio,
         count(*) AS interacoes, count(DISTINCT contact_id) AS contatos
    FROM base GROUP BY 1
),
canal AS (
  SELECT coalesce(channel,'sem_canal') AS canal,
         count(*) AS n,
         count(*) FILTER (WHERE direction = 'outbound') AS enviadas,
         count(*) FILTER (WHERE direction = 'inbound')  AS recebidas
    FROM base GROUP BY 1
),
sent AS (SELECT coalesce(sentiment,'nao_classificado') AS sentimento, count(*) AS n FROM base GROUP BY 1),
dow  AS (SELECT extract(dow FROM data_interacao)::int AS dia, count(*) AS n FROM base GROUP BY 1)
SELECT jsonb_build_object(
  'periodo', jsonb_build_object('de', p_from, 'ate', p_to, 'bucket', (SELECT b FROM par)),
  'totais', jsonb_build_object(
    'interacoes', (SELECT count(*) FROM base),
    'contatos_alcancados', (SELECT count(DISTINCT contact_id) FROM base WHERE contact_id IS NOT NULL),
    'enviadas', (SELECT count(*) FROM base WHERE direction = 'outbound'),
    'recebidas', (SELECT count(*) FROM base WHERE direction = 'inbound')
  ),
  'serie', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'inicio', inicio, 'interacoes', interacoes, 'contatos', contatos) ORDER BY inicio) FROM serie), '[]'::jsonb),
  'por_canal', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'canal', canal, 'total', n, 'enviadas', enviadas, 'recebidas', recebidas) ORDER BY n DESC) FROM canal), '[]'::jsonb),
  'por_sentimento', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'sentimento', sentimento, 'total', n) ORDER BY n DESC) FROM sent), '[]'::jsonb),
  'por_dia_semana', coalesce((SELECT jsonb_agg(jsonb_build_object(
      'dia', dia, 'total', n) ORDER BY dia) FROM dow), '[]'::jsonb)
);
$fn$;
