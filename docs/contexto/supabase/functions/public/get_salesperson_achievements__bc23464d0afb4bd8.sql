CREATE OR REPLACE FUNCTION public.get_salesperson_achievements(p_vendedor_id integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  badges jsonb := '[]'::jsonb;
  total_interacoes int;
  total_clientes int;
  total_vendas numeric;
BEGIN
  -- Obter métricas
  SELECT COUNT(*) INTO total_interacoes FROM interactions WHERE usuario_responsavel_id = p_vendedor_id;
  SELECT COUNT(*) INTO total_clientes FROM customers WHERE vendedor_id = p_vendedor_id AND cliente_ativado = true AND deleted_at IS NULL;
  SELECT COALESCE(SUM(valor_total_compras), 0) INTO total_vendas FROM customers WHERE vendedor_id = p_vendedor_id AND deleted_at IS NULL;
  
  -- Atribuir badges
  IF total_interacoes >= 100 THEN badges := badges || jsonb_build_object('badge', 'Comunicador', 'descricao', '100+ interações'); END IF;
  IF total_interacoes >= 500 THEN badges := badges || jsonb_build_object('badge', 'Super Comunicador', 'descricao', '500+ interações'); END IF;
  IF total_clientes >= 10 THEN badges := badges || jsonb_build_object('badge', 'Conquistador', 'descricao', '10+ clientes ativos'); END IF;
  IF total_clientes >= 50 THEN badges := badges || jsonb_build_object('badge', 'Mestre de Carteira', 'descricao', '50+ clientes ativos'); END IF;
  IF total_vendas >= 100000 THEN badges := badges || jsonb_build_object('badge', 'Vendedor de Ouro', 'descricao', 'R$100k+ em vendas'); END IF;
  IF total_vendas >= 500000 THEN badges := badges || jsonb_build_object('badge', 'Vendedor de Platina', 'descricao', 'R$500k+ em vendas'); END IF;
  
  SELECT jsonb_build_object(
    'vendedor_id', p_vendedor_id,
    'vendedor_nome', (SELECT nome FROM salespeople WHERE id = p_vendedor_id),
    'metricas', jsonb_build_object(
      'total_interacoes', total_interacoes,
      'total_clientes', total_clientes,
      'total_vendas', total_vendas
    ),
    'badges', badges,
    'total_badges', jsonb_array_length(badges)
  ) INTO result;
  
  RETURN result;
END;
$function$
