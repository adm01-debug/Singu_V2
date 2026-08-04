import { useState } from 'react';
import { AlertTriangle, GitMerge, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { updateExternalData, queryExternalData } from '@/lib/externalData';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

interface Props {
  contactId: string;
  contactName: string;
  isDuplicate: boolean;
  duplicateOfId?: string | null;
}

export function DuplicateManagementPanel({ contactId, contactName, isDuplicate, duplicateOfId }: Props) {
  const [marking, setMarking] = useState(false);
  const [unmarking, setUnmarking] = useState(false);
  const [originalName, setOriginalName] = useState<string | null>(null);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const queryClient = useQueryClient();

  const handleMarkAsDuplicate = async () => {
    setMarking(true);
    try {
      const { error } = await updateExternalData('contacts', contactId, { is_duplicate: true });
      if (error) throw error;
      toast.success('Contato marcado como duplicado');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (err) {
      logger.error('Error marking duplicate:', err);
      toast.error('Erro ao marcar como duplicado');
    } finally {
      setMarking(false);
    }
  };

  const handleUnmarkDuplicate = async () => {
    setUnmarking(true);
    try {
      const { error } = await updateExternalData('contacts', contactId, {
        is_duplicate: false,
        duplicate_of: null,
      });
      if (error) throw error;
      toast.success('Flag de duplicação removida');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (err) {
      logger.error('Error unmarking duplicate:', err);
      toast.error('Erro ao remover flag de duplicação');
    } finally {
      setUnmarking(false);
    }
  };

  const loadOriginalContact = async () => {
    if (!duplicateOfId || originalName) return;
    setLoadingOriginal(true);
    try {
      const { data } = await queryExternalData<{ first_name: string; last_name: string }>({
        table: 'contacts',
        select: 'first_name,last_name',
        filters: [{ type: 'eq', column: 'id', value: duplicateOfId }],
        range: { from: 0, to: 0 },
      });
      if (data?.[0]) {
        setOriginalName(`${data[0].first_name} ${data[0].last_name}`);
      }
    } catch {
      setOriginalName('Não encontrado');
    } finally {
      setLoadingOriginal(false);
    }
  };

  if (!isDuplicate) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
            <AlertTriangle className="h-3 w-3" />
            Marcar Duplicado
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Marcar como Duplicado</DialogTitle>
            <DialogDescription className="text-xs">
              Isso marca "{contactName}" como duplicado no banco de dados. O contato será sinalizado para revisão futura.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button size="sm" className="flex-1" onClick={handleMarkAsDuplicate} disabled={marking}>
              {marking ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-warning">
          <GitMerge className="h-4 w-4" />
          Contato Duplicado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-[10px]">Duplicado</Badge>
          <span className="text-xs text-muted-foreground">Este contato foi marcado como duplicado</span>
        </div>

        {duplicateOfId && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Original:</span>
            {originalName ? (
              <span className="text-xs font-medium">{originalName}</span>
            ) : (
              <Button variant="ghost" size="sm" className="h-5 px-2 text-[10px]" onClick={loadOriginalContact} disabled={loadingOriginal}>
                {loadingOriginal ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Eye className="h-3 w-3 mr-0.5" />Ver original</>}
              </Button>
            )}
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={handleUnmarkDuplicate} disabled={unmarking}>
          {unmarking ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Remover flag de duplicação
        </Button>
      </CardContent>
    </Card>
  );
}
