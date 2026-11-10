#!/usr/bin/env node
// Etapa 84 do plano banco-unico: detector de regressao de exposicao RLS.
// Mede via PostgREST (o mesmo caminho do front), nao via SQL direto — e o que o cliente real enxerga.
//
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=... node check-rls-baseline.mjs
//   TEST_USER_JWT=<jwt de usuario sem role/carteira>   (obrigatorio quando o baseline exige esse perfil)
//   --update  regrava o baseline com o estado atual (use no MESMO PR que reduz exposicao)
//   RLS_BASELINE_FILE=<json>   outro arquivo de baseline (padrao: rls-baseline.json ao lado do script)
//   RLS_RETRY_DELAY_MS / RLS_TIMEOUT_MS   espera entre tentativas (2000) e prazo por requisicao (30000)
//
// Exit 1 se alguma tabela expuser MAIS linhas que o baseline, ou se a coleta ficar incompleta.
// Exit 2 se faltar variavel de ambiente ou o baseline estiver ilegivel/fora do formato.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ARQ = process.env.RLS_BASELINE_FILE?.trim() || join(AQUI, 'rls-baseline.json');
const LIMITE = 1001;
const MAX_RETRIES = 2;
const numero = (valor, padrao) => (Number.isFinite(Number(valor)) && Number(valor) >= 0 && String(valor ?? '').trim() !== '' ? Number(valor) : padrao);
const RETRY_DELAY_MS = numero(process.env.RLS_RETRY_DELAY_MS, 2000);
const TIMEOUT_MS = numero(process.env.RLS_TIMEOUT_MS, 30000) || 30000;
// Falha passageira do gateway: vale tentar de novo antes de declarar a coleta incompleta.
const PASSAGEIROS = new Set([429, 500, 502, 503, 504]);

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Uso: SUPABASE_URL=... SUPABASE_ANON_KEY=... [TEST_USER_JWT=...] node scripts/rls-matrix/check-rls-baseline.mjs [--update]\n'
    + 'Falha (exit 1) se alguma tabela expuser mais linhas que rls-baseline.json ou se a coleta ficar incompleta.');
  process.exit(0);
}

const { SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_JWT } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('faltam SUPABASE_URL e SUPABASE_ANON_KEY');
  process.exit(2);
}
const atualizar = process.argv.includes('--update');
const BASE = SUPABASE_URL.trim().replace(/\/+$/, '');

function lerBaseline() {
  let dado;
  try {
    dado = JSON.parse(readFileSync(ARQ, 'utf8'));
  } catch (e) {
    throw new Error(`nao consegui ler o baseline ${ARQ}: ${e.message}`);
  }
  const tabelas = dado?.tabelas;
  if (!tabelas || typeof tabelas !== 'object' || Array.isArray(tabelas) || Object.keys(tabelas).length === 0) {
    throw new Error(`baseline ${ARQ} sem "tabelas": nada seria verificado`);
  }
  for (const [tabela, perfis] of Object.entries(tabelas)) {
    if (!perfis || typeof perfis !== 'object' || Array.isArray(perfis) || Object.keys(perfis).length === 0) {
      throw new Error(`baseline: "${tabela}" precisa de um objeto { perfil: linhas }`);
    }
    for (const [perfil, n] of Object.entries(perfis)) {
      // Um valor que nao e inteiro >= -1 (null, "0", 1.5) faria a comparacao aprovar por coercao.
      if (!Number.isInteger(n) || n < -1) throw new Error(`baseline: ${tabela}.${perfil} = ${JSON.stringify(n)} (esperado inteiro >= -1)`);
    }
  }
  return dado;
}
let baseline;
try {
  baseline = lerBaseline();
} catch (e) {
  console.error(`BASELINE INVALIDO: ${e.message}`);
  process.exit(2);
}

