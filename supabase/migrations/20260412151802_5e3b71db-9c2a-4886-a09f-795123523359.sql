DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'client_values', 'communication_preferences',
    'companies', 'compatibility_settings', 'contact_cadence',
    'contact_preferences', 'contact_relatives', 'contacts',
    'decision_criteria', 'disc_conversion_metrics',
    'health_alert_settings', 'life_events', 'lux_intelligence'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      tbl, tbl
    );
  END LOOP;
END;
$$;