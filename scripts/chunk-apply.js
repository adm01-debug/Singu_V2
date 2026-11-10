// chunk-apply.js — aplica todos os DDL (01 a 11) em lotes de 40 instruções por requisição.
// Mais rápido que o apply-all.js. Cada lote roda numa transação; se o banco recusar o lote, ele é reenviado instrução a
// instrução para isolar a culpada (as demais entram). Índices vão sem CONCURRENTLY, que não roda dentro de lote.
//
// ATENÇÃO: escreve DDL no projeto Supabase de PRODUÇÃO (ref canônico do AGENTS.md) pela Management API.
// O padrão é SIMULAÇÃO: nada é enviado, o script só mostra o que faria. Aplicar de verdade exige --apply.
//   node scripts/chunk-apply.js                    simula (não precisa de token)
//   node scripts/chunk-apply.js --sql              simula e imprime o SQL completo que seria enviado
//   SUPABASE_ACCESS_TOKEN=... node scripts/chunk-apply.js --apply
// Reexecutar é seguro: cada instrução é enviada em forma idempotente (ver scripts/lib/sql-split.mjs).
// Ambiente: SUPABASE_ACCESS_TOKEN (só com --apply; nunca aparece em log), SUPABASE_PROJECT_REF,
// SUPABASE_MGMT_API_URL, timeout/retentativas (ver scripts/lib/supabase-mgmt.mjs).
// Saída: 0 ok · 1 alguma instrução/requisição falhou · 2 uso/configuração/SQL malformado · 130 interrompido.
import { ehCli, etapasDeArquivos, principal, rodarComoCli } from './lib/supabase-mgmt.mjs';

export const ARQUIVOS = ['01_schemas_and_enums.sql', '02_tables.sql', '11_partitions.sql', '03_indexes.sql', '04_foreign_keys.sql', '05_grants.sql',
  '08_functions.sql', '06_rls_enable.sql', '07_policies.sql', '09_triggers.sql', '10_views.sql'];

export const definicao = {
  nome: 'chunk-apply.js',
  descricao: 'aplica todos os DDL (01 a 11) em lotes de 40 instruções por requisição.',
  montarEtapas: ({ args }) => etapasDeArquivos(args.dirDdl, ARQUIVOS, { lote: 40 }),
};

export const main = (argv, env, io) => principal(definicao, argv, env, io);

if (ehCli(import.meta.url)) await rodarComoCli(main);
