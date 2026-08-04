import { Handshake, TrendingUp, MessageSquare, Heart, Phone, Linkedin, Instagram, Twitter, Globe, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useRapportPoints } from '@/hooks/useRapportPoints';
import { useRapportIntel } from '@/hooks/useRapportIntelView';
import { useAIApprovals } from '@/hooks/useAIApprovals';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const LEVEL_COLORS: Record<string, string> = {
  excellent: 'text-success', good: 'text-info', moderate: 'text-warning', low: 'text-destructive',
};

export function RapportCard({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useRapportPoints(contactId);
  const { data: rapportIntel } = useRapportIntel(contactId);
  const { suggestions, approve, reject } = useAIApprovals(contactId);
  const icon = <Handshake className="h-4 w-4 text-success" />;

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp': return <MessageSquare className="h-3 w-3 text-green-500" />;
      case 'call': return <Phone className="h-3 w-3 text-blue-500" />;
      case 'linkedin': return <Linkedin className="h-3 w-3 text-blue-600" />;
      case 'instagram': return <Instagram className="h-3 w-3 text-pink-500" />;
      case 'twitter': return <Twitter className="h-3 w-3 text-sky-400" />;
      default: return <Globe className="h-3 w-3 text-muted-foreground" />;
    }
  };

  return (
    <ExternalDataCard title="Pontos de Rapport" icon={icon} isLoading={isLoading} error={error} hasData={!!data} emptyMessage="Sem dados de rapport" onRetry={refetch}>
      {data && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">{icon} Pontos de Rapport</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.length > 0 && (
              <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-3 mb-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-wider">
                  <Brain className="h-3 w-3" /> Sugestões para Revisão
                </div>
                <div className="space-y-2">
                  {suggestions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-2 bg-background rounded border border-border/50 shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {getSourceIcon(s.source)}
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">"{s.value}"</p>
                          <p className="text-[10px] text-muted-foreground">
                            {s.type === 'hobby' ? 'Hobby' : 'Interesse'} · {s.source}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button 
                          size="icon" aria-label="Confirmar" 
                          variant="ghost" 
                          className="h-6 w-6 text-green-500 hover:bg-green-50" 
                          onClick={() => approve.mutate(s)}
                          disabled={approve.isPending}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 text-destructive hover:bg-red-50"
                          aria-label="Rejeitar"
                          onClick={() => reject.mutate(s.id)}
                          disabled={reject.isPending}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-success/20">
                <span className="text-lg font-bold text-success">{data.rapport_score ?? '—'}</span>
              </div>
              <div>
                {data.rapport_level && <Badge variant="outline" className={cn('text-xs', LEVEL_COLORS[data.rapport_level] || '')}>{data.rapport_level}</Badge>}
                {data.rapport_status && <p className="text-xs text-muted-foreground mt-0.5">{data.rapport_status}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {data.pace && <div className="rounded border p-1.5 text-center"><p className="text-muted-foreground">Ritmo</p><p className="font-medium text-foreground">{data.pace}</p></div>}
              {data.tone && <div className="rounded border p-1.5 text-center"><p className="text-muted-foreground">Tom</p><p className="font-medium text-foreground">{data.tone}</p></div>}
              {data.detail_preference && <div className="rounded border p-1.5 text-center"><p className="text-muted-foreground">Detalhes</p><p className="font-medium text-foreground">{data.detail_preference}</p></div>}
              {data.decision_style && <div className="rounded border p-1.5 text-center"><p className="text-muted-foreground">Decisão</p><p className="font-medium text-foreground">{data.decision_style}</p></div>}
            </div>

            <div className="flex flex-wrap gap-1">
              {data.prefers_data && <Badge variant="secondary" className="text-[10px]">📊 Dados</Badge>}
              {data.prefers_stories && <Badge variant="secondary" className="text-[10px]">📖 Histórias</Badge>}
              {data.prefers_visuals && <Badge variant="secondary" className="text-[10px]">🎨 Visuais</Badge>}
            </div>

            {data.shared_interests && data.shared_interests.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Interesses Compartilhados</p>
                  <div className="flex flex-wrap gap-1">
                    {data.shared_interests.map((i, idx) => {
                      const source = (rapportIntel?.rapport_metadata as { interests?: Record<string, string>; top_values?: Record<string, string> } | null | undefined)?.interests?.[i];
                      return (
                        <Badge key={idx} variant="outline" className="text-[10px] gap-1">
                          {source && getSourceIcon(source)}
                          {i}
                        </Badge>
                      );
                    })}
                  </div>
              </div>
            )}

            {data.mirroring_tips && data.mirroring_tips.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1"><MessageSquare className="h-3 w-3" /> Dicas de Espelhamento</p>
                <ul className="space-y-0.5">{data.mirroring_tips.slice(0, 3).map((tip, i) => <li key={i} className="text-xs text-foreground">• {tip}</li>)}</ul>
              </div>
            )}

            {data.improvement_suggestions && data.improvement_suggestions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1"><TrendingUp className="h-3 w-3" /> Melhorias Sugeridas</p>
                <ul className="space-y-0.5">{data.improvement_suggestions.slice(0, 3).map((s, i) => <li key={i} className="text-xs text-muted-foreground">• {s}</li>)}</ul>
              </div>
            )}

            {rapportIntel && (
              <div className="border-t pt-2 space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Heart className="h-3 w-3" /> Intel de Rapport</p>
                {rapportIntel.top_values && rapportIntel.top_values.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {rapportIntel.top_values.map((v, i) => {
                      const source = (rapportIntel?.rapport_metadata as { interests?: Record<string, string>; top_values?: Record<string, string> } | null | undefined)?.top_values?.[v];
                      return (
                        <Badge key={i} variant="secondary" className="text-[10px] gap-1">
                          {source && getSourceIcon(source)}
                          💎 {v}
                        </Badge>
                      );
                    })}
                  </div>
                )}
                {rapportIntel.positive_anchors && rapportIntel.positive_anchors.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {rapportIntel.positive_anchors.map((a, i) => <Badge key={i} variant="outline" className="text-[10px] text-success">⚓ {a}</Badge>)}
                  </div>
                )}
                {rapportIntel.upcoming_events && rapportIntel.upcoming_events.length > 0 && (
                  <div className="text-xs text-primary">📅 {rapportIntel.upcoming_events[0]}</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </ExternalDataCard>
  );
}
