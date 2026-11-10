// Núcleo compartilhado dos aplicadores de DDL (scripts/apply-*.js, chunk-apply.js, fix-enums.js,
// retry-failed.js): configuração por ambiente, cliente da Management API do Supabase com timeout e
// retentativa, argumentos de CLI, execução do plano e resumo final.
//
// Segurança: esses scripts escrevem DDL em PRODUÇÃO. Por isso o padrão é SIMULAÇÃO (nenhuma requisição
// sai); a aplicação real exige --apply. O token nunca é impresso (toda saída passa por máscara).
//
// Ambiente:
//   SUPABASE_ACCESS_TOKEN     token pessoal da Management API (obrigatório só com --apply)
//   SUPABASE_PROJECT_REF      ref do projeto (padrão: o canônico do AGENTS.md)
//   SUPABASE_MGMT_API_URL     base da API (padrão https://api.supabase.com; http só para 127.0.0.1/localhost)
//   SUPABASE_MGMT_TIMEOUT_MS  timeout por requisição (55000) · SUPABASE_MGMT_RETRIES  retentativas (4)
//   SUPABASE_MGMT_BACKOFF_MS  base do backoff exponencial (500) · SUPABASE_MGMT_PAUSA_MS  pausa entre requisições (100)
// Códigos de saída: 0 ok · 1 alguma instrução/requisição falhou · 2 uso/configuração/SQL malformado · 130 interrompido.
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dividirSql, juntarInstrucoes, tornarIdempotente } from './sql-split.mjs';

export const REF_CANONICO = 'pgxfvjmuubtbowutlide';
export const RAIZ_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DIR_DDL_PADRAO = join(RAIZ_REPO, 'scripts', 'migration', 'ddl');
// Ordem obrigatória de scripts/migration/ddl/99_apply_all.sql (partições após tabelas; views e functions antes de índices/policies).
export const ORDEM_DDL = ['00_extensions.sql', '01_schemas_and_enums.sql', '02_tables.sql', '11_partitions.sql',
  '10_views.sql', '08_functions.sql', '03_indexes.sql', '04_foreign_keys.sql', '05_grants.sql', '06_rls_enable.sql',
  '07_policies.sql', '09_triggers.sql'];
export const emOrdemCanonica = (arquivos) => [...arquivos].sort((a, b) => ORDEM_DDL.indexOf(a) - ORDEM_DDL.indexOf(b));
export const SQL_CONTAR_TABELAS = "SELECT count(*)::int AS t FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'";

/** Erro antes de enviar qualquer DDL (uso/configuração/entrada → saída 2; `codigo` 1 quando a API falhou na preparação). */
export class ErroDeUso extends Error {
  constructor(mensagem, codigo = 2) { super(mensagem); this.name = 'ErroDeUso'; this.codigo = codigo; }
}

const inteiro = (env, nome, padrao, min) => {
  if (env[nome] === undefined || env[nome] === '') return padrao;
  const v = Number(env[nome]);
  if (!Number.isInteger(v) || v < min) throw new ErroDeUso(`${nome} inválido: esperado inteiro >= ${min}`);
  return v;
};

