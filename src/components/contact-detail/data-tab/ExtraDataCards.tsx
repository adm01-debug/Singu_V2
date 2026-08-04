import { Database, ExternalLink, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Contact } from '@/hooks/useContactDetail';

interface Props {
  contact: Contact;
}

export function ExtraDataCard({ contact }: Props) {
  const extraData = (contact as Record<string, unknown>).extra_data;

  if (!extraData || (typeof extraData === 'object' && Object.keys(extraData as object).length === 0)) {
    return null;
  }

  const entries = Object.entries(extraData as Record<string, unknown>).filter(
    ([, v]) => v !== null && v !== undefined && v !== ''
  );

  if (entries.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4 text-primary" />
          Dados Extras
          <Badge variant="outline" className="ml-auto text-[10px]">
            {entries.length} campos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {entries.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 text-xs">
              <span className="text-muted-foreground font-medium shrink-0 min-w-[80px]">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-foreground break-all">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function BitrixIntegrationCard({ contact }: Props) {
  const raw = contact as Record<string, unknown>;
  const bitrixId = raw.bitrix_contact_id as number | null;
  const bitrixCreatedAt = raw.bitrix_created_at as string | null;
  const assignedById = raw.assigned_by_id as number | null;

  if (!bitrixId && !assignedById) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <ExternalLink className="h-4 w-4 text-primary" />
          Integração CRM
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {bitrixId && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">ID Bitrix</span>
            <Badge variant="outline" className="tabular-nums">{bitrixId}</Badge>
          </div>
        )}
        {bitrixCreatedAt && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Criado no Bitrix
            </span>
            <span className="text-foreground tabular-nums">
              {new Date(bitrixCreatedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
        {assignedById && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Atribuído por (ID)</span>
            <Badge variant="outline" className="tabular-nums">{assignedById}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
