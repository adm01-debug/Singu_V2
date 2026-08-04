import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { parseApiError } from '@/lib/errorMessages';
import { ANNOTATION_CATEGORIES, CATEGORY_KEYS } from './annotationCategories';
import type { AnnotationCategory, SentimentAnnotation, useSentimentAnnotations } from '@/hooks/useSentimentAnnotations';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contactId: string;
  weekOptions: string[]; // ISO YYYY-MM-DD
  defaultWeek?: string;
  editing?: SentimentAnnotation | null;
  api: ReturnType<typeof useSentimentAnnotations>;
}

function formatWeekLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function AnnotationDialog({ open, onOpenChange, contactId, weekOptions, defaultWeek, editing, api }: Props) {
  const { toast } = useToast();
  const [week, setWeek] = useState<string>('');
  const [category, setCategory] = useState<AnnotationCategory>('campanha');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setWeek(editing.week_start);
      setCategory(editing.category);
      setTitle(editing.title);
      setDescription(editing.description ?? '');
    } else {
      setWeek(defaultWeek ?? weekOptions[weekOptions.length - 1] ?? '');
      setCategory('campanha');
      setTitle('');
      setDescription('');
    }
  }, [open, editing, defaultWeek, weekOptions]);

  const submitting = api.create.isPending || api.update.isPending;
  const canSubmit = !!week && title.trim().length > 0 && title.length <= 80 && description.length <= 500;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      if (editing) {
        await api.update.mutateAsync({
          id: editing.id,
          week_start: week,
          category,
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
        });
        toast({ title: 'Anotação atualizada' });
      } else {
        await api.create.mutateAsync({
          contact_id: contactId,
          week_start: week,
          category,
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
        });
        toast({ title: 'Anotação criada' });
      }
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Erro ao salvar anotação',
        description: parseApiError(err, 'Tente novamente'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar anotação' : 'Nova anotação'}</DialogTitle>
          <DialogDescription>
            Marque um evento (campanha, mudança de abordagem, release...) para correlacionar com o sentimento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Semana</Label>
              <Select value={week} onValueChange={setWeek}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Escolha" /></SelectTrigger>
                <SelectContent>
                  {weekOptions.map((w) => (
                    <SelectItem key={w} value={w}>{formatWeekLabel(w)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AnnotationCategory)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_KEYS.map((k) => {
                    const meta = ANNOTATION_CATEGORIES[k];
                    const Icon = meta.icon;
                    return (
                      <SelectItem key={k} value={k}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                          {meta.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Título <span className="text-muted-foreground">({title.length}/80)</span></Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 80))}
              placeholder="Ex.: Lançamento campanha de retenção"
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Descrição <span className="text-muted-foreground">({description.length}/500)</span></Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="Detalhes opcionais"
              rows={3}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? 'Salvando...' : editing ? 'Salvar' : 'Criar anotação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
