/**
 * Configuração da persistência dos filtros de canal em localStorage.
 *
 * Ajuste estes valores para alterar TTL, chave de storage e canais válidos
 * sem precisar tocar na lógica em `src/lib/channelPersistence.ts`.
 */

/** Quantos dias o filtro de canais aplicado fica salvo no localStorage. */
export const CHANNEL_PERSISTENCE_TTL_DAYS = 30;

/** TTL em milissegundos derivado de `CHANNEL_PERSISTENCE_TTL_DAYS`. */
export const CHANNEL_PERSISTENCE_TTL_MS =
  CHANNEL_PERSISTENCE_TTL_DAYS * 24 * 60 * 60 * 1000;

/** Chave usada em `localStorage` para persistir os canais aplicados. */
export const CHANNEL_PERSISTENCE_KEY = 'channel-applied-canais';

/** Conjunto de canais aceitos pela persistência. */
export const CHANNEL_PERSISTENCE_VALID_VALUES = [
  'whatsapp',
  'call',
  'email',
  'meeting',
  'video_call',
  'note',
] as const;

export type PersistedChannel = (typeof CHANNEL_PERSISTENCE_VALID_VALUES)[number];
