/**
 * Conta interações por canal a partir de uma lista em memória.
 *
 * Contrato:
 * - Usa `channel` ou `tipo` (o que estiver presente), normalizado para lowercase.
 * - Itens sem canal válido são ignorados.
 * - Espera receber o dataset já filtrado por todos os critérios que NÃO sejam o
 *   próprio filtro de canal — assim cada contador representa o "potencial" por
 *   canal dentro do escopo atual.
 */
export function countByChannel(
  items: Array<{ channel?: string | null; tipo?: string | null; type?: string | null }> | null | undefined,
): Record<string, number> {
  const counts: Record<string, number> = {};
  if (!Array.isArray(items)) return counts;
  for (const it of items) {
    const raw = it?.channel ?? it?.tipo ?? it?.type ?? '';
    const c = typeof raw === 'string' ? raw.toLowerCase() : '';
    if (!c) continue;
    counts[c] = (counts[c] ?? 0) + 1;
  }
  return counts;
}
