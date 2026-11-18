-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409174402
-- nome:   zapp_history_102_sla_view

CREATE OR REPLACE VIEW zapp_history.v_sla_atendimento AS
SELECT
  COALESCE(sla_status, 'sem_resposta') AS sla,
  COUNT(*) AS total_conversas,
  MIN(first_response_seconds) AS resposta_mais_rapida_seg,
  MAX(first_response_seconds) AS resposta_mais_lenta_seg,
  AVG(first_response_seconds)::INT AS resposta_media_seg,
  AVG(first_response_seconds / 60.0)::numeric(6,2) AS resposta_media_min,
  COUNT(*) FILTER (WHERE first_response_seconds <= 300) AS sla_5min,
  COUNT(*) FILTER (WHERE first_response_seconds BETWEEN 301 AND 1800) AS sla_30min,
  COUNT(*) FILTER (WHERE first_response_seconds BETWEEN 1801 AND 3600) AS sla_1h,
  COUNT(*) FILTER (WHERE first_response_seconds > 3600) AS sla_acima_1h
FROM zapp_history.conversations
GROUP BY sla_status
ORDER BY
  CASE COALESCE(sla_status, 'sem_resposta')
    WHEN '🟢 EXCELENTE (≤5min)' THEN 1
    WHEN '🟡 BOM (≤30min)' THEN 2
    WHEN '🟠 ACEITAVEL (≤1h)' THEN 3
    WHEN '🔴 LENTO (≤4h)' THEN 4
    WHEN '⛔ CRITICO (>4h)' THEN 5
    ELSE 6
  END;

GRANT SELECT ON zapp_history.v_sla_atendimento TO authenticated;
