// Testes de scripts/inventario/mudou-conteudo.mjs: funções puras e a CLI num repositório git
// descartável em tmp (INVENTARIO_RAIZ). Não toca no git deste repositório.
// Rodar: node --test scripts/inventario/mudou-conteudo.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { PADRAO, semCarimbos, mudou } from './mudou-conteudo.mjs';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'mudou-conteudo.mjs');
const temGit = spawnSync('git', ['--version']).status === 0;
// Isola do git do usuário/CI: sem config global, sem hooks, sem assinatura.
const GIT_ENV = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0' };
for (const k of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'INVENTARIO_RAIZ']) delete GIT_ENV[k];

const BANCO = {
  medido_em: '2026-11-01T00:00:00Z',
  tabelas: [{ nome: 'contacts', linhas: 10, bytes: 8192, rls: true }],
  cron: {
    jobs: [{ nome: 'limpeza', agenda: '0 3 * * *', ativo: true, execucoes_24h: 1, falhas_24h: 0, execucoes_7d: 7, falhas_7d: 1, taxa_falha_7d_pct: 14.3, startup_timeout_7d: 0, ultima_falha: '2026-10-30T03:00:00Z', duracao_max_s_7d: 4 }],
    horas_paradas_7d: [{ hora: '2026-10-30T03:00Z', execucoes: 1, falhas: 1 }],
    historico: { linhas: 100, bytes: 16384, mais_antigo: '2026-10-25T00:00:00Z', mais_de_7_dias: 0 },
  },
  whatsapp: { conexoes: [{ nome: 'vendas', status: 'connected', atualizada_em: '2026-11-01T00:00:00Z' }], mensagens_7d: 50 },
  alertas: [
    { tipo: 'cron_falhando', detalhe: ['limpeza (14.3% em 7d)'] },
    { tipo: 'cron_parado', detalhe: ['2026-10-30T03:00Z'] },
    { tipo: 'tabela_sem_rls', detalhe: ['logs'] },
  ],
};
const copia = (f) => { const c = JSON.parse(JSON.stringify(BANCO)); f(c); return JSON.stringify(c); };
const igual = (f) => assert.equal(semCarimbos(copia(f)), semCarimbos(JSON.stringify(BANCO)));
const diferente = (f) => assert.notEqual(semCarimbos(copia(f)), semCarimbos(JSON.stringify(BANCO)));

test('PADRAO cobre os cinco arquivos do inventário', () => {
  assert.deepEqual(PADRAO, ['banco', 'edge-tabela', 'edges', 'rotas', 'tabelas-uso'].map((n) => `inventario/estado/${n}.json`));
});

test('carimbos de data e telemetria rolante não contam como mudança', () => {
  igual((c) => { c.medido_em = '2026-11-08T00:00:00Z'; });
  igual((c) => { c.gerado_em = 'agora'; });
  igual((c) => { Object.assign(c.cron.jobs[0], { execucoes_24h: 9, falhas_24h: 3, execucoes_7d: 70, falhas_7d: 9, taxa_falha_7d_pct: 12.9, startup_timeout_7d: 2, ultima_falha: null, duracao_max_s_7d: 99 }); });
  igual((c) => { c.cron.horas_paradas_7d = []; });
  igual((c) => { c.cron.historico = { linhas: 5, bytes: 1, mais_antigo: null, mais_de_7_dias: 3 }; });
  igual((c) => { c.whatsapp.mensagens_7d = 0; c.whatsapp.conexoes[0].atualizada_em = null; });
});

test('texto dos alertas: porcentagem e horas rolam sem contar; entrar/sair da lista conta', () => {
  igual((c) => { c.alertas[0].detalhe = ['limpeza (99% em 7d)']; });
  igual((c) => { c.alertas[1].detalhe = ['2026-11-07T10:00Z', '2026-11-07T11:00Z']; });
  diferente((c) => { c.alertas[0].detalhe.push('outro (5% em 7d)'); });
  diferente((c) => { c.alertas.splice(1, 1); });
  diferente((c) => { c.alertas[2].detalhe = ['logs', 'nova_sem_rls']; });
  diferente((c) => { c.alertas.push({ tipo: 'historico_cron_sem_limpeza', detalhe: ['60000 linhas com mais de 7 dias'] }); });
});

test('mudança de verdade conta', () => {
  diferente((c) => { c.tabelas[0].linhas = 11; });
  diferente((c) => { c.tabelas[0].bytes = 16384; });
  diferente((c) => { c.tabelas[0].rls = false; });
  diferente((c) => { c.tabelas.push({ nome: 'nova' }); });
  diferente((c) => { c.cron.jobs[0].agenda = '0 4 * * *'; });
  diferente((c) => { c.cron.jobs[0].ativo = false; });
  diferente((c) => { c.whatsapp.conexoes[0].status = 'disconnected'; });
});

