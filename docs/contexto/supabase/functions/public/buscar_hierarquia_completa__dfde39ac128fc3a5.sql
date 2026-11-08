CREATE OR REPLACE FUNCTION public.buscar_hierarquia_completa(p_entidade_id uuid)
 RETURNS TABLE(nivel text, id uuid, tipo text, nome_curto text, uf text, cnpj text)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    WITH ent AS (SELECT * FROM coop_entidades WHERE coop_entidades.id = p_entidade_id)
    SELECT 'SISTEMA'::TEXT, s.id, 'SISTEMA'::TEXT, s.sigla::TEXT, NULL::TEXT, NULL::TEXT
    FROM ent en JOIN coop_sistemas s ON s.id = en.sistema_id
    UNION ALL SELECT 'CONFEDERACAO', c.id, c.tipo, c.nome_curto, c.uf, c.cnpj
    FROM ent en JOIN coop_entidades c ON c.id = en.confederacao_id
    UNION ALL SELECT 'CENTRAL', c.id, c.tipo, c.nome_curto, c.uf, c.cnpj
    FROM ent en JOIN coop_entidades c ON c.id = en.central_id
    UNION ALL SELECT 'SINGULAR', c.id, c.tipo, c.nome_curto, c.uf, c.cnpj
    FROM ent en JOIN coop_entidades c ON c.id = en.singular_id
    UNION ALL SELECT 'ENTIDADE', en.id, en.tipo, en.nome_curto, en.uf, en.cnpj FROM ent en;
END; $function$
