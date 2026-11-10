// Testes dos checks que dependem da CONFIGURAÇÃO do servidor (check-client-tls, check-replication-config).
// ssl/wal_level/archive_mode só mudam com restart, então o lado "bom" é provado num cluster descartável
// (initdb em diretório temporário, TLS com certificado autoassinado) e o lado "ruim" plantando a condição.
// Sem initdb/openssl, ou sem PGHOST, os testes correspondentes se pulam com o motivo.
//   PGHOST=127.0.0.1 PGPORT=5432 PGUSER=postgres node --test scripts/hardening/hardening-cluster.test.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { bancoDisponivel, clusterEfemero, psql, rodarArquivo, sql } from './_pg-teste.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const arquivo = (nome) => path.join(AQUI, `${nome}.sql`);
const padrao = bancoDisponivel();

describe('hardening: veredito coerente com a configuração do servidor de teste', { skip: padrao.ok ? false : padrao.motivo }, () => {
  test('check-replication-config acusa exatamente as configurações divergentes', () => {
    const valor = (nome) => sql(`SHOW ${nome}`);
    const esperado = [];
    if (valor('ssl') !== 'on') esperado.push('ssl=');
    if (valor('wal_level') !== 'logical') esperado.push('wal_level=');
    if (valor('archive_mode') !== 'on') esperado.push('archive_mode=');
    const r = rodarArquivo(arquivo('check-replication-config'));
    if (esperado.length === 0) {
      assert.equal(r.status, 0, r.stderr);
      assert.match(r.stdout, /OK check-replication-config\.$/m);
    } else {
      assert.equal(r.status, 3, r.stdout);
      assert.match(r.stderr, /FATAL: config critica divergente:/);
      for (const trecho of esperado) assert.ok(r.stderr.includes(`- ${trecho}`), `faltou ${trecho} em:\n${r.stderr}`);
      assert.doesNotMatch(r.stdout, /OK check-replication-config/);
    }
  });

  test('check-client-tls acusa servidor com ssl desligado', (t) => {
    if (sql('SHOW ssl') === 'on') { t.skip('servidor de teste já tem ssl=on (lado ruim coberto no cluster descartável)'); return; }
    const r = rodarArquivo(arquivo('check-client-tls'));
    assert.equal(r.status, 3);
    assert.match(r.stderr, /FATAL: ssl=off/);
    assert.doesNotMatch(r.stdout, /OK check-client-tls/);
  });
});

const efemero = clusterEfemero({ tls: true });

