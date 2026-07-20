import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useMergeRecords } from '@/hooks/useMergeRecords';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  primaryId: string;
  secondaryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MergeContactsDialog({ primaryId, secondaryId, open, onOpenChange, onSuccess }: Props) {
  const merge = useMergeRecords();
  const [overrides, setOverrides] = useState<Record<string, unknown>>({});

  const { data: records, isLoading } = useQuery({
    queryKey: ['merge-details', primaryId, secondaryId],
    enabled: open && !!primaryId && !!secondaryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .in('id', [primaryId, secondaryId])
        .limit(1000);
      if (error) throw error;
      
      const primary = data.find(r => r.id === primaryId);
      const secondary = data.find(r => r.id === secondaryId);
      return { primary, secondary };
    }
  });

  const fields = [
    { key: 'first_name', label: 'Nome' },
    { key: 'last_name', label: 'Sobrenome' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefone' },
    { key: 'role_title', label: 'Cargo' },
    { key: 'company_id', label: 'Empresa' },
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'instagram', label: 'Instagram' },
    { key: 'notes', label: 'Notas' },
    { key: 'family_info', label: 'Família' },
  ];

  const handleMerge = async () => {
    await merge.mutateAsync({
      entity: 'contacts',
      primaryId,
      secondaryId,
      fieldOverrides: overrides
    });
    onOpenChange(false);
    onSuccess?.();
  };

  const getDisplayValue = (val: unknown, fieldKey: string) => {
    if (val === null || val === undefined || val === '') return <span className="text-muted-foreground italic">Vazio</span>;
    if (fieldKey === 'company_id') return <span className="text-[10px] truncate max-w-[100px]">{val as string}</span>;
    return val as string;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mesclar Contatos</DialogTitle>
          <DialogDescription>
            Escolha quais informações deseja manter. O contato secundário será excluído e suas interações serão mantidas se vinculadas ao ID primário.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando detalhes dos registros...</p>
          </div>
        ) : records?.primary && records?.secondary ? (
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-[10px] font-bold uppercase text-primary mb-1">Registro Primário (Mantido)</p>
                  <p className="text-sm font-medium">{records.primary.first_name} {records.primary.last_name}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted border border-border">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Registro Secundário (Removido)</p>
                  <p className="text-sm font-medium">{records.secondary.first_name} {records.secondary.last_name}</p>
                </div>
              </div>

              <div className="space-y-4">
                {fields.map((field) => {
                  const pVal = (records.primary as Record<string, unknown>)[field.key];
                  const sVal = (records.secondary as Record<string, unknown>)[field.key];
                  
                  // Only show field if values are different and secondary has a value
                  if (pVal === sVal || (sVal === null || sVal === '')) return null;

                  return (
                    <div key={field.key} className="space-y-2 border-b pb-4 last:border-0">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{field.label}</Label>
                      <RadioGroup 
                        value={overrides[field.key] !== undefined ? 'secondary' : 'primary'}
                        onValueChange={(val) => {
                          if (val === 'secondary') {
                            setOverrides(prev => ({ ...prev, [field.key]: sVal }));
                          } else {
                            const newOverrides = { ...overrides };
                            delete newOverrides[field.key];
                            setOverrides(newOverrides);
                          }
                        }}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2 p-2 rounded border hover:bg-accent transition-colors">
                          <RadioGroupItem value="primary" id={`p-${field.key}`} />
                          <Label htmlFor={`p-${field.key}`} className="flex-1 cursor-pointer text-xs">
                            {getDisplayValue(pVal, field.key)}
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-2 rounded border border-warning/20 bg-warning/5 hover:bg-warning/10 transition-colors">
                          <RadioGroupItem value="secondary" id={`s-${field.key}`} />
                          <Label htmlFor={`s-${field.key}`} className="flex-1 cursor-pointer text-xs font-medium">
                            {getDisplayValue(sVal, field.key)}
                            <Badge variant="outline" className="ml-2 text-[8px] h-3 px-1 uppercase border-warning/30 text-warning">Substituir</Badge>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">Erro ao carregar registros.</div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={merge.isPending}>Cancelar</Button>
          <Button onClick={handleMerge} disabled={merge.isPending || isLoading}>
            {merge.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Confirmar Mesclagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
