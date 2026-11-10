// Testes de scripts/inventario/gerar-rotas.mjs sobre um repo sintetico em diretorio temporario.
// Rodar: node --test scripts/inventario/gerar-rotas.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  extrairChamadas, resolverImport, lerUrls, lerMenuSidebar, lerMenuMobile,
  lerPaginas, listarPaginas, gerarRotas, serializar,
} from './gerar-rotas.mjs';

/** Monta um repo minimo com AppRoutes/lazyPages/AppSidebar/MobileBottomNav e duas paginas. */
function repoFalso() {
  const raiz = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-rotas-'));
  const escrever = (rel, texto) => {
    fs.mkdirSync(path.join(raiz, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(raiz, rel), texto);
  };

  escrever('src/app/lazyPages.tsx', `import { lazy } from 'react';
export const Contatos = lazy(() => import("@/pages/Contatos"));
export const Orfa = lazy(() => import("@/pages/sub/Orfa"));
export const Fantasma = lazy(() => import("@/pages/NaoExiste"));
`);

  escrever('src/app/AppRoutes.tsx', `import Index from '@/pages/Index';
import * as P from './lazyPages';
export const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<LazyPage><P.Auth /></LazyPage>} />
    <Route path="/" element={<Protected><Index /></Protected>} />
    <Route path="/contatos" element={<Protected fallback={<ContactsPageSkeleton />}><P.Contatos /></Protected>} />
    <Route path="/contatos/:id" element={<Protected><P.Contatos /></Protected>} />
    <Route path="/admin" element={<Admin><P.Contatos /></Admin>} />
    <Route path="/seguranca" element={<Protected allowMfaSetup><P.Contatos /></Protected>} />
    <Route path="/whatsapp" element={<RequireAuth><Navigate to="/contatos" replace /></RequireAuth>} />
    <Route path="/contatos" element={<Protected><P.Contatos /></Protected>} />
  </Routes>
);
`);

  escrever('src/components/layout/AppSidebar.tsx', `const navSections = [
  {
    label: "Principal",
    key: "principal",
    items: [
      { title: "Dashboard", url: "/", icon: X },
      { title: "Contatos", url: "/contatos", icon: X },
    ],
  },
  {
    label: "Config",
    key: "config",
    items: [
      { title: "Sumida", url: "/sumida", icon: X },
    ],
  },
];
`);

  escrever('src/components/layout/MobileBottomNav.tsx', `const items = [
  { icon: Home, label: 'Início', path: '/' },
  { icon: Users, label: 'Contatos', path: '/contatos' },
];
`);

  escrever('src/pages/Index.tsx', "import { useAuth } from '@/hooks/useAuth';\nexport default function Index() { return null; }\n");
  escrever('src/pages/Contatos.tsx', `import { useContatos } from '@/hooks/useContatos';
import { quebrado } from '@/hooks/NaoExiste';
export default function Contatos() { return null; }
`);
  escrever('src/pages/sub/Orfa.tsx', 'export default function Orfa() { return null; }\n');
  escrever('src/pages/sub/Auxiliar.tsx', 'export default function Auxiliar() { return null; }\n');
  escrever('src/hooks/useAuth.ts', "export const useAuth = () => supabase.from('profiles');\n");
  escrever('src/hooks/useContatos.ts', `const BUCKET = 'avatares';
export const useContatos = async () => {
  await supabase.from('contacts').select('*');
  await supabase.storage.from(BUCKET).list();
  await supabase.rpc('search_contacts');
  await supabase.functions.invoke('ask-crm/stream');
  await fetch(\`\${URL}/functions/v1/enriquecer\`);
  await fetch(\`\${URL}/rest/v1/companies\`);
};
`);
  return raiz;
}

test('extrairChamadas separa tabela, bucket, rpc e edge (inclusive por constante e por URL)', () => {
  const c = extrairChamadas(`const BUCKET = 'anexos';
supabase.from('contacts'); supabase.storage.from(BUCKET);
supabase.rpc('has_role'); supabase.functions.invoke('ask-crm/stream');
fetch(\`\${U}/functions/v1/enriquecer\`); fetch(\`\${U}/rest/v1/companies\`);
`);
  assert.deepEqual([...new Set(c.tabelas)].sort(), ['companies', 'contacts']);
  assert.deepEqual(c.buckets, ['anexos']);
  assert.deepEqual(c.rpcs, ['has_role']);
  assert.deepEqual([...new Set(c.edges)].sort(), ['ask-crm', 'enriquecer']);
});

test('extrairChamadas nao resolve const declarada dentro de funcao', () => {
  const c = extrairChamadas("function f() {\n  const T = 'segredo';\n  supabase.from(T);\n}\n");
  assert.deepEqual(c.tabelas, []);
});

test('resolverImport: null para externo, caminho para alias @/ e undefined para local quebrado', () => {
  const raiz = repoFalso();
  const de = path.join(raiz, 'src/pages/Contatos.tsx');
  assert.equal(resolverImport(raiz, de, 'react'), null);
  assert.equal(resolverImport(raiz, de, '@/hooks/useContatos'), path.join(raiz, 'src/hooks/useContatos.ts'));
  assert.equal(resolverImport(raiz, de, '@/hooks/NaoExiste'), undefined);
});

test('lerUrls le path, componente, arquivo, acesso, parametro, skeleton e redirect', () => {
  const raiz = repoFalso();
  const urls = lerUrls(raiz);
  const porCaminho = (c) => urls.find((u) => u.caminho === c);

  assert.equal(porCaminho('/auth').acesso, 'publica');
  assert.equal(porCaminho('/').acesso, 'protegida');
  assert.equal(porCaminho('/').arquivo, 'src/pages/Index.tsx', 'import default do AppRoutes conta como pagina');
  assert.equal(porCaminho('/admin').acesso, 'admin');
  assert.equal(porCaminho('/whatsapp').acesso, 'autenticada');
  assert.equal(porCaminho('/whatsapp').redireciona, '/contatos');
  assert.equal(porCaminho('/seguranca').mfa_setup_liberado, true);
  assert.equal(porCaminho('/contatos').skeleton, 'ContactsPageSkeleton', 'skeleton nao e confundido com a pagina');
  assert.equal(porCaminho('/contatos').componente, 'Contatos');
  assert.deepEqual(porCaminho('/contatos/:id').parametros, ['id']);
});

test('lerMenuSidebar casa cada item com a sua secao; lerMenuMobile le label/path', () => {
  const raiz = repoFalso();
  assert.deepEqual(lerMenuSidebar(raiz), [
    { secao: 'Principal', chave: 'principal', rotulo: 'Dashboard', url: '/' },
    { secao: 'Principal', chave: 'principal', rotulo: 'Contatos', url: '/contatos' },
    { secao: 'Config', chave: 'config', rotulo: 'Sumida', url: '/sumida' },
  ]);
  assert.deepEqual(lerMenuMobile(raiz), [
    { rotulo: 'Início', url: '/' },
    { rotulo: 'Contatos', url: '/contatos' },
  ]);
});

test('listarPaginas pega a raiz de src/pages e o que lazyPages declara, nao subcomponente', () => {
  const raiz = repoFalso();
  const paginas = listarPaginas(raiz);
  assert.ok(paginas.includes('src/pages/Index.tsx'));
  assert.ok(paginas.includes('src/pages/sub/Orfa.tsx'), 'pagina lazy em subpasta conta');
  assert.ok(!paginas.includes('src/pages/sub/Auxiliar.tsx'), 'subcomponente nao conta como pagina');
  assert.equal(lerPaginas(raiz).Fantasma, null, 'lazy apontando para arquivo inexistente fica sem arquivo');
});

test('gerarRotas aponta os cinco tipos de problema e junta o fecho de imports', () => {
  const raiz = repoFalso();
  const inv = gerarRotas(raiz);
  const tipos = (t) => inv.problemas.filter((p) => p.tipo === t).map((p) => p.id);

  assert.deepEqual(tipos('menu_sem_rota'), ['/sumida']);
  assert.deepEqual(tipos('rota_duplicada'), ['/contatos']);
  assert.deepEqual(tipos('pagina_sem_rota'), ['src/pages/sub/Orfa.tsx']);
  assert.deepEqual(tipos('rota_sem_arquivo'), ['/auth'], 'P.Auth nao existe em lazyPages');
  assert.equal(tipos('import_quebrado').length > 0, true);

  const contatos = inv.rotas.find((r) => r.caminho === '/contatos');
  assert.deepEqual(contatos.tabelas, ['companies', 'contacts']);
  assert.deepEqual(contatos.buckets, ['avatares']);
  assert.deepEqual(contatos.edges, ['ask-crm', 'enriquecer']);
  assert.deepEqual(contatos.rpcs, ['search_contacts']);
  assert.deepEqual(contatos.menu, [
    { onde: 'sidebar', secao: 'Principal', rotulo: 'Contatos' },
    { onde: 'mobile', secao: null, rotulo: 'Contatos' },
  ]);
  assert.deepEqual(inv.hooks.useContatos.rotas.sort(), ['/admin', '/contatos', '/contatos/:id', '/seguranca']);
  assert.equal(inv.resumo.urls, 8);
  assert.equal(inv.resumo.admin, 1);
});

test('a saida e deterministica e termina em uma quebra de linha', () => {
  const raiz = repoFalso();
  const a = serializar(gerarRotas(raiz));
  const b = serializar(gerarRotas(raiz));
  assert.equal(a, b);
  assert.ok(a.endsWith('\n'));
  assert.ok(!/\d{4}-\d{2}-\d{2}T/.test(a), 'sem carimbo de data: o diff semanal nao pode ser ruido');
});
