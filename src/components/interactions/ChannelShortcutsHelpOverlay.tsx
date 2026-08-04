import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MessageSquare,
  Phone,
  Mail,
  Users,
  Video,
  FileText,
  Eraser,
  Check,
  CornerDownLeft,
  Keyboard,
  Calendar as CalendarIcon,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useChannelSyncMode } from '@/hooks/useChannelSyncMode';
import { useAuth } from '@/hooks/useAuth';

const CHANNELS: Array<{
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Reunião', icon: Users },
  { value: 'video_call', label: 'Vídeo', icon: Video },
  { value: 'note', label: 'Nota', icon: FileText },
];

const PENDING_KEY_PREFIX = 'channel-pending-canais';

function readPending(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

interface KeyChipProps {
  children: React.ReactNode;
  active?: boolean;
}

function KeyChip({ children, active }: KeyChipProps) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded border text-[11px] font-mono font-semibold tabular-nums',
        active
          ? 'border-primary bg-primary/15 text-foreground'
          : 'border-border bg-muted/40 text-muted-foreground',
      )}
    >
      {children}
    </kbd>
  );
}

interface Props {
  /**
   * Canais atualmente aplicados (vindos da URL/estado avançado).
   */
  appliedCanais: string[];
  /**
   * Contagens por canal no escopo atual (mesmos números dos chips).
   * Usadas para indicar canais sem interações.
   */
  channelCounts?: Record<string, number>;
}

/**
 * Mini-dúvida contextual: ao pressionar `?` na página de Interações, abre um
 * diálogo com todos os atalhos de filtros de canal e destaca quais chips
 * estão ativos (aplicados e pendentes) no momento.
 *
 * Não interfere no cheatsheet global (`KeyboardShortcutsCheatsheet`) — o
 * primeiro listener a abrir um diálogo modal "rouba" o foco; mantemos os dois
 * coexistindo para o usuário escolher (este é mais focado/contextual).
 */
export const ChannelShortcutsHelpOverlay = React.memo(function ChannelShortcutsHelpOverlay({
  appliedCanais,
  channelCounts,
}: Props) {
  const { user } = useAuth();
  const pendingKey = `${PENDING_KEY_PREFIX}-${user?.id ?? 'anon'}`;
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<string[]>(() => readPending(pendingKey));
  const { mode } = useChannelSyncMode();

  const appliedSet = useMemo(() => new Set(appliedCanais), [appliedCanais]);
  const pendingSet = useMemo(() => new Set(pending), [pending]);

  // Atualiza a leitura do pending sempre que o overlay abrir e quando o
  // localStorage mudar em outra aba/janela.
  useEffect(() => {
    if (!open) return;
    setPending(readPending(pendingKey));
    const onStorage = (e: StorageEvent) => {
      if (e.key === pendingKey) setPending(readPending(pendingKey));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps estáveis (storage keys/user id/refs) — adicionar causaria re-execução desnecessária ou loop
  }, [open]);

  // Listener da tecla `?` (ou Shift+/). Ignorado quando o foco está em input
  // ou quando outra modal já está aberta.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const isQuestion = e.key === '?' || (e.shiftKey && e.key === '/');
      if (!isQuestion) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
      }
      // Co-existe com o cheatsheet global: ambos abrem em paralelo, e o
      // usuário pode fechar com Esc qualquer um deles.
      e.preventDefault();
      setOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const activeAppliedCount = appliedSet.size;
  const pendingDiff = useMemo(() => {
    if (mode !== 'manual') return [] as string[];
    const diff: string[] = [];
    for (const v of pendingSet) if (!appliedSet.has(v)) diff.push(v);
    for (const v of appliedSet) if (!pendingSet.has(v)) diff.push(v);
    return diff;
  }, [mode, appliedSet, pendingSet]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Atalhos de filtros de canal
          </DialogTitle>
          <DialogDescription>
            Pressione as teclas abaixo a qualquer momento — funcionam mesmo com o foco no campo de busca.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo do estado atual */}
        <div className="rounded-md border border-border bg-muted/30 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Modo de aplicação</span>
            <Badge variant="secondary" className="capitalize">{mode === 'manual' ? 'Manual' : 'Automático'}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Canais ativos agora</span>
            <span className="tabular-nums font-semibold text-foreground">
              {activeAppliedCount === 0 ? 'Nenhum (todos)' : `${activeAppliedCount} de ${CHANNELS.length}`}
            </span>
          </div>
          {mode === 'manual' && pendingDiff.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Alterações pendentes</span>
              <span className="tabular-nums font-semibold text-warning">
                {pendingDiff.length} canal{pendingDiff.length === 1 ? '' : 'is'}
              </span>
            </div>
          )}
        </div>

        {/* Atalhos por canal */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Por canal</p>
          {CHANNELS.map((ch, idx) => {
            const Icon = ch.icon;
            const isApplied = appliedSet.has(ch.value);
            const isPending = mode === 'manual' && pendingSet.has(ch.value) && !isApplied;
            const isPendingRemoval = mode === 'manual' && !pendingSet.has(ch.value) && isApplied;
            const count = channelCounts?.[ch.value] ?? 0;
            const noData = !!channelCounts && count === 0;

            return (
              <div
                key={ch.value}
                className={cn(
                  'flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border text-sm',
                  isApplied
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-card',
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <KeyChip active={isApplied}>Alt+{idx + 1}</KeyChip>
                  <Icon className={cn('w-4 h-4 shrink-0', isApplied ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('truncate', isApplied ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                    {ch.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {channelCounts && (
                    <span className={cn(
                      'text-[11px] tabular-nums',
                      noData ? 'text-muted-foreground/70' : 'text-muted-foreground',
                    )}>
                      {count}
                    </span>
                  )}
                  {isApplied && (
                    <Badge variant="default" className="h-5 px-1.5 text-[10px]">Ativo</Badge>
                  )}
                  {isPending && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-warning text-warning">
                      Pendente
                    </Badge>
                  )}
                  {isPendingRemoval && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-warning text-warning">
                      Será removido
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Atalhos gerais */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ações</p>
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-border bg-card text-sm">
            <div className="flex items-center gap-2">
              <KeyChip>Alt+0</KeyChip>
              <Eraser className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Limpar todos os canais</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-border bg-card text-sm">
            <div className="flex items-center gap-2">
              <KeyChip>Alt+D</KeyChip>
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Limpar filtro de datas (sem afetar outros)</span>
            </div>
          </div>
          {mode === 'manual' && (
            <>
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-border bg-card text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <KeyChip>Alt+Enter</KeyChip>
                  <span className="text-muted-foreground/70">ou</span>
                  <KeyChip>Ctrl/⌘+Enter</KeyChip>
                  <Check className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Aplicar canais pendentes</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-border bg-card text-sm">
                <div className="flex items-center gap-2">
                  <KeyChip>Esc</KeyChip>
                  <CornerDownLeft className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Descartar canais pendentes</span>
                </div>
              </div>
            </>
          )}
          <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-border bg-card text-sm">
            <div className="flex items-center gap-2">
              <KeyChip>?</KeyChip>
              <span className="text-muted-foreground">Abrir/fechar este painel</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={close} className="gap-1.5">
            <X className="w-3.5 h-3.5" />
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
