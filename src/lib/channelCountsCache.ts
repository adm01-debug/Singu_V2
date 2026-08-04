import { countByChannel } from './countByChannel';

/**
 * Cache LRU em memória para contagens por canal.
 *
 * Motivação: ao alternar rapidamente entre chips (canal/sentimento) é comum o
 * usuário voltar a uma combinação de filtros já vista. Recomputar
 * `countByChannel` sobre o mesmo subset é desperdício — guardamos os últimos
 * resultados indexados por uma chave estável dos filtros não-canal.
 *
 * Escopo: cache por sessão (módulo singleton). Não persiste entre reloads.
 */
const MAX_ENTRIES = 32;
const cache = new Map<string, Record<string, number>>();

interface ChannelCountsKeyParts {
  /** Identidade do dataset bruto (length basta para o caso de uso atual). */
  datasetSize: number;
  q: string;
  contact: string;
  company: string;
  direcao: string;
  de: string | null;
  ate: string | null;
  sentimento: string | null;
}

function buildKey(parts: ChannelCountsKeyParts): string {
  return JSON.stringify(parts);
}

/**
 * Retorna as contagens por canal para o subset dado, reaproveitando o
 * resultado anterior quando a mesma chave de filtros reaparece.
 */
export function getChannelCountsCached<T extends { type?: string | null; channel?: string | null }>(
  parts: ChannelCountsKeyParts,
  computeSubset: () => T[],
): Record<string, number> {
  const key = buildKey(parts);
  const hit = cache.get(key);
  if (hit) {
    // Move para o final (LRU): chave mais recente fica no fim.
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const value = countByChannel(computeSubset());
  cache.set(key, value);
  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return value;
}

/** Limpa o cache (útil para testes). */
export function clearChannelCountsCache(): void {
  cache.clear();
}

/** Tamanho atual do cache (útil para testes). */
export function channelCountsCacheSize(): number {
  return cache.size;
}
