// Testes do lint de hierarquia de providers (scripts/lint-providers.cjs) em árvores de mentira.
// Rodar: node --test scripts/lint-providers.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const SCRIPT = join(REPO, 'scripts/lint-providers.cjs');
const { DEPENDENCIES } = createRequire(import.meta.url)(SCRIPT);

function rodar(t, arquivos, args = (dir) => ['--root', dir], cwd = tmpdir()) {
  const dir = mkdtempSync(join(tmpdir(), 'lint providers ç-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [rel, conteudo] of Object.entries(arquivos)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), conteudo);
  }
  const res = spawnSync(process.execPath, [SCRIPT, ...args(dir)], { cwd, encoding: 'utf8' });
  return { code: res.status, out: res.stdout, err: res.stderr, dir };
}

/** App.tsx com os providers aninhados na ordem dada (de fora para dentro). */
const arvore = (ordem, miolo = '<Rotas />') => {
  const abre = ordem.map((n) => `<${n}>`).join('\n');
  const fecha = [...ordem].reverse().map((n) => `</${n}>`).join('\n');
  return `const App = () => (\n${abre}\n${miolo}\n${fecha}\n);\nexport default App;\n`;
};
const CERTA = ['HelmetProvider', 'QueryClientProvider', 'BrowserRouter', 'AuthProvider', 'NavigationStackProvider'];

test('o repositório atual passa e o lint realmente encontra os providers', () => {
  const res = spawnSync(process.execPath, [SCRIPT], { cwd: tmpdir(), encoding: 'utf8' });
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /AuthProvider.*NavigationStackProvider/);
});

test('as dependências do lint são as mesmas de src/lib/providerGuard.ts', () => {
  const guard = readFileSync(join(REPO, 'src/lib/providerGuard.ts'), 'utf8');
  const doGuard = {};
  for (const m of guard.matchAll(/\{\s*name:\s*'(\w+)',\s*requires:\s*\[([^\]]*)\]/g)) {
    const requer = m[2].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean);
    if (requer.length) doGuard[m[1]] = requer.sort();
  }
  const doLint = Object.fromEntries(Object.entries(DEPENDENCIES).map(([k, v]) => [k, [...v].sort()]));
  assert.deepEqual(doLint, doGuard);
});

test('aprova a ordem certa num App.tsx só', (t) => {
  const r = rodar(t, { 'src/App.tsx': arvore(CERTA) });
  assert.equal(r.code, 0, r.err);
});

const ERRADAS = {
  'AuthProvider fora do BrowserRouter': [['QueryClientProvider', 'AuthProvider', 'BrowserRouter', 'NavigationStackProvider'], /AuthProvider requer BrowserRouter/],
  'AuthProvider fora do QueryClientProvider': [['BrowserRouter', 'AuthProvider', 'QueryClientProvider', 'NavigationStackProvider'], /AuthProvider requer QueryClientProvider/],
  'NavigationStackProvider fora do AuthProvider': [['QueryClientProvider', 'BrowserRouter', 'NavigationStackProvider', 'AuthProvider'], /NavigationStackProvider requer AuthProvider/],
  'BrowserRouter ausente': [['QueryClientProvider', 'AuthProvider', 'NavigationStackProvider'], /AuthProvider requer BrowserRouter/],
};
for (const [nome, [ordem, erro]] of Object.entries(ERRADAS)) {
  test(`reprova ${nome}`, (t) => {
    const r = rodar(t, { 'src/App.tsx': arvore(ordem) });
    assert.equal(r.code, 1);
    assert.match(r.err, erro);
    assert.match(r.err, /src\/App\.tsx:\d+/);
    assert.match(r.err, /Ordem de providers inválida/);
  });
}

test('reprova irmãos: BrowserRouter aparece antes no texto, mas não envolve o AuthProvider', (t) => {
  // O lint antigo só comparava a ordem de aparição no texto e aprovava isto.
  const app = `const App = () => (
  <QueryClientProvider client={c}>
    <BrowserRouter><Menu /></BrowserRouter>
    <AuthProvider><NavigationStackProvider><Rotas /></NavigationStackProvider></AuthProvider>
  </QueryClientProvider>
);`;
  const r = rodar(t, { 'src/App.tsx': app });
  assert.equal(r.code, 1);
  assert.match(r.err, /AuthProvider requer BrowserRouter/);
  assert.match(r.err, /NavigationStackProvider requer BrowserRouter/);
});

