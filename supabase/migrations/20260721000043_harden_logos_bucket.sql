-- Migration: harden_logos_bucket (Wave 129)
-- Addresses public_bucket_allows_listing advisor warning and fixes three
-- critical security gaps in the logos bucket:
--
--   1. INSERT allowed for unauthenticated callers → restrict to authenticated
--   2. UPDATE allowed for unauthenticated callers → restrict to authenticated
--   3. No file size limit or MIME type restriction → add 2 MB limit and
--      image-only MIME types to prevent bucket abuse
--
-- The SELECT policy is kept for all roles because logos are public assets
-- (company/user avatars rendered in the UI, emails, and shared links).
-- Upload/overwrite is restricted to signed-in users only.

-- ── Drop the open-to-world upload and update policies ────────────────────────
DROP POLICY IF EXISTS "Permitir upload de logos"  ON storage.objects;
DROP POLICY IF EXISTS "Permitir update de logos"  ON storage.objects;

-- ── Authenticated-only INSERT ─────────────────────────────────────────────────
CREATE POLICY logos_authenticated_insert ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (SELECT auth.uid()) IS NOT NULL
  );

-- ── Authenticated-only UPDATE (own files or any, depending on app logic) ─────
CREATE POLICY logos_authenticated_update ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'logos'
    AND (SELECT auth.uid()) IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'logos'
    AND (SELECT auth.uid()) IS NOT NULL
  );

-- ── Apply bucket-level constraints ───────────────────────────────────────────
UPDATE storage.buckets
SET
  file_size_limit    = 2097152,                    -- 2 MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/x-icon'
  ]
WHERE id = 'logos';
