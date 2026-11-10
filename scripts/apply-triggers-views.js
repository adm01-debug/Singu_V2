// apply-triggers-views.js — cria os triggers (09_triggers.sql) e as views (10_views.sql), uma instrução por requisição.
// Pré-requisito: tabelas e functions já aplicadas (os triggers executam functions de 08_functions.sql).
//
// ATENÇÃO: escreve DDL no projeto Supabase de PRODUÇÃO (ref canônico do AGENTS.md) pela Management API.
// O padrão é SIMULAÇÃO: nada é enviado, o script só mostra o que faria. Aplicar de verdade exige --apply.
//   node scripts/apply-triggers-views.js                    simula (não precisa de token)
//   node scripts/apply-triggers-views.js --sql              simula e imprime o SQL completo que seria enviado
//   SUPABASE_ACCESS_TOKEN=... node scripts/apply-triggers-views.js --apply
// Reexecutar é seguro: cada instrução é enviada em forma idempotente (ver scripts/lib/sql-split.mjs).
// Ambiente: SUPABASE_ACCESS_TOKEN (só com --apply; nunca aparece em log), SUPABASE_PROJECT_REF,
// SUPABASE_MGMT_API_URL, timeout/retentativas (ver scripts/lib/supabase-mgmt.mjs).
// Saída: 0 ok · 1 alguma instrução/requisição falhou · 2 uso/configuração/SQL malformado · 130 interrompido.
import { ehCli, etapasDeArquivos, principal, rodarComoCli } from './lib/supabase-mgmt.mjs';

export const ARQUIVOS = ['09_triggers.sql', '10_views.sql'];

export const definicao = {
  nome: 'apply-triggers-views.js',
  descricao: 'cria os triggers (09_triggers.sql) e as views (10_views.sql), uma instrução por requisição.',
  montarEtapas: ({ args }) => etapasDeArquivos(args.dirDdl, ARQUIVOS, { lote: 1 }),
};

export const main = (argv, env, io) => principal(definicao, argv, env, io);

if (ehCli(import.meta.url)) await rodarComoCli(main);
