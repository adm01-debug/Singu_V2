CREATE OR REPLACE FUNCTION public.get_duplicate_contacts(p_limit integer DEFAULT 100)
 RETURNS TABLE(contact_id uuid, contact_name text, company_id uuid, email text, duplicate_group integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH contact_emails_agg AS (
    SELECT 
      ct.id          AS ct_id,
      ct.full_name   AS ct_full_name,
      ct.company_id  AS ct_company_id,
      (SELECT ce.email 
         FROM contact_emails ce 
        WHERE ce.contact_id = ct.id 
          AND ce.is_primary 
        LIMIT 1) AS ct_email
    FROM contacts ct 
    WHERE ct.deleted_at IS NULL
  ),
  duplicates AS (
    SELECT 
      cea.ct_email AS dup_email,
      DENSE_RANK() OVER (ORDER BY cea.ct_email) AS grp
    FROM contact_emails_agg cea
    WHERE cea.ct_email IS NOT NULL
    GROUP BY cea.ct_email 
    HAVING COUNT(*) > 1
  )
  SELECT 
    c.ct_id                 AS contact_id,
    c.ct_full_name::text    AS contact_name,
    c.ct_company_id         AS company_id,
    c.ct_email::text        AS email,
    d.grp::int              AS duplicate_group
  FROM contact_emails_agg c
  JOIN duplicates d ON c.ct_email = d.dup_email
  ORDER BY d.grp, c.ct_full_name
  LIMIT p_limit;
END;
$function$
