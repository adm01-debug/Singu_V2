-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409174444
-- nome:   zapp_history_105_volume_heatmap

CREATE OR REPLACE VIEW zapp_history.v_volume_por_hora AS
SELECT
  day_of_week AS dia_semana,
  EXTRACT(HOUR FROM (created_at AT TIME ZONE 'America/Sao_Paulo'))::INT AS hora,
  COUNT(*) AS total_mensagens,
  COUNT(*) FILTER (WHERE direction = 'inbound') AS inbound,
  COUNT(*) FILTER (WHERE direction = 'outbound') AS outbound,
  COUNT(*) FILTER (WHERE in_business_hours = TRUE) AS comercial,
  COUNT(*) FILTER (WHERE in_business_hours = FALSE) AS fora_expediente,
  COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
  AVG(lead_score)::numeric(5,2) AS lead_score_medio
FROM zapp_history.messages
WHERE day_of_week IS NOT NULL
GROUP BY day_of_week, EXTRACT(HOUR FROM (created_at AT TIME ZONE 'America/Sao_Paulo'))
ORDER BY
  CASE day_of_week
    WHEN 'segunda' THEN 1 WHEN 'terca' THEN 2 WHEN 'quarta' THEN 3
    WHEN 'quinta' THEN 4 WHEN 'sexta' THEN 5 WHEN 'sabado' THEN 6
    WHEN 'domingo' THEN 7
  END,
  hora;

GRANT SELECT ON zapp_history.v_volume_por_hora TO authenticated;

-- View resumida: melhor horário pra atender
CREATE OR REPLACE VIEW zapp_history.v_melhores_horarios AS
SELECT
  day_of_week AS dia_semana,
  EXTRACT(HOUR FROM (created_at AT TIME ZONE 'America/Sao_Paulo'))::INT AS hora,
  COUNT(*) AS volume,
  COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot,
  AVG(lead_score)::numeric(5,2) AS score_medio
FROM zapp_history.messages
WHERE direction = 'inbound' AND day_of_week IS NOT NULL
GROUP BY day_of_week, EXTRACT(HOUR FROM (created_at AT TIME ZONE 'America/Sao_Paulo'))
HAVING COUNT(*) >= 1
ORDER BY leads_hot DESC, volume DESC
LIMIT 20;

GRANT SELECT ON zapp_history.v_melhores_horarios TO authenticated;
