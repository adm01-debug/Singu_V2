CREATE OR REPLACE FUNCTION public.get_singu_allowed_tables()
 RETURNS text[]
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT ARRAY[
    'companies','contacts','interactions','activities','alerts','disc_profile_config',
    'disc_analysis_history','disc_communication_logs','disc_conversion_metrics',
    'eq_analysis_history','cognitive_bias_history','metaprogram_analysis',
    'emotional_states_history','emotional_anchors','hidden_objections',
    'decision_criteria','client_values','offer_suggestions','insights',
    'contact_cadence','contact_preferences','communication_preferences',
    'contact_relatives','contact_time_analysis','life_events',
    'compatibility_alerts','compatibility_settings','health_alerts',
    'health_alert_settings','automation_rules','automation_logs',
    'lux_intelligence','favorite_templates'
  ];
$function$
