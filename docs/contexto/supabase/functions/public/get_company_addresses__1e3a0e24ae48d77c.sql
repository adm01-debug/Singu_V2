CREATE OR REPLACE FUNCTION public.get_company_addresses(p_company_id uuid)
 RETURNS TABLE(address_id uuid, tipo character varying, is_primary boolean, cep character varying, logradouro character varying, numero character varying, complemento character varying, bairro character varying, cidade character varying, estado character varying, pais character varying, latitude numeric, longitude numeric, ponto_referencia character varying, instrucoes_entrega text, endereco_formatado text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
    SELECT 
        ca.id,
        ca.tipo,
        ca.is_primary,
        ca.cep,
        ca.logradouro,
        ca.numero,
        ca.complemento,
        ca.bairro,
        ca.cidade,
        ca.estado,
        ca.pais,
        ca.latitude,
        ca.longitude,
        ca.ponto_referencia,
        ca.instrucoes_entrega,
        CONCAT_WS(', ',
            NULLIF(CONCAT_WS(' ', ca.logradouro, ca.numero), ''),
            ca.complemento,
            ca.bairro,
            CONCAT_WS(' - ', ca.cidade, ca.estado),
            ca.cep
        ) AS endereco_formatado
    FROM company_addresses ca
    WHERE ca.company_id = p_company_id
    ORDER BY ca.is_primary DESC, ca.tipo;
$function$
