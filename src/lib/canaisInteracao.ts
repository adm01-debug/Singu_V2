/**
 * Utilitários compartilhados de parsing/normalização de canais de interação.
 *
 * Por que existe:
 * - Antes desta centralização, `useInteractionsAdvancedFilter` e
 *   `useFicha360Filters` faziam split/trim/lowercase/whitelist em paralelo,
 *   com riscos sutis de divergência (ex.: a Ficha 360 não inclui `video_call`
 *   na whitelist). Cada cópia também repetia a etapa de dedup.
 * - Centralizar aqui garante uma única fonte de verdade para a normalização
 *   (trim + lowercase + dedup) e deixa a whitelist explícita por contexto.
 *
 * Como usar:
 * - Cada consumidor declara sua própria whitelist (Set<string>) e passa pra
 *   `parseCanaisFromString` (URL) ou `normalizeCanaisArray` (array vindo de
 *   localStorage/preset).
 * - A whitelist `INTERACTION_CHANNELS` cobre o domínio completo de Interações
 *   (inclui `video_call`); `FICHA360_CHANNELS` cobre o subset usado na Ficha 360.
 */

/** Whitelist canônica de canais usados na seção "Interações" (multicanal). */
export const INTERACTION_CHANNELS = [
  'whatsapp',
  'call',
  'email',
  'meeting',
  'video_call',
  'note',
] as const;
export type InteractionChannel = (typeof INTERACTION_CHANNELS)[number];
export const INTERACTION_CHANNELS_SET: ReadonlySet<string> = new Set(INTERACTION_CHANNELS);

/** Whitelist do filtro da Ficha 360 — não expõe `video_call` na UI. */
export const FICHA360_CHANNELS = ['whatsapp', 'call', 'email', 'meeting', 'note', 'audio', 'transcription'] as const;
export type Ficha360Channel = (typeof FICHA360_CHANNELS)[number];
export const FICHA360_CHANNELS_SET: ReadonlySet<string> = new Set(FICHA360_CHANNELS);

/**
 * Normaliza um único token de canal (trim + lowercase). Retorna string vazia
 * para entradas vazias/whitespace — o chamador filtra `Boolean` em seguida.
 * Mantida pública para casos pontuais (ex.: comparações ad-hoc).
 */
export function normalizeChannelToken(raw: string): string {
  return (raw ?? '').trim().toLowerCase();
}

/**
 * Faz parse do valor bruto do query param `?canais=` (CSV) aplicando:
 *   1) split por vírgula
 *   2) trim + lowercase token a token
 *   3) remoção de vazios
 *   4) dedup preservando a primeira ocorrência
 *   5) whitelist (se fornecida)
 *
 * Sem whitelist, devolve a lista normalizada — útil para diagnósticos
 * (ex.: comparar com a versão filtrada para descobrir o que foi descartado).
 */
export function parseCanaisFromString(
  value: string | null | undefined,
  whitelist?: ReadonlySet<string>,
): string[] {
  if (!value) return [];
  const tokens = value.split(',').map(normalizeChannelToken).filter(Boolean);
  const dedup = Array.from(new Set(tokens));
  return whitelist ? dedup.filter((c) => whitelist.has(c)) : dedup;
}

/**
 * Normaliza uma lista já parseada (vinda de localStorage, preset, formulário).
 * Aplica trim + lowercase + dedup + whitelist opcional. Tolerante a entradas
 * não-array (retorna `[]`) e itens não-string (descartados).
 */
export function normalizeCanaisArray(
  arr: unknown,
  whitelist?: ReadonlySet<string>,
): string[] {
  if (!Array.isArray(arr)) return [];
  const lowered = arr
    .filter((v): v is string => typeof v === 'string')
    .map(normalizeChannelToken)
    .filter(Boolean);
  const dedup = Array.from(new Set(lowered));
  return whitelist ? dedup.filter((c) => whitelist.has(c)) : dedup;
}

/**
 * Diff util para diagnósticos/UX: dada a string crua do param e uma whitelist,
 * devolve os tokens que foram ignorados (vazios já filtrados, dedup aplicado).
 * Usado pelo aviso de "canais ignorados" em useInteractionsAdvancedFilter.
 */
export function findIgnoredCanais(
  raw: string | null | undefined,
  whitelist: ReadonlySet<string>,
): string[] {
  if (!raw) return [];
  const all = parseCanaisFromString(raw); // sem whitelist → normalizado completo
  return all.filter((c) => !whitelist.has(c));
}
