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
