import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ALL_TAGS, sanitizeTags, type InteractionTag } from '@/lib/interactionTags';
import {
  FICHA360_CHANNELS,
  FICHA360_CHANNELS_SET,
  parseCanaisFromString,
  normalizeCanaisArray,
} from '@/lib/canaisInteracao';

const VALID_PERIODS = [7, 30, 90, 365] as const;
const DEFAULT_DAYS = 90;
// Whitelist e parsing de canais centralizados em `@/lib/canaisInteracao` —
// mantém aliases locais para preservar a API pública do hook.
const KNOWN_CHANNELS = FICHA360_CHANNELS;
const KNOWN_CHANNELS_SET = FICHA360_CHANNELS_SET;
const KNOWN_TAGS_SET = new Set<string>(ALL_TAGS);

export type Ficha360Period = (typeof VALID_PERIODS)[number];

interface SetterOptions {
  /** Quando true, empilha entrada no histórico (back/forward navega entre estados). Default: false (replace). */
  pushHistory?: boolean;
}

/**
 * Sincroniza filtros da seção "Últimas Interações" da Ficha 360 com a URL.
 * Query params: ?periodo=<days>&canais=<csv>&q=<termo>&tags=<csv>
 *
 * Valores inválidos colados na URL são descartados via whitelist.
 */
export function useFicha360Filters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const days: Ficha360Period = useMemo(() => {
    const raw = Number(searchParams.get('periodo'));
    return (VALID_PERIODS as readonly number[]).includes(raw)
      ? (raw as Ficha360Period)
      : DEFAULT_DAYS;
  }, [searchParams]);

  const channels: string[] = useMemo(
    () => parseCanaisFromString(searchParams.get('canais'), KNOWN_CHANNELS_SET),
    [searchParams],
  );

  const q: string = useMemo(() => searchParams.get('q')?.trim() ?? '', [searchParams]);

  const tags: InteractionTag[] = useMemo(() => {
    const raw = searchParams.get('tags');
    if (!raw) return [];
    const parts = raw
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t && KNOWN_TAGS_SET.has(t));
    return sanitizeTags(parts);
  }, [searchParams]);

  const setDays = useCallback(
    (next: Ficha360Period, opts?: SetterOptions) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (next === DEFAULT_DAYS) sp.delete('periodo');
          else sp.set('periodo', String(next));
          return sp;
        },
        { replace: !opts?.pushHistory },
      );
    },
    [setSearchParams],
  );

  const setChannels = useCallback(
    (next: string[], opts?: SetterOptions) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          const cleaned = normalizeCanaisArray(next, KNOWN_CHANNELS_SET);
          if (cleaned.length === 0) sp.delete('canais');
          else sp.set('canais', cleaned.join(','));
          return sp;
        },
        { replace: !opts?.pushHistory },
      );
    },
    [setSearchParams],
  );

  const setQ = useCallback(
    (next: string, opts?: SetterOptions) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          const trimmed = (next ?? '').trim();
          if (!trimmed) sp.delete('q');
          else sp.set('q', trimmed);
          return sp;
        },
        { replace: !opts?.pushHistory },
      );
    },
    [setSearchParams],
  );

  const setTags = useCallback(
    (next: InteractionTag[], opts?: SetterOptions) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          const cleaned = sanitizeTags(next);
          if (cleaned.length === 0) sp.delete('tags');
          else sp.set('tags', cleaned.join(','));
          return sp;
        },
        { replace: !opts?.pushHistory },
      );
    },
    [setSearchParams],
  );

  const clear = useCallback(
    (opts?: SetterOptions) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.delete('periodo');
          sp.delete('canais');
          sp.delete('q');
          sp.delete('tags');
          return sp;
        },
        { replace: !opts?.pushHistory },
      );
    },
    [setSearchParams],
  );

  const activeCount =
    (days !== DEFAULT_DAYS ? 1 : 0) +
    (channels.length > 0 ? 1 : 0) +
    (q ? 1 : 0) +
    (tags.length > 0 ? 1 : 0);

  return {
    days,
    channels,
    q,
    tags,
    setDays,
    setChannels,
    setQ,
    setTags,
    clear,
    activeCount,
    periods: VALID_PERIODS,
  };
}
