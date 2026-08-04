import { Database, ExternalLink, Building2, Users, MapPin, Globe, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompaniesCompletoView } from '@/hooks/useCompaniesCompletoView';

interface Props {
  companyId: string;
}

export function CompanyEnrichedCard({ companyId }: Props) {
  const { data, isLoading, error } = useCompaniesCompletoView(companyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3"><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-24" /></CardContent>
      </Card>
    );
  }

  if (error || !data) return null; // Silently hide if view is unavailable

  const record = data as Record<string, unknown>;

  // Extract enriched fields not already shown in main profile
  const enrichedFields = [
    { label: 'Total Contatos', value: record.total_contacts, icon: Users },
    { label: 'Total Interações', value: record.total_interactions, icon: Database },
    { label: 'Score Médio', value: record.avg_relationship_score, icon: Building2 },
    { label: 'Último Contato', value: record.last_interaction_at, icon: ExternalLink },
    { label: 'Cidade', value: record.city || record.cidade, icon: MapPin },
    { label: 'Estado', value: record.state || record.estado, icon: MapPin },
    { label: 'Website', value: record.website, icon: Globe },
    { label: 'Telefone', value: record.phone || record.telefone, icon: Phone },
    { label: 'Email', value: record.email, icon: Mail },
  ].filter(f => f.value != null && f.value !== '' && f.value !== 0);

  if (enrichedFields.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Database className="h-4 w-4 text-primary" />
          Dados Enriquecidos
          <Badge variant="outline" className="text-[10px] ml-auto">View 360°</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {enrichedFields.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/30">
              <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground truncate text-xs">
                  {typeof value === 'number' ? value.toLocaleString('pt-BR') : String(value)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
