import { useMemo, useState } from 'react';
import { Pencil, Trash2, ChevronDown, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useToast } from '@/hooks/use-toast';
import { ANNOTATION_CATEGORIES } from './annotationCategories';
import type { AnnotationCategory, SentimentAnnotation, useSentimentAnnotations } from '@/hooks/useSentimentAnnotations';
import { cn } from '@/lib/utils';

interface Props {
  api: ReturnType<typeof useSentimentAnnotations>;
  onEdit: (a: SentimentAnnotation) => void;
  categoryFilter?: Set<AnnotationCategory>;
}

function formatWeekRange(iso: string): string {
  const start = new Date(iso + 'T00:00:00');
  if (isNaN(start.getTime())) return iso;
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  return `${fmt(start)} – ${fmt(end)}`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AnnotationList({ api, onEdit, categoryFilter }: Props) {
  const [open, setOpen] = useState(false);
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<SentimentAnnotation | null>(null);
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const items = useMemo(() => {
    const all = api.list.data ?? [];
    return categoryFilter ? all.filter((a) => categoryFilter.has(a.category)) : all;
  }, [api.list.data, categoryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, SentimentAnnotation[]>();
    for (const a of items) {
      const arr = map.get(a.week_start) ?? [];
      arr.push(a);
      map.set(a.week_start, arr);
    }
    // Já vem ordenado desc por week_start no hook
    return Array.from(map.entries());
  }, [items]);

  const toggleWeek = (week: string) => {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDelete) return;
    try {
      await api.remove.mutateAsync(pendingDelete.id);
      toast({ title: 'Anotação excluída' });
    } catch (err) {
      toast({
        title: 'Erro ao excluir',
        description: err instanceof Error ? err.message : 'Tente novamente',
        variant: 'destructive',
      });
    } finally {
      setPendingDelete(null);
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      <div className="rounded-md border border-border">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium hover:bg-muted/50 transition-colors"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            Anotações{' '}
            <span className="text-muted-foreground tabular-nums">
              ({items.length} em {grouped.length} {grouped.length === 1 ? 'semana' : 'semanas'})
            </span>
          </span>
          <span className="text-[10px] text-muted-foreground">
            clique para {open ? 'recolher' : 'expandir'}
          </span>
        </button>
        {open && (
          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {grouped.map(([week, anns]) => {
              const weekCollapsed = collapsedWeeks.has(week);
              return (
                <div key={week} className="bg-background">
                  <button
                    type="button"
                    onClick={() => toggleWeek(week)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] font-medium bg-muted/40 hover:bg-muted/70 transition-colors"
                    aria-expanded={!weekCollapsed}
                  >
                    <span className="flex items-center gap-1.5 text-foreground">
                      {weekCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      <CalendarDays className="h-3 w-3 text-muted-foreground" aria-hidden />
                      Semana de {formatWeekRange(week)}
                    </span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {anns.length} {anns.length === 1 ? 'anotação' : 'anotações'}
                    </span>
                  </button>
                  {!weekCollapsed && (
                    <ul className="divide-y divide-border/60">
                      {anns.map((a) => {
                        const meta = ANNOTATION_CATEGORIES[a.category];
                        const Icon = meta.icon;
                        const isOwner = !!user && a.created_by === user.id;
                        const canEdit = isOwner;
                        const canDelete = isOwner || isAdmin;
                        return (
                          <li key={a.id} className="px-3 py-2 flex items-start gap-2">
                            <span
                              className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm"
                              style={{ backgroundColor: meta.color }}
                              aria-hidden
                            >
                              <Icon
                                className="h-3 w-3"
                                style={{ color: 'hsl(var(--background))' }}
                                strokeWidth={2.5}
                              />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={cn('text-[10px] gap-1', meta.badgeClass)}
                                >
                                  {meta.label}
                                </Badge>
                                {!isOwner && (
                                  <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                                    de outro usuário
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-medium text-foreground mt-1 break-words">
                                {a.title}
                              </p>
                              {a.description && (
                                <p className="text-[11px] text-muted-foreground mt-0.5 break-words whitespace-pre-wrap">
                                  {a.description}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-1">
                                criado em {formatDateTime(a.created_at)}
                                {a.updated_at && a.updated_at !== a.created_at && (
                                  <> · editado em {formatDateTime(a.updated_at)}</>
                                )}
                              </p>
                            </div>
                            {(canEdit || canDelete) && (
                              <div className="flex items-center gap-1 shrink-0">
                                {canEdit && (
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="ghost"
                                    onClick={() => onEdit(a)}
                                    title="Editar"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="ghost"
                                    onClick={() => setPendingDelete(a)}
                                    title={isAdmin && !isOwner ? 'Excluir (admin)' : 'Excluir'}
                                    disabled={api.remove.isPending}
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!pendingDelete} onOpenChange={(v) => !v && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anotação?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && (
                <>
                  &quot;{pendingDelete.title}&quot; — Semana de{' '}
                  {formatWeekRange(pendingDelete.week_start)}. Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
