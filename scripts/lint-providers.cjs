#!/usr/bin/env node

/**
 * Script de lint para validar a ordem dos providers em App.tsx.
 * Uso: node scripts/lint-providers.cjs [arquivo.tsx] [--root <raiz-do-repo>]
 *
 * Verifica que providers críticos aparecem DENTRO dos providers de que dependem (ancestral real
 * no JSX, não só "aparece antes no texto"). Começa em src/App.tsx e segue os componentes
 * importados que renderizam os providers (hoje a árvore mora em src/app/AppProviders.tsx).
 * Com [arquivo.tsx], valida só a árvore que começa nesse arquivo.
 *
 * Exit: 0 = ordem correta · 1 = ordem inválida, arquivo ausente ou nenhum provider crítico
 * encontrado (lint que não acha o que verificar não pode aprovar) · 2 = uso inválido.
 * As dependências abaixo espelham PROVIDER_ORDER de src/lib/providerGuard.ts.
 */

const fs = require('fs');
const path = require('path');

const DEPENDENCIES = {
  AuthProvider: ['BrowserRouter', 'QueryClientProvider'],
  NavigationStackProvider: ['BrowserRouter', 'AuthProvider'],
  EasterEggsProvider: ['AuthProvider'],
};
// Sem estes na árvore o lint não estaria verificando nada.
const OBRIGATORIOS = ['AuthProvider', 'NavigationStackProvider'];
const MAX_PROFUNDIDADE = 4;

/** Troca comentários por espaços (mantém as quebras de linha) sem mexer em strings. */
function semComentarios(codigo) {
  let saida = '';
  for (let i = 0; i < codigo.length; i++) {
    const c = codigo[i];
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < codigo.length && codigo[j] !== c && !(c !== '`' && codigo[j] === '\n')) j += codigo[j] === '\\' ? 2 : 1;
      saida += codigo.slice(i, j + 1);
      i = j;
    } else if (c === '/' && codigo[i + 1] === '/' && codigo[i - 1] !== ':' && codigo[i - 1] !== '\\') {
      const fim = codigo.indexOf('\n', i);
      i = (fim === -1 ? codigo.length : fim) - 1;
    } else if (c === '/' && codigo[i + 1] === '*') {
      const fim = codigo.indexOf('*/', i + 2);
      const trecho = codigo.slice(i, fim === -1 ? codigo.length : fim + 2);
      saida += trecho.replace(/[^\n]/g, ' ');
      i += trecho.length - 1;
    } else saida += c;
  }
  return saida;
}

/** Índice do `>` que fecha a tag aberta em `i` (pula `{...}` e strings dos atributos); -1 se não fechar. */
function fimDaTag(codigo, i) {
  let chaves = 0;
  for (; i < codigo.length; i++) {
    const c = codigo[i];
    if (c === '"' || c === "'" || c === '`') {
      const fim = codigo.indexOf(c, i + 1);
      if (fim === -1) return -1;
      i = fim;
    } else if (c === '{') chaves++;
    else if (c === '}') chaves--;
    else if (c === '>' && chaves === 0 && codigo[i - 1] !== '=') return i;
  }
  return -1;
}