/** Lê e valida a configuração do ambiente. Nunca devolve nem cita o token em mensagens de erro. */
export function lerConfig(env = process.env) {
  const token = (env.SUPABASE_ACCESS_TOKEN ?? '').trim();
  if (token && !/^[\x21-\x7e]+$/.test(token)) throw new ErroDeUso('SUPABASE_ACCESS_TOKEN contém espaço ou caractere inválido');
  const ref = (env.SUPABASE_PROJECT_REF ?? '').trim() || REF_CANONICO;
  if (!/^[a-z0-9]{20}$/.test(ref)) throw new ErroDeUso('SUPABASE_PROJECT_REF inválido: esperado 20 caracteres [a-z0-9]');
  let url;
  try { url = new URL((env.SUPABASE_MGMT_API_URL ?? '').trim() || 'https://api.supabase.com'); } catch { throw new ErroDeUso('SUPABASE_MGMT_API_URL não é uma URL válida'); }
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
  if (url.username || url.password) throw new ErroDeUso('SUPABASE_MGMT_API_URL não pode conter usuário/senha');
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) throw new ErroDeUso('SUPABASE_MGMT_API_URL precisa ser https (http só para 127.0.0.1/localhost)');
  return {
    token, ref, urlBase: `${url.origin}${url.pathname.replace(/\/+$/, '')}`,
    timeoutMs: inteiro(env, 'SUPABASE_MGMT_TIMEOUT_MS', 55000, 1), retentativas: inteiro(env, 'SUPABASE_MGMT_RETRIES', 4, 0),
    backoffMs: inteiro(env, 'SUPABASE_MGMT_BACKOFF_MS', 500, 0), pausaMs: inteiro(env, 'SUPABASE_MGMT_PAUSA_MS', 100, 0),
  };
}

const SQLSTATE_JA_EXISTE = new Set(['42P07', '42710', '42P06', '42723', '42701', '42P04']);
/** Extrai o SQLSTATE da mensagem da API e diz se o erro é só "objeto já existe". */
export function classificarErro(mensagem) {
  const sqlstate = /ERROR:\s+([0-9A-Z]{5}):/.exec(mensagem ?? '')?.[1] ?? null;
  return { sqlstate, jaExiste: sqlstate ? SQLSTATE_JA_EXISTE.has(sqlstate) : /\balready exists\b/i.test(mensagem ?? '') };
}

const dormirPadrao = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Cliente da Management API. consultar(sql) nunca lança; devolve:
 *   { tipo: 'ok', linhas } · { tipo: 'sql', status, mensagem, sqlstate, jaExiste } (o banco recusou o SQL)
 *   { tipo: 'fatal', status, mensagem } (credencial/rota inválida, ou rede/timeout/429/5xx após esgotar retentativas)
 */
