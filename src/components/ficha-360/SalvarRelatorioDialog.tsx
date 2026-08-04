import { memo, useEffect, useId, useState } from 'react';
import { periodLabelShort } from '@/lib/ficha360Formatters';
import { Save, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { FilterFavorite } from '@/hooks/useFicha360FilterFavorites';
import type { InteractionTag } from '@/lib/interactionTags';

const MAX_NAME = 40;
const MAX_DESC = 200;

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Ligação',
  email: 'Email',
  meeting: 'Reunião',
  note: 'Nota',
};

function buildPreview(
  days: number,
  channels: string[],
  tags: InteractionTag[],
  q: string,
): string {
  const parts: string[] = [periodLabelShort(days)];
  if (channels.length === 0) parts.push('Todos os canais');
  else parts.push(channels.map((c) => CHANNEL_LABELS[c] ?? c).join('+'));
  if (tags.length > 0) parts.push(`${tags.length} tag${tags.length === 1 ? '' : 's'}`);
  if (q.trim()) parts.push(`busca "${q.trim().slice(0, 20)}"`);
  return parts.join(' · ');
}

interface Props {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  mode: 'create' | 'edit';
  /** Filtros capturados (para criar) ou do preset (para editar). */
  days: number;
  channels: string[];
  tags: InteractionTag[];
  q: string;
  /** Sugestão inicial de nome (em create). */
  suggestedName: string;
  /** Preset existente em modo edit. */
  preset?: FilterFavorite;
  /** Lista de nomes já usados (excluindo o próprio em edit) — para checagem visual. */
  takenNames: string[];
  onSubmit: (data: { name: string; description?: string; autoOpenSummary: boolean }) => void;
}

export const SalvarRelatorioDialog = memo(function SalvarRelatorioDialog({
  open,
  onOpenChange,
  mode,
  days,
  channels,
  tags,
  q,
  suggestedName,
  preset,
  takenNames,
  onSubmit,
}: Props) {
  const titleId = useId();
  const switchHelpId = useId();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [autoOpenSummary, setAutoOpenSummary] = useState(true);

  // Reset ao abrir
  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && preset) {
      setName(preset.name);
      setDescription(preset.description ?? '');
      setAutoOpenSummary(preset.autoOpenSummary !== false);
    } else {
      setName(suggestedName);
      setDescription('');
      setAutoOpenSummary(true);
    }
  }, [open, mode, preset, suggestedName]);

  const trimmedName = name.trim();
  const nameInvalid = trimmedName.length === 0;
  const nameCollides = takenNames
    .map((n) => n.toLowerCase())
    .includes(trimmedName.toLowerCase());
  const canSubmit = !nameInvalid;

  const preview = buildPreview(days, channels, tags, q);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: trimmedName,
      description: description.trim() || undefined,
      autoOpenSummary,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-labelledby={titleId}>
        <DialogHeader>
          <DialogTitle id={titleId} className="flex items-center gap-2">
            <Save className="h-4 w-4 text-primary" />
            {mode === 'edit' ? 'Editar relatório fixo' : 'Salvar relatório fixo'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Atualize nome, descrição e comportamento ao aplicar.'
              : 'Salve esta combinação de filtros como um relatório reutilizável.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview dos filtros */}
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              Filtros capturados
            </p>
            <p className="text-sm font-medium break-words">{preview}</p>
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <label htmlFor="rel-name" className="text-sm font-medium">
              Nome <span className="text-destructive">*</span>
            </label>
            <Input
              id="rel-name"
              value={name}
              maxLength={MAX_NAME}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSubmit) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Ex.: Quentes 30d"
              autoFocus
              aria-invalid={nameInvalid}
            />
            <div className="flex items-center justify-between text-[11px]">
              {nameCollides ? (
                <span className="text-warning">
                  Nome já existe — será salvo com sufixo (2).
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {trimmedName.length}/{MAX_NAME}
                </span>
              )}
              <span className="text-muted-foreground">{name.length}/{MAX_NAME}</span>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <label htmlFor="rel-desc" className="text-sm font-medium">
              Descrição <span className="text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              id="rel-desc"
              value={description}
              maxLength={MAX_DESC}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Para que serve este relatório?"
              rows={3}
              className="resize-none"
            />
            <div className="text-right text-[11px] text-muted-foreground">
              {description.length}/{MAX_DESC}
            </div>
          </div>

          {/* Switch auto-resumo */}
          <div className="flex items-start gap-3 rounded-md border border-border bg-muted/20 px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <label
                htmlFor="rel-auto"
                className="text-sm font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Abrir resumo IA ao aplicar
              </label>
              <p id={switchHelpId} className="text-[11px] text-muted-foreground mt-0.5">
                Ao clicar no relatório, o resumo IA é gerado automaticamente.
              </p>
            </div>
            <Switch
              id="rel-auto"
              checked={autoOpenSummary}
              onCheckedChange={setAutoOpenSummary}
              aria-describedby={switchHelpId}
            />
          </div>

          {mode === 'create' && (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[10px]">
                Disponível em qualquer Ficha 360
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {mode === 'edit' ? 'Salvar alterações' : 'Salvar relatório'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
