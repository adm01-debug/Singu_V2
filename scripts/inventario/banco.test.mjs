// Roda scripts/inventario/banco.sql num Postgres LOCAL com fixtures e confere o JSON que o
// gerar-banco.mjs consome. Lê PGHOST/PGPORT/PGUSER do ambiente e se PULA (não falha) quando não
// há banco. Só aceita host de loopback: o teste cria e apaga um banco próprio, então nunca pode
// apontar para produção. Rodar: PGHOST=127.0.0.1 PGPORT=55432 PGUSER=postgres node --test scripts/inventario/banco.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SQL = join(AQUI, 'banco.sql');
const GERAR = join(AQUI, 'gerar-banco.mjs');
const host = process.env.PGHOST ?? '';
const local = ['127.0.0.1', 'localhost', '::1'].includes(host) || host.startsWith('/');
const BANCO = `g2_inv_teste_${process.pid}`;
const envPg = (database) => ({ ...process.env, PGDATABASE: database, PGCONNECT_TIMEOUT: '5', PGOPTIONS: '' });
const psql = (database, args, input) => spawnSync('psql', ['--no-psqlrc', '--quiet', '--set', 'ON_ERROR_STOP=1', ...args], { env: envPg(database), encoding: 'utf8', input });

let pular = false;
if (!local) pular = `PGHOST ausente ou não é loopback ("${host}"): teste de banco.sql pulado`;
else if (spawnSync('psql', ['--version']).status !== 0) pular = 'psql não instalado: teste de banco.sql pulado';
else if (psql('postgres', ['--command', 'SELECT 1']).status !== 0) pular = `sem Postgres em ${host}:${process.env.PGPORT ?? 5432}: teste de banco.sql pulado`;

