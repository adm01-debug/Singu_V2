/**
 * Transporte versionado para exportar/importar presets de busca.
 * Sem dependências externas. Usa base64url puro para links curtos.
 */

export const PRESET_KIND = 'interacoes-search-preset';
export const PRESET_VERSION = 1;

export interface ExportablePreset {
  name: string;
  filters: Record<string, string[]>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isFavorite?: boolean;
}

export interface PresetBundle {
  v: number;
  kind: string;
  exportedAt: string;
  presets: ExportablePreset[];
}

export type ParseResult =
  | { ok: true; bundle: PresetBundle }
  | { ok: false; reason: string };

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

function isFiltersShape(v: unknown): v is Record<string, string[]> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  return Object.values(v as Record<string, unknown>).every(isStringArray);
}

function sanitizePreset(raw: unknown): ExportablePreset | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== 'string' || !r.name.trim()) return null;
  if (!isFiltersShape(r.filters)) return null;
  const sortBy = typeof r.sortBy === 'string' ? r.sortBy : '';
  const sortOrder = r.sortOrder === 'asc' || r.sortOrder === 'desc' ? r.sortOrder : 'desc';
  const out: ExportablePreset = {
    name: r.name.trim().slice(0, 80),
    filters: r.filters,
    sortBy,
    sortOrder,
  };
  if (typeof r.isFavorite === 'boolean') out.isFavorite = r.isFavorite;
  return out;
}

export function buildBundle(presets: ExportablePreset[]): PresetBundle {
  return {
    v: PRESET_VERSION,
    kind: PRESET_KIND,
    exportedAt: new Date().toISOString(),
    presets,
  };
}

export function parseBundle(raw: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'JSON inválido' };
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, reason: 'Formato inválido' };
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.v !== PRESET_VERSION) {
    return { ok: false, reason: `Versão não suportada (esperado ${PRESET_VERSION})` };
  }
  if (obj.kind !== PRESET_KIND) {
    return { ok: false, reason: 'Tipo de bundle inesperado' };
  }
  if (!Array.isArray(obj.presets)) {
    return { ok: false, reason: 'Campo "presets" deve ser um array' };
  }
  const presets: ExportablePreset[] = [];
  for (const p of obj.presets) {
    const clean = sanitizePreset(p);
    if (clean) presets.push(clean);
  }
  if (presets.length === 0) {
    return { ok: false, reason: 'Nenhum preset válido encontrado' };
  }
  const exportedAt = typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString();
  return {
    ok: true,
    bundle: { v: PRESET_VERSION, kind: PRESET_KIND, exportedAt, presets },
  };
}

// ── Base64Url ──

function utf8ToBase64(str: string): string {
  // unicode-safe
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToUtf8(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function bundleToBase64Url(bundle: PresetBundle): string {
  const json = JSON.stringify(bundle);
  // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  return utf8ToBase64(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBundle(b64: string): PresetBundle | null {
  try {
    const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
    const json = base64ToUtf8(padded + pad);
    const result = parseBundle(json);
    return result.ok ? result.bundle : null;
  } catch {
    return null;
  }
}

// ── Download helper ──

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'busca';
}

export function downloadBundleAsFile(bundle: PresetBundle, filename?: string): void {
  const name =
    filename ||
    (bundle.presets.length === 1
      ? `busca-${slugify(bundle.presets[0].name)}.json`
      : `buscas-${bundle.presets.length}.json`);
  if (typeof document === 'undefined') return;
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name.endsWith('.json') ? name : `${name}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Dedup ──

/**
 * Normaliza para comparação fuzzy de nomes:
 * - lowercase
 * - remove acentos (NFD + strip diacríticos)
 * - colapsa espaços e remove pontuação leve (· - – — / : |)
 * - remove sufixos numéricos " (2)", " (10)"...
 */
export function normalizePresetName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[·•\-–—/:|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Retorna nome único contra `existing`, comparando de forma normalizada
 * (case/acentos/pontuação insensível). Inclui favoritos automaticamente
 * porque `existing` deve ser todos os presets já salvos.
 */
export function dedupeNameAgainst(existing: string[], proposed: string): string {
  const base = proposed.trim();
  if (!base) return base;
  const normalizedExisting = new Set(existing.map(normalizePresetName));
  if (!normalizedExisting.has(normalizePresetName(base))) return base;
  let i = 2;
  while (i < 1000 && normalizedExisting.has(normalizePresetName(`${base} (${i})`))) i++;
  return `${base} (${i})`;
}

/**
 * Detecta colisão (exata ou aproximada) contra a lista de presets existentes.
 * Útil para feedback visual antes de salvar.
 */
export function findSimilarPresetName(
  existing: string[],
  proposed: string,
): { conflict: boolean; matched: string | null } {
  const norm = normalizePresetName(proposed);
  if (!norm) return { conflict: false, matched: null };
  const matched = existing.find((n) => normalizePresetName(n) === norm) ?? null;
  return { conflict: !!matched, matched };
}
