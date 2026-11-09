// Os aplicadores contra os DDL REAIS de scripts/migration/ddl, num Postgres 16 LOCAL com stubs do Supabase,
// através de uma "Management API" local (127.0.0.1). Nunca toca a API real nem altera os .sql.
// As expectativas não são números fixos: cada script é comparado com uma aplicação de referência independente
// (instrução a instrução, direto no banco) e com os outros scripts — continua valendo se os DDL mudarem.
// Precisa de PGHOST/PGPORT/PGUSER; sem banco os testes se PULAM. Rodar: node --test scripts/apply-ddl-real.test.mjs
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cfgPg, ConexaoPg, criarBanco, iniciarMock, pgDisponivel, removerBanco, retrato, rodarCli, sqlLocal } from './lib/mgmt-mock.test.mjs';
import { carregarDdl, DIR_DDL_PADRAO } from './lib/supabase-mgmt.mjs';
import { ARQUIVOS } from './apply-all.js';

const pular = (await pgDisponivel()) ? false : 'Postgres local indisponível (defina PGHOST/PGPORT/PGUSER)';
const temPsql = spawnSync('psql', ['--version']).status === 0;
const opcoes = { skip: pular, timeout: 240000 };
const tmp = mkdtempSync(join(tmpdir(), 'g1-real-'));
const bancos = [];
after(async () => { for (const b of bancos) await removerBanco(b).catch(() => {}); rmSync(tmp, { recursive: true, force: true }); });
const novoBanco = async (sufixo, o) => { const b = await criarBanco(sufixo, o); bancos.push(b); return b; };
async function aplicar(script, banco) {
  const mock = await iniciarMock({ banco });
  try { const r = await rodarCli(script, ['--apply'], { mock, cwd: tmp }); return { ...r, chamadas: mock.chamadas }; } finally { await mock.fechar(); }
}
const resumo = (stdout) => { const m = /RESUMO .*: (\d+) instrução\(ões\) — (\d+) ok, (\d+) já existiam, (\d+) falharam, (\d+) não executadas/.exec(stdout); return m && { total: +m[1], ok: +m[2], jaExistiam: +m[3], falharam: +m[4], naoExecutadas: +m[5] }; };
const origensQueFalharam = (stdout) => [...stdout.matchAll(/^ {2}FALHOU (\S+?):? /gm)].map((m) => m[1].replace(/:$/, '')).sort();

/** Referência: cada instrução CRUA dos arquivos, na ordem canônica, direto no banco; repete as que falharam enquanto houver progresso. */
async function aplicarReferencia(banco) {
  const c = await ConexaoPg.abrir(banco);
  try {
    let pendentes = ARQUIVOS.flatMap((f) => carregarDdl(DIR_DDL_PADRAO, f));
    const total = pendentes.length; const sintaxe = []; const multiplos = [];
    for (let passada = 0; passada < 4 && pendentes.length; passada++) {
      const falhas = [];
      for (const i of pendentes) {
        const r = await c.consultar(i.sql);
        if (r.emTransacao) await c.consultar('ROLLBACK');
        if (r.erro) { falhas.push({ ...i, erro: `${r.erro.code}: ${r.erro.message}` }); if (r.erro.code === '42601') sintaxe.push(i.origem); } else if (r.comandos !== 1) multiplos.push(i.origem);
      }
      if (falhas.length === pendentes.length) break;
      pendentes = falhas;
    }
    return { total, falhas: pendentes, sintaxe: [...new Set(sintaxe)], multiplos };
  } finally { c.fechar(); }
}

const ctx = {}; // estado compartilhado entre os testes (rodam em sequência)

