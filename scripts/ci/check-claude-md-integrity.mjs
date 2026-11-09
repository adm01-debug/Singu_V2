#!/usr/bin/env node
/**
 * GA02: garante que as instrucoes para agentes nao foram apagadas ou esvaziadas por outra sessao.
 * Alvo: AGENTS.md (regras) + docs/agentes/*.md (referencia). CLAUDE.md e so `@AGENTS.md`.
 * Base no CI: a `main` buscada (CLAUDE_MD_BASE=origin/main); local, sem a variavel, o HEAD.
 * Verifica: AGENTS.md existe, cabecalhos obrigatorios presentes, o conjunto
 * AGENTS.md + CLAUDE.md + docs/agentes/*.md nao encolheu >30% em bytes vs a base, cada arquivo
 * vigiado (AGENTS.md e cada docs/agentes/*.md que exista na base) continua existindo com >=50% do
 * tamanho que tem na base (o limiar do conjunto sozinho nao pega o esvaziamento de 1 arquivo), e
 * o CORPO de cada secao obrigatoria de AGENTS.md continua com >=50% do tamanho que tinha na base
 * (achado de auditoria adversarial: apagar o corpo das secoes mantendo so os titulos escapava do
 * limiar por arquivo inteiro, desde que o total ficasse pouco acima de 50%).
 * Base: CLAUDE_MD_BASE (no CI, a main buscada; no checkout do CI o HEAD e o proprio arquivo
 * e a comparacao viraria no-op). Localmente, sem a variavel, compara com o HEAD.
 * Na base o conjunto e o que existir la (na main antiga, CLAUDE.md + AGENTS.md).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const AGENTS = 'AGENTS.md';
const DOCS_DIR = 'docs/agentes';
const CONJUNTO_RAIZ = ['AGENTS.md', 'CLAUDE.md'];
const REQUIRED_SECTIONS = [
  '## Contexto',
  '## Projeto',
  '## Comandos',
  '## Como trabalhar',
  '## Bugs e funcionalidades',
  '## Comunicação',
  '## Fluxo Git',
  '## Banco, Edge Functions, CI e código',
  '## Ler quando',
];
const SHRINK_THRESHOLD = 0.30;
const FILE_SHRINK_THRESHOLD = 0.50;

let content;
try {
  content = readFileSync(AGENTS, 'utf8');
} catch {
  console.error(`::error::${AGENTS} nao encontrado. Outra sessao pode ter apagado o arquivo.`);
  process.exitCode = 1;
  process.exit();
}

const missing = REQUIRED_SECTIONS.filter((s) => !content.includes(s));
if (missing.length > 0) {
  for (const s of missing) console.error(`::error::${AGENTS}: secao obrigatoria ausente: ${s}`);
  process.exitCode = 1;
  process.exit();
}

/** Corpo de cada `## titulo` (do fim da linha do titulo at o proximo `## `, ou fim do arquivo). */
export function secoesPorTitulo(conteudo) {
  const linhas = conteudo.split('\n');
  const secoes = new Map();
  let titulo = null;
  let corpo = [];
  for (const linha of linhas) {
    if (/^## /.test(linha)) {
      if (titulo !== null) secoes.set(titulo, corpo.join('\n'));
      titulo = linha.trim();
      corpo = [];
    } else if (titulo !== null) {
      corpo.push(linha);
    }
  }
  if (titulo !== null) secoes.set(titulo, corpo.join('\n'));
  return secoes;
}

