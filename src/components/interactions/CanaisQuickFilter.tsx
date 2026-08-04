import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { MessageSquare, Phone, Mail, Users, Video, FileText, Zap, MousePointerClick, Check, X, Eraser, AlertCircle, Plus, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useChannelSyncMode } from '@/hooks/useChannelSyncMode';
import { useChannelHistory } from '@/hooks/useChannelHistory';
import { RecentChannelCombos } from '@/components/interactions/RecentChannelCombos';
import { toast } from 'sonner';

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Reunião', icon: Users },
  { value: 'video_call', label: 'Vídeo', icon: Video },
  { value: 'note', label: 'Nota', icon: FileText },
] as const;

const PENDING_KEY_PREFIX = 'channel-pending-canais';
const APPLIED_KEY_PREFIX = 'channel-applied-canais';
const CHANNEL_SYNC_KEY_PREFIX = 'channel-sync-mode';
const VALID_VALUES = new Set(CHANNELS.map((c) => c.value));

function readStoredArray(key: string): string[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(
      (v): v is string =>
        typeof v === 'string' && VALID_VALUES.has(v as typeof CHANNELS[number]['value']),
    );
  } catch {
    return null;
  }
}

function readPending(key: string): string[] | null {
  return readStoredArray(key);
}

function readApplied(key: string): string[] | null {
  return readStoredArray(key);
}

function writeStoredArray(key: string, next: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* noop */
  }
}

const writePending = writeStoredArray;
const writeApplied = writeStoredArray;

