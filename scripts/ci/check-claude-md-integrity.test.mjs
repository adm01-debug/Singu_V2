// Testes do guarda anti-wipe das instruções para agentes (scripts/ci/check-claude-md-integrity.mjs).
//
// O script lê o cwd diretamente e roda `git show <BASE>:<caminho>` contra a ref em CLAUDE_MD_BASE,
// então cada caso monta um repositório git descartável: commita um estado base, altera o working
// tree (sem commitar) e roda o script com CLAUDE_MD_BASE=HEAD contra esse commit.
//
// A seção "Fluxo Git — corpo apagado, título preservado" é regressão de um achado de auditoria
// adversarial: a versão anterior só comparava bytes do ARQUIVO inteiro e do CONJUNTO, então uma
// sessão paralela podia apagar o corpo de uma seção obrigatória (mantendo o título bare) sem
// disparar nenhum dos dois limiares, desde que o arquivo ficasse pouco acima de 50% do total.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { secoesPorTitulo } from './check-claude-md-integrity.mjs';

const SCRIPT = fileURLToPath(new URL('./check-claude-md-integrity.mjs', import.meta.url));

// Corpo de cada seção com texto suficiente (>0 bytes) para o limiar por seção ter o que medir.
const CORPO_FLUXO_GIT = 'Regra de fluxo git com texto suficiente para nao ser zero bytes de corpo, repetido.';
const AGENTS_BASE = `# AGENTS.md — fixture

## Contexto
Texto de contexto com conteúdo suficiente para não ser zero bytes de corpo.

## Projeto
Texto de projeto com conteúdo suficiente para não ser zero bytes de corpo.

## Comandos
Texto de comandos com conteúdo suficiente para não ser zero bytes de corpo.

## Como trabalhar
Texto de como trabalhar com conteúdo suficiente para não ser zero bytes de corpo.

## Bugs e funcionalidades
Texto de bugs com conteúdo suficiente para não ser zero bytes de corpo.

## Comunicação
Texto de comunicação com conteúdo suficiente para não ser zero bytes de corpo.

## Fluxo Git (vários agentes ao mesmo tempo)
${CORPO_FLUXO_GIT}

## Banco, Edge Functions, CI e código
Texto de banco com conteúdo suficiente para não ser zero bytes de corpo.

## Ler quando
Texto de ler quando com conteúdo suficiente para não ser zero bytes de corpo.
`;
const DOC_REFERENCIA = 'y'.repeat(500);

function git(cwd, ...args) {
  const r = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0' },
  });
  assert.equal(r.status, 0, `git ${args.join(' ')} falhou: ${r.stderr}`);
  return r.stdout.trim();
}

/** Repositório git descartável com AGENTS.md + docs/agentes/referencia.md commitados em HEAD. */
function montarRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'claude-md-integrity-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.email', 'fixture@example.com');
  git(dir, 'config', 'user.name', 'fixture');
  writeFileSync(join(dir, 'AGENTS.md'), AGENTS_BASE, 'utf8');
  mkdirSync(join(dir, 'docs/agentes'), { recursive: true });
  writeFileSync(join(dir, 'docs/agentes/referencia.md'), DOC_REFERENCIA, 'utf8');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'base');
  return dir;
}

/** Roda o guarda no repositório, comparando o working tree (possivelmente alterado) contra HEAD. */
function rodar(dir) {
  const r = spawnSync(process.execPath, [SCRIPT], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_MD_BASE: 'HEAD' },
  });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

function comRepo(fn) {
  const dir = montarRepo();
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('passa sem alteração nenhuma no working tree', () => {
  comRepo((dir) => {
    const r = rodar(dir);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /AGENTS\.md OK/);
  });
});

test('reprova quando AGENTS.md é apagado', () => {
  comRepo((dir) => {
    rmSync(join(dir, 'AGENTS.md'));
    const r = rodar(dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /AGENTS\.md nao encontrado/);
  });
});