test('ordem das chaves não conta; ordem de lista conta', () => {
  const invertido = JSON.stringify(Object.fromEntries(Object.entries(BANCO).reverse()));
  assert.equal(semCarimbos(invertido), semCarimbos(JSON.stringify(BANCO)));
  diferente((c) => { c.alertas.reverse(); });
});

test('semCarimbos: entradas degeneradas', () => {
  assert.equal(semCarimbos(null), null);
  assert.equal(semCarimbos(''), '');
  assert.equal(semCarimbos('não é json'), 'não é json');
  assert.equal(semCarimbos('null'), 'null');
  assert.equal(semCarimbos('[]'), '[]');
  assert.equal(semCarimbos('{"medido_em":"x"}'), '{}');
  assert.equal(semCarimbos('{"historico":null,"alertas":[null,"texto",{"tipo":"cron_falhando"}]}'), '{"alertas":[null,"texto",{"tipo":"cron_falhando"}],"historico":null}');
  // Fora de cron.historico, `linhas`/`bytes` continuam valendo.
  assert.notEqual(semCarimbos('{"tabelas":[{"linhas":1}]}'), semCarimbos('{"tabelas":[{"linhas":2}]}'));
  assert.equal(semCarimbos('{"cron":{"historico":{"linhas":1}}}'), semCarimbos('{"cron":{"historico":{"linhas":2}}}'));
});

test('mudou: arquivo novo, apagado, igual e ausente dos dois lados', () => {
  const ler = (mapa) => (f) => (f in mapa ? mapa[f] : null);
  assert.equal(mudou(['a'], ler({}), ler({ a: '{}' })), true);
  assert.equal(mudou(['a'], ler({ a: '{}' }), ler({})), true);
  assert.equal(mudou(['a'], ler({ a: '{"gerado_em":1}' }), ler({ a: '{"gerado_em":2}' })), false);
  assert.equal(mudou(['a', 'b'], ler({ a: '{}' }), ler({ a: '{}' })), false);
  assert.equal(mudou(['a', 'b'], ler({ a: '{}', b: '{"x":1}' }), ler({ a: '{}', b: '{"x":2}' })), true);
  assert.equal(mudou([], ler({}), ler({})), false);
});

// ─── CLI num repositório git descartável ─────────────────────────────────────

function repo(t, arquivos, nome = 'mudou ç repo-') {
  const dir = mkdtempSync(join(tmpdir(), nome));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => {
    const r = spawnSync('git', ['-c', 'user.name=teste', '-c', 'user.email=teste@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args], { cwd: dir, env: GIT_ENV, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
  };
  git('init', '-q');
  escrever(dir, { 'LEIAME.txt': 'x', ...arquivos });
  git('add', '-A');
  git('commit', '-q', '-m', 'base');
  return dir;
}
function escrever(dir, arquivos) {
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), conteudo);
  }
}
const cli = (raiz, args = [], cwd = tmpdir()) => {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, env: { ...GIT_ENV, INVENTARIO_RAIZ: raiz }, encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr };
};
const B = 'inventario/estado/banco.json';
const E = 'inventario/estado/edges.json';
const opcoes = { skip: !temGit && 'git não instalado' };

test('CLI: sem mudança -> false; só carimbo -> false; conteúdo -> true (stdout só com a palavra)', opcoes, (t) => {
  const dir = repo(t, { [B]: JSON.stringify(BANCO), [E]: '{"gerado_em":"a","total":1}\n' });
  assert.deepEqual(cli(dir), { code: 0, out: 'false\n', err: '' });
  escrever(dir, { [B]: copia((c) => { c.medido_em = 'depois'; }), [E]: '{"gerado_em":"b","total":1}\n' });
  assert.deepEqual(cli(dir), { code: 0, out: 'false\n', err: '' });
  escrever(dir, { [E]: '{"gerado_em":"b","total":2}\n' });
  assert.deepEqual(cli(dir), { code: 0, out: 'true\n', err: '' });
});

test('CLI: arquivo novo e arquivo apagado contam como mudança', opcoes, (t) => {
  const dir = repo(t, { [B]: JSON.stringify(BANCO) });
  escrever(dir, { 'inventario/estado/rotas.json': '{"rotas":[]}' });
  assert.equal(cli(dir).out, 'true\n');
  const dir2 = repo(t, { [B]: JSON.stringify(BANCO), [E]: '{}' });
  rmSync(join(dir2, E));
  assert.equal(cli(dir2).out, 'true\n');
});

