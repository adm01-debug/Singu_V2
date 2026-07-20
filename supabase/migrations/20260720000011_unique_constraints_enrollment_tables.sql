-- Migration: composite UNIQUE constraints on enrollment/junction tables
-- Prevents the same entity being enrolled/added twice to the same campaign,
-- workflow, or having duplicate social profiles per platform.
-- All tables verified to have zero duplicate rows before applying.

-- campaign_members: a contact can only be a member of a campaign once
-- Partial index (WHERE contact_id IS NOT NULL) avoids blocking
-- company-only campaign members where contact_id is NULL.
CREATE UNIQUE INDEX IF NOT EXISTS uq_campaign_members_campaign_contact
  ON public.campaign_members(campaign_id, contact_id)
  WHERE contact_id IS NOT NULL;

-- campaign_recipients: a campaign shouldn't send to the same email twice
ALTER TABLE public.campaign_recipients
  ADD CONSTRAINT uq_campaign_recipients_campaign_email
  UNIQUE (campaign_id, email);

-- sms_campaign_recipients: don't SMS the same number twice in one campaign
ALTER TABLE public.sms_campaign_recipients
  ADD CONSTRAINT uq_sms_campaign_recipients_campaign_phone
  UNIQUE (campaign_id, phone_number);

-- nurturing_enrollments: a contact can only be in a workflow once at a time
ALTER TABLE public.nurturing_enrollments
  ADD CONSTRAINT uq_nurturing_enrollments_workflow_contact
  UNIQUE (workflow_id, contact_id);

-- social_profiles: one profile per platform per contact
-- (e.g. a contact can't have two LinkedIn profiles)
ALTER TABLE public.social_profiles
  ADD CONSTRAINT uq_social_profiles_contact_platform
  UNIQUE (contact_id, platform);
