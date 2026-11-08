-- Bloco 4 (seção 11 do doc de arquitetura): jobs pg_cron do rodízio.
-- Achado antes de agendar: rodizio_closer_executar/rodizio_sdr_executar NÃO verificam
-- RODIZIO_CLOSER_ATIVO/RODIZIO_SDR_ATIVO internamente -- a flag era decorativa. Os wrappers
-- abaixo fazem o check e mantêm as funções do motor intocadas (não são meu código).

CREATE OR REPLACE FUNCTION public.cron_rodizio_closer_tick()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE v_ativo boolean;
BEGIN
  SELECT COALESCE(valor,'false')='true' INTO v_ativo
    FROM public.config_regras_negocio WHERE chave='RODIZIO_CLOSER_ATIVO';
  IF v_ativo THEN
    PERFORM public.rodizio_closer_executar('REAL', 250);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cron_rodizio_sdr_tick()
RETURNS void
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE v_ativo boolean;
BEGIN
  SELECT COALESCE(valor,'false')='true' INTO v_ativo
    FROM public.config_regras_negocio WHERE chave='RODIZIO_SDR_ATIVO';
  IF v_ativo THEN
    PERFORM public.rodizio_sdr_executar('REAL', 250);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.cron_rodizio_closer_tick() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cron_rodizio_sdr_tick() FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('singu-rodizio-segmentar', '0 1 * * *', $$SELECT public.rodizio_segmentar_carteira()$$);
SELECT cron.schedule('singu-rodizio-closer',     '0 6 * * 1', $$SELECT public.cron_rodizio_closer_tick()$$);
SELECT cron.schedule('singu-rodizio-sdr',        '10 6 * * 1', $$SELECT public.cron_rodizio_sdr_tick()$$);
SELECT cron.schedule('singu-rodizio-bloqueios',  '10 7 * * *', $$SELECT public.rodizio_expirar_bloqueios()$$);
