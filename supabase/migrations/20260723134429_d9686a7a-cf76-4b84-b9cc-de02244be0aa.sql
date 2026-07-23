-- Rodada 43/10 — Least Privilege nos Deal Rooms
-- Revoga privilégios amplos herdados do default do Supabase e re-concede
-- apenas o mínimo necessário para o fluxo público via share_token.

-- ============ deal_rooms ============
REVOKE INSERT, UPDATE, DELETE ON public.deal_rooms FROM anon;
-- Re-emite grants column-level (idempotente com Rodada 41)
GRANT UPDATE (buyer_view_count, last_buyer_view_at) ON public.deal_rooms TO anon;

-- ============ deal_room_milestones ============
REVOKE INSERT, UPDATE, DELETE ON public.deal_room_milestones FROM anon;

-- ============ deal_room_stakeholders ============
REVOKE INSERT, UPDATE, DELETE ON public.deal_room_stakeholders FROM anon;

-- ============ deal_room_documents ============
REVOKE INSERT, UPDATE, DELETE ON public.deal_room_documents FROM anon;

-- ============ deal_room_comments ============
-- Comprador pode comentar via edge function autenticada; anon direto não.
REVOKE INSERT, UPDATE, DELETE ON public.deal_room_comments FROM anon;

-- ============ deal_room_activities ============
-- Mantém INSERT para permitir record_buyer_view (INVOKER); revoga UPDATE/DELETE.
REVOKE UPDATE, DELETE ON public.deal_room_activities FROM anon;