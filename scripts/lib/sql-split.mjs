// Divisor de SQL (dialeto PostgreSQL) + transformações de idempotência, usados por toda a família
// scripts/apply-*.js, chunk-apply.js, fix-enums.js e retry-failed.js.
//
// O divisor segue as regras léxicas do Postgres/psql: um `;` só encerra a instrução fora de
//   - strings '...' (aspas dobradas '' não fecham) e E'...' (barra invertida escapa);
//   - identificadores "..." ("" não fecha);
//   - dollar-quoting $$...$$ e $tag$...$tag$ (tag sensível a maiúsculas; `a$b$` é identificador, `$1` é parâmetro);
//   - comentários `--` até o fim da linha e `/* ... */` ANINHADOS;
//   - parênteses abertos (ex.: CREATE RULE ... DO (a; b));
//   - corpo BEGIN ATOMIC ... END de CREATE FUNCTION/PROCEDURE (mesma heurística do psql).
// SQL truncado (string, dollar-quote ou comentário sem fim) lança ErroSqlMalformado: é mais seguro
// não enviar nada do que enviar meia instrução para produção.

export class ErroSqlMalformado extends Error {
  constructor(oQue, linha) {
    super(`SQL malformado: ${oQue} sem fechamento (aberto na linha ${linha})`);
    this.name = 'ErroSqlMalformado';
    this.linha = linha;
  }
}

const INICIO_IDENT = /[A-Za-z_\u0080-\uffff]/;
const RESTO_IDENT = /[A-Za-z0-9_$\u0080-\uffff]/;
const TAG_DOLAR = /\$(?:[A-Za-z_\u0080-\uffff][A-Za-z0-9_\u0080-\uffff]*)?\$/y;

/**
 * Divide `sql` em instruções. Cada item traz o texto sem o `;` final, sem comentários antes/depois
 * (os do meio ficam) e a linha (base 1) onde a instrução começa — útil para relatar falhas.
 * @param {string} sql
 * @returns {{ sql: string, linha: number }[]}
 */