test('apply-all.js = aplicação de referência (mesmos objetos, mesmas falhas) e reexecução idempotente', opcoes, async () => {
  const bancoRef = await novoBanco('ref');
  const ref = await aplicarReferencia(bancoRef);
  assert.deepEqual(ref.sintaxe, [], 'nenhuma instrução cortada pelo divisor gera erro de sintaxe');
  assert.deepEqual(ref.multiplos, [], 'cada pedaço é exatamente um comando para o servidor');
  const banco = await novoBanco('all');
  const r = await aplicar('apply-all.js', banco);
  const s = resumo(r.stdout);
  assert.ok(s, r.stdout.slice(-500) + r.stderr);
  assert.equal(s.total, ref.total); assert.equal(s.naoExecutadas, 0);
  assert.equal(s.falharam, ref.falhas.length, 'o script falha exatamente no que é inválido por si só');
  assert.equal(s.ok + s.jaExistiam, ref.total - ref.falhas.length);
  assert.equal(r.codigo, ref.falhas.length ? 1 : 0, 'código de saída honesto');
  if (ref.falhas.length <= 60) assert.deepEqual(origensQueFalharam(r.stdout), ref.falhas.map((f) => f.origem).sort(), 'o resumo nomeia as mesmas instruções (arquivo:linha)');
  const ret = await retrato(banco);
  assert.deepEqual(ret, await retrato(bancoRef));
  // Regressões dos bugs originais: a 1ª instrução de cada arquivo (antes descartada) agora existe.
  assert.ok(ret.tabelas.length > 250 && ret.tabelas.includes('abm_account_plans') && ret.tabelas.includes('audit_log_default'));
  assert.ok(ret.rls.includes('abm_account_plans')); assert.ok(ret.policies.includes('abm_account_plans: abm_plans_delete'));
  assert.ok(ret.indices.includes('idx_abm_plans_account')); assert.ok(ret.fks.includes('abm_account_plans_account_id_fkey'));
  assert.ok(ret.funcoes.includes('_connection_encryption_key()')); assert.ok(ret.triggers.includes('abm_account_plans: abm_plans_audit'));
  assert.ok(ret.views.includes('csat_surveys_public')); assert.ok(ret.policies.some((p) => p.includes("contact's neuro history")));
  const semRls = await sqlLocal(banco, "SELECT count(*)::int AS n FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind IN ('r', 'p') AND NOT relispartition AND NOT relrowsecurity");
  assert.equal(semRls[0].n, 0, 'nenhuma tabela criada ficou sem RLS');
  const r2 = await aplicar('apply-all.js', banco);
  assert.equal(r2.codigo, r.codigo); assert.deepEqual(resumo(r2.stdout), s); assert.deepEqual(await retrato(banco), ret);
  assert.ok(!r2.chamadas.some((c) => /already exists/.test(c.erro ?? '')), 'reexecução não esbarra em "já existe"');
  Object.assign(ctx, { ref, ret, bancoAll: banco, falharam: s.falharam });
});

test('chunk-apply.js chega ao mesmo banco que o apply-all.js com muito menos requisições', opcoes, async () => {
  const banco = await novoBanco('chunk');
  const r = await aplicar('chunk-apply.js', banco);
  const s = resumo(r.stdout);
  assert.equal(s.falharam, ctx.falharam); assert.equal(s.naoExecutadas, 0); assert.equal(r.codigo, ctx.falharam ? 1 : 0);
  assert.deepEqual(await retrato(banco), ctx.ret);
  assert.ok(r.chamadas.length < s.total / 2, `${r.chamadas.length} requisições para ${s.total} instruções`);
  ctx.bancoChunk = banco;
});

test('o SQL de `apply-all.js --sql` executado pelo psql (divisor independente) dá o mesmo banco', { ...opcoes, skip: pular || (temPsql ? false : 'psql não está no PATH') }, async () => {
  const banco = await novoBanco('psql');
  const { stdout, codigo } = await rodarCli('apply-all.js', ['--sql'], { cwd: tmp });
  assert.equal(codigo, 0);
  const arquivo = join(tmp, 'gerado.sql'); writeFileSync(arquivo, stdout);
  const c = cfgPg(); let erros = [];
  for (let passada = 0; passada < 4; passada++) {
    const p = spawnSync('psql', ['-X', '-q', '-h', c.host, '-p', String(c.port), '-U', c.user, '-d', banco, '-f', arquivo], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, env: { ...process.env, PGPASSWORD: c.password } });
    erros = p.stderr.split('\n').filter((l) => /ERROR:/.test(l));
  }
  assert.equal(erros.length, ctx.falharam, 'depois de convergir, o psql recusa exatamente as mesmas instruções');
  assert.ok(!erros.some((l) => /syntax error|already exists/.test(l)), erros.slice(0, 3).join('\n'));
  assert.deepEqual(await retrato(banco), ctx.ret);
});

