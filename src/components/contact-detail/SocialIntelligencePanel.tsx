import { Globe, Linkedin, Instagram, Twitter, Bell, TrendingUp, Users, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useSocialIntelligence } from '@/hooks/useSocialIntelligence';
import { format } from 'date-fns';

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
};

interface Props {
  contactId: string;
}

export function SocialIntelligencePanel({ contactId }: Props) {
  const { profiles, behaviorAnalysis, lifeEvents, loading, dismissEvent } = useSocialIntelligence(contactId);

  if (loading) return null;

  const hasData = profiles.length > 0 || behaviorAnalysis || lifeEvents.length > 0;
  if (!hasData) return null;

  return (
    <div className="space-y-4" id="social-intelligence-section">
      {/* Social Profiles */}
      {profiles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-primary" />
              Perfis Sociais ({profiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {profiles.map(p => {
              const Icon = PLATFORM_ICONS[p.platform] || Globe;
              return (
                <div key={p.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm text-foreground capitalize">{p.platform}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {p.followers_count != null && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {p.followers_count.toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  {p.headline && <p className="text-xs text-muted-foreground">{p.headline}</p>}
                  {p.current_position && p.current_company && (
                    <p className="text-xs text-foreground">{p.current_position} @ {p.current_company}</p>
                  )}
                  {p.skills && p.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.skills.slice(0, 6).map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {p.skills.length > 6 && (
                        <Badge variant="outline" className="text-xs">+{p.skills.length - 6}</Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Behavior Analysis */}
      {behaviorAnalysis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-info" />
              Análise Comportamental Social
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {behaviorAnalysis.executive_summary && (
              <p className="text-sm text-foreground">{behaviorAnalysis.executive_summary}</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {behaviorAnalysis.overall_sentiment && (
                <div className="rounded-lg border p-2 text-center">
                  <p className="text-xs text-muted-foreground">Sentimento</p>
                  <p className="font-medium text-sm capitalize text-foreground">{behaviorAnalysis.overall_sentiment}</p>
                </div>
              )}
              {behaviorAnalysis.influence_level && (
                <div className="rounded-lg border p-2 text-center">
                  <p className="text-xs text-muted-foreground">Influência</p>
                  <p className="font-medium text-sm capitalize text-foreground">{behaviorAnalysis.influence_level}</p>
                </div>
              )}
            </div>
            {behaviorAnalysis.interests && (behaviorAnalysis.interests as string[]).length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Interesses</p>
                <div className="flex flex-wrap gap-1">
                  {(behaviorAnalysis.interests as string[]).slice(0, 8).map(i => (
                    <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                  ))}
                </div>
              </div>
            )}
            {behaviorAnalysis.confidence != null && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Confiança</span>
                <Progress value={Number(behaviorAnalysis.confidence)} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground">{Number(behaviorAnalysis.confidence)}%</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Life Events */}
      {lifeEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-warning" />
              Eventos Sociais ({lifeEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lifeEvents.map(e => (
              <div key={e.id} className="flex items-start justify-between rounded-lg border p-2.5 text-sm">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{e.platform}</Badge>
                    <span className="text-xs text-muted-foreground capitalize">{e.event_type.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="font-medium text-foreground mt-1">{e.event_title}</p>
                  {e.event_description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{e.event_description}</p>
                  )}
                  {e.event_date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(e.event_date), 'dd/MM/yyyy')}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground"
                  onClick={() => dismissEvent(e.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
