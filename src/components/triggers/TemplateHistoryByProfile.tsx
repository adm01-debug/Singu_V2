import { useState } from 'react';
import { Users, BarChart3, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DISCProfile } from '@/types';
import { TemplateHistoryByProfileProps } from './template-history/types';
import { ProfileCard } from './template-history/ProfileCard';
import { TemplateByProfileView } from './template-history/TemplateByProfileView';
import { useTemplateHistoryMetrics } from './template-history/useTemplateHistoryMetrics';

export function TemplateHistoryByProfile({ className }: TemplateHistoryByProfileProps) {
  const [expandedProfile, setExpandedProfile] = useState<DISCProfile | null>(null);
  const [viewMode, setViewMode] = useState<'by-profile' | 'by-template'>('by-profile');
  const { profileMetrics, templateMetrics, isLoading, hasData } = useTemplateHistoryMetrics();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3"><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Histórico por Perfil
          </CardTitle>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="by-profile">
                <div className="flex items-center gap-2"><Users className="w-4 h-4" />Por Perfil</div>
              </SelectItem>
              <SelectItem value="by-template">
                <div className="flex items-center gap-2"><Eye className="w-4 h-4" />Por Template</div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">Métricas de sucesso de templates por perfil DISC</p>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground/70 mb-4" />
            <p className="text-sm text-muted-foreground mb-2">Nenhum dado de histórico com perfil DISC</p>
            <p className="text-xs text-muted-foreground">Configure o perfil DISC dos seus contatos para ver métricas por perfil</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            {viewMode === 'by-profile' ? (
              <div className="space-y-3">
                {(['D', 'I', 'S', 'C'] as DISCProfile[]).map((profile) => (
                  <ProfileCard
                    key={profile}
                    metrics={profileMetrics[profile]}
                    isExpanded={expandedProfile === profile}
                    onToggle={() => setExpandedProfile(expandedProfile === profile ? null : profile)}
                  />
                ))}
              </div>
            ) : (
              <TemplateByProfileView templateMetrics={templateMetrics} />
            )}
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
