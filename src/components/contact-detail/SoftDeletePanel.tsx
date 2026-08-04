import { useState } from 'react';
import { Trash2, RotateCcw, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { updateExternalData } from '@/lib/externalData';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '@/lib/logger';

interface Props {
  contactId: string;
  contactName: string;
  deletedAt: string | null;
}

export function SoftDeletePanel({ contactId, contactName, deletedAt }: Props) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSoftDelete = async () => {
    setLoading(true);
    try {
      const { error } = await updateExternalData('contacts', contactId, {
        deleted_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success('Contato movido para lixeira');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (err) {
      logger.error('Error soft-deleting:', err);
      toast.error('Erro ao mover para lixeira');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const { error } = await updateExternalData('contacts', contactId, {
        deleted_at: null,
      });
      if (error) throw error;
      toast.success('Contato restaurado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (err) {
      logger.error('Error restoring:', err);
      toast.error('Erro ao restaurar contato');
    } finally {
      setLoading(false);
    }
  };

  if (deletedAt) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
            <Trash2 className="h-4 w-4" />
            Na Lixeira
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="destructive" className="text-[10px]">Excluído</Badge>
            <span className="text-xs text-muted-foreground">
              Removido em {format(new Date(deletedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1" onClick={handleRestore} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Restaurar contato
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3 w-3" />
          Mover para Lixeira
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Mover para Lixeira</DialogTitle>
          <DialogDescription className="text-xs">
            "{contactName}" será movido para a lixeira. Você poderá restaurá-lo a qualquer momento.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="destructive" className="flex-1" onClick={handleSoftDelete} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
            Mover para Lixeira
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
