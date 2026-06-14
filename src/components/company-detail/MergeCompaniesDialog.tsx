import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Merge } from 'lucide-react';
import { useMergeCompanies } from '@/hooks/useCompanyActions';

interface MergeCompaniesDialogProps {
  primaryCompanyId?: string;
  primaryCompanyName?: string;
  trigger?: React.ReactNode;
}

export function MergeCompaniesDialog({ primaryCompanyId, primaryCompanyName, trigger }: MergeCompaniesDialogProps) {
  const [open, setOpen] = useState(false);
  const [primaryId, setPrimaryId] = useState(primaryCompanyId ?? '');
  const [secondaryId, setSecondaryId] = useState('');
  const merge = useMergeCompanies();

  const handleMerge = async () => {
    if (!primaryId || !secondaryId) return;
    await merge.mutateAsync({ primaryId, secondaryId });
    setOpen(false);
    setSecondaryId('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Merge className="h-4 w-4 mr-2" />
            Mesclar Empresas
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5 text-primary" />
            Mesclar Empresas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              A empresa secundária será mesclada na empresa principal. Contatos, interações e negócios
              serão transferidos. Esta ação não pode ser desfeita.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Empresa Principal (mantida)</Label>
            {primaryCompanyName ? (
              <div className="p-2 bg-muted/50 rounded text-sm font-medium">{primaryCompanyName}</div>
            ) : (
              <Input
                placeholder="ID da empresa principal"
                value={primaryId}
                onChange={(e) => setPrimaryId(e.target.value)}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>Empresa Secundária (será absorvida)</Label>
            <Input
              placeholder="ID da empresa a ser mesclada"
              value={secondaryId}
              onChange={(e) => setSecondaryId(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleMerge}
              disabled={!primaryId || !secondaryId || merge.isPending}
            >
              {merge.isPending ? 'Mesclando...' : 'Confirmar Mesclagem'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
