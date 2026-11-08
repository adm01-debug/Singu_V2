-- Migration: drop_logos_listing_policy (Wave 145)
-- Fixes advisor: public_bucket_allows_listing (logos bucket).
-- The logos bucket is public=true — CDN URLs work without a SELECT policy.
-- Dropping the SELECT policy prevents listing via /object/list/ API.

DROP POLICY IF EXISTS logos_authenticated_select ON storage.objects;
