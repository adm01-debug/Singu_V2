import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useScopedShortcut } from '@/lib/keyboardShortcutRegistry';

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  note: 'Nota',
};

interface Options {
  days: number;
  channels: string[];
  q: string;
  hasPeriodChip: boolean;
  onClearAll: () => void;
  onClearPeriod: () => void;
  onClearSearch: () => void;
  onRemoveChannel: (channel: string) => void;
  onCopyLink?: () => void;
  onQuickSaveFavorito?: () => void;
  onAbrirFavoritos?: () => void;
  onSortRecente?: () => void;
  onSortRelevante?: () => void;
  onAbrirResumoIA?: () => void;
  onSalvarRelatorio?: () => void;
  filteredCount?: number;
  enabled: boolean;
}

/**
 * Registra atalhos de teclado escopados para gerenciar chips de filtros
 * ativos da Ficha 360 (período, canais, busca textual).
 *
 * Escopo: 'ficha360-filtros' — aparece automaticamente no cheatsheet (?).
 */
export function useFicha360FilterShortcuts({
  days,
  channels,
  q,
  hasPeriodChip,
  onClearAll,
  onClearPeriod,
  onClearSearch,
  onRemoveChannel,
  onCopyLink,
  onQuickSaveFavorito,
  onAbrirFavoritos,
  onSortRecente,
  onSortRelevante,
  onAbrirResumoIA,
  onSalvarRelatorio,
  filteredCount = 0,
  enabled,
}: Options) {
  // Refs garantem que handlers leiam estado atual sem re-registrar atalhos.
  const stateRef = useRef({ days, channels, q, hasPeriodChip, enabled, filteredCount });
  useEffect(() => {
    stateRef.current = { days, channels, q, hasPeriodChip, enabled, filteredCount };
  }, [days, channels, q, hasPeriodChip, enabled, filteredCount]);

  const handlersRef = useRef({
    onClearAll,
    onClearPeriod,
    onClearSearch,
    onRemoveChannel,
    onCopyLink,
    onQuickSaveFavorito,
    onAbrirFavoritos,
    onSortRecente,
    onSortRelevante,
    onAbrirResumoIA,
    onSalvarRelatorio,
  });
  useEffect(() => {
    handlersRef.current = {
      onClearAll,
      onClearPeriod,
      onClearSearch,
      onRemoveChannel,
      onCopyLink,
      onQuickSaveFavorito,
      onAbrirFavoritos,
      onSortRecente,
      onSortRelevante,
      onAbrirResumoIA,
      onSalvarRelatorio,
    };
  }, [
    onClearAll,
    onClearPeriod,
    onClearSearch,
    onRemoveChannel,
    onCopyLink,
    onQuickSaveFavorito,
    onAbrirFavoritos,
    onSortRecente,
    onSortRelevante,
    onAbrirResumoIA,
    onSalvarRelatorio,
  ]);

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 'c',
    shift: true,
    description: 'Limpar todos os filtros (período, canais, busca)',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled) return;
      const hadAny = s.hasPeriodChip || s.channels.length > 0 || s.q.trim().length > 0;
      if (!hadAny) return;
      handlersRef.current.onClearAll();
      toast.info('Filtros limpos', { duration: 1500 });
    },
  });

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 'p',
    shift: true,
    description: 'Remover filtro de período (volta para 90d)',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled || !s.hasPeriodChip) return;
      handlersRef.current.onClearPeriod();
      toast.info('Período limpo', { duration: 1500 });
    },
  });

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 'b',
    shift: true,
    description: 'Remover filtro de busca textual',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled || !s.q.trim()) return;
      handlersRef.current.onClearSearch();
      toast.info('Busca limpa', { duration: 1500 });
    },
  });

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 'l',
    shift: true,
    description: 'Copiar link com filtros atuais',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled) return;
      const hasAny = s.hasPeriodChip || s.channels.length > 0 || s.q.trim().length > 0;
      if (!hasAny) return;
      handlersRef.current.onCopyLink?.();
    },
  });

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 's',
    shift: true,
    description: 'Salvar filtros atuais como favorito (auto-nome)',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled) return;
      handlersRef.current.onQuickSaveFavorito?.();
    },
  });

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 'f',
    shift: true,
    description: 'Abrir menu de filtros favoritos',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled) return;
      handlersRef.current.onAbrirFavoritos?.();
    },
  });

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 'r',
    alt: true,
    description: 'Ordenar interações por mais recente',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled) return;
      handlersRef.current.onSortRecente?.();
    },
  });

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 'm',
    alt: true,
    description: 'Ordenar interações por mais relevante (requer busca)',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled) return;
      if (!s.q.trim()) {
        toast.info('Digite um termo de busca para ordenar por relevância', { duration: 1800 });
        return;
      }
      handlersRef.current.onSortRelevante?.();
    },
  });

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 't',
    shift: true,
    description: 'Abrir filtro de tags temáticas',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled) return;
      window.dispatchEvent(new CustomEvent('ficha360:open-tags'));
    },
  });

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 'i',
    alt: true,
    description: 'Abrir resumo IA das interações filtradas',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled) return;
      if (s.filteredCount === 0) {
        toast.info('Sem interações filtradas para resumir', { duration: 1800 });
        return;
      }
      handlersRef.current.onAbrirResumoIA?.();
    },
  });

  useScopedShortcut({
    scope: 'ficha360-filtros',
    keys: 'r',
    shift: true,
    description: 'Salvar filtros atuais como relatório fixo',
    handler: () => {
      const s = stateRef.current;
      if (!s.enabled) return;
      handlersRef.current.onSalvarRelatorio?.();
    },
  });

  // Shift+1..5 → remove o N-ésimo chip de canal visível.
  for (let i = 1; i <= 5; i++) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useScopedShortcut({
      scope: 'ficha360-filtros',
      keys: String(i),
      shift: true,
      description: `Remover ${i}º chip de canal`,
      handler: () => {
        const s = stateRef.current;
        if (!s.enabled) return;
        const channel = s.channels[i - 1];
        if (!channel) return;
        handlersRef.current.onRemoveChannel(channel);
        const label = CHANNEL_LABELS[channel] ?? channel;
        toast.info(`Canal ${label} removido`, { duration: 1500 });
      },
    });
  }
}
