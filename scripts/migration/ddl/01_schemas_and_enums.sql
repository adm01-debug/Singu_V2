-- ============================================================================
-- SCHEMAS + ENUM TYPES
-- Gerado por scripts/migration/extract-ddl.sh em 2026-07-21T16:10:58Z
-- Fonte: aws-1-us-east-2.pooler.supabase.com/postgres
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS public;

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.entity_relationship_role AS ENUM ('buyer', 'manager', 'owner', 'decision_maker', 'influencer', 'user', 'sponsor', 'partner', 'supplier', 'subsidiary', 'parent', 'employee_of', 'other');
CREATE TYPE public.entity_type AS ENUM ('company', 'contact');
CREATE TYPE public.error_severity AS ENUM ('info', 'warning', 'error', 'critical');
CREATE TYPE public.passo_outcome AS ENUM ('respondeu_positivo', 'respondeu_neutro', 'nao_respondeu', 'nao_atendeu', 'pulou');
CREATE TYPE public.validation_kind AS ENUM ('email', 'phone');
CREATE TYPE public.validation_queue_status AS ENUM ('pending', 'processing', 'done', 'error');

