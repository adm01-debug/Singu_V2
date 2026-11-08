#!/usr/bin/env node
/**
 * Inventario das rotas do front -> inventario/estado/rotas.json (fonte de consulta dos agentes).
 *
 * Le o codigo, nao documentacao:
 *  - URLs:   src/app/AppRoutes.tsx (path, componente, wrapper de acesso, Navigate, fallback)
 *  - Paginas: src/app/lazyPages.tsx (arquivo de cada pagina lazy) + os imports diretos do AppRoutes
 *  - Menu:   src/components/layout/AppSidebar.tsx (navSections: secao, rotulo, url)
 *            e src/components/layout/MobileBottomNav.tsx (rotulo, path)
 *  - Para cada rota: segue os imports a partir do arquivo da pagina (src/hooks, src/lib, src/domain,
 *    src/integrations, src/contexts, src/store(s), src/data, src/config e a pasta da pagina) e lista
 *    hooks, edge functions invocadas, RPCs, tabelas (.from e /rest/v1) e buckets (storage.from).
 *  - `problemas`: item de menu sem rota, rota sem arquivo, rota duplicada, pagina em src/pages/ que
 *    nenhuma rota usa (codigo morto) e import local que nao resolve.
 *
 * Uso:
 *   node scripts/inventario/gerar-rotas.mjs           grava inventario/estado/rotas.json
 *   node scripts/inventario/gerar-rotas.mjs --check   exit 1 se o arquivo commitado esta desatualizado
 * Saida deterministica (sem data): o mesmo codigo gera o mesmo arquivo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAIDA_REL = 'inventario/estado/rotas.json';
const EXTENSOES = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];

// Arquivos-fonte. Cada um e lido uma vez; se algum sair de lugar o script falha alto em vez de
// gerar um inventario silenciosamente vazio.
export const FONTES = {
  rotas: 'src/app/AppRoutes.tsx',
  lazy: 'src/app/lazyPages.tsx',
  sidebar: 'src/components/layout/AppSidebar.tsx',
  mobile: 'src/components/layout/MobileBottomNav.tsx',
};

// Wrappers de rota: nunca sao a pagina da rota.
const WRAPPERS = new Set([
  'Routes', 'Route', 'Protected', 'Admin', 'LazyPage', 'RequireAuth', 'Navigate',
  'Suspense', 'ErrorBoundary', 'MFAGuardLazy', 'RequireAdminLazy',
]);

// Pastas que o fecho de imports segue sem gastar salto (onde vive a logica de dados).
const PASTAS_LIVRES = [
  'src/hooks', 'src/lib', 'src/domain', 'src/integrations', 'src/contexts',
  'src/store', 'src/stores', 'src/data', 'src/config', 'src/services',
];

const ler = (raiz, rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');
const rel = (raiz, abs) => path.relative(raiz, abs).split(path.sep).join('/');
const unico = (lista) => [...new Set(lista)].sort();

/** Resolve um especificador de import para um arquivo do repo (null = externo, undefined = local quebrado). */
export function resolverImport(raiz, deArquivoAbs, especificador) {
  let base;
  if (especificador.startsWith('@/')) base = path.join(raiz, 'src', especificador.slice(2));
  else if (especificador.startsWith('.')) base = path.resolve(path.dirname(deArquivoAbs), especificador);
  else return null;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of EXTENSOES) if (fs.existsSync(base + ext)) return base + ext;
  return undefined;
}