export function criarCliente(cfg, { fetchImpl = globalThis.fetch, dormir = dormirPadrao, aleatorio = Math.random } = {}) {
  const estatisticas = { requisicoes: 0, retentativas: 0 };
  const endpoint = `${cfg.urlBase}/v1/projects/${cfg.ref}/database/query`;
  async function consultar(sql) {
    const corpo = JSON.stringify({ query: sql });
    let ultimo = '';
    for (let tentativa = 0; tentativa <= cfg.retentativas; tentativa++) {
      let espera = Math.min(cfg.backoffMs * 2 ** tentativa, 30000) * (0.5 + aleatorio() / 2);
      estatisticas.requisicoes++;
      let resp; let texto;
      // Timer próprio (e não AbortSignal.timeout, cujo timer não segura o processo vivo) cobrindo cabeçalhos + corpo.
      const aborto = new AbortController();
      const relogio = setTimeout(() => aborto.abort(new DOMException('tempo esgotado', 'TimeoutError')), cfg.timeoutMs);
      try {
        resp = await fetchImpl(endpoint, {
          method: 'POST', body: corpo, redirect: 'manual', signal: aborto.signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.token}`, apikey: cfg.token },
        });
        texto = await resp.text();
      } catch (e) {
        ultimo = e?.name === 'TimeoutError' ? `timeout após ${cfg.timeoutMs} ms` : `erro de rede (${e?.cause?.code ?? e?.code ?? e?.name ?? 'desconhecido'})`;
        resp = null;
      } finally { clearTimeout(relogio); }
      if (resp) {
        let json; try { json = JSON.parse(texto); } catch { json = undefined; }
        const mensagem = String(json?.message ?? json?.error ?? texto ?? '').trim().slice(0, 2000);
        if (resp.status >= 200 && resp.status < 300) return { tipo: 'ok', linhas: Array.isArray(json) ? json : [] };
        if (resp.status === 400) return { tipo: 'sql', status: 400, mensagem, ...classificarErro(mensagem) };
        const repetivel = resp.status === 408 || resp.status === 425 || resp.status === 429 || resp.status >= 500;
        if (!repetivel) {
          const dica = resp.status === 401 || resp.status === 403 ? ' — token recusado (confira SUPABASE_ACCESS_TOKEN)'
            : resp.status === 404 ? ' — projeto ou rota não encontrados (confira SUPABASE_PROJECT_REF)' : '';
          return { tipo: 'fatal', status: resp.status, mensagem: `HTTP ${resp.status}${dica}: ${mensagem.slice(0, 200)}` };
        }
        ultimo = `HTTP ${resp.status}: ${mensagem.slice(0, 200)}`;
        const retryAfter = resp.headers?.get?.('retry-after') ?? '';
        if (/^\d+$/.test(retryAfter.trim())) espera = Math.min(Number(retryAfter) * 1000, 60000);
      }
      if (tentativa < cfg.retentativas) { estatisticas.retentativas++; await dormir(espera); }
    }
    return { tipo: 'fatal', status: 0, mensagem: `desisti após ${cfg.retentativas + 1} tentativa(s): ${ultimo}` };
  }
  return { consultar, estatisticas };
}

/** Interpreta os argumentos de linha de comando (iguais para todos os scripts da família). */
export function lerArgs(argv) {
  const args = { aplicar: false, simular: false, ajuda: false, sql: false, dirDdl: DIR_DDL_PADRAO };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--apply') args.aplicar = true;
    else if (a === '--dry-run') args.simular = true;
    else if (a === '--help' || a === '-h') args.ajuda = true;
    else if (a === '--sql') args.sql = true;
    else if (a === '--ddl-dir' || a.startsWith('--ddl-dir=')) {
      const v = a.includes('=') ? a.slice(a.indexOf('=') + 1) : argv[++i];
      if (!v) throw new ErroDeUso('--ddl-dir exige um caminho');
      args.dirDdl = resolve(v);
    } else throw new ErroDeUso(`argumento desconhecido: ${a}`);
  }
  if (args.aplicar && args.simular) throw new ErroDeUso('use --apply OU --dry-run, não os dois');
  if (args.aplicar && args.sql) throw new ErroDeUso('--sql só vale na simulação (sem --apply)');
  return args;
}

export function textoDeAjuda({ nome, descricao }) {
  return `${nome} — ${descricao}

Uso: node scripts/${nome} [--dry-run] [--apply] [--sql] [--ddl-dir <dir>] [--help]

  (sem flags)      SIMULAÇÃO: mostra o que seria enviado; não faz nenhuma requisição.
  --dry-run        o mesmo que o padrão, explícito.
  --apply          APLICA no projeto Supabase (produção por padrão). Exige SUPABASE_ACCESS_TOKEN.
  --sql            na simulação, imprime o SQL completo que seria enviado (saída é um script SQL válido).
  --ddl-dir <dir>  lê os .sql de outro diretório (padrão: scripts/migration/ddl na raiz do repo).

Ambiente: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF (padrão ${REF_CANONICO}), SUPABASE_MGMT_API_URL,
          SUPABASE_MGMT_TIMEOUT_MS, SUPABASE_MGMT_RETRIES, SUPABASE_MGMT_BACKOFF_MS, SUPABASE_MGMT_PAUSA_MS.
Saída: 0 ok · 1 houve falha · 2 uso/configuração/SQL malformado · 130 interrompido.
`;
}

/** Lê e divide um arquivo de DDL. Devolve [{ origem: 'arquivo:linha', sql }]. Falha → ErroDeUso (nada é enviado). */
export function carregarDdl(dirDdl, arquivo) {
  const caminho = join(dirDdl, arquivo);
  let texto;
  try { texto = readFileSync(caminho, 'utf8'); } catch (e) { throw new ErroDeUso(`não consegui ler ${caminho} (${e.code ?? e.message})`); }
  try { return dividirSql(texto).map((s) => ({ origem: `${arquivo}:${s.linha}`, sql: s.sql })); } catch (e) { throw new ErroDeUso(`${arquivo}: ${e.message}`); }
}

/** Agrupa instruções em unidades (1 unidade = 1 POST). `atomico` = tudo ou nada, sem repartir em caso de erro. */
export function emUnidades(instrucoes, lote = 1, atomico = false) {
  const unidades = [];
  const passo = atomico ? Math.max(instrucoes.length, 1) : lote;
  for (let i = 0; i < instrucoes.length; i += passo) unidades.push({ instrucoes: instrucoes.slice(i, i + passo), atomico });
  return unidades;
}

/** Monta as etapas (uma por arquivo, na ordem canônica) com cada instrução já idempotente. */
export function etapasDeArquivos(dirDdl, arquivos, { lote = 1, atomico = false } = {}) {
  return emOrdemCanonica(arquivos).map((arquivo) => {
    const instrucoes = carregarDdl(dirDdl, arquivo).map((i) => ({ origem: i.origem, sql: tornarIdempotente(i.sql) }));
    return { titulo: arquivo, unidades: emUnidades(instrucoes, lote, atomico) };
  });
}

const resumir = (sql) => { const l = sql.replace(/\s+/g, ' ').trim(); return l.length > 110 ? `${l.slice(0, 107)}...` : l; };
const totalDe = (etapas) => etapas.reduce((n, e) => n + e.unidades.reduce((m, u) => m + u.instrucoes.length, 0), 0);

/** Executa (ou simula) o plano e imprime o resumo. Devolve o código de saída. */
export async function executarPlano({ nome, etapas, args, cfg, cliente, escrever, estado = { parar: null } }) {
  const total = totalDe(etapas);
  const requisicoes = etapas.reduce((n, e) => n + e.unidades.length, 0);
  if (!args.aplicar) {
    const c = (t) => escrever(args.sql ? `-- ${t}` : t);
    c(`${nome}: SIMULAÇÃO (nada é enviado). Projeto ${cfg.ref} em ${cfg.urlBase}. Token ${cfg.token ? 'presente' : 'ausente (necessário para --apply)'}.`);
    for (const e of etapas) {
      c(`[${e.titulo}] ${totalDe([e])} instrução(ões) em ${e.unidades.length} requisição(ões)${e.nota ? ` — ${e.nota}` : ''}`);
      if (args.sql) for (const u of e.unidades) escrever(`-- ${u.instrucoes[0].origem}${u.atomico ? ' (arquivo inteiro, atômico)' : ''}\n${juntarInstrucoes(u.instrucoes)}`);
      else {
        for (const u of e.unidades.slice(0, 3)) c(`   ${u.instrucoes[0].origem}  ${resumir(u.instrucoes[0].sql)}${u.instrucoes.length > 1 ? `  (+${u.instrucoes.length - 1} no mesmo POST)` : ''}`);
        if (e.unidades.length > 3) c(`   ... +${e.unidades.length - 3} requisição(ões); use --sql para ver o SQL completo`);
      }
    }
    c(`TOTAL: ${total} instrução(ões) em ${requisicoes} requisição(ões) seriam enviadas. Para aplicar de verdade: --apply`);
    return 0;
  }

  const r = { ok: 0, jaExistia: 0, falhas: [], naoExecutadas: 0, fatal: null };
  const contar = async () => { const x = await cliente.consultar(SQL_CONTAR_TABELAS); return x.tipo === 'ok' && Number.isInteger(x.linhas[0]?.t) ? x.linhas[0].t : x; };
  escrever(`${nome}: APLICAÇÃO REAL no projeto ${cfg.ref} em ${cfg.urlBase} — ${total} instrução(ões), ${requisicoes} requisição(ões).`);
  const antes = await contar();
  if (antes?.tipo === 'fatal') r.fatal = antes.mensagem;
  escrever(`Tabelas em public antes: ${Number.isInteger(antes) ? antes : 'indisponível'}`);
  const pausa = () => (cfg.pausaMs ? dormirPadrao(cfg.pausaMs) : null);
  // Envia uma unidade; em erro de SQL num lote não atômico, reenvia instrução a instrução para isolar a culpada.
  const enviar = async (u, etapa, repescagem = false) => {
    const resp = await cliente.consultar(juntarInstrucoes(u.instrucoes));
    const n = u.instrucoes.length;
    if (resp.tipo === 'ok') { r.ok += n; return repescagem ? 'OK (2ª passada)' : 'OK'; }
    if (resp.tipo === 'fatal') { r.fatal = resp.mensagem; r.naoExecutadas += n; return `ABORTADO: ${resp.mensagem}`; }
    if (n > 1 && !u.atomico) {
      let falhou = 0;
      for (let k = 0; k < n; k++) {
        if ((await enviar({ instrucoes: [u.instrucoes[k]], atomico: false }, etapa)).startsWith('FALHOU')) falhou++;
        if (r.fatal) { r.naoExecutadas += n - k - 1; return `ABORTADO: ${r.fatal}`; }
        await pausa();
      }
      return `lote recusado pelo banco; reenviado 1 a 1: ${n - falhou} ok, ${falhou} falharam`;
    }
    if (resp.jaExiste) { r.jaExistia += n; return 'JÁ EXISTIA'; }
    r.falhas.push({ etapa, unidade: u, mensagem: resp.mensagem });
    return `FALHOU: ${resumir(resp.mensagem)}`;
  };
  let feitas = 0;
  for (const e of etapas) {
    escrever(`[${e.titulo}] ${totalDe([e])} instrução(ões) em ${e.unidades.length} requisição(ões)`);
    for (const u of e.unidades) {
      if (r.fatal || estado.parar) { r.naoExecutadas += u.instrucoes.length; continue; }
      feitas++;
      escrever(`  ${feitas}/${requisicoes} ${u.instrucoes[0].origem}${u.instrucoes.length > 1 ? ` (+${u.instrucoes.length - 1})` : ''} ... ${await enviar(u, e.titulo)}`);
      await pausa();
    }
  }
  // Repescagem: o que falhou pode depender de objeto criado depois (ex.: índice que usa função). Repete enquanto houver progresso.
  for (let passada = 0, progresso = true; passada < 3 && progresso && r.falhas.length && !r.fatal && !estado.parar; passada++) {
    const pendentes = r.falhas; r.falhas = []; progresso = false;
    escrever(`[repescagem ${passada + 1}] ${pendentes.length} unidade(s) que falharam`);
    for (const f of pendentes) {
      if (r.fatal || estado.parar) { r.falhas.push(f); continue; }
      const antesOk = r.ok + r.jaExistia;
      const res = await enviar(f.unidade, f.etapa, true);
      if (r.fatal) { r.naoExecutadas -= f.unidade.instrucoes.length; r.falhas.push(f); }
      if (r.ok + r.jaExistia > antesOk) { progresso = true; escrever(`  ${f.unidade.instrucoes[0].origem} ... ${res}`); }
      await pausa();
    }
  }
  if (!r.fatal) {
    const depois = await contar();
    escrever(`Tabelas em public depois: ${Number.isInteger(depois) ? `${depois}${Number.isInteger(antes) ? ` (${depois - antes >= 0 ? '+' : ''}${depois - antes})` : ''}` : 'indisponível'}`);
  }
  const falhadas = r.falhas.reduce((n, f) => n + f.unidade.instrucoes.length, 0);
  escrever(`\nRESUMO ${nome}: ${total} instrução(ões) — ${r.ok} ok, ${r.jaExistia} já existiam, ${falhadas} falharam, ${r.naoExecutadas} não executadas. Requisições: ${cliente.estatisticas.requisicoes} (retentativas: ${cliente.estatisticas.retentativas}).`);
  for (const f of r.falhas.slice(0, 60)) escrever(`  FALHOU ${f.unidade.instrucoes[0].origem}${f.unidade.atomico ? ` (arquivo atômico: nada dele foi aplicado, ${f.unidade.instrucoes.length} instruções)` : ''}: ${resumir(f.mensagem)}\n         ${resumir(f.unidade.instrucoes[0].sql)}`);
  if (r.falhas.length > 60) escrever(`  ... +${r.falhas.length - 60} falha(s)`);
  if (r.fatal) escrever(`  ABORTADO: ${r.fatal}`);
  if (estado.parar) escrever(`  INTERROMPIDO (${estado.parar}): o que não foi enviado está contado em "não executadas".`);
  const codigo = estado.parar === 'SIGINT' ? 130 : (falhadas || r.naoExecutadas || r.fatal || estado.parar) ? 1 : 0;
  escrever(`Resultado: ${codigo === 0 ? 'SUCESSO' : 'FALHOU'} (código de saída ${codigo})`);
  return codigo;
}

/**
 * Ponto de entrada comum. `def` = { nome, descricao, montarEtapas({ args, cfg, cliente }) }.
 * `montarEtapas` pode ser assíncrono; `cliente` só existe com --apply. Devolve o código de saída (não chama process.exit).
 */
export async function principal(def, argv = process.argv.slice(2), env = process.env, io = {}) {
  const saida = io.stdout ?? process.stdout;
  const estado = { parar: null };
  let token = '';
  const escrever = (t) => { if (!estado.saidaFechada) saida.write(`${token ? String(t).split(token).join('***') : t}\n`); };
  const aoFecharSaida = (e) => { if (e.code === 'EPIPE') { estado.saidaFechada = true; estado.parar ??= 'saída fechada'; } };
  const aoSigint = () => { estado.parar = 'SIGINT'; };
  saida.on?.('error', aoFecharSaida);
  process.once('SIGINT', aoSigint);
  try {
    const args = lerArgs(argv);
    if (args.ajuda) { escrever(textoDeAjuda(def)); return 0; }
    const cfg = lerConfig(env);
    token = cfg.token;
    if (args.aplicar && !cfg.token) throw new ErroDeUso('SUPABASE_ACCESS_TOKEN é obrigatório com --apply (forneça pelo ambiente seguro; nunca em arquivo versionado)');
    const cliente = args.aplicar ? criarCliente(cfg, io) : null;
    const etapas = await def.montarEtapas({ args, cfg, cliente });
    return await executarPlano({ nome: def.nome, etapas, args, cfg, cliente, escrever, estado });
  } catch (e) {
    const texto = String(e instanceof ErroDeUso ? e.message : e?.stack ?? e);
    const limpo = token ? texto.split(token).join('***') : texto;
    (io.stderr ?? process.stderr).write(e instanceof ErroDeUso ? `${def.nome}: ${limpo}\nNada foi enviado. Use --help para ver o uso.\n` : `${def.nome}: erro inesperado: ${limpo}\n`);
    return e instanceof ErroDeUso ? e.codigo : 1;
  } finally {
    process.removeListener('SIGINT', aoSigint);
    saida.removeListener?.('error', aoFecharSaida);
  }
}

/** Verdadeiro quando o módulo `metaUrl` é o script chamado na linha de comando (resolve symlinks). */
export function ehCli(metaUrl) {
  try { return Boolean(process.argv[1]) && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(metaUrl)); } catch { return false; }
}

/** Roda `main` como CLI: define o código de saída e encerra depois de esvaziar o stdout. */
export async function rodarComoCli(main) {
  const codigo = await main();
  process.exitCode = codigo;
  if (process.stdout.writableLength === 0 || process.stdout.destroyed) process.exit(codigo);
  process.stdout.write('', () => process.exit(codigo));
}
