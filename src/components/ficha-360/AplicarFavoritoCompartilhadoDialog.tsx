import { memo, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  decodeFavoriteFromToken,
  useFicha360FilterFavorites,
  type SharedFavoritePayload,
} from '@/hooks/useFicha360FilterFavorites';

interface Props {
  onApply: (days: number, channels: string[]) => void;
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  note: 'Nota',
};

const periodLabel = (d: number) =>
  d === 7 ? '7 dias' : d === 30 ? '30 dias' : d === 365 ? '1 ano' : '90 dias';

/**
 * Detecta `?favorito=<token>` na URL e exibe um diálogo permitindo aplicar
 * o filtro recebido (e opcionalmente salvar como favorito local).
 */
export const AplicarFavoritoCompartilhadoDialog = memo(
  function AplicarFavoritoCompartilhadoDialog({ onApply }: Props) {
    const [params, setParams] = useSearchParams();
    const token = params.get('favorito');

    const payload = useMemo<SharedFavoritePayload | null>(
      () => (token ? decodeFavoriteFromToken(token) : null),
      [token],
    );

    const { importShared, findMatch } = useFicha360FilterFavorites();
    const [open, setOpen] = useState(false);

    useEffect(() => {
      if (token && payload) setOpen(true);
      else setOpen(false);
    }, [token, payload]);

    const clearParam = () => {
      const next = new URLSearchParams(params);
      next.delete('favorito');
      setParams(next, { replace: true });
    };

    const handleClose = (next: boolean) => {
      setOpen(next);
      if (!next) clearParam();
    };

    if (token && !payload) {
      // Token inválido — limpa silenciosamente para não poluir a URL
      clearParam();
      return null;
    }

    if (!payload) return null;

    const existing = findMatch(payload.days, payload.channels);

    const handleApplyOnly = () => {
      onApply(payload.days, payload.channels);
      toast.success('Filtro compartilhado aplicado.');
      handleClose(false);
    };

    const handleApplyAndSave = () => {
      const saved = importShared(payload);
      onApply(payload.days, payload.channels);
      if (saved) {
        toast.success(
          existing
            ? `Filtro aplicado (já estava salvo como "${saved.name}").`
            : `Filtro aplicado e salvo como "${saved.name}".`,
        );
      } else {
        toast.warning('Filtro aplicado, mas não foi possível salvar (limite atingido).');
      }
      handleClose(false);
    };

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-primary" />
              Filtro compartilhado recebido
            </DialogTitle>
            <DialogDescription>
              Alguém compartilhou um conjunto de filtros. Revise antes de aplicar à Ficha 360.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Star className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{payload.name}</p>
                <p className="text-xs text-muted-foreground">
                  Período: {periodLabel(payload.days)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {payload.channels.length === 0 ? (
                <Badge variant="outline" className="text-xs">
                  Todos os canais
                </Badge>
              ) : (
                payload.channels.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">
                    {CHANNEL_LABELS[c] ?? c}
                  </Badge>
                ))
              )}
            </div>
            {existing && (
              <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                Você já tem este favorito salvo como{' '}
                <span className="font-medium text-foreground">"{existing.name}"</span>.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="ghost" onClick={() => handleClose(false)}>
              Ignorar
            </Button>
            <Button variant="outline" onClick={handleApplyOnly}>
              Apenas aplicar
            </Button>
            <Button onClick={handleApplyAndSave} disabled={!!existing}>
              {existing ? 'Já salvo' : 'Aplicar e salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