test('reprova provider auto-fechado usado como se envolvesse os filhos', (t) => {
  const app = `const App = () => (<QueryClientProvider client={c}><BrowserRouter />
  <AuthProvider><NavigationStackProvider /></AuthProvider></QueryClientProvider>);`;
  const r = rodar(t, { 'src/App.tsx': app });
  assert.equal(r.code, 1);
  assert.match(r.err, /AuthProvider requer BrowserRouter/);
});

test('segue o componente importado onde a árvore mora (caso real: App.tsx -> app/AppProviders.tsx)', (t) => {
  const arquivos = (ordem) => ({
    'src/App.tsx': "import { AppProviders } from './app/AppProviders';\nconst App = () => <AppProviders />;\nexport default App;\n",
    'src/app/AppProviders.tsx': `export const AppProviders = () => (\n${arvore(ordem)}\n);`,
  });
  assert.equal(rodar(t, arquivos(CERTA)).code, 0);
  const ruim = rodar(t, arquivos(['QueryClientProvider', 'AuthProvider', 'BrowserRouter', 'NavigationStackProvider']));
  assert.equal(ruim.code, 1);
  assert.match(ruim.err, /src\/app\/AppProviders\.tsx:\d+/);
});

test('herda os ancestrais de quem renderiza: providers divididos em dois arquivos, alias @/ e lazy()', (t) => {
  const interno = "export const Interno = () => (<AuthProvider><NavigationStackProvider><Rotas /></NavigationStackProvider></AuthProvider>);";
  const chrome = 'export default function Chrome() { return <EasterEggsProvider />; }';
  const app = (dentro) => `import { Interno } from '@/app/Interno';
import { lazy } from 'react';
const Chrome = lazy(() => import('./app/Chrome'));
const App = () => (<QueryClientProvider client={c}><BrowserRouter>${dentro}</BrowserRouter></QueryClientProvider>);`;
  const ok = rodar(t, { 'src/App.tsx': app('<Interno />'), 'src/app/Interno.tsx': interno, 'src/app/Chrome.tsx': chrome });
  assert.equal(ok.code, 0, ok.err);
  // EasterEggsProvider (via lazy) fora do AuthProvider:
  const ruim = rodar(t, { 'src/App.tsx': app('<Interno /><Chrome />'), 'src/app/Interno.tsx': interno, 'src/app/Chrome.tsx': chrome });
  assert.equal(ruim.code, 1);
  assert.match(ruim.err, /EasterEggsProvider requer AuthProvider.*src\/app\/Chrome\.tsx/);
});

test('reprova quando não há provider crítico para verificar (não aprova no vazio)', (t) => {
  // Bug do lint antigo: App.tsx virou `<AppProviders />` e ele passou a aprovar sem olhar nada.
  const r = rodar(t, { 'src/App.tsx': 'const App = () => <Outro />;\nexport default App;\n' });
  assert.equal(r.code, 1);
  assert.match(r.err, /AuthProvider não foi encontrado/);
});

test('ignora providers em comentário e nome parecido (AuthProviderMock)', (t) => {
  const app = `// <AuthProvider> ficava aqui
/* <NavigationStackProvider> também */
const App = () => (
  <QueryClientProvider client={c}>
    {/* <AuthProvider> antigo */}
    <AuthProviderMock />
    <BrowserRouter future={{ v7: true }} onError={(e) => log(e > 1 ? 'a' : "b")}>
      <AuthProvider><NavigationStackProvider><a href="https://x.dev/y">x</a></NavigationStackProvider></AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);`;
  const r = rodar(t, { 'src/App.tsx': app });
  assert.equal(r.code, 0, r.err);
});

test('arquivo posicional valida só aquela árvore; arquivo ausente e --root sem valor falham', (t) => {
  const r = rodar(t, { 'x/Arvore.tsx': arvore(CERTA) }, (dir) => [join(dir, 'x/Arvore.tsx'), '--root', dir]);
  assert.equal(r.code, 0, r.err);
  const ausente = rodar(t, {});
  assert.equal(ausente.code, 1);
  assert.match(ausente.err, /App\.tsx não encontrado/);
  assert.equal(rodar(t, {}, () => ['--root']).code, 2);
  assert.equal(rodar(t, {}, () => ['--help']).code, 0);
});

test('import em ciclo e arquivo importado inexistente não travam', (t) => {
  const r = rodar(t, {
    'src/App.tsx': `import { A } from './A';\nimport { Sumiu } from './Sumiu';\n${arvore(CERTA, '<A /><Sumiu />')}`,
    'src/A.tsx': "import App from './App';\nexport const A = () => <AuthProvider><App /></AuthProvider>;",
  });
  // A.tsx renderiza AuthProvider de novo, já dentro de BrowserRouter/QueryClientProvider: válido.
  assert.equal(r.code, 0, r.err);
});
