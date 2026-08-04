import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContactDaysWithout } from '@/hooks/useContactDaysWithout';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ContactDaysWithoutWidget = React.memo(function ContactDaysWithoutWidget({ contactId }: { contactId: string }) {
  const { data, isLoading } = useContactDaysWithout(contactId);

  if (isLoading) return <Card><CardContent className="py-3"><Skeleton className="h-8" /></CardContent></Card>;
  if (!data) return null;

  const days = data.days ?? 0;
  const color = days > 30 ? 'text-destructive' : days > 14 ? 'text-warning' : 'text-success';
  const Icon = days > 30 ? AlertTriangle : days > 14 ? Clock : CheckCircle;
  const label = days > 30 ? 'Urgente' : days > 14 ? 'Atenção' : 'Em dia';

  return (
    <Card className={cn(days > 30 && "border-destructive/20", days > 14 && days <= 30 && "border-warning/20")}>
      <CardContent className="py-3 flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", days > 30 ? "bg-destructive/10" : days > 14 ? "bg-warning/10" : "bg-success/10")}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-lg font-bold tabular-nums", color)}>{days}d</span>
            <span className="text-xs text-muted-foreground">sem contato</span>
            <Badge variant="outline" className={cn("text-[9px] ml-auto", color)}>{label}</Badge>
          </div>
          {data.last_contact_date && (
            <p className="text-[10px] text-muted-foreground">Último: {new Date(data.last_contact_date).toLocaleDateString('pt-BR')}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

export default ContactDaysWithoutWidget;
