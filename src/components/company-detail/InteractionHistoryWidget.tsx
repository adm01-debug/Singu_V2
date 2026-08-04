import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useInteractionHistory } from '@/hooks/useInteractionsRpc';
import { MessageSquare, Phone, Mail, Video, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const TYPE_ICON: Record<string, React.ElementType> = {
  call: Phone, email: Mail, meeting: Video, whatsapp: MessageSquare, note: FileText,
};
const TYPE_COLOR: Record<string, string> = {
  call: 'text-primary', email: 'text-warning', meeting: 'text-success', whatsapp: 'text-success', note: 'text-muted-foreground',
};

export const InteractionHistoryWidget = React.memo(function InteractionHistoryWidget({ companyId }: { companyId: string }) {
  const { data: interactions, isLoading } = useInteractionHistory(companyId, undefined, 10);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Histórico</CardTitle></CardHeader><CardContent><Skeleton className="h-32" /></CardContent></Card>;
  if (!interactions || interactions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />Últimas Interações
          <Badge variant="outline" className="text-[10px] ml-auto">{interactions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-[280px] overflow-y-auto">
          {interactions.map((item) => {
            const Icon = TYPE_ICON[item.type] || MessageSquare;
            const color = TYPE_COLOR[item.type] || 'text-muted-foreground';
            return (
              <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg border text-xs">
                <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", color)} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground line-clamp-1">{item.resumo || item.type}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                    {item.contact_name && <span className="truncate">{item.contact_name}</span>}
                    <span>{format(new Date(item.data_interacao), "dd/MM HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0">{item.channel || item.direction}</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

export default InteractionHistoryWidget;