// O mínimo do Supabase que o banco.sql lê: pg_cron, ledger de migrations e as tabelas do WhatsApp.
const STUBS = `
CREATE SCHEMA cron;
CREATE TABLE cron.job (jobid bigint PRIMARY KEY, schedule text, command text, active boolean DEFAULT true, jobname text);
CREATE TABLE cron.job_run_details (jobid bigint, runid bigserial, status text, return_message text, start_time timestamptz, end_time timestamptz);
CREATE SCHEMA supabase_migrations;
CREATE TABLE supabase_migrations.schema_migrations (version text PRIMARY KEY, statements text[], name text);
CREATE TABLE public.whatsapp_instances (instance_name text, display_name text, status text, last_connected_at timestamptz, updated_at timestamptz, phone text, token text);
CREATE TABLE public.whatsapp_messages (id bigserial, created_at timestamptz DEFAULT now());
`;
const FIXTURE = `${STUBS}
INSERT INTO supabase_migrations.schema_migrations(version, name) VALUES ('20261101000000','a'), ('20261103000000','c');
INSERT INTO public.whatsapp_instances VALUES
  ('vendas', 'Vendas', 'connected', '2026-11-08 10:00+00', '2026-11-08 11:00+00', '5511999990000', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.assinatura'),
  ('suporte', NULL, 'disconnected', NULL, NULL, '5511888880000', 'sb_secret_nao_pode_sair');
INSERT INTO public.whatsapp_messages(created_at) VALUES (now()), (now() - interval '10 days');

CREATE TABLE public.com_rls (id int PRIMARY KEY, dono uuid);
ALTER TABLE public.com_rls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.com_rls FORCE ROW LEVEL SECURITY;
CREATE POLICY p1 ON public.com_rls FOR SELECT USING (true);
CREATE POLICY p2 ON public.com_rls FOR INSERT WITH CHECK (true);
INSERT INTO public.com_rls SELECT g, NULL FROM generate_series(1, 7) g;
CREATE TABLE public.sem_rls (id int);
CREATE TABLE public.rls_sem_policy (id int);
ALTER TABLE public.rls_sem_policy ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.orfa (id int);
ALTER TABLE public.orfa ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.orfa USING (true);
CREATE TABLE public.grande (id int);
ALTER TABLE public.grande ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.grande USING (true);
INSERT INTO public.grande VALUES (1), (2);

-- Corpo com $$, ponto e vírgula dentro de string e comentário: nada disso pode confundir a consulta.
CREATE FUNCTION public.toca() RETURNS trigger LANGUAGE plpgsql AS $f$
BEGIN
  -- comentário; com ponto e vírgula
  INSERT INTO sem_rls VALUES (length('a;b $$ c'));
  RETURN NEW;
END $f$;
CREATE TRIGGER t1 BEFORE INSERT ON public.com_rls FOR EACH ROW EXECUTE FUNCTION public.toca();
CREATE TRIGGER t2 AFTER UPDATE ON public.com_rls FOR EACH ROW EXECUTE FUNCTION public.toca();
CREATE VIEW public.vw_x AS SELECT id FROM public.rls_sem_policy;
CREATE PROCEDURE public.proc() LANGUAGE sql AS $$ SELECT 1 $$;

CREATE TABLE public.metricas (dia date, v int) PARTITION BY RANGE (dia);
ALTER TABLE public.metricas ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON public.metricas USING (true);
CREATE TABLE public.metricas_2026_11 PARTITION OF public.metricas FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
ALTER TABLE public.metricas_2026_11 ENABLE ROW LEVEL SECURITY;
INSERT INTO public.metricas VALUES ('2026-11-05', 1);

-- Nomes hostis: regex ("a.b" não pode casar com axb; "(" e "[" não podem derrubar a consulta) e Markdown.
CREATE TABLE public."a.b" (id int);
CREATE TABLE public.axb (id int);
CREATE FUNCTION public.usa_axb() RETURNS int LANGUAGE sql AS $$ SELECT count(*)::int FROM axb $$;
CREATE TABLE public."foo(bar" (id int);
CREATE VIEW public.vw_foo AS SELECT * FROM public."foo(bar";
CREATE TABLE public."x[y" (id int);
CREATE TABLE public."pipe|star*_\`md\`" (id int);
CREATE TABLE public."Maiúscula Ç" (id int);
CREATE TABLE public."a\\b" (id int);

INSERT INTO cron.job VALUES
  (1, '*/5 * * * *', $c$SELECT net.http_post(url := 'https://x.supabase.co/functions/v1/f', headers := '{"Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.segredo.assinatura"}'::jsonb); SELECT public.limpa();$c$, true, 'chama-edge'),
  (2, '0 3 * * *', 'SELECT public.limpa()', true, 'limpeza'),
  (3, '0 3 * * 1', 'VACUUM', false, 'desligado');
INSERT INTO cron.job_run_details(jobid, status, return_message, start_time, end_time)
SELECT 1, CASE WHEN g % 4 = 0 THEN 'failed' ELSE 'succeeded' END, CASE WHEN g % 4 = 0 THEN 'job startup timeout' END,
       date_trunc('hour', now()) - (g || ' hours')::interval, date_trunc('hour', now()) - (g || ' hours')::interval + interval '3 seconds'
  FROM generate_series(1, 40) g;
INSERT INTO cron.job_run_details(jobid, status, start_time, end_time) VALUES (2, 'succeeded', now() - interval '9 days', now() - interval '9 days' + interval '1 second');
ANALYZE;
-- Simula tabela grande: acima de 200 mil na estimativa o banco.sql usa a estimativa, não o count(*).
UPDATE pg_class SET reltuples = 500000 WHERE oid = 'public.grande'::regclass;
`;

/** Roda o banco.sql exatamente como o inventario-estado-semanal.yml. */
const rodarInventario = (database) => psql(database, ['--no-align', '--tuples-only', '--command', 'SET default_transaction_read_only = on', '--file', SQL]);

let saida;
let dado;
before(() => {
  if (pular) return;
  psql('postgres', ['--command', `DROP DATABASE IF EXISTS "${BANCO}"`, '--command', `CREATE DATABASE "${BANCO}"`]);
  const fx = psql(BANCO, ['--file', '-'], FIXTURE);
  assert.equal(fx.status, 0, fx.stderr);
  saida = rodarInventario(BANCO);
  if (saida.status === 0) dado = JSON.parse(saida.stdout);
});
after(() => {
  if (!pular) psql('postgres', ['--command', `DROP DATABASE IF EXISTS "${BANCO}" WITH (FORCE)`, '--command', `DROP DATABASE IF EXISTS "${BANCO}_vazio" WITH (FORCE)`]);
});
const tabela = (nome) => dado.tabelas.find((t) => t.nome === nome);

