// apply-functions.js — aplica functions (08), triggers (09) e views (10) em lotes de 3 instruções por requisição.
// Lote recusado é reenviado instrução a instrução para isolar a culpada. Pré-requisito: tabelas já aplicadas.
//
// ATENÇÃO: escreve DDL no projeto Supabase de PRODUÇÃO (ref canônico do AGENTS.md) pela Management API.
// O padrão é SIMULAÇÃO: nada é enviado, o script só mostra o que faria. Aplicar de verdade exige --apply.
//   node scripts/apply-functions.js                    simula (não precisa de token)
//   node scripts/apply-functions.js --sql              simula e imprime o SQL completo que seria enviado
//   SUPABASE_ACCESS_TOKEN=... node scripts/apply-functions.js --apply
// Reexecutar é seguro: cada instrução é enviada em forma idempotente (ver scripts/lib/sql-split.mjs).
// Ambiente: SUPABASE_ACCESS_TOKEN (só com --apply; nunca aparece em log), SUPABASE_PROJECT_REF,
// SUPABASE_MGMT_API_URL, timeout/retentativas (ver scripts/lib/supabase-mgmt.mjs).
// Saída: 0 ok · 1 alguma instrução/requisição falhou · 2 uso/configuração/SQL malformado · 130 interrompido.
import { ehCli, etapasDeArquivos, principal, rodarComoCli } from './lib/supabase-mgmt.mjs';

export const ARQUIVOS = ['08_functions.sql', '09_triggers.sql', '10_views.sql'];

export const definicao = {
  nome: 'apply-functions.js',
  descricao: 'aplica functions (08), triggers (09) e views (10) em lotes de 3 instruções por requisição.',
  montarEtapas: ({ args }) => etapasDeArquivos(args.dirDdl, ARQUIVOS, { lote: 3 }),
};

export const main = (argv, env, io) => principal(definicao, argv, env, io);

if (ehCli(import.meta.url)) await rodarComoCli(main);
