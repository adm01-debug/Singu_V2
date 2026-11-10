#!/usr/bin/env node
/**
 * O que cada edge function toca -> inventario/estado/edge-tabela.json.
 *
 * `edges.json` ja diz quantas linhas cada edge tem, quais segredos ela le e quem a chama; o que
 * faltava era o outro lado: quais tabelas, RPCs, buckets e outras edges cada funcao alcanca, e o
 * indice inverso (dada uma tabela, quais edges mexem nela). Sem isso, mexer numa tabela obriga a
 * reler supabase/functions/ inteiro para saber o que quebra.
 *
 * Le supabase/functions/<funcao>/ ** /*.ts (sem `_shared`, sem teste), com a mesma extracao usada
 * no inventario das rotas (scripts/inventario/chamadas-supabase.mjs). Import de `_shared/` e
 * seguido uma vez, para que a tabela acessada por helper compartilhado apareca na funcao que o usa.
 *
 * Uso:
 *   node scripts/inventario/gerar-edge-tabela.mjs           grava o JSON
 *   node scripts/inventario/gerar-edge-tabela.mjs --check   exit 1 se o commitado esta velho
 * Saida deterministica (sem data): o mesmo codigo gera o mesmo arquivo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { extrairChamadas } from './chamadas-supabase.mjs';

const RAIZ_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR_FUNCOES_REL = 'supabase/functions';
const SAIDA_REL = 'inventario/estado/edge-tabela.json';

const unico = (lista) => [...new Set(lista)].sort();
const ehTeste = (nome) => /(_test|\.test|\.spec)\.(ts|tsx|js|mjs)$/.test(nome);

/** Todos os .ts de um diretorio, recursivo, sem teste. */
export function listarTs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return listarTs(p);
    return /\.ts$/.test(e.name) && !ehTeste(e.name) ? [p] : [];
  }).sort();
}

/** Arquivos de `_shared/` importados por um texto (import relativo que sobe para _shared). */
export function sharedImportados(texto, arquivoAbs, dirFuncoes) {
  const alvos = new Set();
  for (const m of texto.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
    const base = path.resolve(path.dirname(arquivoAbs), m[1]);
    if (!base.startsWith(path.join(dirFuncoes, '_shared') + path.sep)) continue;
    for (const cand of [base, `${base}.ts`, path.join(base, 'index.ts')]) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) { alvos.add(cand); break; }
    }
  }
  return [...alvos].sort();
}

/** Monta o inventario a partir de uma raiz de repo. */
export function gerarEdgeTabela(raiz = RAIZ_PADRAO) {
  const dirFuncoes = path.join(raiz, DIR_FUNCOES_REL);
  if (!fs.existsSync(dirFuncoes)) throw new Error(`${DIR_FUNCOES_REL} nao existe neste repositorio.`);
  const nomes = fs.readdirSync(dirFuncoes, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .map((e) => e.name).sort();

  const funcoes = {};
  for (const nome of nomes) {
    const arquivos = listarTs(path.join(dirFuncoes, nome));
    const acumulado = { tabelas: [], buckets: [], rpcs: [], edges: [] };
    const compartilhados = new Set();
    for (const arq of arquivos) {
      const texto = fs.readFileSync(arq, 'utf8');
      const c = extrairChamadas(texto);
      for (const k of Object.keys(acumulado)) acumulado[k].push(...c[k]);
      for (const s of sharedImportados(texto, arq, dirFuncoes)) compartilhados.add(s);
    }
    // `_shared/` entra uma vez por funcao que o importa: helper que faz `.from('x')` conta para
    // quem o usa, nao para uma funcao fantasma chamada `_shared`.
    for (const s of compartilhados) {
      const c = extrairChamadas(fs.readFileSync(s, 'utf8'));
      for (const k of Object.keys(acumulado)) acumulado[k].push(...c[k]);
    }
    funcoes[nome] = {
      arquivos: arquivos.length,
      compartilhados: [...compartilhados].map((s) => path.relative(raiz, s).split(path.sep).join('/')).sort(),
      tabelas: unico(acumulado.tabelas),
      rpcs: unico(acumulado.rpcs),
      buckets: unico(acumulado.buckets),
      invoca_edges: unico(acumulado.edges).filter((e) => e !== nome),
    };
  }

  const porTabela = {};
  for (const [nome, d] of Object.entries(funcoes)) for (const t of d.tabelas) (porTabela[t] ??= []).push(nome);
  const porRpc = {};
  for (const [nome, d] of Object.entries(funcoes)) for (const r of d.rpcs) (porRpc[r] ??= []).push(nome);

  const ordenado = (obj) => Object.fromEntries(Object.keys(obj).sort().map((k) => [k, unico(obj[k])]));

  return {
    format_version: 1,
    fonte: `scripts/inventario/gerar-edge-tabela.mjs (le ${DIR_FUNCOES_REL}/<funcao>/**/*.ts, sem teste, seguindo _shared/ uma vez)`,
    limites: 'leitura estatica: nome de tabela em variavel nao constante, concatenacao e SQL cru ficam de fora; '
      + 'alcance nao prova execucao',
    resumo: {
      funcoes: Object.keys(funcoes).length,
      funcoes_sem_tabela: Object.values(funcoes).filter((d) => !d.tabelas.length).length,
      tabelas_distintas: Object.keys(porTabela).length,
      rpcs_distintas: Object.keys(porRpc).length,
    },
    funcoes,
    por_tabela: ordenado(porTabela),
    por_rpc: ordenado(porRpc),
  };
}

export const serializar = (inv) => `${JSON.stringify(inv, null, 2)}\n`;

function main(argv) {
  const saida = path.join(RAIZ_PADRAO, SAIDA_REL);
  const conteudo = serializar(gerarEdgeTabela(RAIZ_PADRAO));
  if (argv.includes('--check')) {
    const atual = fs.existsSync(saida) ? fs.readFileSync(saida, 'utf8') : '';
    if (atual !== conteudo) {
      console.error(`${SAIDA_REL} desatualizado: rode node scripts/inventario/gerar-edge-tabela.mjs e commite o resultado.`);
      process.exit(1);
    }
    console.log(`${SAIDA_REL} em dia.`);
    return;
  }
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, conteudo);
  const r = JSON.parse(conteudo).resumo;
  console.log(`edge-tabela.json: ${r.funcoes} edge functions (${r.funcoes_sem_tabela} sem tabela), `
    + `${r.tabelas_distintas} tabelas, ${r.rpcs_distintas} RPCs.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