/** Componentes importados de caminho local: { Nome: 'caminho' } (imports estáticos e lazy(() => import())). */
function importsLocais(codigo) {
  const mapa = {};
  for (const m of codigo.matchAll(/import\s+(?:type\s+)?([^;'"]*?)\s+from\s+['"]((?:\.{1,2}|@)\/[^'"]+)['"]/g)) {
    const [, nomes, origem] = m;
    const padrao = /^([A-Za-z_$][\w$]*)/.exec(nomes.trim());
    if (padrao && !nomes.trim().startsWith('{')) mapa[padrao[1]] = origem;
    const chaves = /\{([^}]*)\}/.exec(nomes);
    if (chaves) {
      for (const parte of chaves[1].split(',')) {
        const nome = parte.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop();
        if (nome) mapa[nome] = origem;
      }
    }
  }
  for (const m of codigo.matchAll(/(?:const|let|var)\s+([A-Z][\w$]*)\s*=\s*(?:React\.)?lazy\s*\([\s\S]{0,80}?\bimport\s*\(\s*['"]((?:\.{1,2}|@)\/[^'"]+)['"]/g)) {
    mapa[m[1]] = m[2];
  }
  return mapa;
}

function resolver(origem, arquivoAtual, raiz) {
  const base = origem.startsWith('@/') ? path.join(raiz, 'src', origem.slice(2)) : path.resolve(path.dirname(arquivoAtual), origem);
  for (const sufixo of ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts']) {
    const candidato = base + sufixo;
    if (fs.existsSync(candidato) && fs.statSync(candidato).isFile()) return candidato;
  }
  return null;
}

const RE_DEPENDENTE = new RegExp(`<(?:${Object.keys(DEPENDENCIES).join('|')})\\b`);

/**
 * Percorre o JSX de `arquivo` mantendo a pilha de componentes abertos. `externos` são os
 * ancestrais herdados de quem renderiza este arquivo. Devolve { erros, encontrados }.
 */
function analisar(arquivo, raiz, externos = [], estado = { erros: [], encontrados: new Set(), visitados: new Set() }, nivel = 0) {
  const chave = `${arquivo}|${externos.join('>')}`;
  if (estado.visitados.has(chave) || nivel > MAX_PROFUNDIDADE) return estado;
  estado.visitados.add(chave);
  const codigo = semComentarios(fs.readFileSync(arquivo, 'utf8'));
  const imports = importsLocais(codigo);
  const pilha = [];
  const rel = path.relative(raiz, arquivo) || arquivo;

  for (const m of codigo.matchAll(/<(\/?)([A-Z][\w$]*(?:\.[A-Za-z_$][\w$]*)*)(?![\w$])/g)) {
    const [, fecha, nome] = m;
    if (fecha) {
      const i = pilha.lastIndexOf(nome);
      if (i !== -1) pilha.length = i;
      continue;
    }
    const fim = fimDaTag(codigo, m.index + m[0].length);
    if (fim === -1) continue;
    const autoFecha = codigo[fim - 1] === '/';
    const ancestrais = [...externos, ...pilha];

    if (DEPENDENCIES[nome]) {
      estado.encontrados.add(nome);
      const linha = codigo.slice(0, m.index).split('\n').length;
      for (const dep of DEPENDENCIES[nome]) {
        if (!ancestrais.includes(dep)) {
          estado.erros.push(`❌ ${nome} requer ${dep} como provider pai, mas ${dep} não envolve ${nome} (${rel}:${linha}).`);
        }
      }
    } else if (imports[nome]) {
      // Componente local que renderiza algum provider crítico: a árvore continua dentro dele.
      const alvo = resolver(imports[nome], arquivo, raiz);
      if (alvo && RE_DEPENDENTE.test(semComentarios(fs.readFileSync(alvo, 'utf8')))) {
        analisar(alvo, raiz, [...ancestrais, nome], estado, nivel + 1);
      }
    }
    if (!autoFecha) pilha.push(nome);
  }
  return estado;
}

function main(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Uso: node scripts/lint-providers.cjs [arquivo.tsx] [--root <raiz-do-repo>]\n'
      + 'Falha (exit 1) se AuthProvider/NavigationStackProvider/EasterEggsProvider não estiverem dentro dos providers de que dependem.');
    return 0;
  }
  const iRoot = argv.indexOf('--root');
  if (iRoot !== -1 && !argv[iRoot + 1]) {
    console.error('❌ --root exige um diretório');
    return 2;
  }
  const raiz = path.resolve(iRoot !== -1 ? argv[iRoot + 1] : path.join(__dirname, '..'));
  const posicionais = argv.filter((a, i) => !a.startsWith('--') && i !== iRoot + 1);
  const entrada = posicionais[0] ? path.resolve(posicionais[0]) : path.join(raiz, 'src', 'App.tsx');

  if (!fs.existsSync(entrada)) {
    console.error('❌ App.tsx não encontrado em', entrada);
    return 1;
  }

  const { erros, encontrados } = analisar(entrada, raiz);
  for (const nome of OBRIGATORIOS) {
    if (!encontrados.has(nome)) {
      erros.push(`❌ ${nome} não foi encontrado a partir de ${path.relative(raiz, entrada) || entrada}: o lint não teria o que verificar.`);
    }
  }

  if (erros.length) {
    for (const e of erros) console.error(e);
    console.error('\n🚨 Ordem de providers inválida em App.tsx!');
    return 1;
  }

  console.log(`✅ Ordem de providers em App.tsx está correta. (${[...encontrados].sort().join(', ')})`);
  return 0;
}

if (require.main === module) process.exit(main(process.argv.slice(2)));

module.exports = { DEPENDENCIES, analisar, semComentarios, importsLocais, main };
