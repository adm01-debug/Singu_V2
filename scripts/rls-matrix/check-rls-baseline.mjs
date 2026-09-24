#!/usr/bin/env node
// Etapa 84 do plano banco-unico: detector de regressao de exposicao RLS.
// Mede via PostgREST (o mesmo caminho do front), nao via SQL direto — e o que o cliente real enxerga.
//
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=... node check-rls-baseline.mjs
//   TEST_USER_JWT=<jwt de usuario sem role/carteira>   (opcional; sem ele so o perfil anon roda)
//   --update  regrava o baseline com o estado atual (use no MESMO PR que reduz exposicao)
//
// Exit 1 se alguma tabela expuser MAIS linhas que o baseline.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ARQ = join(AQUI, 'rls-baseline.json');
const LIMITE = 1001;

const { SUPABASE_URL, SUPABASE_ANON_KEY, TEST_USER_JWT } = process.env;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('faltam SUPABASE_URL e SUPABASE_ANON_KEY');
  process.exit(2);
}
const atualizar = process.argv.includes('--update');
const baseline = JSON.parse(readFileSync(ARQ, 'utf8'));

// -1 = sem grant (permission denied). Distinguir de 0 (grant existe, RLS filtrou tudo) importa:
// 0 pode virar N se alguem afrouxar a policy; -1 so muda se alguem conceder grant.
async function contar(tabela, jwt) {
  const url = `${SUPABASE_URL}/rest/v1/${tabela}?select=*&limit=${LIMITE}`;
  const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${jwt ?? SUPABASE_ANON_KEY}` };
  let res;
  try {
    res = await fetch(url, { headers });
  } catch (e) {
    return { erro: `rede: ${e.message}` };
  }
  if (res.status === 401 || res.status === 403) return { n: -1 };
  if (!res.ok) return { erro: `http ${res.status}` };
  const linhas = await res.json();
  return { n: Array.isArray(linhas) ? linhas.length : -1 };
}

const perfis = [{ nome: 'anon', jwt: null }];
if (TEST_USER_JWT) perfis.push({ nome: 'authenticated_sem_role', jwt: TEST_USER_JWT });
else console.warn('! TEST_USER_JWT ausente — perfil authenticated_sem_role nao verificado\n');

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

if (falhas.length) console.warn(`avisos:\n  ${falhas.join('\n  ')}\n`);
if (melhorias.length) console.log(`exposicao reduzida (rode com --update para fixar):\n  ${melhorias.join('\n  ')}\n`);

if (atualizar) {
  baseline.tabelas = atual;
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