test('banco.sql roda limpo em transação só-leitura e imprime UMA linha com UM JSON', { skip: pular }, () => {
  assert.equal(saida.status, 0, saida.stderr);
  assert.equal(saida.stderr, '');
  assert.equal(saida.stdout.trim().split('\n').length, 1);
  assert.deepEqual(Object.keys(dado).sort(), ['cron', 'format_version', 'medido_em', 'resumo', 'tabelas', 'whatsapp']);
  assert.equal(dado.format_version, 1);
  assert.match(dado.medido_em, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
});

test('resumo: contagens batem com a fixture', { skip: pular }, () => {
  const r = dado.resumo;
  assert.equal(r.tabelas_public, 16);
  assert.equal(r.tabelas_sem_rls, 10);
  assert.equal(r.policies, 5);
  assert.equal(r.funcoes_public, 3);
  assert.equal(r.views_public, 2);
  assert.equal(r.triggers_public, 2);
  assert.deepEqual([r.cron_jobs, r.cron_ativos, r.ledger_registros, r.ledger_versao_max], [3, 2, 2, '20261103000000']);
  assert.ok(Number.isInteger(r.max_connections) && r.tamanho_bytes > 0);
  assert.match(r.postgres, /^16\./);
});

test('tabelas: RLS, policies, triggers, linhas, partição e citação no banco', { skip: pular }, () => {
  assert.equal(new Set(dado.tabelas.map((t) => t.nome)).size, dado.tabelas.length, 'uma entrada por tabela');
  assert.deepEqual({ ...tabela('com_rls'), bytes: 0 }, { nome: 'com_rls', rls: true, rls_forcado: true, policies: 2, triggers: 2, linhas: 7, linhas_exatas: true, bytes: 0, particao_de: null, citada_no_banco: false });
  assert.deepEqual([tabela('sem_rls').rls, tabela('sem_rls').citada_no_banco], [false, true], 'citada pelo corpo da função');
  assert.deepEqual([tabela('rls_sem_policy').rls, tabela('rls_sem_policy').policies, tabela('rls_sem_policy').citada_no_banco], [true, 0, true], 'citada pela view');
  assert.deepEqual([tabela('orfa').linhas, tabela('orfa').citada_no_banco], [0, false]);
  assert.deepEqual([tabela('metricas').particao_de, tabela('metricas').policies, tabela('metricas').linhas], [null, 1, 1]);
  assert.deepEqual([tabela('metricas_2026_11').particao_de, tabela('metricas_2026_11').policies, tabela('metricas_2026_11').rls], ['metricas', 0, true]);
  assert.deepEqual([tabela('grande').linhas, tabela('grande').linhas_exatas], [500000, false], 'acima de 200 mil vale a estimativa');
});

test('nomes com caractere de regex/Markdown: consulta não cai e a citação é exata', { skip: pular }, () => {
  // Antes: "a.b" era dada como citada (a regex casava com axb) e uma tabela "foo(bar" derrubava o inventário inteiro.
  assert.equal(tabela('a.b').citada_no_banco, false);
  assert.equal(tabela('axb').citada_no_banco, true);
  assert.equal(tabela('foo(bar').citada_no_banco, true, 'citada pela view vw_foo');
  for (const nome of ['x[y', 'pipe|star*_`md`', 'Maiúscula Ç', 'a\\b']) assert.equal(tabela(nome)?.citada_no_banco, false, nome);
});

test('cron: só o nome das funções chamadas, taxas e horas paradas', { skip: pular }, () => {
  const [edge, desligado, limpeza] = dado.cron.jobs;
  assert.deepEqual(dado.cron.jobs.map((j) => j.nome), ['chama-edge', 'desligado', 'limpeza']);
  assert.deepEqual(edge.chama, ['net.http_post', 'public.limpa']);
  assert.deepEqual([edge.execucoes_7d, edge.falhas_7d, edge.startup_timeout_7d, edge.taxa_falha_7d_pct, edge.duracao_max_s_7d], [40, 10, 10, 25, 3]);
  assert.match(edge.ultima_falha, /^\d{4}-\d{2}-\d{2}T\d{2}:00:00Z$/);
  assert.deepEqual([desligado.ativo, desligado.chama, desligado.execucoes_7d, desligado.taxa_falha_7d_pct, desligado.ultima_falha], [false, [], 0, 0, null]);
  assert.deepEqual([limpeza.execucoes_7d, limpeza.execucoes_24h, limpeza.duracao_max_s_7d], [0, 0, null], 'execução de 9 dias atrás fica fora da janela');
  assert.equal(dado.cron.horas_paradas_7d.length, 10);
  assert.match(dado.cron.horas_paradas_7d[0].hora, /^\d{4}-\d{2}-\d{2}T\d{2}:00Z$/);
  assert.deepEqual([dado.cron.historico.linhas, dado.cron.historico.mais_de_7_dias], [41, 1]);
  assert.equal(dado.cron.config.max_worker_processes > 0, true);
});

test('nenhum segredo sai: token/telefone do WhatsApp e o Bearer do comando do cron ficam de fora', { skip: pular }, () => {
  assert.deepEqual(dado.whatsapp.conexoes, [
    { nome: 'suporte', rotulo: null, status: 'disconnected', ultima_conexao: null, atualizada_em: null },
    { nome: 'vendas', rotulo: 'Vendas', status: 'connected', ultima_conexao: '2026-11-08T10:00:00Z', atualizada_em: '2026-11-08T11:00:00Z' },
  ]);
  assert.equal(dado.whatsapp.mensagens_7d, 1);
  assert.doesNotMatch(saida.stdout, /eyJ|Bearer|sb_secret|5511|supabase\.co/);
});

test('o JSON real do banco.sql passa pelo gerar-banco.mjs e vira o inventário com os alertas certos', { skip: pular }, (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'inv pg ç-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [rel, conteudo] of Object.entries({
    'supabase/migrations/20261101000000_a.sql': '', 'supabase/migrations/20261103000000_c.sql': '',
    'supabase/functions/fn/index.ts': "db.from('com_rls')", 'src/a.ts': "db.from('grande')", 'entrada.json': saida.stdout,
  })) { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), conteudo); }
  const r = spawnSync(process.execPath, [GERAR, '--entrada', join(dir, 'entrada.json')], { env: { ...process.env, INVENTARIO_RAIZ: dir, SUPABASE_ACCESS_TOKEN: '' }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^banco\.json: 16 tabelas, 3 cron jobs, \d+ orfas, 6 alertas, edges 1 no repo/);
  const inv = JSON.parse(readFileSync(join(dir, 'inventario/estado/banco.json'), 'utf8'));
  const alerta = (tipo) => inv.alertas.find((a) => a.tipo === tipo)?.detalhe;
  assert.deepEqual(inv.alertas.map((a) => a.tipo), ['tabela_sem_rls', 'rls_sem_policy', 'cron_falhando', 'cron_sem_execucao', 'cron_parado', 'whatsapp_desconectado']);
  assert.equal(alerta('tabela_sem_rls').length, 10);
  assert.deepEqual(alerta('rls_sem_policy'), ['rls_sem_policy'], 'a partição com policy no pai não alerta');
  assert.deepEqual(alerta('cron_falhando'), ['chama-edge (25% em 7d)']);
  assert.deepEqual(alerta('cron_sem_execucao'), ['limpeza']);
  assert.deepEqual(alerta('whatsapp_desconectado'), ['suporte: disconnected']);
  assert.ok(inv.tabelas_orfas.lista.includes('orfa') && inv.tabelas_orfas.lista.includes('a.b'));
  assert.ok(!inv.tabelas_orfas.lista.includes('axb') && !inv.tabelas_orfas.lista.includes('foo(bar'));
  assert.deepEqual(inv.tabelas.find((x) => x.nome === 'com_rls').uso_no_codigo, { edges: 1, src: 0 });
});

test('banco só com os stubs (quase vazio) ainda devolve JSON válido; sem pg_cron a consulta falha sem imprimir nada', { skip: pular }, () => {
  psql('postgres', ['--command', `DROP DATABASE IF EXISTS "${BANCO}_vazio"`, '--command', `CREATE DATABASE "${BANCO}_vazio"`]);
  assert.equal(psql(`${BANCO}_vazio`, ['--file', '-'], STUBS).status, 0);
  const vazio = rodarInventario(`${BANCO}_vazio`);
  assert.equal(vazio.status, 0, vazio.stderr);
  const d = JSON.parse(vazio.stdout);
  assert.deepEqual([d.tabelas.length, d.cron.jobs, d.cron.horas_paradas_7d, d.whatsapp.conexoes, d.resumo.ledger_versao_max, d.cron.historico.mais_antigo], [2, [], [], [], null, null]);
  assert.equal(psql(`${BANCO}_vazio`, ['--command', 'DROP SCHEMA cron CASCADE']).status, 0);
  const semCron = rodarInventario(`${BANCO}_vazio`);
  assert.equal(semCron.status, 3);
  assert.equal(semCron.stdout, '');
  assert.match(semCron.stderr, /cron\.job/);
});
