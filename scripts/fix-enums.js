// fix-enums.js — cria os enums que faltavam e a tabela system_alerts com o DEFAULT corrigido.
// O CREATE TABLE de system_alerts em 02_tables.sql é inválido (DEFAULT com referência a coluna); aqui vai a versão que roda.
// Os enums espelham 01_schemas_and_enums.sql (um teste garante que não divergem).
//
// ATENÇÃO: escreve DDL no projeto Supabase de PRODUÇÃO (ref canônico do AGENTS.md) pela Management API.
// O padrão é SIMULAÇÃO: nada é enviado, o script só mostra o que faria. Aplicar de verdade exige --apply.
//   node scripts/fix-enums.js                    simula (não precisa de token)
//   node scripts/fix-enums.js --sql              simula e imprime o SQL completo que seria enviado
//   SUPABASE_ACCESS_TOKEN=... node scripts/fix-enums.js --apply
// Reexecutar é seguro: cada instrução é enviada em forma idempotente (ver scripts/lib/sql-split.mjs).
// Ambiente: SUPABASE_ACCESS_TOKEN (só com --apply; nunca aparece em log), SUPABASE_PROJECT_REF,
// SUPABASE_MGMT_API_URL, timeout/retentativas (ver scripts/lib/supabase-mgmt.mjs).
// Saída: 0 ok · 1 alguma instrução/requisição falhou · 2 uso/configuração/SQL malformado · 130 interrompido.
import { ehCli, emUnidades, principal, rodarComoCli } from './lib/supabase-mgmt.mjs';
import { sqlCriarEnum } from './lib/sql-split.mjs';

export const ENUMS = {
  'public.entity_relationship_role': ['buyer', 'manager', 'owner', 'decision_maker', 'influencer', 'user',
    'sponsor', 'partner', 'supplier', 'subsidiary', 'parent', 'employee_of', 'other'],
  'public.entity_type': ['company', 'contact'],
  'public.error_severity': ['info', 'warning', 'error', 'critical'],
  'public.passo_outcome': ['respondeu_positivo', 'respondeu_neutro', 'nao_respondeu', 'nao_atendeu', 'pulou'],
  'public.validation_kind': ['email', 'phone'],
  'public.validation_queue_status': ['pending', 'processing', 'done', 'error'],
};

export const SQL_SYSTEM_ALERTS = `CREATE TABLE IF NOT EXISTS public.system_alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  alert_type text NOT NULL,
  severity text NOT NULL,
  threshold_pct numeric NOT NULL,
  consumed_pct numeric NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  acknowledged_at timestamp with time zone,
  acknowledged_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  is_simulated boolean DEFAULT false,
  CONSTRAINT system_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT system_alerts_severity_check CHECK ((severity = ANY (ARRAY['warning'::text, 'high'::text, 'critical'::text])))
)`;

export function montarEtapas() {
  const enums = Object.entries(ENUMS).map(([nome, valores]) => ({ origem: `enum ${nome}`, sql: sqlCriarEnum(nome, valores) }));
  return [
    { titulo: 'enums faltantes', unidades: emUnidades(enums) },
    { titulo: 'system_alerts (DEFAULT corrigido)', unidades: emUnidades([{ origem: 'tabela public.system_alerts', sql: SQL_SYSTEM_ALERTS }]) },
  ];
}

export const definicao = {
  nome: 'fix-enums.js',
  descricao: 'cria os enums que faltavam e a tabela system_alerts com o DEFAULT corrigido.',
  montarEtapas,
};

export const main = (argv, env, io) => principal(definicao, argv, env, io);

if (ehCli(import.meta.url)) await rodarComoCli(main);
