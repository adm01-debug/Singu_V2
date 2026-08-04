import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { BRAZILIAN_STATES, getRegion } from '@/lib/brazilianStates';
import { useCreateTerritory, type Territory } from '@/hooks/useTerritories';
import { X } from 'lucide-react';

interface TerritoryFormProps {
  open: boolean;
  onClose: () => void;
  initial?: Partial<Territory>;
}

export function TerritoryForm({ open, onClose, initial }: TerritoryFormProps) {
  const createTerritory = useCreateTerritory();

  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [selectedStates, setSelectedStates] = useState<string[]>(
    initial?.state?.split(',').map(s => s.trim()).filter(Boolean) ?? []
  );
  const [cities, setCities] = useState(initial?.city ?? '');
  const [assignedTo, setAssignedTo] = useState(initial?.assigned_to ?? '');
  const [isActive, setIsActive] = useState(true);

  const toggleState = (uf: string) => {
    setSelectedStates(prev =>
      prev.includes(uf) ? prev.filter(s => s !== uf) : [...prev, uf]
    );
  };

  const region = selectedStates.length > 0
    ? [...new Set(selectedStates.map(getRegion))].join(', ')
    : '';

  const handleSubmit = () => {
    if (!name.trim()) return;

    createTerritory.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        state: selectedStates.join(', '),
        city: cities.trim() || undefined,
        region,
        assigned_to: assignedTo || undefined,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'Editar Território' : 'Novo Território'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="territory-name">Nome *</Label>
            <Input
              id="territory-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Região Sul"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="territory-desc">Descrição</Label>
            <Textarea
              id="territory-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descrição do território"
              rows={2}
            />
          </div>

          {/* States multi-select */}
          <div className="space-y-1.5">
            <Label>Estados</Label>
            {selectedStates.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedStates.map(uf => (
                  <Badge key={uf} variant="secondary" className="text-xs gap-1">
                    {uf}
                    <button type="button" onClick={() => toggleState(uf)} aria-label={`Remover ${uf}`}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto border rounded-md p-2">
              {BRAZILIAN_STATES.map(st => (
                <button
                  key={st.uf}
                  type="button"
                  onClick={() => toggleState(st.uf)}
                  className={`text-[11px] px-1.5 py-1 rounded-md border transition-colors ${
                    selectedStates.includes(st.uf)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:bg-muted'
                  }`}
                  title={st.name}
                >
                  {st.uf}
                </button>
              ))}
            </div>
            {region && (
              <p className="text-[10px] text-muted-foreground">Região: {region}</p>
            )}
          </div>

          {/* Cities */}
          <div className="space-y-1.5">
            <Label htmlFor="territory-cities">Cidades (separadas por vírgula)</Label>
            <Input
              id="territory-cities"
              value={cities}
              onChange={e => setCities(e.target.value)}
              placeholder="São Paulo, Campinas, Santos"
            />
          </div>

          {/* Assigned to */}
          <div className="space-y-1.5">
            <Label htmlFor="territory-assigned">ID do Gestor</Label>
            <Input
              id="territory-assigned"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              placeholder="UUID do gestor responsável"
            />
          </div>

          {/* Active */}
          <div className="flex items-center justify-between">
            <Label htmlFor="territory-active">Território ativo</Label>
            <Switch id="territory-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || createTerritory.isPending}
          >
            {createTerritory.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
