import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import pg from 'pg';

const tables = (process.env.CRITICAL_TABLES ?? 'contacts,deals,interactions,companies,whatsapp_messages,user_roles,profiles').split(',');
const backupFile = process.env.BACKUP_FILE;
const countsFile = process.env.SOURCE_COUNTS_FILE;
if (!process.env.PROD_DB_URL || !backupFile || !countsFile ||
    tables.some(table => !/^[a-z_][a-z0-9_]*$/.test(table)) || new Set(tables).size !== tables.length) {
  throw new Error('Conexão, arquivos e nomes de tabelas válidos são obrigatórios');
}

const client = new pg.Client({ connectionString: process.env.PROD_DB_URL });
let dump;
const interrupt = () => {
  dump?.kill('SIGTERM');
  setTimeout(() => process.exit(130), 1000).unref();
  void client.end().then(() => process.exit(130), () => process.exit(130));
};
process.on('SIGINT', interrupt);
process.on('SIGTERM', interrupt);

try {
  await client.connect();
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const { rows: [{ snapshot }] } = await client.query('SELECT pg_export_snapshot() AS snapshot');
  const counts = [];
  for (const table of tables) {
    const { rows: [{ count }] } = await client.query(`SELECT COUNT(*)::text AS count FROM public."${table}"`);
    counts.push(`${table}\t${count}`);
  }

  dump = spawn('docker', [
    'exec', '--user', `${process.getuid()}:${process.getgid()}`, '-e', 'PGPASSWORD', '-e', 'PROD_DB_URL',
    process.env.DUMP_CONTAINER ?? 'singu-drill', 'pg_dump', `--snapshot=${snapshot}`,
    '--format=custom', '--no-owner', '--no-privileges', '--dbname', process.env.PROD_DB_URL,
    '--file', process.env.CONTAINER_BACKUP_FILE ?? '/workspace/.drill/backup.dump',
  ], { stdio: 'ignore' });
  await new Promise((resolve, reject) => {
    dump.once('error', reject);
    dump.once('exit', code => code === 0 ? resolve() : reject(new Error('pg_dump falhou')));
  });
  await client.query('COMMIT');

  const hash = createHash('sha256');
  for await (const chunk of createReadStream(backupFile)) hash.update(chunk);
  await writeFile(countsFile, `#sha256\t${hash.digest('hex')}\n#snapshot\t${snapshot}\n${counts.join('\n')}\n`, { mode: 0o600 });
  console.log('Dump e contagens capturados no mesmo snapshot; manifesto vinculado por SHA-256.');
} catch {
  console.error('Falha ao capturar dump e contagens no mesmo snapshot. Nenhum manifesto válido foi produzido.');
  process.exitCode = 1;
} finally {
  process.removeListener('SIGINT', interrupt);
  process.removeListener('SIGTERM', interrupt);
  await client.end();
}
