const TENANT_ID_KEYS = new Set([
  'user_id',
  'userid',
  'userId',
  'p_user_id',
  'created_by',
  'owner_id',
]);

type TenantContainer = Record<string, unknown> | unknown[];

export interface RelationScope {
  foreignKey: 'contact_id' | 'company_id';
  parentTable: 'contacts' | 'companies';
}

export const MAX_QUERY_FILTERS = 20;

const RELATION_SCOPES = new Map<string, RelationScope>([
  ['contact_phones', { foreignKey: 'contact_id', parentTable: 'contacts' }],
  ['contact_emails', { foreignKey: 'contact_id', parentTable: 'contacts' }],
  ['contact_addresses', { foreignKey: 'contact_id', parentTable: 'contacts' }],
  ['contact_social_media', { foreignKey: 'contact_id', parentTable: 'contacts' }],
  ['company_phones', { foreignKey: 'company_id', parentTable: 'companies' }],
  ['company_emails', { foreignKey: 'company_id', parentTable: 'companies' }],
  ['company_addresses', { foreignKey: 'company_id', parentTable: 'companies' }],
  ['company_social_media', { foreignKey: 'company_id', parentTable: 'companies' }],
  ['company_cnaes', { foreignKey: 'company_id', parentTable: 'companies' }],
]);

function assignContainerValue(target: TenantContainer, key: string, value: unknown): void {
  if (Array.isArray(target)) target[Number(key)] = value;
  else target[key] = value;
}

export function enforceTenantIdentity(value: unknown, userId: string): unknown {
  if (value === null || typeof value !== 'object') return value;

  const root: TenantContainer = Array.isArray(value) ? [] : {};
  const stack: Array<{ source: TenantContainer; target: TenantContainer }> = [{
    source: value as TenantContainer,
    target: root,
  }];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;

    for (const [key, entry] of Object.entries(current.source)) {
      if (TENANT_ID_KEYS.has(key)) {
        assignContainerValue(current.target, key, userId);
      } else if (entry !== null && typeof entry === 'object') {
        const child: TenantContainer = Array.isArray(entry) ? [] : {};
        assignContainerValue(current.target, key, child);
        stack.push({ source: entry as TenantContainer, target: child });
      } else {
        assignContainerValue(current.target, key, entry);
      }
    }
  }

  return root;
}

export function getRelationScope(table: string): RelationScope | null {
  return RELATION_SCOPES.get(table) ?? null;
}

export function extractRelationId(filters: unknown, foreignKey: string): string | null {
  if (!Array.isArray(filters)) return null;
  for (const entry of filters.slice(0, MAX_QUERY_FILTERS)) {
    if (!entry || typeof entry !== 'object') continue;
    const filter = entry as Record<string, unknown>;
    if (
      filter.type === 'eq' &&
      filter.column === foreignKey &&
      typeof filter.value === 'string' &&
      filter.value.length > 0
    ) {
      return filter.value;
    }
  }
  return null;
}

export function isSafeIdentifier(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z_]\w*$/.test(value);
}

export function quotePostgrestValue(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}
