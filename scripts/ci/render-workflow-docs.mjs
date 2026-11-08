#!/usr/bin/env node
/**
 * Gera `docs/ci/README.md` a partir dos blocos `# docs:` e `# nao-e-bug:` de cada workflow.
 *
 * Por que existe: um workflow de centenas de linhas só conta o que faz, e a quem avisa, se
 * alguem escrever isso. Comentario solto no meio do arquivo nao e lido, e um README escrito a
 * mao desatualiza no primeiro PR que mexe num gatilho. Aqui o README e projecao do YAML: a
 * unica forma de mudar o texto e mudar o bloco no workflow.
 *
 * O contrato: cada YAML carrega, no topo, um bloco
 *
 *   # docs:
 *   #   gatilho: <quando roda>
 *   #   prova:   <o que ele prova>
 *   #   falha:   <o que acontece quando falha>
 *   #   avisa:   <quem e avisado>
 *
 * e opcionalmente:
 *
 *   # nao-e-bug:
 *   #   - <chave>: <descricao>
 *
 * Workflow sem bloco nao derruba a geracao: ele aparece no README numa secao propria, como
 * lacuna declarada. Bloco pela metade (faltando um dos quatro campos) derruba, porque ai o
 * texto gerado seria meia-verdade.
 *
 * KPI opcional: se `docs/ci/kpi.json` existir, as colunas "custo/sem (min)" e "falha (7 d)" saem
 * de la (chaves `custo_semana_min` e `taxa_falha_7d`, indexadas pelo nome do arquivo YAML).
 *
 * Uso:
 *   node scripts/ci/render-workflow-docs.mjs           escreve docs/ci/README.md
 *   node scripts/ci/render-workflow-docs.mjs --check    exit 1 se o commitado divergir
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAIDA_REL = 'docs/ci/README.md';
export const CAMPOS = ['gatilho', 'prova', 'falha', 'avisa'];

/** Bloco `# docs:` do topo do arquivo, ou null se nao houver. */
export function extrairDocs(texto) {
  const saida = {};
  let dentro = false;
  for (const linha of texto.split('\n')) {
    if (/^#\s*docs:\s*$/.test(linha)) { dentro = true; continue; }
    if (!dentro) continue;
    const m = /^#\s+([a-z_]+):\s*(.+?)\s*$/.exec(linha);
    if (m) { saida[m[1]] = m[2]; continue; }
    if (/^#\s*$/.test(linha) || linha.trim() === '') continue;
    break;
  }
  return Object.keys(saida).length ? saida : null;
}

/** Remove um par de aspas que envolva todo o texto; deixa aspas internas em paz. */
export const desencapar = (texto) => (/^(["']).*\1$/.test(texto) ? texto.slice(1, -1) : texto);

/** Itens do bloco `# nao-e-bug:`: [{ chave, descricao }]. */
export function extrairNaoEBug(texto) {
  const itens = [];
  let dentro = false;
  for (const linha of texto.split('\n')) {
    if (/^#\s*nao-e-bug:\s*$/.test(linha)) { dentro = true; continue; }
    if (!dentro) continue;
    const m = /^#\s+-\s+(.+?):\s*(.+?)\s*$/.exec(linha);
    // So desencapa quando a descricao inteira esta entre aspas: `"nada mudou" no publicar...`
    // tem aspa no meio e perderia o fechamento se a troca fosse por caractere.
    if (m) { itens.push({ chave: m[1], descricao: desencapar(m[2]) }); continue; }
    if (/^#\s*$/.test(linha)) continue;
    break;
  }
  return itens;
}

/** Nome amigavel: `name:` do workflow, senao o nome do arquivo. */
export function nomeDe(texto, arquivo) {
  const m = /^name:\s*(.+?)\s*$/m.exec(texto);
  return m ? desencapar(m[1]) : arquivo.replace(/\.ya?ml$/, '');
}

/** Le os workflows e devolve { documentados, semBloco, naoEBug }. */
export function lerWorkflows(raiz = RAIZ_PADRAO) {
  const dir = path.join(raiz, '.github/workflows');
  const arquivos = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort() : [];
  const documentados = [];
  const semBloco = [];
  const naoEBug = [];
  for (const arquivo of arquivos) {
    const texto = fs.readFileSync(path.join(dir, arquivo), 'utf8');
    const nome = nomeDe(texto, arquivo);
    const bloco = extrairDocs(texto);
    if (!bloco) { semBloco.push({ arquivo, nome }); continue; }
    const faltando = CAMPOS.filter((c) => !bloco[c]);
    if (faltando.length) {
      throw new Error(`${arquivo}: bloco "# docs:" sem ${faltando.join(', ')}. `
        + 'Declare os quatro campos (gatilho, prova, falha, avisa) ou remova o bloco.');
    }
    for (const item of extrairNaoEBug(texto)) naoEBug.push({ arquivo, nome, ...item });
    documentados.push({ arquivo, nome, ...bloco });
  }
  return { documentados, semBloco, naoEBug };
}

/** Monta o texto do README. */
export function renderizar(raiz = RAIZ_PADRAO, dados = lerWorkflows(raiz)) {
  const { documentados, semBloco, naoEBug } = dados;
  let kpi = {};
  try { kpi = JSON.parse(fs.readFileSync(path.join(raiz, 'docs/ci/kpi.json'), 'utf8')); } catch { /* sem KPI */ }
  const link = (a) => `[\`${a}\`](../../.github/workflows/${a})`;

  const linhas = [
    '# Workflows de CI — o que cada um faz',
    '',
    '> **Gerado por `scripts/ci/render-workflow-docs.mjs`.** Não edite à mão: `--check` falha se',
    '> este arquivo divergir do bloco `# docs:` de cada workflow. Para mudar o texto daqui, mude o',
    '> bloco no YAML.',
    '',
    `**${documentados.length + semBloco.length} workflows, ${documentados.length} com bloco \`# docs:\`.**`,
    '',
    '| Workflow | Arquivo | Gatilho | O que prova | Quando falha | Quem é avisado | Custo/sem (min) | Falha (7 d) |',
    '|---|---|---|---|---|---|---|---|',
    ...documentados.map((d) => `| ${d.nome} | ${link(d.arquivo)} | ${d.gatilho} | ${d.prova} | ${d.falha} | ${d.avisa} | `
      + `${kpi[d.arquivo]?.custo_semana_min ?? '—'} | ${kpi[d.arquivo]?.taxa_falha_7d ?? '—'} |`),
    '',
    '## Detalhe',
    '',
    ...documentados.flatMap((d) => [
      `### ${d.nome} (\`${d.arquivo}\`)`,
      '',
      `- **Gatilho:** ${d.gatilho}`,
      `- **O que prova:** ${d.prova}`,
      `- **Quando falha:** ${d.falha}`,
      `- **Quem é avisado:** ${d.avisa}`,
      '',
    ]),
  ];

  if (naoEBug.length) {
    linhas.push(
      '## O que NÃO é bug',
      '',
      '> Comportamento que parece erro mas é intencional. Cada item vem do bloco `# nao-e-bug:` do YAML.',
      '',
      '| Workflow | Situação | Por quê não é bug |',
      '|---|---|---|',
      ...naoEBug.map((i) => `| ${link(i.arquivo)} | **${i.chave}** | ${i.descricao} |`),
      '',
    );
  }

  if (semBloco.length) {
    linhas.push(
      '## Sem bloco `# docs:`',
      '',
      '> Estes workflows rodam sem declarar gatilho, prova, falha e quem é avisado. Quem for mexer',
      '> em um deles acrescenta o bloco no topo do YAML e roda o gerador de novo.',
      '',
      ...semBloco.map((d) => `- ${link(d.arquivo)} — ${d.nome}`),
      '',
    );
  }

  return linhas.join('\n');
}

function main(argv) {
  const saida = path.join(RAIZ_PADRAO, SAIDA_REL);
  const dados = lerWorkflows(RAIZ_PADRAO);
  const conteudo = renderizar(RAIZ_PADRAO, dados);
  const { documentados, semBloco } = dados;
  if (argv.includes('--check')) {
    const atual = fs.existsSync(saida) ? fs.readFileSync(saida, 'utf8') : null;
    if (atual === null) {
      console.error(`${SAIDA_REL} nao existe. Rode sem --check para gerar.`);
      process.exit(1);
    }
    if (atual !== conteudo) {
      console.error(`${SAIDA_REL} divergiu dos blocos "# docs:" dos workflows: `
        + 'rode node scripts/ci/render-workflow-docs.mjs e commite o resultado.');
      process.exit(1);
    }
    console.log(`${SAIDA_REL} bate com os ${documentados.length + semBloco.length} workflows.`);
    return;
  }
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, conteudo);
  console.log(`${SAIDA_REL} gerado: ${documentados.length} workflows documentados, ${semBloco.length} sem bloco.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
