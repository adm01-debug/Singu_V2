import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Phone, Mail, Calendar, List, Clock, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  contactId: string;
  channelCounts: Record<string, number>;
  companyId?: string | null;
}

interface Chip {
  label: string;
  to: string;
  icon: typeof MessageSquare;
  count?: number;
}

export const ConversasRelacionadasCard = memo(({ contactId, channelCounts, companyId }: Props) => {
  const chips: Chip[] = [
    { label: 'Todas as conversas', to: `/interacoes?contact=${contactId}`, icon: List, count: channelCounts.total },
    { label: 'Timeline cronológica', to: `/interacoes?tab=timeline&contact=${contactId}`, icon: Clock },
    { label: 'WhatsApp', to: `/interacoes?contact=${contactId}&canal=whatsapp`, icon: MessageSquare, count: channelCounts.whatsapp },
    { label: 'E-mails', to: `/interacoes?contact=${contactId}&canal=email`, icon: Mail, count: channelCounts.email },
    { label: 'Ligações', to: `/interacoes?contact=${contactId}&canal=call`, icon: Phone, count: channelCounts.call },
    { label: 'Reuniões', to: `/interacoes?contact=${contactId}&canal=meeting`, icon: Calendar, count: channelCounts.meeting },
    ...(companyId
      ? [{ label: 'Interações da empresa por pessoa', to: `/empresas/${companyId}?tab=interactions`, icon: Building2 } as Chip]
      : []),
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Conversas Relacionadas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {chips.map((chip) => {
            const Icon = chip.icon;
            return (
              <Link
                key={chip.label}
                to={chip.to}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium truncate">{chip.label}</span>
                </div>
                {typeof chip.count === 'number' && chip.count > 0 && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {chip.count}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});
ConversasRelacionadasCard.displayName = 'ConversasRelacionadasCard';
