// retry-failed.js — recria as 4 tabelas de 02_tables.sql que falhavam por falta de enum.
// Rode depois do fix-enums.js (que cria os enums). Tabelas: entity_relationships, error_logs, proximo_passo_feedback,
// validation_queue. Se alguma não estiver em 02_tables.sql o script para antes de enviar qualquer coisa.
//
// ATENÇÃO: escreve DDL no projeto Supabase de PRODUÇÃO (ref canônico do AGENTS.md) pela Management API.
// O padrão é SIMULAÇÃO: nada é enviado, o script só mostra o que faria. Aplicar de verdade exige --apply.
//   node scripts/retry-failed.js                    simula (não precisa de token)
//   node scripts/retry-failed.js --sql              simula e imprime o SQL completo que seria enviado
//   SUPABASE_ACCESS_TOKEN=... node scripts/retry-failed.js --apply
// Reexecutar é seguro: cada instrução é enviada em forma idempotente (ver scripts/lib/sql-split.mjs).
// Ambiente: SUPABASE_ACCESS_TOKEN (só com --apply; nunca aparece em log), SUPABASE_PROJECT_REF,
// SUPABASE_MGMT_API_URL, timeout/retentativas (ver scripts/lib/supabase-mgmt.mjs).
// Saída: 0 ok · 1 alguma instrução/requisição falhou · 2 uso/configuração/SQL malformado · 130 interrompido.
import { carregarDdl, ehCli, emUnidades, ErroDeUso, principal, rodarComoCli } from './lib/supabase-mgmt.mjs';
import { tabelaCriada, tornarIdempotente } from './lib/sql-split.mjs';

export const ARQUIVO = '02_tables.sql';
export const TABELAS = ['entity_relationships', 'error_logs', 'proximo_passo_feedback', 'validation_queue'];

/** Acha no arquivo o CREATE TABLE de cada tabela pedida (schema public). Tabela ausente → ErroDeUso. */
export function instrucoesDasTabelas(dirDdl, nomes = TABELAS) {
  const porNome = new Map();
  for (const i of carregarDdl(dirDdl, ARQUIVO)) {
    const t = tabelaCriada(i.sql);
    if (t && (t.esquema ?? 'public') === 'public' && !porNome.has(t.nome)) porNome.set(t.nome, i);
  }
  const ausentes = nomes.filter((n) => !porNome.has(n));
  if (ausentes.length) throw new ErroDeUso(`tabela(s) não encontrada(s) em ${ARQUIVO}: ${ausentes.join(', ')}`);
  return nomes.map((n) => ({ origem: porNome.get(n).origem, sql: tornarIdempotente(porNome.get(n).sql) }));
}

export const definicao = {
  nome: 'retry-failed.js',
  descricao: 'recria as 4 tabelas de 02_tables.sql que falhavam por falta de enum.',
  montarEtapas: ({ args }) => [{ titulo: `${ARQUIVO}: ${TABELAS.join(', ')}`, unidades: emUnidades(instrucoesDasTabelas(args.dirDdl)) }],
};

export const main = (argv, env, io) => principal(definicao, argv, env, io);

if (ehCli(import.meta.url)) await rodarComoCli(main);
