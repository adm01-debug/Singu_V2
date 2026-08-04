import { memo } from 'react';
import { Phone, Mail, MapPin, Globe, Users, BarChart3, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Props {
  counts: {
    phones: number;
    emails: number;
    addresses: number;
    socials: number;
    relatives: number;
    hasTime: boolean;
  };
}

export const DataSummaryStrip = memo(function DataSummaryStrip({ counts }: Props) {
  const items = [
    { icon: Phone, label: 'Telefones', count: counts.phones, color: 'text-primary' },
    { icon: Mail, label: 'Emails', count: counts.emails, color: 'text-info' },
    { icon: MapPin, label: 'Endereços', count: counts.addresses, color: 'text-accent' },
    { icon: Globe, label: 'Sociais', count: counts.socials, color: 'text-secondary' },
    { icon: Users, label: 'Relacionados', count: counts.relatives, color: 'text-warning' },
  ];
  const total = items.reduce((s, i) => s + i.count, 0);

  return (
    <Card className="mb-4">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{total} registros</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <item.icon className={cn('h-3.5 w-3.5', item.color)} />
              <span className="text-xs text-muted-foreground">{item.count}</span>
            </div>
          ))}
          {counts.hasTime && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5 text-success" />
                <span className="text-xs text-muted-foreground">Heatmap</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
