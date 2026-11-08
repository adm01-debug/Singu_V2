CREATE OR REPLACE FUNCTION coop003_finalize() RETURNS jsonb AS $$
DECLARE
  upd int;
BEGIN
  UPDATE companies c SET
    cnpj = p.cnpj,
    merge_notes = to_jsonb(
      CONCAT(COALESCE(c.merge_notes #>> '{}', ''), 
             '|COOP-003-T001:cnpj=' || p.cnpj || '|metodo=' || p.metodo)
    )
  FROM coop003_pending p
  WHERE c.id = p.id AND c.cnpj IS NULL;
  
  GET DIAGNOSTICS upd = ROW_COUNT;
  RETURN jsonb_build_object('updated', upd);
END $$ LANGUAGE plpgsql;
