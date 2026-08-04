/**
 * Exporter universal multi-formato para o Intelligence Hub.
 * Suporta: csv | json | tsv | markdown.
 */
export type IntelExportFormat = 'csv' | 'json' | 'tsv' | 'markdown';

const MIME: Record<IntelExportFormat, string> = {
  csv: 'text/csv;charset=utf-8;',
  tsv: 'text/tab-separated-values;charset=utf-8;',
  json: 'application/json;charset=utf-8;',
  markdown: 'text/markdown;charset=utf-8;',
};

const EXT: Record<IntelExportFormat, string> = {
  csv: 'csv',
  tsv: 'tsv',
  json: 'json',
  markdown: 'md',
};

function collectHeaders<T extends Record<string, unknown>>(rows: T[]): string[] {
  const set = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => set.add(k)));
  return Array.from(set);
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function escapeDelimited(value: string, delimiter: string): string {
  const re = new RegExp(`[${delimiter === '\t' ? '\\t' : delimiter}"\\n\\r]`);
  if (re.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function buildDelimited<T extends Record<string, unknown>>(rows: T[], delimiter: string, bom = false): string {
  const headers = collectHeaders(rows);
  const lines = [
    headers.join(delimiter),
    ...rows.map((r) => headers.map((h) => escapeDelimited(toStr(r[h]), delimiter)).join(delimiter)),
  ];
  return (bom ? '\uFEFF' : '') + lines.join('\r\n');
}

function buildMarkdown<T extends Record<string, unknown>>(rows: T[]): string {
  const headers = collectHeaders(rows);
  if (headers.length === 0) return '';
  const escapeMd = (v: string) => v.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  const head = `| ${headers.map(escapeMd).join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${headers.map((h) => escapeMd(toStr(r[h]))).join(' | ')} |`);
  return [head, sep, ...body].join('\n');
}

export function intelExportUniversal<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  format: IntelExportFormat = 'csv',
): boolean {
  if (!rows.length) return false;
  let content: string;
  switch (format) {
    case 'csv':
      content = buildDelimited(rows, ',', true);
      break;
    case 'tsv':
      content = buildDelimited(rows, '\t', false);
      break;
    case 'json':
      content = JSON.stringify(rows, null, 2);
      break;
    case 'markdown':
      content = buildMarkdown(rows);
      break;
    default:
      return false;
  }

  const blob = new Blob([content], { type: MIME[format] });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ext = EXT[format];
  a.href = url;
  a.download = filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