// -1 = sem grant (permission denied). Distinguir de 0 (grant existe, RLS filtrou tudo) importa:
// 0 pode virar N se alguem afrouxar a policy; -1 so muda se alguem conceder grant.
async function contar(tabela, jwt) {
  const url = `${BASE}/rest/v1/${encodeURIComponent(tabela)}?select=*&limit=${LIMITE}`;
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${jwt ?? SUPABASE_ANON_KEY}` };
  let res;
  let erroDeRede;
  for (let tentativa = 0; tentativa <= MAX_RETRIES; tentativa++) {
    if (tentativa > 0) await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    try {
      res = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
      erroDeRede = undefined;
    } catch (e) {
      res = undefined;
      erroDeRede = e.name === 'TimeoutError' ? `sem resposta em ${TIMEOUT_MS} ms` : e.message;
      continue;
    }
    if (!PASSAGEIROS.has(res.status)) break;
  }
  if (!res) return { erro: `rede: ${erroDeRede}` };
  if (res.status === 401 || res.status === 403) {
    const body = await res.json().catch(() => null);
    return body?.code === '42501' ? { n: -1 } : { erro: `autenticacao/permissao nao confirmada: http ${res.status}` };
  }
  if (res.status === 404) return { erro: 'http 404 (a tabela nao existe mais? se foi removida de proposito, tire-a do baseline)' };
  if (!res.ok) return { erro: `http ${res.status}` };
  try {
    const linhas = await res.json();
    return Array.isArray(linhas) ? { n: linhas.length } : { erro: 'resposta nao e uma lista' };
  } catch {
    return { erro: 'JSON invalido' };
  }
}

const perfis = [{ nome: 'anon', jwt: null }];
if (TEST_USER_JWT?.trim()) perfis.push({ nome: 'authenticated_sem_role', jwt: TEST_USER_JWT.trim() });
const exigidos = new Set([
  ...Object.keys(baseline._meta?.perfis ?? {}),
  ...Object.values(baseline.tabelas).flatMap(esperado => Object.keys(esperado)),
]);
const ausentes = [...exigidos].filter(nome => !perfis.some(perfil => perfil.nome === nome));
if (ausentes.length) {
  console.error(`VERIFICACAO INCOMPLETA: perfis exigidos nao disponiveis: ${ausentes.join(', ')}`);
  process.exit(1);
}

const regressoes = [];
const melhorias = [];
const falhas = [];
const atual = {};

for (const [tabela, esperado] of Object.entries(baseline.tabelas)) {
  atual[tabela] = { ...esperado };
  for (const { nome, jwt } of perfis) {
    const { n, erro } = await contar(tabela, jwt);
    if (erro) { falhas.push(`${tabela}/${nome}: ${erro}`); continue; }
    atual[tabela][nome] = n;
    const antes = esperado[nome];
    if (antes === undefined) continue;
    // -1 (sem grant) e estritamente melhor que qualquer n >= 0.
    const piorou = antes === -1 ? n !== -1 : n > antes;
    const melhorou = antes === -1 ? false : n === -1 || n < antes;
    if (piorou) regressoes.push(`${tabela} [${nome}]: ${antes} -> ${n}`);
    else if (melhorou) melhorias.push(`${tabela} [${nome}]: ${antes} -> ${n}`);
  }
}

if (falhas.length) {
  console.error(`VERIFICACAO INCOMPLETA (${falhas.length}):\n  ${falhas.join('\n  ')}\n`);
  process.exit(1);
}
if (melhorias.length) console.log(`exposicao reduzida (rode com --update para fixar):\n  ${melhorias.join('\n  ')}\n`);

if (atualizar) {
  // --update aceita o estado atual, inclusive o que piorou: que fique escrito no log do PR.
  if (regressoes.length) console.error(`REGRESSAO ACEITA PELO --update (${regressoes.length}):\n  ${regressoes.join('\n  ')}\n`);
  baseline.tabelas = atual;
  baseline._meta ??= {};
  baseline._meta.gerado_em = new Date().toISOString().slice(0, 10);
  writeFileSync(ARQ, JSON.stringify(baseline, null, 2) + '\n');
  console.log('baseline atualizado');
  process.exit(0);
}

if (regressoes.length) {
  console.error(`REGRESSAO DE EXPOSICAO (${regressoes.length}):\n  ${regressoes.join('\n  ')}`);
  console.error('\nAlguma policy passou a mostrar mais linhas. Se foi intencional, rode com --update no mesmo PR.');
  process.exit(1);
}
console.log(`ok: ${Object.keys(baseline.tabelas).length} tabelas, ${perfis.length} perfil(is), nenhuma regressao`);
