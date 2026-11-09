// apply-missing.js — cria só as tabelas (02_tables.sql) e partições (11_partitions.sql) que ainda não existem no banco.
// Com --apply, primeiro consulta as tabelas existentes (somente leitura) e envia um CREATE TABLE IF NOT EXISTS por
// tabela faltante. Na simulação não há consulta: lista todas as tabelas dos arquivos como candidatas.
//
// ATENÇÃO: escreve DDL no projeto Supabase de PRODUÇÃO (ref canônico do AGENTS.md) pela Management API.
// O padrão é SIMULAÇÃO: nada é enviado, o script só mostra o que faria. Aplicar de verdade exige --apply.
//   node scripts/apply-missing.js                    simula (não precisa de token)
//   node scripts/apply-missing.js --sql              simula e imprime o SQL completo que seria enviado
//   SUPABASE_ACCESS_TOKEN=... node scripts/apply-missing.js --apply
// Reexecutar é seguro: cada instrução é enviada em forma idempotente (ver scripts/lib/sql-split.mjs).
// Ambiente: SUPABASE_ACCESS_TOKEN (só com --apply; nunca aparece em log), SUPABASE_PROJECT_REF,
// SUPABASE_MGMT_API_URL, timeout/retentativas (ver scripts/lib/supabase-mgmt.mjs).
// Saída: 0 ok · 1 alguma instrução/requisição falhou · 2 uso/configuração/SQL malformado · 130 interrompido.
import { carregarDdl, ehCli, emUnidades, ErroDeUso, principal, rodarComoCli } from './lib/supabase-mgmt.mjs';
import { tabelaCriada, tornarIdempotente } from './lib/sql-split.mjs';

export const ARQUIVOS = ['02_tables.sql', '11_partitions.sql'];
export const SQL_TABELAS_EXISTENTES = "SELECT table_schema, table_name FROM information_schema.tables "
  + "WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema')";

/** CREATE TABLE dos arquivos, na ordem: [{ origem, sql (já com IF NOT EXISTS), chave: 'esquema.nome' }]. */
export function tabelasDoArquivo(dirDdl) {
  return ARQUIVOS.flatMap((arquivo) => carregarDdl(dirDdl, arquivo)).flatMap((i) => {
    const t = tabelaCriada(i.sql);
    return t ? [{ origem: i.origem, sql: tornarIdempotente(i.sql), chave: `${t.esquema ?? 'public'}.${t.nome}` }] : [];
  });
}

/** Filtra as tabelas cuja chave não está em `existentes` (linhas { table_schema, table_name }). */
export function faltantes(tabelas, existentes) {
  const tem = new Set(existentes.map((l) => `${l.table_schema}.${l.table_name}`));
  return tabelas.filter((t) => !tem.has(t.chave));
}

export const definicao = {
  nome: 'apply-missing.js',
  descricao: 'cria só as tabelas (02_tables.sql) e partições (11_partitions.sql) que ainda não existem no banco.',
  async montarEtapas({ args, cliente }) {
    const tabelas = tabelasDoArquivo(args.dirDdl);
    if (!cliente) {
      return [{ titulo: ARQUIVOS.join(' + '), unidades: emUnidades(tabelas), nota: 'a simulação não consulta o banco: estas são TODAS as tabelas dos arquivos; com --apply só as que faltarem são criadas' }];
    }
    const r = await cliente.consultar(SQL_TABELAS_EXISTENTES);
    if (r.tipo !== 'ok') throw new ErroDeUso(`não consegui listar as tabelas existentes: ${r.mensagem}`, 1);
    const criar = faltantes(tabelas, r.linhas);
    return [{ titulo: `${ARQUIVOS.join(' + ')}: ${criar.length} tabela(s) faltando de ${tabelas.length}`, unidades: emUnidades(criar) }];
  },
};

export const main = (argv, env, io) => principal(definicao, argv, env, io);

if (ehCli(import.meta.url)) await rodarComoCli(main);