export function dividirSql(sql) {
  if (typeof sql !== 'string') throw new TypeError('dividirSql espera uma string');
  const n = sql.length;
  const saida = [];
  let i = sql.charCodeAt(0) === 0xfeff ? 1 : 0; // ignora BOM
  let linha = 1;
  let inicio = -1; // offset do 1º token significativo da instrução corrente
  let fim = -1; // offset logo após o último token significativo
  let linhaInicio = 1;
  let parenteses = 0;
  let blocos = 0; // profundidade de BEGIN ... END (só em CREATE FUNCTION/PROCEDURE)
  let palavras = []; // primeiras palavras da instrução (para a heurística do psql)

  const contarLinhas = (de, ate) => {
    for (let k = de; k < ate; k++) if (sql.charCodeAt(k) === 10) linha++;
  };
  const marcar = (de, ate) => {
    if (inicio < 0) { inicio = de; linhaInicio = linha; }
    contarLinhas(de, ate);
    fim = ate;
  };
  const fechar = () => {
    if (inicio >= 0) saida.push({ sql: sql.slice(inicio, fim), linha: linhaInicio });
    inicio = -1; fim = -1; parenteses = 0; blocos = 0; palavras = [];
  };
  // Devolve o offset logo após a aspa que fecha a string/identificador aberto em `de`.
  const fimDeAspas = (de, aspa, comEscape, oQue) => {
    let k = de + 1;
    while (k < n) {
      const c = sql[k];
      if (comEscape && c === '\\') { k += 2; continue; }
      if (c === aspa) {
        if (sql[k + 1] === aspa) { k += 2; continue; }
        return k + 1;
      }
      k++;
    }
    throw new ErroSqlMalformado(oQue, linha);
  };

  while (i < n) {
    const c = sql[i];
    const prox = sql[i + 1];

    if (c === '-' && prox === '-') { // comentário de linha
      let k = sql.indexOf('\n', i);
      if (k < 0) k = n;
      i = k;
      continue;
    }
    if (c === '/' && prox === '*') { // comentário de bloco (aninha)
      const linhaAbertura = linha;
      let prof = 1;
      let k = i + 2;
      while (k < n && prof > 0) {
        if (sql[k] === '/' && sql[k + 1] === '*') { prof++; k += 2; }
        else if (sql[k] === '*' && sql[k + 1] === '/') { prof--; k += 2; }
        else k++;
      }
      if (prof > 0) throw new ErroSqlMalformado('comentário /* */', linhaAbertura);
      contarLinhas(i, k);
      i = k;
      continue;
    }
    if (c === "'") { const k = fimDeAspas(i, "'", false, "string '...'"); marcar(i, k); i = k; continue; }
    if (c === '"') { const k = fimDeAspas(i, '"', false, 'identificador "..."'); marcar(i, k); i = k; continue; }
    if (c === '$') {
      TAG_DOLAR.lastIndex = i;
      const m = TAG_DOLAR.exec(sql);
      if (m) {
        const fecha = sql.indexOf(m[0], i + m[0].length);
        if (fecha < 0) throw new ErroSqlMalformado(`dollar-quote ${m[0]}`, linha);
        const k = fecha + m[0].length;
        marcar(i, k); i = k;
        continue;
      }
      marcar(i, i + 1); i++; // $1, $2... (parâmetro) ou cifrão solto
      continue;
    }
    if (INICIO_IDENT.test(c)) {
      let k = i + 1;
      while (k < n && RESTO_IDENT.test(sql[k])) k++;
      const palavra = sql.slice(i, k).toLowerCase();
      if (k - i === 1 && palavra === 'e' && sql[k] === "'") { // E'...' com escapes de barra invertida
        const f = fimDeAspas(k, "'", true, "string E'...'");
        marcar(i, f); i = f;
        continue;
      }
      if (palavras.length < 4) palavras.push(palavra);
      const ehRotina = palavras[0] === 'create' && (palavras[1] === 'function' || palavras[1] === 'procedure'
        || (palavras[1] === 'or' && palavras[2] === 'replace' && (palavras[3] === 'function' || palavras[3] === 'procedure')));
      if (ehRotina && parenteses === 0) {
        if (palavra === 'begin') blocos++;
        else if (palavra === 'case' && blocos > 0) blocos++;
        else if (palavra === 'end' && blocos > 0) blocos--;
      }
      marcar(i, k); i = k;
      continue;
    }
    if (c === ';' && parenteses === 0 && blocos === 0) { fechar(); i++; continue; }
    if (c === '(') parenteses++;
    else if (c === ')' && parenteses > 0) parenteses--;
    if (c === '\n') linha++;
    else if (c !== ' ' && c !== '\t' && c !== '\r' && c !== '\f' && c !== '\v') marcar(i, i + 1);
    i++;
  }
  fechar();
  return saida;
}

/** Atalho: só os textos das instruções. */
export const dividirInstrucoes = (sql) => dividirSql(sql).map((s) => s.sql);

/** Junta instruções num único corpo de requisição (cada uma terminada em `;`). */
export const juntarInstrucoes = (lista) => lista.map((s) => `${typeof s === 'string' ? s : s.sql};`).join('\n');

// ── idempotência ──────────────────────────────────────────────────────────────

const NOME = String.raw`(?:"(?:[^"]|"")+"|[A-Za-z_][\w$]*)`;
const NOME_QUALIFICADO = `${NOME}(?:\\s*\\.\\s*${NOME})?`;
const RE_TABELA = new RegExp(String.raw`^(CREATE\s+(?:UNLOGGED\s+)?TABLE)\s+(?!IF\s+NOT\s+EXISTS\b)(${NOME_QUALIFICADO})`, 'i');
const RE_INDICE = new RegExp(String.raw`^(CREATE\s+(?:UNIQUE\s+)?INDEX)\s+(?:CONCURRENTLY\s+)?(?:IF\s+NOT\s+EXISTS\s+)?(${NOME})\s+ON\b`, 'i');
const RE_PRECISA_GUARDA = /^(?:CREATE\s+TYPE\b|CREATE\s+POLICY\b|CREATE\s+(?:CONSTRAINT\s+)?TRIGGER\b|CREATE\s+DOMAIN\b|ALTER\s+TABLE\s[\s\S]*?\bADD\s+CONSTRAINT\b)/i;