test('CLI: responde igual de qualquer diretório atual', opcoes, (t) => {
  // Antes: o HEAD era lido pela raiz do git e o disco pelo cwd; de uma subpasta saía `true` sem nada ter mudado.
  const dir = repo(t, { [B]: JSON.stringify(BANCO), 'sub/pasta/x.txt': 'x' });
  for (const cwd of [dir, join(dir, 'sub/pasta'), tmpdir()]) assert.equal(cli(dir, [], cwd).out, 'false\n', cwd);
  escrever(dir, { [B]: copia((c) => { c.tabelas[0].rls = false; }) });
  for (const cwd of [dir, join(dir, 'sub/pasta'), tmpdir()]) assert.equal(cli(dir, [], cwd).out, 'true\n', cwd);
});

test('CLI: arquivo maior que 1 MB idêntico ao HEAD -> false', opcoes, (t) => {
  // Antes: execFileSync estourava o buffer padrão de 1 MB, o HEAD era lido como "não existe" e saía `true` sempre.
  const grande = JSON.stringify({ gerado_em: 'a', rotas: Array.from({ length: 30000 }, (_, i) => ({ caminho: `/rota/${i}`, pagina: `Pagina${i}.tsx` })) });
  assert.ok(grande.length > 1024 * 1024);
  const dir = repo(t, { 'inventario/estado/rotas.json': grande });
  assert.equal(cli(dir).out, 'false\n');
  escrever(dir, { 'inventario/estado/rotas.json': grande.replace('"gerado_em":"a"', '"gerado_em":"b"') });
  assert.equal(cli(dir).out, 'false\n');
  escrever(dir, { 'inventario/estado/rotas.json': grande.replace('/rota/29999', '/rota/mudou') });
  assert.equal(cli(dir).out, 'true\n');
});

test('CLI: arquivos passados por argumento (relativos à raiz ou absolutos)', opcoes, (t) => {
  const dir = repo(t, { 'outro/a.json': '{"v":1}', [B]: JSON.stringify(BANCO) });
  escrever(dir, { [B]: copia((c) => { c.tabelas[0].linhas = 99; }) });
  assert.equal(cli(dir, ['outro/a.json']).out, 'false\n');
  assert.equal(cli(dir, [join(dir, 'outro/a.json')]).out, 'false\n');
  assert.equal(cli(dir, ['outro/a.json', B]).out, 'true\n');
  assert.equal(cli(dir, ['nao/existe.json']).out, 'false\n');
});

test('CLI: JSON quebrado no disco é comparado como texto (mudou)', opcoes, (t) => {
  const dir = repo(t, { [B]: JSON.stringify(BANCO) });
  escrever(dir, { [B]: '{"tabelas": [' });
  assert.equal(cli(dir).out, 'true\n');
});

test('CLI: fora de repositório git ou sem commit -> exit 2 e stdout vazio (o workflow falha, não decide no escuro)', opcoes, (t) => {
  // Antes: saía `false` com exit 0 fora de um repositório (nenhum PR aberto, sem aviso).
  const solto = mkdtempSync(join(tmpdir(), 'mudou-sem-git-'));
  t.after(() => rmSync(solto, { recursive: true, force: true }));
  escrever(solto, { [B]: '{}' });
  const r = cli(solto);
  assert.equal(r.code, 2);
  assert.equal(r.out, '');
  assert.match(r.err, /ERRO: .*nao e um repositorio git com HEAD/);
  spawnSync('git', ['init', '-q'], { cwd: solto, env: GIT_ENV });
  const semCommit = cli(solto);
  assert.equal(semCommit.code, 2);
  assert.equal(semCommit.out, '');
});

test('CLI: arquivo do inventário que virou pasta -> exit 2, stdout vazio', opcoes, (t) => {
  const dir = repo(t, { [B]: JSON.stringify(BANCO) });
  rmSync(join(dir, B));
  mkdirSync(join(dir, B));
  const r = cli(dir);
  assert.equal(r.code, 2);
  assert.equal(r.out, '');
});

test('CLI: git ausente do PATH -> exit 2', (t) => {
  const vazio = mkdtempSync(join(tmpdir(), 'mudou-sem-path-'));
  t.after(() => rmSync(vazio, { recursive: true, force: true }));
  const r = spawnSync(process.execPath, [SCRIPT], { env: { PATH: vazio, INVENTARIO_RAIZ: vazio }, encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.equal(r.stdout, '');
  assert.match(r.stderr, /git nao encontrado/);
});

test('CLI: --help sai 0', () => {
  const r = cli(tmpdir(), ['--help']);
  assert.equal(r.code, 0);
  assert.match(r.out, /Uso:/);
});

test('CLI: no repositório real responde true ou false com exit 0', opcoes, () => {
  const r = spawnSync(process.execPath, [SCRIPT], { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^(true|false)\n$/);
});
