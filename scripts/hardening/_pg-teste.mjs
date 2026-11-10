// Apoio dos testes que precisam de Postgres (scripts/hardening/*.test.mjs e scripts/sql-raiz.test.mjs).
//
// Usa o servidor apontado por PGHOST/PGPORT/PGUSER (e PGPASSWORD, se houver). Sem banco acessível os
// testes se PULAM com o motivo — nunca falham por falta de infraestrutura. Cada teste cria o próprio
// banco descartável (prefixo g3_) e o remove no fim. Nunca aponte isso para produção.
import { spawnSync } from 'node:child_process';
import { appendFileSync, chownSync, existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const LIMITE_MS = 60_000;

function rodar(cmd, args, opcoes = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', timeout: LIMITE_MS, ...opcoes });
}

/** Roda psql; `alvo` = { banco, host, port, user } sobrepõe o ambiente. Devolve { status, stdout, stderr }. */
export function psql(args, { banco = 'postgres', entrada, host, port, user, env = {} } = {}) {
  const ambiente = { ...process.env, PGDATABASE: banco, PGCONNECT_TIMEOUT: '10', PGAPPNAME: 'g3-teste', ...env };
  if (host) ambiente.PGHOST = host;
  if (port) ambiente.PGPORT = String(port);
  if (user) ambiente.PGUSER = user;
  delete ambiente.SUPABASE_DB_URL;
  const r = rodar('psql', ['-X', '-q', '-w', ...args], { env: ambiente, input: entrada });
  return { status: r.status, stdout: r.stdout ?? '', stderr: r.stderr ?? '', erro: r.error };
}

/** Executa SQL e exige sucesso (para montar cenário). */
export function sql(texto, alvo = {}) {
  const r = psql(['-v', 'ON_ERROR_STOP=1', '-At', '-f', '-'], { ...alvo, entrada: texto });
  if (r.status !== 0) throw new Error(`SQL de cenário falhou: ${r.stderr || r.erro}`);
  return r.stdout.trim();
}

/** Roda um arquivo .sql do repositório como o usuário rodaria. */
export function rodarArquivo(arquivo, alvo = {}, variaveis = {}, extras = []) {
  const args = [...extras];
  for (const [nome, valor] of Object.entries(variaveis)) args.push('-v', `${nome}=${valor}`);
  return psql([...args, '-f', arquivo], alvo);
}

/** { ok: true } ou { ok: false, motivo } — motivo vai para o `skip` do teste. */
export function bancoDisponivel(alvo = {}) {
  if (!alvo.host && !process.env.PGHOST) return { ok: false, motivo: 'PGHOST não definido (sem Postgres de teste)' };
  const r = psql(['-At', '-c', 'select 1'], alvo);
  if (r.erro?.code === 'ENOENT') return { ok: false, motivo: 'psql não instalado' };
  if (r.status !== 0) return { ok: false, motivo: `Postgres inacessível: ${(r.stderr || '').trim().split('\n')[0]}` };
  return { ok: true };
}

export function criarBanco(rotulo, alvo = {}) {
  const nome = `g3_${rotulo}_${process.pid}_${Date.now().toString(36)}`;
  sql(`CREATE DATABASE ${nome} TEMPLATE template0`, alvo);
  return nome;
}

export function removerBanco(nome, alvo = {}) {
  psql(['-c', `DROP DATABASE IF EXISTS ${nome} WITH (FORCE)`], alvo);
}

/** Cria (sem nunca remover) as roles que o Supabase sempre tem; tolera corrida com outro teste. */
export function garantirRolesSupabase(alvo = {}) {
  sql(`DO $$ DECLARE r text; BEGIN
         FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
           BEGIN EXECUTE format('CREATE ROLE %I NOLOGIN', r);
           EXCEPTION WHEN duplicate_object OR unique_violation THEN NULL; END;
         END LOOP; END $$;`, alvo);
}

function binariosPostgres() {
  const pgConfig = rodar('pg_config', ['--bindir']);
  const candidatos = [];
  if (pgConfig.status === 0) candidatos.push(pgConfig.stdout.trim());
  const base = '/usr/lib/postgresql';
  if (existsSync(base)) {
    for (const versao of readdirSync(base).sort((a, b) => Number(b) - Number(a))) candidatos.push(path.join(base, versao, 'bin'));
  }
  return candidatos.find((dir) => existsSync(path.join(dir, 'initdb')) && existsSync(path.join(dir, 'pg_ctl')));
}

/**
 * Sobe um cluster descartável com TLS, wal_level=logical, archive_mode=on e pg_stat_statements
 * carregado — configurações que exigem restart e por isso não dá para "plantar" no cluster comum.
 * Devolve { ok: true, alvo: { host, port, user }, parar() } ou { ok: false, motivo }.
 */
export function clusterEfemero({ tls = true } = {}) {
  const bin = binariosPostgres();
  if (!bin) return { ok: false, motivo: 'initdb/pg_ctl não encontrados (cluster descartável indisponível)' };
  const raiz = process.getuid?.() === 0;
  if (raiz && rodar('id', ['postgres']).status !== 0) return { ok: false, motivo: 'rodando como root sem usuário postgres' };
  const como = (cmd, args) => (raiz ? rodar('runuser', ['-u', 'postgres', '--', cmd, ...args]) : rodar(cmd, args));
  const dir = mkdtempSync(path.join(tmpdir(), 'g3-pg-'));
  const dados = path.join(dir, 'dados');
  const limpar = () => rmSync(dir, { recursive: true, force: true });
  try {
    if (raiz) { chownSync(dir, Number(rodar('id', ['-u', 'postgres']).stdout), 0); rodar('chmod', ['755', dir]); }
    const init = como(path.join(bin, 'initdb'), ['-D', dados, '-U', 'postgres', '-A', 'trust', '-E', 'UTF8', '--locale=C']);
    if (init.status !== 0) { limpar(); return { ok: false, motivo: `initdb falhou: ${(init.stderr || '').trim().split('\n').pop()}` }; }
    let comTls = false;
    if (tls) {
      const cert = como('openssl', ['req', '-new', '-x509', '-days', '2', '-nodes', '-subj', '/CN=localhost',
        '-keyout', path.join(dados, 'server.key'), '-out', path.join(dados, 'server.crt')]);
      comTls = cert.status === 0 && como('chmod', ['600', path.join(dados, 'server.key')]).status === 0;
      if (!comTls) { limpar(); return { ok: false, motivo: 'openssl indisponível para gerar o certificado de teste' }; }
    }
    for (let tentativa = 0; tentativa < 5; tentativa += 1) {
      const port = 20000 + ((process.pid * 7 + tentativa * 131 + Date.now()) % 20000);
      const conf = [`port = ${port}`, "listen_addresses = '127.0.0.1'", `unix_socket_directories = '${dir}'`,
        `ssl = ${comTls ? 'on' : 'off'}`, 'wal_level = logical', 'archive_mode = on', "archive_command = '/bin/true'",
        "shared_preload_libraries = 'pg_stat_statements'", 'fsync = off', ''].join('\n');
      appendFileSync(path.join(dados, 'postgresql.conf'), `\n${conf}`); // a última ocorrência vale
      const inicio = como(path.join(bin, 'pg_ctl'), ['-D', dados, '-l', path.join(dir, 'log'), '-w', '-t', '30', 'start']);
      if (inicio.status === 0) {
        const alvo = { host: '127.0.0.1', port, user: 'postgres' };
        const parar = () => { como(path.join(bin, 'pg_ctl'), ['-D', dados, '-m', 'immediate', '-w', 'stop']); limpar(); };
        return { ok: true, alvo, parar };
      }
    }
    limpar();
    return { ok: false, motivo: 'não foi possível iniciar o cluster descartável (porta ocupada?)' };
  } catch (erro) {
    limpar();
    return { ok: false, motivo: `cluster descartável indisponível: ${erro.message}` };
  }
}
