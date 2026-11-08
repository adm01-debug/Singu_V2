CREATE OR REPLACE FUNCTION public.upsert_driver(p_fid text, p_name text, p_phone text, p_plate text, p_rating numeric, p_st integer)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO lalamove_drivers (driver_fid, driver_name, driver_phone, license_plate, avg_rating, service_times, rides_with_us, last_seen_at)
  VALUES (p_fid, p_name, p_phone, p_plate, p_rating, p_st, 1, now())
  ON CONFLICT (driver_fid) DO UPDATE SET
    driver_name = EXCLUDED.driver_name,
    driver_phone = COALESCE(NULLIF(EXCLUDED.driver_phone,''), lalamove_drivers.driver_phone),
    license_plate = COALESCE(NULLIF(EXCLUDED.license_plate,''), lalamove_drivers.license_plate),
    avg_rating = EXCLUDED.avg_rating,
    service_times = EXCLUDED.service_times,
    rides_with_us = lalamove_drivers.rides_with_us + 1,
    last_seen_at = now(),
    updated_at = now();
END;
$function$
