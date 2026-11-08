CREATE OR REPLACE FUNCTION public.extrair_nome_tratamento(p_full_name text, p_first_name text DEFAULT NULL::text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_nome TEXT;
    v_palavras TEXT[];
    v_primeira TEXT;
    v_segunda TEXT;
    v_nomes_compostos TEXT[] := ARRAY[
        'maria', 'ana', 'jose', 'josé', 'joao', 'joão', 'luiz', 'luis',
        'pedro', 'carlos', 'paulo', 'marco', 'marcos',
        'antonio', 'antônio', 'francisco', 'jean', 'john',
        'rosa', 'vera', 'rita'
    ];
    v_segundos_compostos TEXT[] := ARRAY[
        'fernanda', 'carolina', 'claudia', 'cláudia', 'cristina',
        'paula', 'beatriz', 'luiza', 'luíza', 'helena', 'alice',
        'clara', 'cecilia', 'cecília', 'eduarda', 'gabriela',
        'julia', 'júlia', 'leticia', 'letícia', 'vitoria', 'vitória',
        'carlos', 'eduardo', 'henrique', 'felipe', 'augusto',
        'pedro', 'miguel', 'gabriel', 'lucas', 'victor', 'vitor',
        'antonio', 'antônio', 'roberto', 'ricardo', 'alberto',
        'sergio', 'sérgio', 'fernando', 'marcelo', 'paulo',
        'guilherme', 'gustavo', 'rafael', 'daniel'
    ];
BEGIN
    IF p_full_name IS NULL AND p_first_name IS NULL THEN
        RETURN NULL;
    END IF;

    v_nome := TRIM(COALESCE(p_full_name, p_first_name));
    v_palavras := regexp_split_to_array(v_nome, '\s+');

    IF array_length(v_palavras, 1) <= 1 THEN
        RETURN initcap(v_palavras[1]);
    END IF;

    v_primeira := LOWER(v_palavras[1]);
    v_segunda := LOWER(v_palavras[2]);

    IF v_primeira = ANY(v_nomes_compostos) AND v_segunda = ANY(v_segundos_compostos) THEN
        RETURN initcap(v_palavras[1]) || ' ' || initcap(v_palavras[2]);
    END IF;

    IF v_primeira IN ('ana', 'maria', 'jose', 'josé', 'joão', 'joao') AND array_length(v_palavras, 1) >= 3 THEN
        IF v_segunda NOT IN ('de', 'da', 'do', 'das', 'dos', 'e') THEN
            RETURN initcap(v_palavras[1]) || ' ' || initcap(v_palavras[2]);
        END IF;
    END IF;

    RETURN initcap(v_palavras[1]);
END;
$function$