/** Escolhe uma tag de dollar-quote que não aparece no texto. */
export function tagLivre(texto, base = 'idem') {
  let tag = `$${base}$`;
  for (let k = 1; texto.includes(tag); k++) tag = `$${base}${k}$`;
  return tag;
}

/** Envolve a instrução num DO que ignora "já existe" (duplicate_object/duplicate_table). */
export function comGuardaDeDuplicado(instrucao) {
  const tag = tagLivre(instrucao);
  return `DO ${tag} BEGIN\n${instrucao};\nEXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;\nEND ${tag}`;
}

/**
 * Torna UMA instrução DDL reexecutável sem mudar o que ela cria:
 *  - CREATE TABLE → CREATE TABLE IF NOT EXISTS (vale também para PARTITION BY / PARTITION OF);
 *  - CREATE [UNIQUE] INDEX [CONCURRENTLY] → ... IF NOT EXISTS, e SEM CONCURRENTLY, porque a Management API
 *    roda cada POST em transação implícita e CONCURRENTLY falha em lote (25001);
 *  - CREATE TYPE / DOMAIN / POLICY / TRIGGER e ALTER TABLE ... ADD CONSTRAINT → bloco DO que ignora
 *    duplicate_object (o Postgres não tem IF NOT EXISTS para eles);
 *  - o resto (CREATE OR REPLACE, GRANT, ENABLE ROW LEVEL SECURITY, IF NOT EXISTS, COMMENT) já é idempotente.
 * @param {string} instrucao texto sem o `;` final (como devolvido por dividirSql)
 */
export function tornarIdempotente(instrucao) {
  if (RE_TABELA.test(instrucao)) return instrucao.replace(RE_TABELA, '$1 IF NOT EXISTS $2');
  const mi = RE_INDICE.exec(instrucao);
  if (mi) return `${mi[1]} IF NOT EXISTS ${mi[2]} ON${instrucao.slice(mi[0].length)}`;
  if (RE_PRECISA_GUARDA.test(instrucao)) return comGuardaDeDuplicado(instrucao);
  return instrucao;
}

const semAspas = (id) => (id.startsWith('"') ? id.slice(1, -1).replace(/""/g, '"') : id.toLowerCase());
const RE_TABELA_CRIADA = new RegExp(String.raw`^CREATE\s+(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(${NOME})(?:\s*\.\s*(${NOME}))?`, 'i');

/**
 * Se a instrução for CREATE TABLE, devolve { esquema, nome } como o Postgres os guarda (sem aspas;
 * minúsculos quando não citados; esquema null se não qualificado). Caso contrário, null.
 */
export function tabelaCriada(instrucao) {
  const m = RE_TABELA_CRIADA.exec(instrucao);
  if (!m) return null;
  return m[2] ? { esquema: semAspas(m[1]), nome: semAspas(m[2]) } : { esquema: null, nome: semAspas(m[1]) };
}

/** Monta um CREATE TYPE ... AS ENUM idempotente, com identificador e rótulos devidamente citados. */
export function sqlCriarEnum(nome, valores) {
  if (!/^[a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)?$/.test(nome)) throw new Error(`nome de enum inválido: ${nome}`);
  if (!Array.isArray(valores) || valores.length === 0) throw new Error(`enum ${nome} sem valores`);
  const rotulos = valores.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(', ');
  return comGuardaDeDuplicado(`CREATE TYPE ${nome} AS ENUM (${rotulos})`);
}
