import { readFileSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

function statements(sql, kind) {
  const result = [];
  const edits = [];
  const conditions = [];
  const word = /[\p{L}_][\p{L}\p{N}_$]*/uy;
  const dollar = /\$(?:[\p{L}_][\p{L}\p{N}_]*)?\$/uy;
  let start = 0;
  let words = [];
  let hasContent = false;
  let hasNonWord = false;
  let contentStart = 0;
  let i = 0;
  const finish = end => {
    if (hasContent) result.push({ start, contentStart, end, words, hasNonWord });
    start = end;
    words = [];
    hasContent = false;
    hasNonWord = false;
  };
  while (i < sql.length) {
    if (/\s/.test(sql[i])) { i++; continue; }
    if (sql.startsWith('--', i)) {
      const end = sql.indexOf('\n', i + 2);
      i = end < 0 ? sql.length : end + 1;
      continue;
    }
    if (sql.startsWith('/*', i)) {
      let depth = 1;
      i += 2;
      while (i < sql.length && depth) {
        if (sql.startsWith('/*', i)) { depth++; i += 2; }
        else if (sql.startsWith('*/', i)) { depth--; i += 2; }
        else i++;
      }
      if (depth) throw new Error('comentário SQL não terminado');
      continue;
    }
    if (sql[i] === '\\') {
      const newline = sql.indexOf('\n', i);
      const end = newline < 0 ? sql.length : newline;
      const line = sql.slice(i, end).trimEnd();
      const command = /^\\(echo|set|gset|if|else|endif)\b(.*)$/.exec(line);
      if (kind !== 'fixture' || !command || /[\\`]/.test(command[2])) {
        throw new Error('metacomando psql não permitido no gate transacional');
      }
      const [, name, args] = command;
      if (name === 'set' && !/^\s+ON_ERROR_STOP\s+(on|1|true)\s*$/i.test(args)
        && !/^\s+test_\w+\s+'''[^'\r\n]*'''\s*$/.test(args)) {
        throw new Error('metacomando psql set não permitido no gate transacional');
      }
      if (name === 'gset') {
        const alias = /\bAS\s+(rls_\w+|fixture_\w+)\s*$/i.exec(sql.slice(start, i))?.[1];
        if (args.trim() || !alias) throw new Error('metacomando psql gset sem alias de fixture permitido');
        edits.push({ start: i, end, text: `\\gset rls_gate_\n\\set ${alias} :rls_gate_${alias}` });
        finish(i);
      }
      if (name === 'if') {
        if (!/^\s+:(rls_\w+|fixture_\w+)\s*$/.test(args)) throw new Error('condição psql não permitida');
        conditions.push(false);
      }
      if (name === 'else') {
        if (args.trim() || !conditions.length || conditions.at(-1)) throw new Error('else psql inesperado');
        conditions[conditions.length - 1] = true;
      }
      if (name === 'endif' && (args.trim() || !conditions.length)) throw new Error('endif psql inesperado');
      if (name === 'endif') conditions.pop();
      i = end;
      continue;
    }
    if (sql[i] === ';') { finish(++i); continue; }
    if (!hasContent) contentStart = i;
    hasContent = true;
    const quote = sql[i];
    if (quote === "'" || quote === '"') {
      hasNonWord = true;
      const escaped = quote === "'" && /[Ee]/.test(sql[i - 1] ?? '')
        && !/[\p{L}\p{N}_$]/u.test(sql[i - 2] ?? '');
      i++;
      let closed = false;
      while (i < sql.length) {
        if (escaped && sql[i] === '\\') { i += 2; continue; }
        if (sql[i] === quote) {
          if (sql[i + 1] === quote) { i += 2; continue; }
          i++; closed = true; break;
        }
        i++;
      }
      if (!closed) throw new Error('literal ou identificador SQL não terminado');
      continue;
    }
    dollar.lastIndex = i;
    const tag = dollar.exec(sql)?.[0];
    if (tag) {
      hasNonWord = true;
      const end = sql.indexOf(tag, i + tag.length);
      if (end < 0) throw new Error('bloco dollar-quoted não terminado');
      i = end + tag.length;
      continue;
    }
    word.lastIndex = i;
    const token = word.exec(sql)?.[0];
    if (token) {
      if (words.length < 3) words.push(token.toUpperCase());
      i += token.length;
    } else { hasNonWord = true; i++; }
  }
  finish(sql.length);
  if (conditions.length) throw new Error('condição psql não terminada');
  return { parts: result, edits };
}

function applyEdits(sql, edits) {
  let result = '';
  let offset = 0;
  for (const { start, end, text } of edits.sort((a, b) => a.start - b.start)) {
    result += sql.slice(offset, start) + text;
    offset = end;
  }
  return result + sql.slice(offset);
}

export function prepareSql(sql, kind) {
  if (!['fixture', 'migration'].includes(kind)) throw new Error('tipo de SQL inválido');
  const { parts, edits } = statements(sql, kind);
  const controls = parts.filter(({ words: [first, second] }) =>
    ['BEGIN', 'COMMIT', 'END', 'ROLLBACK', 'ABORT', 'SAVEPOINT', 'RELEASE'].includes(first)
    || (first === 'START' && second === 'TRANSACTION')
    || (first === 'PREPARE' && second === 'TRANSACTION'));
  if (!controls.length) return applyEdits(sql, edits);
  const opening = controls[0];
  const closing = controls.at(-1);
  const simple = ({ words, hasNonWord }) => !hasNonWord && (words.length === 1
    || (words.length === 2 && ['WORK', 'TRANSACTION'].includes(words[1])));
  const isBegin = (opening.words[0] === 'BEGIN' && simple(opening))
    || (!opening.hasNonWord && opening.words.join(' ') === 'START TRANSACTION');
  const allowedEnd = kind === 'migration' ? ['COMMIT', 'END'] : ['ROLLBACK', 'ABORT', 'COMMIT', 'END'];
  if (controls.length !== 2 || (kind === 'migration' && (opening !== parts[0] || closing !== parts.at(-1)))
    || !isBegin || !allowedEnd.includes(closing.words[0]) || !simple(closing)) {
    throw new Error('controle transacional inesperado: apenas um BEGIN/COMMIT externo pareado é permitido');
  }
  let closingStart = closing.contentStart;
  while (closingStart > opening.end && /[ \t\r]/.test(sql[closingStart - 1])) closingStart--;
  edits.push({ start: kind === 'migration' ? opening.start : opening.contentStart, end: opening.end, text: '' });
  edits.push({ start: closingStart, end: closing.end, text: '' });
  return applyEdits(sql, edits);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , kind, path] = process.argv;
  try {
    process.stdout.write(prepareSql(readFileSync(path, 'utf8'), kind));
  } catch (error) {
    process.stderr.write(`${path}: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