test('reprova quando uma seção obrigatória desaparece (título alterado)', () => {
  comRepo((dir) => {
    const alterado = AGENTS_BASE.replace('## Fluxo Git (vários agentes ao mesmo tempo)', '## fluxo git (minúsculo)');
    writeFileSync(join(dir, 'AGENTS.md'), alterado, 'utf8');
    const r = rodar(dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /secao obrigatoria ausente: ## Fluxo Git/);
  });
});

test('reprova quando o conjunto (AGENTS.md + docs/agentes/) encolhe mais de 30%', () => {
  comRepo((dir) => {
    // Apaga o doc de referência inteiro: o conjunto cai bem abaixo de 70% do total na base.
    rmSync(join(dir, 'docs/agentes/referencia.md'));
    const r = rodar(dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /encolheram.*Possivel wipe por sessao paralela/);
  });
});

test('reprova quando um arquivo vigiado some, mesmo com o conjunto quase intacto', () => {
  comRepo((dir) => {
    // Some o arquivo, mas cresce AGENTS.md pra o CONJUNTO não cair abaixo de 70% (isola o teste
    // da checagem de conjunto e prova que o limiar por arquivo dispara por si só).
    rmSync(join(dir, 'docs/agentes/referencia.md'));
    writeFileSync(join(dir, 'AGENTS.md'), AGENTS_BASE + 'x'.repeat(600), 'utf8');
    const r = rodar(dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /docs\/agentes\/referencia\.md existia em HEAD .* e sumiu/);
  });
});

test('reprova quando um arquivo vigiado encolhe abaixo de 50%, mesmo sem sumir', () => {
  comRepo((dir) => {
    writeFileSync(join(dir, 'docs/agentes/referencia.md'), 'y'.repeat(100), 'utf8'); // 100/500 = 20%
    const r = rodar(dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /docs\/agentes\/referencia\.md encolheu/);
  });
});

test('REGRESSÃO: reprova quando o corpo de uma seção obrigatória é apagado mas o título fica', () => {
  comRepo((dir) => {
    // O ataque que escapava do guarda antigo: título intacto, corpo zerado. Cresce docs/agentes/
    // pra provar que é o limiar POR SEÇÃO disparando, não o de arquivo/conjunto.
    const atacado = AGENTS_BASE.replace(CORPO_FLUXO_GIT, '');
    writeFileSync(join(dir, 'AGENTS.md'), atacado, 'utf8');
    writeFileSync(join(dir, 'docs/agentes/referencia.md'), DOC_REFERENCIA + 'z'.repeat(400), 'utf8');
    const r = rodar(dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /corpo da secao "## Fluxo Git" encolheu \d+%/);
  });
});

test('não reprova quando o corpo de uma seção encolhe mas fica em pelo menos 50%', () => {
  comRepo((dir) => {
    const corpoMenor = CORPO_FLUXO_GIT.slice(0, Math.ceil(CORPO_FLUXO_GIT.length * 0.6));
    const alterado = AGENTS_BASE.replace(CORPO_FLUXO_GIT, corpoMenor);
    writeFileSync(join(dir, 'AGENTS.md'), alterado, 'utf8');
    const r = rodar(dir);
    assert.equal(r.status, 0, r.stderr);
  });
});

test('não reprova quando um arquivo vigiado só cresce (sem falso-positivo de crescimento)', () => {
  comRepo((dir) => {
    writeFileSync(join(dir, 'docs/agentes/referencia.md'), DOC_REFERENCIA + 'z'.repeat(50000), 'utf8');
    const r = rodar(dir);
    assert.equal(r.status, 0, r.stderr);
  });
});

test('secoesPorTitulo: título com texto extra na mesma linha é a chave completa', () => {
  const mapa = secoesPorTitulo('## Fluxo Git (vários agentes)\ncorpo aqui\n## Outro\nx');
  assert.deepEqual([...mapa.keys()], ['## Fluxo Git (vários agentes)', '## Outro']);
  assert.equal(mapa.get('## Fluxo Git (vários agentes)'), 'corpo aqui');
});