test('apply-migrations.js: arquivo com instrução inválida não entra pela metade; saída coerente; estável ao repetir', opcoes, async () => {
  const banco = await novoBanco('mig');
  const r = await aplicar('apply-migrations.js', banco);
  const invalidos = [...new Set(ctx.ref.falhas.map((f) => f.origem.split(':')[0]))];
  // 00_extensions pede pg_cron/pg_net/supabase_vault, que não existem no Postgres local: é esperado falhar AQUI.
  assert.match(r.stdout, /FALHOU 00_extensions\.sql:\d+ \(arquivo atômico[^\n]*is not available/);
  assert.equal(r.codigo, 1);
  for (const arquivo of invalidos) assert.match(r.stdout, new RegExp(`FALHOU ${arquivo.replace('.', '\\.')}:\\d+ \\(arquivo atômico: nada dele foi aplicado`), arquivo);
  const ret = await retrato(banco);
  if (invalidos.includes('02_tables.sql')) assert.deepEqual(ret.tabelas, [], 'nenhuma tabela de um 02_tables.sql recusado');
  assert.deepEqual(ret.enums, ctx.ret.enums, '01_schemas_and_enums.sql entrou inteiro');
  const r2 = await aplicar('apply-migrations.js', banco);
  assert.equal(r2.codigo, 1); assert.deepEqual(await retrato(banco), ret); assert.deepEqual(resumo(r2.stdout), resumo(r.stdout));
});

test('três caminhos, um resultado: apply-all, chunk-apply e a cadeia fix-enums/retry-failed/apply-missing/apply-remaining', opcoes, async () => {
  // Caminho 1: apply-all → fix-enums (cria system_alerts) → apply-all de novo (agora entram os dependentes).
  const b1 = await novoBanco('c1', { modelo: ctx.bancoAll });
  assert.equal((await aplicar('fix-enums.js', b1)).codigo, 0);
  const again = await aplicar('apply-all.js', b1);
  const ret1 = await retrato(b1);
  assert.ok(ret1.tabelas.includes('system_alerts') && ret1.rls.includes('system_alerts') && ret1.indices.includes('idx_system_alerts_unack'));
  assert.ok(resumo(again.stdout).falharam < ctx.falharam, 'com a tabela corrigida, menos instruções falham');
  // Caminho 3: o mesmo com chunk-apply.
  const b3 = await novoBanco('c3', { modelo: ctx.bancoChunk });
  assert.equal((await aplicar('fix-enums.js', b3)).codigo, 0);
  assert.equal(resumo((await aplicar('chunk-apply.js', b3)).stdout).falharam, resumo(again.stdout).falharam);
  assert.deepEqual(await retrato(b3), ret1);
  // Caminho 2: a cadeia de reparo, partindo só do enum app_role (que em produção já existia).
  const b2 = await novoBanco('c2');
  await sqlLocal(b2, carregarDdl(DIR_DDL_PADRAO, '01_schemas_and_enums.sql').find((i) => /^CREATE TYPE public\.app_role /.test(i.sql)).sql);
  assert.equal((await aplicar('fix-enums.js', b2)).codigo, 0);
  assert.equal((await aplicar('retry-failed.js', b2)).codigo, 0);
  const missing = await aplicar('apply-missing.js', b2);
  assert.deepEqual((await retrato(b2)).tabelas, ret1.tabelas, 'apply-missing completa exatamente as tabelas que faltavam');
  assert.equal(resumo((await aplicar('apply-missing.js', b2)).stdout).total, resumo(missing.stdout).falharam, 'na 2ª vez só sobram as que o banco recusa');
  const soTabelas = await novoBanco('c2tab', { modelo: b2 });
  const rem = await aplicar('apply-remaining.js', b2);
  assert.equal(resumo(rem.stdout).naoExecutadas, 0);
  assert.deepEqual(await retrato(b2), ret1);
  const rem2 = await aplicar('apply-remaining.js', b2);
  assert.deepEqual(resumo(rem2.stdout), resumo(rem.stdout)); assert.deepEqual(await retrato(b2), ret1);
  // Scripts especializados, a partir de "só tabelas": functions+triggers+views, depois RLS+policies.
  const fn = await aplicar('apply-functions.js', soTabelas);
  let ret = await retrato(soTabelas);
  assert.deepEqual([ret.funcoes, ret.triggers, ret.views], [ret1.funcoes, ret1.triggers, ret1.views]);
  assert.equal(fn.codigo, resumo(fn.stdout).falharam ? 1 : 0);
  const rls = await aplicar('apply-rls.js', soTabelas);
  ret = await retrato(soTabelas);
  assert.deepEqual([ret.rls, ret.policies], [ret1.rls, ret1.policies]);
  assert.equal(rls.codigo, resumo(rls.stdout).falharam ? 1 : 0);
  const tv = await aplicar('apply-triggers-views.js', soTabelas);
  assert.equal(tv.codigo, resumo(tv.stdout).falharam ? 1 : 0); assert.equal(resumo(tv.stdout).naoExecutadas, 0);
  assert.deepEqual(await retrato(soTabelas), ret, 'reaplicar triggers e views não muda nada');
});
