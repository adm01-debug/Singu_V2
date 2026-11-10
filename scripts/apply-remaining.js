// apply-remaining.js — aplica o que vem depois das tabelas: índices, FKs, grants, functions, RLS, policies, triggers e views.
// Lotes de 8 instruções por requisição; lote recusado é reenviado instrução a instrução para isolar a culpada.
// Ordem: a de 99_apply_all.sql (functions antes de RLS/policies, que chamam has_role e afins).
//
// ATENÇÃO: escreve DDL no projeto Supabase de PRODUÇÃO (ref canônico do AGENTS.md) pela Management API.
// O padrão é SIMULAÇÃO: nada é enviado, o script só mostra o que faria. Aplicar de verdade exige --apply.
//   node scripts/apply-remaining.js                    simula (não precisa de token)
//   node scripts/apply-remaining.js --sql              simula e imprime o SQL completo que seria enviado
//   SUPABASE_ACCESS_TOKEN=... node scripts/apply-remaining.js --apply
// Reexecutar é seguro: cada instrução é enviada em forma idempotente (ver scripts/lib/sql-split.mjs).
// Ambiente: SUPABASE_ACCESS_TOKEN (só com --apply; nunca aparece em log), SUPABASE_PROJECT_REF,
// SUPABASE_MGMT_API_URL, timeout/retentativas (ver scripts/lib/supabase-mgmt.mjs).
// Saída: 0 ok · 1 alguma instrução/requisição falhou · 2 uso/configuração/SQL malformado · 130 interrompido.
import { ehCli, etapasDeArquivos, principal, rodarComoCli } from './lib/supabase-mgmt.mjs';

export const ARQUIVOS = ['03_indexes.sql', '04_foreign_keys.sql', '05_grants.sql', '08_functions.sql', '06_rls_enable.sql', '07_policies.sql',
  '09_triggers.sql', '10_views.sql'];

export const definicao = {
  nome: 'apply-remaining.js',
  descricao: 'aplica o que vem depois das tabelas: índices, FKs, grants, functions, RLS, policies, triggers e views.',
  montarEtapas: ({ args }) => etapasDeArquivos(args.dirDdl, ARQUIVOS, { lote: 8 }),
};

export const main = (argv, env, io) => principal(definicao, argv, env, io);

if (ehCli(import.meta.url)) await rodarComoCli(main);