function clearPending(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

interface Props {
  canais: string[];
  onChange: (next: string[]) => void;
  /**
   * Mapa opcional `canal → quantidade` calculado no dataset filtrado pelos
   * demais critérios (sem aplicar o próprio filtro de canal). Quando ausente,
   * os chips renderizam só o ícone (comportamento legado).
   */
  counts?: Record<string, number>;
}

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export const CanaisQuickFilter = React.memo(function CanaisQuickFilter({ canais, onChange, counts }: Props) {
  const { user } = useAuth();
  const uid = user?.id ?? 'anon';
  const pendingKey = `${PENDING_KEY_PREFIX}-${uid}`;
  const appliedKey = `${APPLIED_KEY_PREFIX}-${uid}`;
  const syncModeKey = `${CHANNEL_SYNC_KEY_PREFIX}-${uid}`;

  const safe = useMemo(() => (Array.isArray(canais) ? canais : []), [canais]);
  const { mode, toggle, setMode } = useChannelSyncMode();
  const { history, record: recordCombo, remove: removeCombo, clear: clearHistory } = useChannelHistory();

  // Default to safe; hydrate from user-scoped keys after auth is known.
  const [pending, setPendingState] = useState<string[]>(safe);
  const hydratedRef = React.useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const savedMode = localStorage.getItem(syncModeKey);
      if (savedMode === 'manual') {
        const savedPending = readPending(pendingKey);
        if (savedPending) { setPendingState(savedPending); return; }
        const initial = Array.isArray(canais) ? canais : [];
        if (initial.length === 0) {
          const savedApplied = readApplied(appliedKey);
          if (savedApplied) { setPendingState(savedApplied); return; }
        }
        setPendingState(initial);
      }
    } catch {
      /* noop */
    }
  }, [syncModeKey, pendingKey, appliedKey, canais]);

  const setPending = useCallback((next: string[] | ((prev: string[]) => string[])) => {
    setPendingState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      return value;
    });
  }, []);

  // Rastreia o `safe` anterior para distinguir mudanças externas (preset/clear)
  // de transições internas (apply/revert/toggle no auto).
  const prevSafeRef = React.useRef<string[]>(safe);

  useEffect(() => {
    const prevSafe = prevSafeRef.current;
    const wasNonEmpty = prevSafe.length > 0;
    const isNowEmpty = safe.length === 0;
    const externalClear = wasNonEmpty && isNowEmpty;
    const safeChanged = !arraysEqual(prevSafe, safe);
    prevSafeRef.current = safe;

    setPendingState((prev) => {
      if (arraysEqual(prev, safe)) return prev;

      // Clear externo: força sincronização mesmo em manual
      if (externalClear) {
        if (mode === 'manual' && prev.length > 0) {
          toast.info('Filtros limpos', {
            description: 'Seleção pendente de canais foi sincronizada.',
            duration: 2500,
          });
        }
        return safe;
      }

      // Preset/mudança externa para canais não-vazios: se o `safe` mudou
      // (não é apenas o pending divergente do mount) e estamos em manual,
      // o preset venceu — voltamos para auto e sincronizamos.
      if (safeChanged && safe.length > 0 && mode === 'manual') {
        setMode('auto');
        clearPending(pendingKey);
        toast.info('Preset aplicado', {
          description: 'Canais sincronizados e modo manual desativado.',
          duration: 3000,
        });
        return safe;
      }

      // No modo manual sem mudança externa em safe, mantém pending divergente
      if (mode === 'manual' && !safeChanged) {
        return prev;
      }

      // Em auto mode sem mudança de safe e safe vazio: não resetar pending.
      // Evita sobrescrever a hidratação de pending que ocorre no mesmo flush.
      if (mode === 'auto' && !safeChanged && safe.length === 0) {
        return prev;
      }

      return safe;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps estáveis (storage keys/user id/refs) — adicionar causaria re-execução desnecessária ou loop
  }, [safe, mode, setMode]);


  // Persiste o estado aplicado (safe) no localStorage para servir de bootstrap
  // do modo manual em recargas futuras antes do pai hidratar a prop `canais`.
  useEffect(() => {
    writeApplied(appliedKey, safe);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps estáveis (storage keys/user id/refs) — adicionar causaria re-execução desnecessária ou loop
  }, [safe]);

  // Registra cada combinação aplicada não-vazia no histórico MRU.
  // Combinação vazia (== "todos") é ignorada porque já é o estado default.
  useEffect(() => {
    if (safe.length > 0) recordCombo(safe);
  }, [safe, recordCombo]);

  // Persiste pending no localStorage quando estiver no modo manual e houver divergência
  useEffect(() => {
    if (mode === 'manual' && !arraysEqual(pending, safe)) {
      writePending(pendingKey, pending);
    } else {
      clearPending(pendingKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps estáveis (storage keys/user id/refs) — adicionar causaria re-execução desnecessária ou loop
  }, [pending, safe, mode]);

  const dirty = mode === 'manual' && !arraysEqual(pending, safe);
  const diffDetail = useMemo(() => {
    const setA = new Set(safe);
    const setB = new Set(pending);
    const labelOf = (v: string) => CHANNELS.find((c) => c.value === v)?.label ?? v;
    const added: string[] = [];
    const removed: string[] = [];
    setB.forEach((v) => { if (!setA.has(v)) added.push(labelOf(v)); });
    setA.forEach((v) => { if (!setB.has(v)) removed.push(labelOf(v)); });
    return { added, removed, count: added.length + removed.length };
  }, [safe, pending]);
  const diffCount = diffDetail.count;

  const toggleCanal = useCallback((value: string) => {
    const base = mode === 'manual' ? pending : safe;
    const next = base.includes(value) ? base.filter((c) => c !== value) : [...base, value];
    if (mode === 'auto') {
      onChange(next);
    } else {
      setPending(next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pending, safe, onChange]);

  const apply = useCallback(() => {
    onChange(pending);
    toast.success('Filtros de canal aplicados');
  }, [pending, onChange]);

  const [confirmRevertOpen, setConfirmRevertOpen] = useState(false);
  // Sinaliza visualmente (pulso verde) que pendências foram desfeitas após Reverter.
  const [justReverted, setJustReverted] = useState(false);

  const revert = useCallback(() => {
    setPending(safe);
    setConfirmRevertOpen(false);
    setJustReverted(true);
    window.setTimeout(() => setJustReverted(false), 1400);
    toast.success('Alterações pendentes descartadas');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safe]);

  const handleToggleMode = useCallback(() => {
    const goingToManual = mode === 'auto';
    toggle();
    if (goingToManual) {
      // Entrando em manual: alinha pending ao estado aplicado para evitar
      // divergência visual herdada (ex: pending órfão de sessão anterior
      // que sobreviveu à hidratação porque o usuário não tinha tocado nos
      // chips desde então). O usuário sempre começa com a mesma seleção
      // que está na URL.
      if (!arraysEqual(pending, safe)) {
        setPending(safe);
        clearPending(pendingKey);
      }
      toast.info('Você está no modo manual', {
        description: 'Clique em "Aplicar" para atualizar os filtros após selecionar os canais.',
        duration: 5000,
      });
    } else {
      // Voltando para auto: aplica imediatamente o pending e limpa o
      // pending persistido. O realinhamento final fica a cargo do effect
      // `syncPendingOnAutoSwitch` abaixo, porque o pai pode normalizar o
      // array recebido (whitelist) — confiar cegamente em `pending` aqui
      // produziria divergência fantasma se voltássemos a manual depois.
      if (!arraysEqual(pending, safe)) {
        onChange(pending);
      }
      clearPending(pendingKey);
      toast.success('Modo automático ativado', {
        description: 'Canais aplicados imediatamente e seleção pendente limpa.',
        duration: 3000,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps estáveis (storage keys/user id/refs) — adicionar causaria re-execução desnecessária ou loop
  }, [mode, toggle, pending, safe, onChange, setPending]);

  // Após alternar manual→auto, realinha `pending` com o `safe` recém-aplicado
  // pelo pai (que pode ter descartado canais inválidos). Sem isso, voltar
  // para manual depois mostraria uma "alteração pendente" que o usuário
  // nunca fez. Disparado APENAS na transição de modo (não em cada mudança
  // de safe), o que preserva o comportamento normal do pending no manual.
  const prevModeRef = React.useRef(mode);
  useEffect(() => {
    const prev = prevModeRef.current;
    prevModeRef.current = mode;
    if (prev === 'manual' && mode === 'auto' && !arraysEqual(pending, safe)) {
      setPending(safe);
    }
  }, [mode, safe, pending, setPending]);

  const clearAll = useCallback(() => {
    if (mode === 'auto') {
      if (safe.length === 0) return;
      onChange([]);
      toast.success('Filtros de canal limpos');
    } else {
      if (pending.length === 0) return;
      setPending([]);
      toast.info('Canais desmarcados', {
        description: 'Clique em "Aplicar" para confirmar.',
        duration: 3000,
      });
    }
  }, [mode, safe, pending, onChange, setPending]);

  const showClear = mode === 'auto' ? safe.length > 0 : pending.length > 0;

  /**
   * Aplica uma combinação salva em 1 clique.
   * - auto: chama `onChange` direto, atualizando os filtros aplicados.
   * - manual: escreve em pending e pede confirmação via Aplicar.
   */
  const applyCombo = useCallback((combo: string[]) => {
    const target = combo.filter((v) => VALID_VALUES.has(v as typeof CHANNELS[number]['value']));
    if (mode === 'auto') {
      if (arraysEqual(safe, target)) return;
      onChange(target);
      toast.success('Combinação aplicada', {
        description: target.map((v) => CHANNELS.find((c) => c.value === v)?.label ?? v).join(' + '),
        duration: 2500,
      });
    } else {
      if (arraysEqual(pending, target)) return;
      setPending(target);
      toast.info('Combinação carregada como pendente', {
        description: 'Clique em "Aplicar" para confirmar.',
        duration: 3000,
      });
    }
  }, [mode, safe, pending, onChange, setPending]);

  // ── Atalhos de teclado: Alt+1..6 alterna canal, Alt+0 limpa.
  // Setas ←/→ no campo de busca movem um cursor circular pelos canais e
  // alternam o canal correspondente — atalho ergonômico que não exige Alt.
  const [altPressed, setAltPressed] = useState(false);
  const arrowCursorRef = React.useRef(0);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl+Enter: aplica canais pendentes no modo manual (sem Alt/Shift).
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        if (mode !== 'manual') return;
        if (arraysEqual(pending, safe)) return;
        e.preventDefault();
        apply();
        return;
      }
      // Esc: reverte alterações pendentes no modo manual.
      if (e.key === 'Escape' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        if (mode !== 'manual') return;
        if (arraysEqual(pending, safe)) return;
        // Não interceptar se foco em input/textarea/contenteditable (deixa Esc nativo)
        const tgt = e.target as HTMLElement | null;
        const tag = tgt?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tgt?.isContentEditable) return;
        e.preventDefault();
        revert();
        return;
      }

      // ←/→ apenas quando o foco está no campo de busca de interações.
      // Não interceptamos se há modificadores (preserva navegação nativa de
      // texto com Shift/Alt/Ctrl).
      if (
        (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
        !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey
      ) {
        const tgt = e.target as HTMLElement | null;
        const isSearch =
          tgt?.tagName === 'INPUT' &&
          (tgt as HTMLInputElement).dataset.interacoesSearch !== undefined;
        if (isSearch) {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const next = (arrowCursorRef.current + dir + CHANNELS.length) % CHANNELS.length;
          arrowCursorRef.current = next;
          const canal = CHANNELS[next];
          const wasActive = (mode === 'manual' ? pending : safe).includes(canal.value);
          toggleCanal(canal.value);
          toast.message(`${canal.label} ${wasActive ? 'desativado' : 'ativado'}`, { duration: 1500 });
          return;
        }
      }

      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      // Alt+Enter: aplica canais pendentes no modo manual (atalho legado).
      if (e.key === 'Enter') {
        if (mode !== 'manual') return;
        if (arraysEqual(pending, safe)) return;
        e.preventDefault();
        apply();
        return;
      }
      if (e.key === '0') {
        e.preventDefault();
        const hasAny = mode === 'auto' ? safe.length > 0 : pending.length > 0;
        if (!hasAny) return;
        clearAll();
        toast.message('Canais limpos', { duration: 1500 });
        return;
      }
      const idx = parseInt(e.key, 10);
      if (Number.isNaN(idx) || idx < 1 || idx > CHANNELS.length) return;
      e.preventDefault();
      const canal = CHANNELS[idx - 1];
      const wasActive = (mode === 'manual' ? pending : safe).includes(canal.value);
      // Alinha o cursor de setas com a última ação por número.
      arrowCursorRef.current = idx - 1;
      toggleCanal(canal.value);
      toast.message(`${canal.label} ${wasActive ? 'desativado' : 'ativado'}`, { duration: 1500 });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mode, safe, pending, toggleCanal, clearAll, apply, revert]);

  // Detecta Alt pressionado para mostrar badges Alt+N nos chips
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { if (e.altKey) setAltPressed(true); };
    const onUp = (e: KeyboardEvent) => { if (!e.altKey) setAltPressed(false); };
    const onBlur = () => setAltPressed(false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return (
    <TooltipProvider delayDuration={200}>
     <div className="flex flex-col gap-0">
      <div className="flex flex-wrap items-center gap-1">
        {CHANNELS.map((opt, idx) => {
          const Icon = opt.icon;
          const inPending = pending.includes(opt.value);
          const inApplied = safe.includes(opt.value);
          const isDifferent = mode === 'manual' && inPending !== inApplied;
          const hasCounts = !!counts;
          const count = hasCounts ? (counts?.[opt.value] ?? 0) : undefined;
          const isEmpty = hasCounts && count === 0 && !inPending;
          const shortcutLabel = `Alt+${idx + 1}`;
          const stateLabel = inPending ? 'selecionado' : 'não selecionado';
          const countLabel =
            typeof count === 'number'
              ? `, ${count} ${count === 1 ? 'interação' : 'interações'}`
              : '';
          const pendingLabel = isDifferent ? ', alteração pendente' : '';
          const ariaLabel = `Canal ${opt.label}, ${stateLabel}${countLabel}${pendingLabel}. Atalho ${shortcutLabel} para alternar.`;
          const chip = (
            <div className="relative inline-flex">
              <Badge
                variant={inPending ? 'default' : 'outline'}
                role="button"
                tabIndex={0}
                aria-pressed={inPending}
                aria-keyshortcuts={`Alt+${idx + 1}`}
                aria-label={ariaLabel}
                title={opt.label}
                onClick={() => toggleCanal(opt.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCanal(opt.value);
                  }
                }}
                className={cn(
                  'cursor-pointer gap-1 px-2 py-1 text-xs transition-all select-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  !inPending && 'hover:bg-muted',
                  isDifferent && 'border-dashed border-warning/70 text-warning ring-1 ring-warning/40 bg-warning/5',
                  isEmpty && 'opacity-50',
                  justReverted && 'ring-1 ring-success/60 bg-success/5',
                )}
              >
                <Icon className="w-3 h-3" aria-hidden="true" />
                <span className="hidden sm:inline">{opt.label}</span>
                {typeof count === 'number' && (
                  <span className="ml-0.5 text-[10px] tabular-nums opacity-70" aria-hidden="true">
                    {count > 999 ? '999+' : count}
                  </span>
                )}
              </Badge>
              {altPressed && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-1 -right-1 rounded border border-border bg-background px-1 text-[9px] font-mono leading-tight text-muted-foreground shadow-sm"
                >
                  {idx + 1}
                </span>
              )}
            </div>
          );
          return (
            <Tooltip key={opt.value}>
              <TooltipTrigger asChild>{chip}</TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1 text-xs">
                  <p className="font-medium">
                    {opt.label}{' '}
                    <span className="text-muted-foreground font-normal">({shortcutLabel})</span>
                  </p>
                  {hasCounts && (
                    isEmpty ? (
                      <p className="text-muted-foreground">
                        Sem interações neste canal no escopo atual.
                        <br />
                        Refine sua busca para ver mais interações neste canal.
                      </p>
                    ) : (
                      <p className="text-muted-foreground">
                        <span className="tabular-nums font-semibold text-foreground">{count}</span>{' '}
                        interaç{count === 1 ? 'ão' : 'ões'} disponíve{count === 1 ? 'l' : 'is'} no escopo atual.
                      </p>
                    )
                  )}
                  {inPending && (
                    <p className="text-[10px] text-muted-foreground border-t border-border pt-1">
                      Clique para {mode === 'manual' ? 'desmarcar (pendente)' : 'remover'}.
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleToggleMode}
              aria-label={mode === 'auto' ? 'Mudar para modo manual' : 'Mudar para modo automático'}
              className={cn(
                'relative ml-1 text-muted-foreground hover:text-foreground transition-colors',
                dirty && 'text-warning hover:text-warning',
                justReverted && 'text-success hover:text-success ring-1 ring-success/50 rounded-md',
              )}
            >
              {mode === 'auto' ? <Zap className="w-3.5 h-3.5" /> : <MousePointerClick className="w-3.5 h-3.5" />}
              {dirty && (
                <span
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-warning text-warning-foreground text-[10px] font-bold leading-none flex items-center justify-center ring-2 ring-background"
                  aria-label={`${diffCount} canal${diffCount === 1 ? '' : 'is'} pendente${diffCount === 1 ? '' : 's'}`}
                >
                  {diffCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {mode === 'auto'
              ? 'Modo automático: aplica ao clicar. Clique para mudar para manual.'
              : dirty
                ? `Modo manual: ${diffCount} canal${diffCount === 1 ? '' : 'is'} pendente${diffCount === 1 ? '' : 's'}. Alt+Enter para aplicar.`
                : 'Modo manual: clique em Aplicar para atualizar. Clique para voltar ao automático.'}
          </TooltipContent>
        </Tooltip>

        {showClear && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={clearAll}
                aria-label="Limpar seleção de canais"
                className="gap-1 text-muted-foreground hover:text-foreground"
              >
                <Eraser className="w-3 h-3" />
                Limpar canais
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {mode === 'auto'
                ? 'Remove todos os canais selecionados (aplica imediatamente). (Alt+0)'
                : 'Desmarca todos os canais. Clique em Aplicar para confirmar. (Alt+0)'}
            </TooltipContent>
          </Tooltip>
        )}

        {dirty && (
          <div className="flex items-center gap-1 ml-1" aria-live="polite">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className="gap-1 px-2 py-1 text-xs border-warning/50 bg-warning/10 text-warning cursor-help"
                  aria-label={`${diffCount} divergência${diffCount === 1 ? '' : 's'} entre seleção pendente e filtros aplicados`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="font-semibold">{diffCount}</span>
                  <span className="hidden sm:inline">pendente{diffCount === 1 ? '' : 's'}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2 text-xs">
                  <p className="font-medium">
                    Sua seleção difere dos filtros aplicados em {diffCount} canal{diffCount === 1 ? '' : 'is'}.
                  </p>
                  {diffDetail.added.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1 font-medium text-success">
                        <Plus className="w-3 h-3" /> Será adicionado:
                      </p>
                      <p className="ml-4">{diffDetail.added.join(', ')}</p>
                    </div>
                  )}
                  {diffDetail.removed.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1 font-medium text-destructive">
                        <Minus className="w-3 h-3" /> Será removido:
                      </p>
                      <p className="ml-4">{diffDetail.removed.join(', ')}</p>
                    </div>
                  )}
                  <p className="pt-1 text-muted-foreground border-t border-border">
                    Clique em <strong>Aplicar</strong> para confirmar ou em <strong>Reverter</strong> para descartar.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="button"
                    variant="default"
                    size="xs"
                    onClick={apply}
                    disabled={!dirty}
                    aria-keyshortcuts="Control+Enter Meta+Enter Alt+Enter"
                    aria-disabled={!dirty}
                    className="gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Aplicar
                    <span className="text-[10px] opacity-80">({diffCount})</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                {dirty
                  ? 'Aplicar canais pendentes (Ctrl/⌘+Enter ou Alt+Enter)'
                  : 'Nenhuma mudança pendente para aplicar'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setConfirmRevertOpen(true)}
                  aria-keyshortcuts="Escape"
                  className="gap-1"
                >
                  <X className="w-3 h-3" />
                  Reverter
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2 text-xs">
                  <p className="font-medium">
                    Reverter {diffCount} alteração{diffCount === 1 ? '' : 'ões'} pendente{diffCount === 1 ? '' : 's'}
                  </p>
                  <p className="text-muted-foreground">
                    Descarta apenas a sua seleção pendente e volta aos filtros de canal
                    atualmente aplicados. Não altera os filtros já em uso na lista.
                  </p>
                  {diffDetail.added.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1 font-medium text-success">
                        <Plus className="w-3 h-3" /> Desfaz adição ({diffDetail.added.length}):
                      </p>
                      <p className="ml-4">{diffDetail.added.join(', ')}</p>
                    </div>
                  )}
                  {diffDetail.removed.length > 0 && (
                    <div>
                      <p className="flex items-center gap-1 font-medium text-destructive">
                        <Minus className="w-3 h-3" /> Restaura remoção ({diffDetail.removed.length}):
                      </p>
                      <p className="ml-4">{diffDetail.removed.join(', ')}</p>
                    </div>
                  )}
                  <p className="pt-1 text-muted-foreground border-t border-border">
                    Atalho: <kbd className="px-1 rounded border border-border bg-muted text-[10px]">Esc</kbd>
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {!dirty && justReverted && (
          <div
            className="ml-1 inline-flex items-center gap-1 rounded-md border border-success/50 bg-success/10 px-2 py-1 text-xs text-success animate-in fade-in"
            aria-live="polite"
          >
            <Check className="w-3 h-3" />
            Pendências desfeitas
          </div>
        )}

        <AlertDialog open={confirmRevertOpen} onOpenChange={setConfirmRevertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Descartar alterações pendentes?</AlertDialogTitle>
              <AlertDialogDescription>
                {diffCount > 0
                  ? `Você tem ${diffCount} alteração${diffCount === 1 ? '' : 'ões'} de canal pendente${diffCount === 1 ? '' : 's'} que ainda não foram aplicadas. Esta ação restaura a seleção para os filtros aplicados atuais.`
                  : 'Esta ação restaura a seleção para os filtros aplicados atuais.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={revert}>Descartar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <RecentChannelCombos
        history={history}
        current={safe}
        onApply={applyCombo}
        onRemove={removeCombo}
        onClearAll={clearHistory}
      />
     </div>
    </TooltipProvider>
  );
});