/** Imports de um arquivo: [{ especificador, nomes[] }] (estaticos, re-export e import() dinamico). */
export function extrairImports(texto) {
  const out = [];
  for (const m of texto.matchAll(/import\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
    if (m[1]) continue;
    const nomes = [...m[2].matchAll(/\b([A-Za-z_$][\w$]*)\b(?!\s*as\b)/g)].map((x) => x[1])
      .filter((n) => !['type', 'as', 'default'].includes(n));
    out.push({ especificador: m[3], nomes });
  }
  for (const m of texto.matchAll(/(?:import|export)\s*(?:\*\s*from\s*)?['"]([^'"]+)['"]/g)) out.push({ especificador: m[1], nomes: [] });
  for (const m of texto.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push({ especificador: m[1], nomes: [] });
  for (const m of texto.matchAll(/export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g)) out.push({ especificador: m[1], nomes: [] });
  return out;
}

/**
 * Mapa nome -> valor dos `const NOME = 'literal'` de nivel de modulo. So resolve o caso comum de
 * identificador passado direto pra `.from`/`storage.from`/`rpc`/`invoke` sendo uma constante de
 * string do mesmo arquivo. Conta profundidade de chaves linha a linha porque um `const` dentro de
 * funcao tambem pode cair em coluna zero. Contagem ingenua de proposito: na duvida, nao resolve.
 */
function constantesDeString(texto) {
  const mapa = new Map();
  let profundidade = 0;
  for (const linha of texto.split('\n')) {
    if (profundidade === 0) {
      const m = linha.match(/^(?:export\s+)?const\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*[^=]+)?=\s*['"`]([A-Za-z0-9_.-]+)['"`]\s*[;,]?\s*$/);
      if (m) mapa.set(m[1], m[2]);
    }
    for (const ch of linha) {
      if (ch === '{') profundidade += 1;
      else if (ch === '}') profundidade -= 1;
    }
  }
  return mapa;
}

/**
 * Chamadas ao Supabase num texto: tabelas (`.from`, `/rest/v1/<tabela>`), buckets (`storage.from`),
 * RPCs (`.rpc`) e edges (`functions.invoke`, `/functions/v1/<edge>`).
 */
export function extrairChamadas(texto) {
  const pegar = (re) => [...texto.matchAll(re)].map((m) => m[1]);
  const consts = constantesDeString(texto);
  const tabelas = [];
  const buckets = [];
  for (const m of texto.matchAll(/(\bstorage\s*)?\.from\(\s*['"`]([A-Za-z0-9_-]+)['"`]/g)) (m[1] ? buckets : tabelas).push(m[2]);
  for (const m of texto.matchAll(/(\bstorage\s*)?\.from\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g)) {
    if (consts.has(m[2])) (m[1] ? buckets : tabelas).push(consts.get(m[2]));
  }
  tabelas.push(...pegar(/\/rest\/v1\/([A-Za-z0-9_]+)/g).filter((t) => t !== 'rpc'));
  return {
    tabelas,
    buckets,
    rpcs: [...pegar(/(?:\.|\b)rpc\(\s*['"`]([A-Za-z0-9_]+)['"`]/g), ...pegar(/\/rest\/v1\/rpc\/([A-Za-z0-9_]+)/g)],
    // `invoke('evolution-api/connect')` conta como a edge `evolution-api`.
    edges: [
      ...pegar(/(?:functions\s*\.\s*invoke|\binvokeEdge)(?:<[^>()]*>)?\(\s*['"`]([A-Za-z0-9_-]+)(?:\/[^'"`]*)?['"`]/g),
      ...pegar(/['"`][^'"`\n]*\/functions\/v1\/([A-Za-z0-9_-]+)/g),
    ],
  };
}

const ehTeste = (p) => /(\.test\.|\.spec\.|__tests__|\.stories\.)/.test(p);

/**
 * Fecho de imports a partir do arquivo da pagina. Segue sem limite a pasta da pagina e as
 * PASTAS_LIVRES; componente de src/components/ (fora de src/components/ui/) entra ate
 * MAX_SALTOS_COMPONENTE saltos. Import local que nao resolve vira problema.
 */
export const MAX_SALTOS_COMPONENTE = 2;
export function fechoDaPagina(raiz, arquivoPaginaAbs) {
  const pastaPagina = path.dirname(arquivoPaginaAbs);
  const dentro = (abs, r) => abs.startsWith(path.join(raiz, r) + path.sep);
  const livre = (abs) => abs.startsWith(pastaPagina + path.sep) || PASTAS_LIVRES.some((d) => dentro(abs, d));
  const componente = (abs) => dentro(abs, 'src/components') && !dentro(abs, 'src/components/ui');
  const saltosVistos = new Map();
  const hooks = new Map();
  const quebrados = new Set();
  const chamadas = { tabelas: [], buckets: [], rpcs: [], edges: [] };
  const fila = [[arquivoPaginaAbs, 0]];
  while (fila.length) {
    const [atual, saltos] = fila.shift();
    if (saltosVistos.has(atual) && saltosVistos.get(atual) <= saltos) continue;
    const primeiraVez = !saltosVistos.has(atual);
    saltosVistos.set(atual, saltos);
    const texto = fs.readFileSync(atual, 'utf8');
    if (primeiraVez) {
      const c = extrairChamadas(texto);
      for (const k of Object.keys(chamadas)) chamadas[k].push(...c[k]);
    }
    for (const imp of extrairImports(texto)) {
      const alvo = resolverImport(raiz, atual, imp.especificador);
      if (alvo === undefined && !/\.(css|scss|svg|png|jpe?g|webp|gif|json)(\?.*)?$|\?/.test(imp.especificador)) {
        quebrados.add(`${rel(raiz, atual)} -> ${imp.especificador}`);
      }
      if (!alvo || ehTeste(alvo)) continue;
      for (const nome of imp.nomes) if (/^use[A-Z]/.test(nome) && !hooks.has(nome)) hooks.set(nome, rel(raiz, alvo));
      if (livre(alvo)) fila.push([alvo, saltos]);
      else if (componente(alvo) && saltos < MAX_SALTOS_COMPONENTE) fila.push([alvo, saltos + 1]);
    }
  }
  return {
    arquivos_lidos: saltosVistos.size,
    hooks: [...hooks.entries()].map(([nome, arquivo]) => ({ nome, arquivo })).sort((a, b) => a.nome.localeCompare(b.nome)),
    buckets: unico(chamadas.buckets),
    edges: unico(chamadas.edges),
    rpcs: unico(chamadas.rpcs),
    tabelas: unico(chamadas.tabelas),
    imports_quebrados: [...quebrados].sort(),
  };
}

/** Componente -> arquivo, vindo de lazyPages.tsx e dos imports default do AppRoutes. */
export function lerPaginas(raiz) {
  const lazyAbs = path.join(raiz, FONTES.lazy);
  const lazyTexto = fs.readFileSync(lazyAbs, 'utf8');
  const mapa = {};
  for (const m of lazyTexto.matchAll(/export\s+const\s+(\w+)\s*=\s*lazy\w*\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]/g)) {
    if (!(m[1] in mapa)) mapa[m[1]] = { de: lazyAbs, especificador: m[2] };
  }
  const rotasAbs = path.join(raiz, FONTES.rotas);
  const rotasTexto = fs.readFileSync(rotasAbs, 'utf8');
  for (const m of rotasTexto.matchAll(/import\s+([A-Z]\w*)\s+from\s+['"]([^'"]+)['"]/g)) {
    if (!(m[1] in mapa)) mapa[m[1]] = { de: rotasAbs, especificador: m[2] };
  }
  return Object.fromEntries(Object.entries(mapa).map(([nome, { de, especificador }]) => {
    const alvo = resolverImport(raiz, de, especificador);
    return [nome, alvo ? rel(raiz, alvo) : null];
  }));
}

/** URLs declaradas no <Routes> do AppRoutes.tsx. */
export function lerUrls(raiz) {
  const texto = ler(raiz, FONTES.rotas);
  const paginas = lerPaginas(raiz);
  const inicio = texto.indexOf('<Routes>');
  const fim = texto.indexOf('</Routes>');
  if (inicio < 0 || fim < 0) throw new Error(`${FONTES.rotas}: nao achei o bloco <Routes>...</Routes>.`);
  const corpo = texto.slice(inicio, fim);
  return corpo.split(/<Route\b/).slice(1).map((pedaco) => {
    const caminho = (pedaco.match(/path=["']([^"']+)["']/) || [])[1];
    const redireciona = (pedaco.match(/<Navigate\s+to=["']([^"']+)["']/) || [])[1] ?? null;
    const componente = ((pedaco.match(/<P\.(\w+)/) || [])[1])
      ?? [...pedaco.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1]).find((n) => !WRAPPERS.has(n) && !/Skeleton$/.test(n))
      ?? null;
    const acesso = pedaco.includes('<Admin') ? 'admin'
      : pedaco.includes('<Protected') ? 'protegida'
        : pedaco.includes('<RequireAuth') ? 'autenticada' : 'publica';
    return {
      caminho,
      componente,
      arquivo: componente ? (paginas[componente] ?? null) : null,
      acesso,
      mfa_setup_liberado: /allowMfaSetup/.test(pedaco),
      skeleton: (pedaco.match(/fallback=\{<(\w+)/) || [])[1] ?? null,
      redireciona,
      parametros: (caminho?.match(/:(\w+)/g) || []).map((p) => p.slice(1)),
    };
  }).filter((u) => u.caminho).sort((a, b) => a.caminho.localeCompare(b.caminho));
}

/** Itens do menu lateral (AppSidebar.navSections): [{ secao, chave, rotulo, url }]. */
export function lerMenuSidebar(raiz) {
  const texto = ler(raiz, FONTES.sidebar);
  const inicio = texto.indexOf('const navSections');
  if (inicio < 0) throw new Error(`${FONTES.sidebar}: nao achei "const navSections".`);
  const corpo = texto.slice(inicio, texto.indexOf('\n];', inicio) + 1);
  const secoes = [...corpo.matchAll(/label:\s*["']([^"']+)["']\s*,\s*\n\s*key:\s*["']([^"']+)["']/g)]
    .map((m) => ({ secao: m[1], chave: m[2], pos: m.index }));
  const itens = [];
  for (const m of corpo.matchAll(/\{\s*title:\s*["']([^"']+)["']\s*,\s*url:\s*["']([^"']+)["']/g)) {
    const s = secoes.filter((x) => x.pos < m.index).pop();
    itens.push({ secao: s?.secao ?? null, chave: s?.chave ?? null, rotulo: m[1], url: m[2] });
  }
  return itens;
}

/** Itens da barra inferior mobile (MobileBottomNav): [{ rotulo, url }]. */
export function lerMenuMobile(raiz) {
  const texto = ler(raiz, FONTES.mobile);
  return [...texto.matchAll(/label:\s*["']([^"']+)["']\s*,\s*path:\s*["']([^"']+)["']/g)]
    .map((m) => ({ rotulo: m[1], url: m[2] }));
}

/**
 * Candidatos a pagina, para achar pagina que nenhuma rota usa: arquivos direto em src/pages/
 * (raiz) mais os que lazyPages.tsx declara em subpasta. Arquivo de subpasta que lazyPages nao
 * declara e subcomponente da pagina (ex.: src/pages/cadastro/EmpresaForm.tsx), nao pagina.
 */
export function listarPaginas(raiz) {
  const base = path.join(raiz, 'src/pages');
  if (!fs.existsSync(base)) return [];
  const valido = (nome) => /\.(tsx|ts)$/.test(nome) && !ehTeste(nome) && !/\.d\.ts$/.test(nome);
  const naRaiz = fs.readdirSync(base)
    .filter((nome) => valido(nome) && fs.statSync(path.join(base, nome)).isFile())
    .map((nome) => `src/pages/${nome}`);
  const declaradas = Object.values(lerPaginas(raiz)).filter((p) => p && p.startsWith('src/pages/'));
  return unico([...naRaiz, ...declaradas]);
}

/** Monta o inventario inteiro a partir de uma raiz de repo. */
export function gerarRotas(raiz = RAIZ_PADRAO) {
  const urls = lerUrls(raiz);
  const sidebar = lerMenuSidebar(raiz);
  const mobile = lerMenuMobile(raiz);
  const porUrl = new Map(urls.map((u) => [u.caminho, u]));

  const rotas = urls.map((u) => ({
    ...u,
    menu: [
      ...sidebar.filter((i) => i.url === u.caminho).map((i) => ({ onde: 'sidebar', secao: i.secao, rotulo: i.rotulo })),
      ...mobile.filter((i) => i.url === u.caminho).map((i) => ({ onde: 'mobile', secao: null, rotulo: i.rotulo })),
    ],
    ...(u.arquivo
      ? fechoDaPagina(raiz, path.join(raiz, u.arquivo))
      : { arquivos_lidos: 0, hooks: [], buckets: [], edges: [], rpcs: [], tabelas: [], imports_quebrados: [] }),
  }));

  const hooks = {};
  for (const r of rotas) for (const h of r.hooks) {
    hooks[h.nome] ??= { arquivo: h.arquivo, rotas: [] };
    hooks[h.nome].rotas.push(r.caminho);
  }

  const usadas = new Set(rotas.map((r) => r.arquivo).filter(Boolean));
  const vistos = new Set();
  const duplicadas = urls.map((u) => u.caminho).filter((c) => (vistos.has(c) ? true : (vistos.add(c), false)));

  const problemas = [
    ...[...sidebar.map((i) => ({ ...i, onde: 'sidebar' })), ...mobile.map((i) => ({ ...i, onde: 'mobile' }))]
      .filter((i) => !porUrl.has(i.url))
      .map((i) => ({ tipo: 'menu_sem_rota', id: i.url, detalhe: `"${i.rotulo}" (${i.onde}) aponta para uma URL sem <Route>: cai no NotFound` })),
    ...rotas.filter((r) => r.componente && !r.arquivo && !r.redireciona)
      .map((r) => ({ tipo: 'rota_sem_arquivo', id: r.caminho, detalhe: `${r.componente} nao resolve em ${FONTES.lazy} nem nos imports de ${FONTES.rotas}` })),
    ...unico(duplicadas).map((c) => ({ tipo: 'rota_duplicada', id: c, detalhe: 'mais de um <Route> com o mesmo path: vence o primeiro' })),
    ...listarPaginas(raiz).filter((p) => !usadas.has(p))
      .map((p) => ({ tipo: 'pagina_sem_rota', id: p, detalhe: 'arquivo em src/pages/ que nenhuma rota usa (candidato a codigo morto)' })),
    ...rotas.flatMap((r) => r.imports_quebrados.map((q) => ({ tipo: 'import_quebrado', id: r.caminho, detalhe: q }))),
  ];

  return {
    format_version: 1,
    fonte: `scripts/inventario/gerar-rotas.mjs (le ${FONTES.rotas}, ${FONTES.lazy}, ${FONTES.sidebar}, ${FONTES.mobile} e os imports de cada pagina)`,
    resumo: {
      urls: rotas.length,
      publicas: rotas.filter((r) => r.acesso === 'publica').length,
      autenticadas: rotas.filter((r) => r.acesso === 'autenticada').length,
      protegidas: rotas.filter((r) => r.acesso === 'protegida').length,
      admin: rotas.filter((r) => r.acesso === 'admin').length,
      itens_menu_sidebar: sidebar.length,
      itens_menu_mobile: mobile.length,
      hooks_distintos: Object.keys(hooks).length,
      problemas: problemas.length,
    },
    rotas,
    menu: { sidebar, mobile },
    hooks: Object.fromEntries(Object.keys(hooks).sort().map((k) => [k, { arquivo: hooks[k].arquivo, rotas: unico(hooks[k].rotas) }])),
    problemas,
  };
}

export const serializar = (inv) => `${JSON.stringify(inv, null, 2)}\n`;

function main(argv) {
  const saida = path.join(RAIZ_PADRAO, SAIDA_REL);
  const conteudo = serializar(gerarRotas(RAIZ_PADRAO));
  if (argv.includes('--check')) {
    const atual = fs.existsSync(saida) ? fs.readFileSync(saida, 'utf8') : '';
    if (atual !== conteudo) {
      console.error(`${SAIDA_REL} desatualizado: rode node scripts/inventario/gerar-rotas.mjs e commite o resultado.`);
      process.exit(1);
    }
    console.log(`${SAIDA_REL} em dia.`);
    return;
  }
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, conteudo);
  const r = JSON.parse(conteudo).resumo;
  console.log(`rotas.json: ${r.urls} rotas (${r.publicas} publicas, ${r.protegidas} protegidas, ${r.admin} admin), `
    + `${r.itens_menu_sidebar} itens de menu, ${r.hooks_distintos} hooks, ${r.problemas} problemas.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
