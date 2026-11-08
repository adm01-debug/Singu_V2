CREATE OR REPLACE VIEW zapp_history.v_routing_queue AS
SELECT
  m.id AS message_id,
  m.created_at,
  ct.full_name AS contato,
  comp.razao_social AS empresa,
  m.lead_score,
  m.bant_score->>'classification' AS bant,
  m.priority_quadrant,
  (zapp_history.smart_routing(m.id))->>'queue' AS fila,
  ((zapp_history.smart_routing(m.id))->>'priority')::INT AS prioridade,
  (zapp_history.smart_routing(m.id))->'skills_required' AS skills,
  (zapp_history.smart_routing(m.id))->>'reason' AS razao,
  ((zapp_history.smart_routing(m.id))->>'sla_minutes')::INT AS sla_minutos,
  LEFT(m.content, 150) AS preview
FROM zapp_history.messages m
JOIN public.contacts ct ON ct.id = m.contact_id
LEFT JOIN public.companies comp ON comp.id = m.company_id
WHERE m.direction = 'inbound'
  AND m.nlp_processed_at IS NOT NULL
  AND NOT COALESCE(m.quarantined, FALSE)
  AND m.created_at > NOW() - INTERVAL '48 hours'
ORDER BY ((zapp_history.smart_routing(m.id))->>'priority')::INT ASC, m.created_at DESC;

GRANT SELECT ON zapp_history.v_routing_queue TO authenticated;