describe('hardening: cluster descartável com TLS e replicação lógica', { skip: efemero.ok ? false : efemero.motivo }, () => {
  const alvo = () => efemero.alvo;
  const abertas = [];
  const check = (nome, variaveis = {}, env = {}, extra = {}) =>
    rodarArquivo(arquivo(nome), { ...alvo(), ...extra, env: { PGSSLMODE: 'require', ...env } }, variaveis);

  /** Mantém uma sessão aberta (pg_sleep) e só devolve quando ela aparece no pg_stat_activity. */
  async function sessao(nomeApp, env = {}, conexao = {}) {
    const ambiente = { ...process.env, PGHOST: alvo().host, PGPORT: String(alvo().port), PGUSER: 'postgres',
      PGDATABASE: 'postgres', PGAPPNAME: nomeApp, ...conexao, ...env };
    const filho = spawn('psql', ['-X', '-q', '-w', '-c', 'select pg_sleep(60)'], { env: ambiente, stdio: 'ignore' });
    abertas.push(filho);
    for (let i = 0; i < 100; i += 1) {
      if (sql(`SELECT count(*) FROM pg_stat_activity WHERE application_name = '${nomeApp}'`, alvo()) === '1') return filho;
      await new Promise((ok) => setTimeout(ok, 100));
    }
    throw new Error(`sessão ${nomeApp} não apareceu`);
  }
  const fechar = async (filho) => {
    filho.kill('SIGKILL');
    await new Promise((ok) => (filho.exitCode !== null || filho.signalCode ? ok() : filho.once('exit', ok)));
    for (let i = 0; i < 100; i += 1) {
      if (sql("SELECT count(*) FROM pg_stat_activity WHERE query LIKE 'select pg_sleep%' AND pid <> pg_backend_pid()", alvo()) === '0') return;
      sql("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE query LIKE 'select pg_sleep%' AND pid <> pg_backend_pid()", alvo());
      await new Promise((ok) => setTimeout(ok, 100));
    }
  };

  before(() => { sql("CREATE ROLE g3_auditor LOGIN; CREATE ROLE g3_outro LOGIN;", alvo()); });
  after(() => { for (const f of abertas) f.kill('SIGKILL'); efemero.parar(); });

  test('configuração boa: os dois checks passam', () => {
    for (const nome of ['check-replication-config', 'check-client-tls']) {
      const r = check(nome);
      assert.equal(r.status, 0, `${nome}: ${r.stderr}`);
      assert.equal(r.stdout.trim().split('\n').pop(), `OK ${nome}.`);
    }
  });

  test('client-tls: conexão TCP sem TLS de IP não-local é acusada; com TLS passa', async () => {
    // ips_locais='' faz o loopback contar como remoto (não há outra interface no ambiente de teste)
    const comTls = await sessao('g3_tls', { PGSSLMODE: 'require' });
    const limpo = check('check-client-tls', { ips_locais: '' });
    assert.equal(limpo.status, 0, limpo.stderr);
    assert.match(limpo.stdout, /client backend\s*\|\s*\d+\s*\|\s*0\s*\|\s*TLSv1/);
    const semTls = await sessao('g3_sem_tls', { PGSSLMODE: 'disable' });
    const sujo = check('check-client-tls', { ips_locais: '' });
    assert.equal(sujo.status, 3, sujo.stdout);
    assert.match(sujo.stderr, /FATAL: 1 conexao\(oes\) remota\(s\) de cliente SEM TLS/);
    assert.doesNotMatch(sujo.stdout, /OK check-client-tls/);
    // a mesma sessão sem TLS, vinda de IP local (padrão), não é achado
    assert.equal(check('check-client-tls').status, 0);
    await fechar(semTls);
    assert.equal(check('check-client-tls', { ips_locais: '' }).status, 0);
    await fechar(comTls);
  });

  test('client-tls: socket Unix (sem TLS por natureza) e app de monitoramento ignorado não são achado', async () => {
    const socket = await sessao('g3_socket', {}, { PGHOST: sql('SHOW unix_socket_directories', alvo()) });
    const r = check('check-client-tls', { ips_locais: '' });
    assert.equal(r.status, 0, r.stderr);
    await fechar(socket);
    const exporter = await sessao('postgres_exporter', { PGSSLMODE: 'disable' });
    assert.equal(check('check-client-tls', { ips_locais: '' }).status, 0);
    const naoIgnorado = check('check-client-tls', { ips_locais: '', ignorar_apps: 'outro_app' });
    assert.equal(naoIgnorado.status, 3);
    await fechar(exporter);
  });

  test('client-tls: role sem pg_read_all_stats não recebe OK às cegas', async () => {
    const outra = await sessao('g3_de_outro', { PGSSLMODE: 'disable', PGUSER: 'g3_outro' });
    const cego = check('check-client-tls', { ips_locais: '' }, {}, { user: 'g3_auditor' });
    assert.equal(cego.status, 3, cego.stdout);
    assert.match(cego.stderr, /FATAL: sem permissao para auditar \d+ sessao\(oes\) de outros usuarios \(conceda pg_read_all_stats a g3_auditor\)/);
    sql('GRANT pg_read_all_stats TO g3_auditor;', alvo());
    const vendo = check('check-client-tls', { ips_locais: '' }, {}, { user: 'g3_auditor' });
    assert.equal(vendo.status, 3);
    assert.match(vendo.stderr, /FATAL: 1 conexao\(oes\) remota\(s\) de cliente SEM TLS/);
    await fechar(outra);
    assert.equal(check('check-client-tls', { ips_locais: '' }, {}, { user: 'g3_auditor' }).status, 0);
  });

  test('replication-config: TLS mínimo obsoleto é acusado e a correção limpa', () => {
    const recarregar = (valor) => sql(`ALTER SYSTEM SET ssl_min_protocol_version = '${valor}'; SELECT pg_reload_conf(); SELECT pg_sleep(0.5);`, alvo());
    recarregar('TLSv1.1');
    const r = check('check-replication-config');
    assert.equal(r.status, 3, r.stdout);
    assert.match(r.stderr, /ssl_min_protocol_version=TLSv1\.1 \(minimo aceito: TLSv1\.2\)/);
    sql('ALTER SYSTEM RESET ssl_min_protocol_version; SELECT pg_reload_conf(); SELECT pg_sleep(0.5);', alvo());
    assert.equal(check('check-replication-config').status, 0);
  });

  test('checks de configuração também rodam em sessão somente-leitura', () => {
    for (const nome of ['check-replication-config', 'check-client-tls']) {
      const r = check(nome, {}, { PGOPTIONS: '-c default_transaction_read_only=on' });
      assert.equal(r.status, 0, `${nome}: ${r.stderr}`);
    }
  });

  test('sem conexão: código de erro do psql, nunca OK', () => {
    const r = psql(['-f', arquivo('check-client-tls')], { host: '127.0.0.1', port: 1 });
    assert.notEqual(r.status, 0);
    assert.doesNotMatch(r.stdout, /OK check-client-tls/);
  });
});
