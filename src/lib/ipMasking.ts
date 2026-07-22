const PLACEHOLDER = '—';

function maskIPv4(ip: string): string {
  const parts = ip.split('.');
  if (parts.length !== 4 || parts.some(p => p === '' || Number.isNaN(Number(p)))) return ip;
  return `${parts[0]}.${parts[1]}.*.*`;
}

export function maskIPv6(ip: string): string {
  // Expand :: minimally for masking purposes
  const groups = ip.split(':');
  if (groups.length < 3) return ip;
  const head = groups.slice(0, 3).join(':');
  return `${head}:*:*:*:*:*`;
}

export function maskIP(ip: string | null | undefined): string {
  if (!ip || typeof ip !== 'string') return PLACEHOLDER;
  const trimmed = ip.trim();
  if (!trimmed) return PLACEHOLDER;
  if (trimmed.includes(':')) return maskIPv6(trimmed);
  if (trimmed.includes('.')) return maskIPv4(trimmed);
  return PLACEHOLDER;
}

function matchIP(ip: string | null | undefined, query: string): boolean {
  if (!ip) return false;
  if (!query) return true;
  return ip.toLowerCase().includes(query.toLowerCase());
}
