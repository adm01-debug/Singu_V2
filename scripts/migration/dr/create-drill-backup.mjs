// create-drill-backup.mjs — gera o backup lógico do drill de restauração.
// Somente leitura na origem: abre um snapshot REPEATABLE READ, conta as tabelas
// críticas e roda o pg_dump (dentro do contêiner DUMP_CONTAINER) no MESMO
// snapshot; depois grava o manifesto (SHA-256 do dump + contagens).
//
// Uso: PROD_DB_URL=... BACKUP_FILE=... SOURCE_COUNTS_FILE=... node create-drill-backup.mjs
// Opcionais: CRITICAL_TABLES, DUMP_CONTAINER (padrão singu-drill),
//   CONTAINER_BACKUP_FILE (caminho do dump visto de dentro do contêiner).
// A senha vai por PGPASSWORD (ambiente), nunca pela linha de comando.
// Manifesto antigo é removido no início: falha no meio nunca deixa manifesto
// "válido" apontando para um dump parcial. Exit: 0 ok · 1 falha (etapa
// informada, sem dados de conexão) ou configuração inválida · 130 interrompido.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { chmod, rename, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Uso: PROD_DB_URL=... BACKUP_FILE=... SOURCE_COUNTS_FILE=... node create-drill-backup.mjs\n' +
    'Opcionais: CRITICAL_TABLES, DUMP_CONTAINER, CONTAINER_BACKUP_FILE. Veja o cabeçalho do arquivo.');
  process.exit(0);
}

const tables = (process.env.CRITICAL_TABLES ?? 'contacts,deals,interactions,companies,whatsapp_messages,user_roles,profiles')
  .split(',').map(table => table.trim());
const backupFile = process.env.BACKUP_FILE;
const countsFile = process.env.SOURCE_COUNTS_FILE;
const problemas = [];
if (!process.env.PROD_DB_URL) problemas.push('PROD_DB_URL ausente');
if (!backupFile) problemas.push('BACKUP_FILE ausente');
if (!countsFile) problemas.push('SOURCE_COUNTS_FILE ausente');
if (tables.some(table => !/^[a-z_][a-z0-9_]*$/.test(table))) problemas.push('CRITICAL_TABLES com nome de tabela inválido');
if (new Set(tables).size !== tables.length) problemas.push('CRITICAL_TABLES com tabela repetida');
if (problemas.length > 0) {
  console.error(`Configuração inválida: ${problemas.join('; ')}.`);
  process.exit(1);
}
// import dinâmico: --help e a validação acima não dependem do pacote pg
const { default: pg } = await import('pg');
await rm(countsFile, { force: true });

let client;
let dump;
let stage = 'conexão';
const interrupt = () => {
  dump?.kill('SIGTERM');
  setTimeout(() => process.exit(130), 1000).unref();
  if (client) void client.end().then(() => process.exit(130), () => process.exit(130));
};
process.on('SIGINT', interrupt);
process.on('SIGTERM', interrupt);

try {
  const connection = new URL(process.env.PROD_DB_URL);
  if (!['postgres:', 'postgresql:'].includes(connection.protocol)) throw new Error('Protocolo inválido');
  const dumpEnv = {
    ...process.env,
    PGHOST: connection.hostname.replace(/^\[|\]$/g, ''),
    PGPORT: connection.port || '5432',
    PGUSER: decodeURIComponent(connection.username) || process.env.PGUSER,
    PGDATABASE: decodeURIComponent(connection.pathname.slice(1)) || process.env.PGDATABASE,
    PGPASSWORD: connection.password ? decodeURIComponent(connection.password) : process.env.PGPASSWORD,
    PGSSLMODE: connection.searchParams.get('sslmode') ?? process.env.PGSSLMODE ?? 'prefer',
  };
  console.log('Etapa: conexão TLS à origem.');
  client = new pg.Client({ connectionString: process.env.PROD_DB_URL, connectionTimeoutMillis: 30_000 });
  await client.connect();
  stage = 'snapshot e contagens';
  console.log('Etapa: snapshot e contagens.');
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const { rows: [{ snapshot }] } = await client.query('SELECT pg_export_snapshot() AS snapshot');
  const counts = [];
  for (const table of tables) {
    const { rows: [{ count }] } = await client.query(`SELECT COUNT(*)::text AS count FROM public."${table}"`);
    counts.push(`${table}\t${count}`);
  }

  stage = 'pg_dump';
  console.log('Etapa: dump lógico.');
  dump = spawn('docker', [
    'exec', '--user', `${process.getuid()}:${process.getgid()}`,
    '-e', 'PGHOST', '-e', 'PGPORT', '-e', 'PGUSER', '-e', 'PGDATABASE', '-e', 'PGPASSWORD',
    '-e', 'PGSSLMODE', '-e', 'PGSSLROOTCERT',
    process.env.DUMP_CONTAINER ?? 'singu-drill', 'pg_dump', `--snapshot=${snapshot}`,
    '--format=custom', '--no-owner', '--no-privileges',
    '--file', process.env.CONTAINER_BACKUP_FILE ?? '/workspace/.drill/backup.dump',
  ], { stdio: 'ignore', env: dumpEnv });
  await new Promise((resolve, reject) => {
    dump.once('error', reject);
    dump.once('exit', code => code === 0 ? resolve() : reject(new Error('pg_dump falhou')));
  });
  await client.query('COMMIT');

  stage = 'manifesto';
  await chmod(backupFile, 0o600).catch(() => {});   // dump contém dados pessoais
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(backupFile)) hash.update(chunk);
  // grava em temporário e renomeia: o manifesto nunca fica pela metade
  const parcial = `${countsFile}.tmp-${process.pid}`;
  await writeFile(parcial, `#sha256\t${hash.digest('hex')}\n#snapshot\t${snapshot}\n${counts.join('\n')}\n`, { mode: 0o600 });
  await rename(parcial, countsFile);
  console.log('Dump e contagens capturados no mesmo snapshot; manifesto vinculado por SHA-256.');
} catch (error) {
  await rm(countsFile, { force: true }).catch(() => {});
  await rm(`${countsFile}.tmp-${process.pid}`, { force: true }).catch(() => {});
  console.error(`Falha na etapa ${stage}. Nenhum manifesto válido foi produzido.`);
  if (error instanceof pg.DatabaseError && /^[0-9A-Z]{5}$/.test(error.code ?? '')) {
    console.error(`SQLSTATE: ${error.code}`);
  }
  process.exitCode = 1;
} finally {
  process.removeListener('SIGINT', interrupt);
  process.removeListener('SIGTERM', interrupt);
  if (client) await client.end();
}
