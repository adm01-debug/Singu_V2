-- Schema Drift Guardrail — snapshot no freeze + comparação durante janela.
-- Classe   : GUARD manual (grava estado; fora do full-audit)
-- Limiar   : action=check falha se o fingerprint (sha256 das colunas de public/auth/storage
--            visiveis ao papel) difere do ultimo snapshot, ou se nao ha snapshot.
-- Variaveis: -v action=snapshot|check (default check)
-- Saida    : 0 = ok; 3 = drift, snapshot ausente ou action invalida (RAISE EXCEPTION).
-- ATENCAO  : ESCREVE no banco — cria (idempotente) public._migration_schema_snapshot
--            (RLS ligada, sem grants a PUBLIC) e public._migration_schema_fingerprint();
--            action=snapshot insere 1 linha. Nao altera nenhum objeto da aplicacao.
-- Uso:
--   psql "$SRC_DB_URL" -v action=snapshot -f verify/schema-freeze-guard.sql
--   psql "$SRC_DB_URL" -v action=check    -f verify/schema-freeze-guard.sql
\set ON_ERROR_STOP on
\pset pager off
\if :{?action}
\else
  \set action check
\endif
-- psql nao interpola variaveis dentro de $$...$$; o valor vai por GUC de sessao.
SELECT set_config('guard.action', :'action', false) AS _cfg \gset
SET client_min_messages = warning;  -- silencia "already exists, skipping"

CREATE TABLE IF NOT EXISTS public._migration_schema_snapshot (
  taken_at   timestamptz PRIMARY KEY DEFAULT now(),
  fingerprint text NOT NULL,
  detail     jsonb NOT NULL
);
-- A tabela guarda o inventario de colunas (inclusive auth/storage): nunca expor via API.
ALTER TABLE public._migration_schema_snapshot ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public._migration_schema_snapshot FROM PUBLIC;

-- sha256() nativo (PG11+): nao depende de pgcrypto nem do schema "extensions".
CREATE OR REPLACE FUNCTION public._migration_schema_fingerprint()
RETURNS TABLE (fingerprint text, detail jsonb)
LANGUAGE sql STABLE SET search_path = public AS $$
  WITH cols AS (
    SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
     WHERE table_schema IN ('public','auth','storage')
     ORDER BY 1,2,3
  ),
  agg AS (
    SELECT jsonb_agg(to_jsonb(c.*)) AS d FROM cols c
  )
  SELECT encode(sha256(convert_to(d::text, 'UTF8')), 'hex'), d FROM agg;
$$;
RESET client_min_messages;

DO $$
DECLARE
  v_action text := NULLIF(current_setting('guard.action', true), '');
  v_fp text; v_detail jsonb; v_last text;
BEGIN
  IF v_action IS NULL THEN
    v_action := 'check';
  END IF;

  SELECT fingerprint, detail INTO v_fp, v_detail FROM public._migration_schema_fingerprint();

  IF v_action = 'snapshot' THEN
    INSERT INTO public._migration_schema_snapshot (fingerprint, detail) VALUES (v_fp, v_detail);
    RAISE NOTICE '✔ Snapshot registrado: fingerprint=%', left(v_fp, 16);
  ELSIF v_action = 'check' THEN
    SELECT fingerprint INTO v_last
      FROM public._migration_schema_snapshot ORDER BY taken_at DESC LIMIT 1;
    IF v_last IS NULL THEN
      RAISE EXCEPTION 'Nenhum snapshot prévio — rode com -v action=snapshot antes do freeze';
    ELSIF v_last <> v_fp THEN
      RAISE EXCEPTION '🚨 SCHEMA DRIFT detectado após freeze: baseline=% atual=%', left(v_last,16), left(v_fp,16);
    ELSE
      RAISE NOTICE '✔ Schema íntegro (fingerprint=%)', left(v_fp, 16);
    END IF;
  ELSE
    RAISE EXCEPTION 'action desconhecida: % (use snapshot|check)', v_action;
  END IF;
END $$;
