-- Rodada 55/10 — Verifica que get_ai_gateway_health retorna as novas
-- chaves resolved_recent e resolved_mttr, e que access_denied é
-- levantado para não-admin.

DO $$
DECLARE
  _payload jsonb;
BEGIN
  -- Executa como service_role (bypass has_role via chamada direta seria
  -- inviável, então validamos apenas o formato para admin usando um bypass
  -- controlado: chamamos como superusuário no contexto do teste).
  SET LOCAL role = postgres;
  _payload := public.get_ai_gateway_health(24);

  ASSERT _payload ? 'resolved_recent', 'chave resolved_recent ausente';
  ASSERT _payload ? 'resolved_mttr',   'chave resolved_mttr ausente';
  ASSERT jsonb_typeof(_payload->'resolved_recent') = 'array', 'resolved_recent deve ser array';
  ASSERT jsonb_typeof(_payload->'resolved_mttr')   = 'array', 'resolved_mttr deve ser array';
END $$;

-- Acesso negado para usuário sem role admin
DO $$
DECLARE
  _err text;
BEGIN
  SET LOCAL role = authenticated;
  BEGIN
    PERFORM public.get_ai_gateway_health(24);
    RAISE EXCEPTION 'esperava access_denied, mas RPC retornou dados';
  EXCEPTION WHEN insufficient_privilege THEN
    _err := SQLERRM;
  END;
  ASSERT _err ILIKE '%access_denied%', format('mensagem inesperada: %s', _err);
END $$;