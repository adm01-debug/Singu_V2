#!/usr/bin/env node
/**
 * O inventario mudou de verdade? Compara cada arquivo de inventario/estado/ com a versao do
 * HEAD depois de tirar so os carimbos de data (`medido_em`, `gerado_em`, em qualquer nivel).
 * Imprime `true` ou `false` (usado pelo inventario-estado-semanal.yml para decidir se abre PR).
 *
 * Uso: node scripts/inventario/mudou-conteudo.mjs [arquivo...]   (padrao: banco, rotas e edges)
 *
 * Os caminhos sao relativos a raiz do repositorio (a pasta acima de scripts/, ou INVENTARIO_RAIZ
 * em teste), nao ao diretorio atual. O stdout tem SO `true`/`false`. Exit 0 = respondeu;
 * exit 2 = nao deu para comparar (git ausente, fora de repositorio, sem HEAD, arquivo ilegivel):
 * nesse caso nada sai no stdout, para o workflow falhar em vez de decidir no escuro.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PADRAO = ['inventario/estado/banco.json', 'inventario/estado/edge-tabela.json', 'inventario/estado/edges.json', 'inventario/estado/rotas.json', 'inventario/estado/tabelas-uso.json'];
const CARIMBOS = new Set(['medido_em', 'gerado_em']);
// Telemetria viva do cron/WhatsApp: muda quase toda semana so pela janela rolante de 7 dias, sem
// mudanca estrutural nenhuma (achado da revisao de 2026-11-02 em scripts/inventario/gerar-banco.mjs:
// mudar so `taxa_falha_7d_pct` de 9 para 9.3 ja fazia `mudou()` dar `true`). Fora desses nomes, nada
// muda: a lista de alertas, tabelas_orfas e o resto de `banco.json`/`rotas.json` continuam
// comparados normalmente.
const TELEMETRIA = new Set([
  'execucoes_24h', 'falhas_24h', 'execucoes_7d', 'falhas_7d', 'taxa_falha_7d_pct',
  'startup_timeout_7d', 'ultima_falha', 'duracao_max_s_7d', 'horas_paradas_7d',
  'mais_antigo', 'mais_de_7_dias', 'mensagens_7d', 'ultimo_health_check', 'atualizada_em',
]);
const IGNORADOS = new Set([...CARIMBOS, ...TELEMETRIA]);
// `historico.linhas`/`historico.bytes` tambem rolam todo dia com a retencao de 7 dias
// (20261102022200_cron_historico_retencao_7d), mas o nome `linhas`/`bytes` e compartilhado com
// cada tabela em `tabelas[]`, onde a contagem real importa. So ignora dentro de `cron.historico`.
function limparHistoricoCron(historico) {
  if (!historico || typeof historico !== 'object') return historico;
  const { linhas, bytes, ...resto } = historico;
  return resto;
}

// Achado da revisao (Codex, 2026-11-02): a telemetria tambem vaza pro TEXTO de alertas[].detalhe,
// que a lista IGNORADOS (por nome de campo) nao alcanca. `cron_falhando` grava
// "nome (9.0% em 7d)" — a porcentagem rola toda semana mesmo sem o job sair da lista; `cron_parado`
// grava a lista de horas de `horas_paradas_7d`, que ja ignoramos na raiz pelo mesmo motivo (janela
// rolante de 7 dias). So normaliza o TEXTO; se um job entra ou sai da lista (`cron_falhando`) ou o
// alerta `cron_parado` aparece/desaparece, a mudanca de verdade continua sendo pega.
const PORCENTAGEM_7D = /\s*\([\d.]+%\s*em\s*7d\)\s*$/;
function normalizarAlerta(a) {
  if (!a || typeof a !== 'object' || !('tipo' in a) || !Array.isArray(a.detalhe)) return a;
  if (a.tipo === 'cron_falhando') {
    return { ...a, detalhe: a.detalhe.map((d) => (typeof d === 'string' ? d.replace(PORCENTAGEM_7D, '') : d)) };
  }
  // Mesmo bug do cron_parado: `mais_de_7_dias` rola todo dia com a retencao diaria
  // (20261102022200_cron_historico_retencao_7d) e vai virar ruido assim que cruzar o limiar.
  if (a.tipo === 'cron_parado' || a.tipo === 'historico_cron_sem_limpeza') return { ...a, detalhe: [] };
  return a;
}

/** JSON canonico sem os carimbos de data e sem a telemetria viva. Texto que nao e JSON volta como esta. */
export function semCarimbos(texto) {
  if (texto === null) return null;
  let dado;
  try { dado = JSON.parse(texto); } catch { return texto; }
  const limpar = (v, chave) => {
    if (Array.isArray(v)) return v.map((x) => limpar(chave === 'alertas' ? normalizarAlerta(x) : x));
    if (v && typeof v === 'object') {
      const base = chave === 'historico' ? limparHistoricoCron(v) : v;
      return Object.fromEntries(
        Object.keys(base).filter((k) => !IGNORADOS.has(k)).sort().map((k) => [k, limpar(base[k], k)]),
      );
    }
    return v;
  };
  return JSON.stringify(limpar(dado));
}

/** true se algum arquivo mudou alem dos carimbos (arquivo novo ou apagado conta). */
export function mudou(arquivos, lerAntes, lerDepois) {
  return arquivos.some((f) => semCarimbos(lerAntes(f)) !== semCarimbos(lerDepois(f)));
}

/** Leitores do HEAD e do disco, ambos a partir de `raiz`. Erro de git que nao seja "nao existe no HEAD" sobe. */
export function leitores(raiz) {
  // 256 MB: com o padrao de 1 MB do execFileSync um JSON maior estourava ENOBUFS, era lido como
  // "arquivo novo" e a resposta virava `true` para sempre.
  const git = (args, stdio = ['ignore', 'pipe', 'pipe']) => execFileSync('git', args, { cwd: raiz, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio });
  try { git(['rev-parse', '--verify', '--quiet', 'HEAD^{commit}']); } catch (e) {
    throw new Error(e.code === 'ENOENT' ? 'git nao encontrado' : `${raiz} nao e um repositorio git com HEAD`);
  }
  const relativo = (f) => path.relative(raiz, path.resolve(raiz, f)).split(path.sep).join('/');
  const lerAntes = (f) => {
    try { git(['cat-file', '-e', `HEAD:${relativo(f)}`], 'ignore'); } catch { return null; } // nao existe no HEAD
    return git(['show', `HEAD:${relativo(f)}`]);
  };
  const lerDepois = (f) => (fs.existsSync(path.resolve(raiz, f)) ? fs.readFileSync(path.resolve(raiz, f), 'utf8') : null);
  return { lerAntes, lerDepois };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Uso: node scripts/inventario/mudou-conteudo.mjs [arquivo...]\nImprime true/false: o inventario mudou alem dos carimbos de data e da telemetria?');
    process.exit(0);
  }
  const raiz = path.resolve(process.env.INVENTARIO_RAIZ?.trim() || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
  try {
    const { lerAntes, lerDepois } = leitores(raiz);
    console.log(String(mudou(args.length ? args : PADRAO, lerAntes, lerDepois)));
  } catch (erro) {
    console.error(`ERRO: ${erro.message}`);
    process.exit(2);
  }
}
