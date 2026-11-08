/**
 * Extracao das chamadas ao Supabase num texto TypeScript/JavaScript: tabelas, buckets, RPCs e
 * edge functions. Usado por gerar-rotas.mjs (front) e por gerar-edge-tabela.mjs (edge functions),
 * para que o front e as edges sejam medidos pela mesma regra.
 *
 * Limite conhecido e de proposito: e leitura estatica de texto, nao compilador. Nome de tabela em
 * variavel que nao seja constante de string do mesmo arquivo, concatenacao e SQL cru ficam de
 * fora. Na duvida, nao resolve — e melhor faltar do que apontar tabela errada.
 */

/**
 * Mapa nome -> valor dos `const NOME = 'literal'` de nivel de modulo. Conta profundidade de
 * chaves linha a linha porque um `const` dentro de funcao tambem pode cair em coluna zero quando
 * o arquivo nao passou por formatador. Contagem ingenua (nao ignora chave dentro de string ou
 * template) de proposito: erra para o lado de nao resolver.
 */
export function constantesDeString(texto) {
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
 * Chamadas ao Supabase num texto: tabelas (`.from`, `/rest/v1/<tabela>`), buckets
 * (`storage.from`), RPCs (`.rpc`) e edges (`functions.invoke`, `/functions/v1/<edge>`).
 * Devolve as listas cruas, com repeticao, na ordem em que aparecem.
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
