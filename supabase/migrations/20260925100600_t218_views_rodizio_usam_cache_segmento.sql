-- Mesmo fix de N+1 já aplicado ontem em fn_carga_atual_closer, agora nas 3 views que ainda
-- chamavam fn_segmento_cliente() por linha via LEFT JOIN LATERAL. Medido antes/depois com
-- EXPLAIN (ANALYZE, BUFFERS): vw_rodizio_carga_closers 2374ms -> 77ms (371.594 -> 6.308 buffers),
-- vw_rodizio_kpis 2359ms -> 72ms. O LATERAL respondia por 98,7% dos buffers.
-- Paridade provada em transação revertida, nas duas direções (EXCEPT ALL), em dois cenários:
-- dados reais e um sintético com as 6 classes de segmento exercitadas (ATIVO/INATIVO/BLOQUEADO/
-- POOL_FRIO/NAO_ATIVADO/FORA_RODIZIO) e closers sem carteira. Zero divergência.
-- Sem bloco GRANT: CREATE OR REPLACE VIEW preserva a ACL existente, e reconceder daria
-- INSERT/UPDATE/DELETE/TRUNCATE a authenticated sem necessidade.

CREATE OR REPLACE VIEW public.vw_rodizio_carga_closers
WITH (security_invoker = true) AS
 SELECT u.id AS closer_id,
    u.name AS closer_nome,
    u.is_active,
    u.ordem_rodizio,
    u.capacidade_max,
    u.afastado_ate,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'ATIVO'::text) AS total_ativo,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'NAO_ATIVADO'::text) AS total_nao_ativado,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'INATIVO'::text) AS total_inativo,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'BLOQUEADO'::text) AS total_bloqueado,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'POOL_FRIO'::text) AS total_pool_frio,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = ANY (ARRAY['NAO_ATIVADO'::text, 'INATIVO'::text])) AS carga_atual,
    count(c.id) AS total_carteira
   FROM users u
     LEFT JOIN customers c ON c.vendedor_id = u.id AND c.deleted_at IS NULL
     LEFT JOIN public.customer_rotation_state crs ON crs.customer_id = c.id
  WHERE u.participa_rodizio_closer
  GROUP BY u.id, u.name, u.is_active, u.ordem_rodizio, u.capacidade_max, u.afastado_ate
  ORDER BY u.ordem_rodizio;

CREATE OR REPLACE VIEW public.vw_rodizio_carga_sdrs
WITH (security_invoker = true) AS
 SELECT u.id AS sdr_id,
    u.name AS sdr_nome,
    u.is_active,
    u.ordem_rodizio,
    u.capacidade_max,
    u.afastado_ate,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'NAO_ATIVADO'::text) AS total_nao_ativado,
    count(c.id) AS total_carteira
   FROM users u
     LEFT JOIN customers c ON c.sdr_id = u.id AND c.deleted_at IS NULL
     LEFT JOIN public.customer_rotation_state crs ON crs.customer_id = c.id
  WHERE u.participa_rodizio_sdr
  GROUP BY u.id, u.name, u.is_active, u.ordem_rodizio, u.capacidade_max, u.afastado_ate
  ORDER BY u.ordem_rodizio;

CREATE OR REPLACE VIEW public.vw_rodizio_kpis
WITH (security_invoker = true) AS
 SELECT u.id AS closer_id,
    u.name AS closer_nome,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'ATIVO'::text) AS total_ativo,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'NAO_ATIVADO'::text) AS total_nao_ativado,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'INATIVO'::text) AS total_inativo,
    count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'POOL_FRIO'::text) AS total_pool_frio,
    round(100.0 * count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'ATIVO'::text)::numeric / NULLIF(count(c.id), 0)::numeric, 1) AS taxa_ativacao_pct,
    ( SELECT count(*) AS count
           FROM customer_events ev
          WHERE ev.evento_tipo = 'RODIZIO_BLOQUEIO'::text AND ev.vendedor_id = u.id AND ev.data_evento >= date_trunc('month'::text, CURRENT_DATE::timestamp with time zone)) AS bloqueios_mes,
    ( SELECT count(*) AS count
           FROM customer_ownership_history h
          WHERE h.vendedor_id = u.id AND h.data_inicio >= (CURRENT_DATE - 30)) AS clientes_recebidos_30d,
    ( SELECT count(*) AS count
           FROM customer_purchases p
             JOIN customer_ownership_history h ON h.customer_id = p.customer_id AND h.vendedor_id = u.id
          WHERE p.vendedor_credito_id = u.id AND p.data_pedido >= h.data_inicio AND h.data_fim IS NULL) AS vendas_pos_rotacao
   FROM users u
     LEFT JOIN customers c ON c.vendedor_id = u.id AND c.deleted_at IS NULL
     LEFT JOIN public.customer_rotation_state crs ON crs.customer_id = c.id
  WHERE u.participa_rodizio_closer
  GROUP BY u.id, u.name, u.ordem_rodizio
  ORDER BY u.ordem_rodizio;
