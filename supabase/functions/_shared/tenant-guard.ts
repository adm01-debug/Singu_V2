const TENANT_ID_KEYS = new Set([
  'user_id',
  'userid',
  'userId',
  'p_user_id',
  'created_by',
  'owner_id',
]);

type TenantContainer = Record<string, unknown> | unknown[];

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

export function isSafeIdentifier(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z_]\w*$/.test(value);
}

export function quotePostgrestValue(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}
