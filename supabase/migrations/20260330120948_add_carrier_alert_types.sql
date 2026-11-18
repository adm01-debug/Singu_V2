-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330120948
-- nome:   add_carrier_alert_types

-- Drop e recria CHECK de alerts.type com carrier_* types
ALTER TABLE alerts DROP CONSTRAINT alerts_type_check;

ALTER TABLE alerts ADD CONSTRAINT alerts_type_check CHECK (
  type = ANY (ARRAY[
    'relationship_risk'::text, 'follow_up_due'::text, 'birthday_reminder'::text,
    'inactivity_warning'::text, 'sentiment_drop'::text, 'opportunity'::text,
    'disc_insight'::text, 'life_event'::text, 'engagement_spike'::text,
    'churn_risk'::text, 'upsell_opportunity'::text, 'referral_opportunity'::text,
    'system'::text, 'custom'::text,
    -- Supplier types
    'supplier_score_baixo'::text, 'supplier_destaque'::text,
    'supplier_homologacao_vencendo'::text, 'supplier_homologacao_vencida'::text,
    'supplier_nao_homologado'::text,
    -- Carrier types (NOVOS)
    'carrier_score_baixo'::text, 'carrier_destaque'::text,
    'carrier_homologacao_vencendo'::text, 'carrier_homologacao_vencida'::text,
    'carrier_nao_homologado'::text
  ])
);
