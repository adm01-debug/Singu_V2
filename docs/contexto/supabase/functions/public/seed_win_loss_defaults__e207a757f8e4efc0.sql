CREATE OR REPLACE FUNCTION public.seed_win_loss_defaults(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.win_loss_reasons (user_id, category, label, outcome_type, sort_order) VALUES
    -- WON
    (_user_id, 'product', 'Melhor adequação técnica', 'won', 1),
    (_user_id, 'relationship', 'Relacionamento forte com decisor', 'won', 2),
    (_user_id, 'price', 'Melhor proposta comercial', 'won', 3),
    (_user_id, 'timing', 'Timing perfeito', 'won', 4),
    (_user_id, 'product', 'Diferencial competitivo claro', 'won', 5),
    (_user_id, 'relationship', 'Confiança no time de vendas', 'won', 6),
    -- LOST
    (_user_id, 'price', 'Preço acima do orçamento', 'lost', 10),
    (_user_id, 'competition', 'Concorrente escolhido', 'lost', 11),
    (_user_id, 'product', 'Faltou funcionalidade crítica', 'lost', 12),
    (_user_id, 'timing', 'Timing ruim / projeto adiado', 'lost', 13),
    (_user_id, 'budget', 'Sem budget aprovado', 'lost', 14),
    (_user_id, 'authority', 'Não falou com decisor real', 'lost', 15),
    (_user_id, 'need', 'Necessidade não confirmada', 'lost', 16),
    (_user_id, 'relationship', 'Relacionamento fraco', 'lost', 17),
    -- BOTH
    (_user_id, 'other', 'Indicação de cliente atual', 'both', 20),
    (_user_id, 'other', 'Inbound qualificado', 'both', 21),
    (_user_id, 'competition', 'Status quo / não fez nada', 'both', 22),
    (_user_id, 'other', 'Outro', 'both', 99)
  ON CONFLICT (user_id, category, label) DO NOTHING;
END;
$function$
