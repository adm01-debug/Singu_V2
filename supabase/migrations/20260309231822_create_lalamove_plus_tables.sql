-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260309231822
-- nome:   create_lalamove_plus_tables

-- ══════════════════════════════════════════════════════════════
-- LALAMOVE PLUS — 4 Tabelas de Suporte
-- Projeto: bancodadosclientes | 10/Mar/2026
-- ══════════════════════════════════════════════════════════════

-- 1. DRIVERS — Histórico de motoristas
CREATE TABLE IF NOT EXISTS lalamove_drivers (
  driver_fid TEXT PRIMARY KEY,
  driver_name TEXT,
  driver_phone TEXT,
  license_plate TEXT,
  avg_rating NUMERIC(4,2),
  service_times INTEGER,
  rides_with_us INTEGER DEFAULT 0,
  times_rejected INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_drivers_banned ON lalamove_drivers(is_banned) WHERE is_banned = true;
CREATE INDEX idx_drivers_service_times ON lalamove_drivers(service_times);

-- 2. POSITION LOG — Posições em tempo real
CREATE TABLE IF NOT EXISTS lalamove_position_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  order_uuid TEXT,
  spa_id TEXT,
  driver_fid TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  distance_to_coleta_m INTEGER,
  distance_to_entrega_m INTEGER,
  instructions_coleta_sent BOOLEAN DEFAULT false,
  instructions_entrega_sent BOOLEAN DEFAULT false,
  stall_alert_sent BOOLEAN DEFAULT false,
  offroute_alert_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_position_order ON lalamove_position_log(order_id, created_at DESC);
CREATE INDEX idx_position_recent ON lalamove_position_log(created_at DESC);

-- 3. ROUTE CACHE — Rotas esperadas
CREATE TABLE IF NOT EXISTS lalamove_route_cache (
  order_id TEXT PRIMARY KEY,
  polyline_encoded TEXT,
  waypoints_json JSONB,
  distance_total_m INTEGER,
  duration_total_s INTEGER,
  origin_lat NUMERIC(10,7),
  origin_lng NUMERIC(10,7),
  dest_lat NUMERIC(10,7),
  dest_lng NUMERIC(10,7),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. DEAD LETTER — Eventos não processados
CREATE TABLE IF NOT EXISTS lalamove_dead_letter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT,
  order_id TEXT,
  raw_payload JSONB,
  error_message TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_deadletter_unresolved ON lalamove_dead_letter(resolved, created_at DESC) WHERE resolved = false;

-- 5. VIEW: Alertas ativos (para F06-PLUS monitor)
CREATE OR REPLACE VIEW vw_lalamove_plus_alerts AS
SELECT 
  'dead_letter' as alert_type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM lalamove_dead_letter 
WHERE resolved = false AND created_at > now() - interval '24 hours'
UNION ALL
SELECT 
  'stall_alerts' as alert_type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM lalamove_position_log
WHERE stall_alert_sent = true AND created_at > now() - interval '24 hours'
UNION ALL
SELECT 
  'offroute_alerts' as alert_type,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM lalamove_position_log
WHERE offroute_alert_sent = true AND created_at > now() - interval '24 hours'
UNION ALL
SELECT 
  'rejected_drivers' as alert_type,
  COUNT(*) as count,
  MAX(last_seen_at) as latest
FROM lalamove_drivers
WHERE times_rejected > 0 AND last_seen_at > now() - interval '24 hours';

COMMENT ON TABLE lalamove_drivers IS 'LALAMOVE PLUS: Histórico de motoristas com service_times e avg_rating';
COMMENT ON TABLE lalamove_position_log IS 'LALAMOVE PLUS: Posições do motorista em tempo real para proximidade e parada';
COMMENT ON TABLE lalamove_route_cache IS 'LALAMOVE PLUS: Cache de rotas esperadas para detecção fora da rota';
COMMENT ON TABLE lalamove_dead_letter IS 'LALAMOVE PLUS: Eventos webhook sem match no B24 para reprocessamento';
