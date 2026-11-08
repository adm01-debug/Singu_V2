const ALIAS = /^[A-Za-z_]\w*\s*:\s*/;
const CAST = /::\s*[A-Za-z_]\w*$/;
const SCALAR = /^(?:\*|[A-Za-z_]\w*)(?:\s*->>?\s*\w+)*$/;
const RELATION = /^(?:[A-Za-z_]\w*\s*:\s*)?([A-Za-z_]\w*)(?:\s*!\s*[A-Za-z_]\w*)*$/;

export function isAllowedSelectProjection(
  projection: string,
  canEmbedRelation: (table: string) => boolean,
): boolean {
  if (!projection.trim() || projection.length > 4096) return false;

  function validate(fields: string, level: number): boolean {
    if (level > 8) return false;
    const parts: string[] = [];
    let depth = 0;
    let start = 0;
    for (let index = 0; index < fields.length; index++) {
      if (fields[index] === '(') depth++;
      else if (fields[index] === ')') {
        if (--depth < 0) return false;
      } else if (fields[index] === ',' && depth === 0) {
        parts.push(fields.slice(start, index).trim());
        start = index + 1;
      }
    }
    if (depth !== 0) return false;
    parts.push(fields.slice(start).trim());

    for (const part of parts) {
      const opening = part.indexOf('(');
      if (opening < 0) {
        if (!SCALAR.test(part.replace(CAST, '').trim().replace(ALIAS, ''))) return false;
        continue;
      }
      if (!part.endsWith(')')) return false;
      const relation = RELATION.exec(part.slice(0, opening).trim());
      if (!relation || !canEmbedRelation(relation[1]) ||
        !validate(part.slice(opening + 1, -1), level + 1)) return false;
    }
    return true;
  }

  return validate(projection, 0);
}