/** Conteudo de AGENTS.md na base, ou '' se a ref/arquivo nao existir la. */
function agentsNaBase(base) {
  try {
    return execSync(`git show ${base}:${AGENTS}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function bytesAtuais() {
  let total = 0;
  for (const f of CONJUNTO_RAIZ) {
    if (existsSync(f)) total += Buffer.byteLength(readFileSync(f, 'utf8'));
  }
  if (existsSync(DOCS_DIR)) {
    for (const f of readdirSync(DOCS_DIR)) {
      if (f.endsWith('.md')) total += Buffer.byteLength(readFileSync(join(DOCS_DIR, f), 'utf8'));
    }
  }
  return total;
}

/** Verdadeiro so' se `base` resolve pra um commit real (git rev-parse --verify). */
function baseResolve(base) {
  try {
    execSync(`git rev-parse --verify ${base}^{commit}`, { stdio: ['ignore', 'pipe', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}

// Tamanho na base de cada arquivo do conjunto: { total, porArquivo: Map(path -> bytes) } ou null
// quando a base nao tem nenhum deles (ref inexistente, checkout raso sem a main).
function bytesNaBase(base) {
  const porArquivo = new Map();
  const tamanho = (path) => {
    try {
      const out = execSync(`git cat-file -s ${base}:${path}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      porArquivo.set(path, Number.parseInt(out.trim(), 10) || 0);
    } catch {
      /* nao existe na base */
    }
  };
  for (const f of CONJUNTO_RAIZ) tamanho(f);
  let lista = '';
  try {
    lista = execSync(`git ls-tree -r --name-only ${base} -- ${DOCS_DIR}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    lista = '';
  }
  for (const path of lista.split('\n').map((l) => l.trim()).filter((l) => l.endsWith('.md'))) tamanho(path);
  if (porArquivo.size === 0) return null;
  let total = 0;
  for (const n of porArquivo.values()) total += n;
  return { total, porArquivo };
}

const BASE = process.env.CLAUDE_MD_BASE || 'HEAD';
const atual = bytesAtuais();
// Achado de auditoria adversarial: se CLAUDE_MD_BASE='origin/main' e o `git fetch` anterior (no
// CI) falhar, origin/main nao resolve, bytesNaBase() so' encontra 0 arquivos e devolve null --
// o bloco de deteccao de encolhimento inteiro era pulado em SILENCIO, exit 0, parecendo "tudo
// verificado" quando nada foi comparado. Agora, quando uma base EXPLICITA (via env var) nao
// resolve, isso fica visivel no log em vez de passar como se a comparacao tivesse rodado.
const baseExplicitaNaoResolve = Boolean(process.env.CLAUDE_MD_BASE) && !baseResolve(BASE);
if (baseExplicitaNaoResolve) {
  console.error(`::warning::CLAUDE_MD_BASE='${BASE}' nao resolveu para um commit (fetch pode ter falhado) -- comparacao de encolhimento/wipe PULADA; so a presenca das secoes obrigatorias foi verificada.`);
}
const base = baseExplicitaNaoResolve ? null : bytesNaBase(BASE);

if (base) {
  const ratio = atual / base.total;
  if (ratio < (1 - SHRINK_THRESHOLD)) {
    console.error(`::error::Instrucoes para agentes (AGENTS.md + CLAUDE.md + ${DOCS_DIR}/*.md) encolheram ${Math.round((1 - ratio) * 100)}% vs ${BASE} (atual: ${atual} bytes, base: ${base.total} bytes). Possivel wipe por sessao paralela.`);
    process.exitCode = 1;
    process.exit();
  }
  // Por arquivo: AGENTS.md e cada docs/agentes/*.md que exista na base precisa continuar existindo
  // com >= 50% do tamanho de la. CLAUDE.md fica de fora: e so `@AGENTS.md` por design.
  let falhas = 0;
  for (const [path, naBase] of base.porArquivo) {
    if (path === 'CLAUDE.md' || naBase === 0) continue;
    if (!existsSync(path)) {
      console.error(`::error::${path} existia em ${BASE} (${naBase} bytes) e sumiu. Possivel wipe por sessao paralela.`);
      falhas += 1;
      continue;
    }
    const agora = Buffer.byteLength(readFileSync(path, 'utf8'));
    if (agora < naBase * FILE_SHRINK_THRESHOLD) {
      console.error(`::error::${path} encolheu ${Math.round((1 - agora / naBase) * 100)}% vs ${BASE} (atual: ${agora} bytes, base: ${naBase} bytes); limite por arquivo e ${Math.round(FILE_SHRINK_THRESHOLD * 100)}%.`);
      falhas += 1;
    }
  }
  // Por secao: um wipe pode preservar os 9 titulos obrigatorios e so apagar o corpo deles,
  // escapando os dois limiares acima (arquivo inteiro ainda >= 50%, conjunto ainda >= 70%).
  // Compara o corpo de cada secao obrigatoria contra o mesmo corpo na base, mesmo limiar.
  const baseAgents = agentsNaBase(BASE);
  if (baseAgents) {
    const secoesBase = secoesPorTitulo(baseAgents);
    const secoesAtual = secoesPorTitulo(content);
    for (const titulo of REQUIRED_SECTIONS) {
      // REQUIRED_SECTIONS guarda so o prefixo (ex. '## Fluxo Git'); o titulo real na base/atual
      // pode ter texto extra na mesma linha (ex. '## Fluxo Git (varios agentes ao mesmo tempo)').
      // Mesma semantica de substring do `missing` acima, so que por chave do mapa de secoes.
      const chaveBase = [...secoesBase.keys()].find((k) => k.startsWith(titulo));
      if (!chaveBase) continue; // titulo nao existia como secao de topo na base: nada pra comparar
      const corpoBase = secoesBase.get(chaveBase);
      const baseBytes = Buffer.byteLength(corpoBase);
      if (baseBytes === 0) continue; // secao sem corpo na base: nada pra comparar
      const chaveAtual = [...secoesAtual.keys()].find((k) => k.startsWith(titulo));
      const corpoAtual = chaveAtual ? secoesAtual.get(chaveAtual) : '';
      const atualBytes = Buffer.byteLength(corpoAtual);
      if (atualBytes < baseBytes * FILE_SHRINK_THRESHOLD) {
        console.error(`::error::${AGENTS}: corpo da secao "${titulo}" encolheu ${Math.round((1 - atualBytes / baseBytes) * 100)}% vs ${BASE} (atual: ${atualBytes} bytes, base: ${baseBytes} bytes); limite por secao e ${Math.round(FILE_SHRINK_THRESHOLD * 100)}%. Possivel wipe que preserva titulos e apaga corpo.`);
        falhas += 1;
      }
    }
  }
  if (falhas > 0) {
    process.exitCode = 1;
    process.exit();
  }
}

console.log(`${AGENTS} OK: ${REQUIRED_SECTIONS.length} secoes presentes; conjunto com ${DOCS_DIR}/: ${atual} bytes${base ? ` (base ${BASE}: ${base.total} bytes em ${base.porArquivo.size} arquivos, cada um >= ${Math.round(FILE_SHRINK_THRESHOLD * 100)}% do tamanho na base)` : ''}.`);
