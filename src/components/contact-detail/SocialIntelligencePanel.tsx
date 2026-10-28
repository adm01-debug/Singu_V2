 import { Globe, Linkedin, Instagram, Twitter, Bell, TrendingUp, Users, X, Heart, ShieldCheck, Lock, CheckCircle2, AlertCircle, Activity, RefreshCw, Zap, BrainCircuit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
 import { useSocialIntelligence } from '@/hooks/useSocialIntelligence';
 import { useSocialInsights } from '@/hooks/useSocialInsights';
import { format } from 'date-fns';
import { SocialInsightsError } from './SocialInsightsError';

const PLATFORM_ICONS: Record<string, typeof Globe> = {
  linkedin: Linkedin,
  instagram: Instagram,
  twitter: Twitter,
};

interface Props {
  contactId: string;
}

  export function SocialIntelligencePanel({ contactId }: Props) {
    const { 
      profiles, 
      behaviorAnalysis, 
      lifeEvents, 
      loading: loadingBase, 
      dismissEvent, 
      syncToPsychographic, 
      isSyncing 
    } = useSocialIntelligence(contactId);
   const { data: historyInsights, isError: historyError, refetch: refetchHistory, isFetching: historyFetching } = useSocialInsights(contactId);
 
   if (loadingBase) return null;

   const hasData = profiles.length > 0 || behaviorAnalysis || lifeEvents.length > 0 || (historyInsights && historyInsights.length > 0);
  if (!hasData && !historyError && !historyFetching) { return null; }

    return (
      <div className="space-y-4" id="social-intelligence-section">
        {historyError && <SocialInsightsError onRetry={() => { void refetchHistory(); }} isRetrying={historyFetching} />}
        {historyFetching && !historyError && !hasData && <p role="status" className="text-sm text-muted-foreground">Carregando histórico social...</p>}
        {hasData && <>
        {/* Intelligence Actions Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 mb-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] text-indigo-700 uppercase font-bold tracking-tighter">
              <Zap className="h-3 w-3 fill-indigo-500" />
              Inteligência Social Ativa
            </div>
            <p className="text-[11px] text-indigo-600/70">Sincronize interesses sociais com o perfil de vendas.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className={cn(
                "h-8 text-[10px] font-bold uppercase tracking-tighter gap-1.5 border-indigo-200 hover:bg-indigo-100 hover:text-indigo-700",
                isSyncing && "animate-pulse"
              )}
              onClick={() => syncToPsychographic()}
              disabled={isSyncing || !behaviorAnalysis}
            >
              {isSyncing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <BrainCircuit className="h-3.5 w-3.5" />
              )}
              {isSyncing ? "Sincronizando..." : "Sincronizar Perfil Psicográfico"}
            </Button>
            <Badge variant="outline" className="text-[9px] bg-white text-green-700 border-green-200 font-bold uppercase">
              LGPD OK
            </Badge>
          </div>
        </div>

        {/* Consent & Privacy Header - Compacted */}
        <div className="flex items-center justify-between bg-muted/30 p-1.5 px-3 rounded-lg border border-dashed mb-2 opacity-60">
         <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
           <Lock className="h-3 w-3" />
            Processamento Seguro e Anonimizado
          </div>
       </div>
        </>}
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

      {/* Negotiation Intelligence & Behavior */}
      {behaviorAnalysis && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader className="pb-3 border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-sm text-primary">
              <TrendingUp className="h-4 w-4" />
              Insights para Negociação (Social Intel)
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {behaviorAnalysis.executive_summary && (
              <p className="text-sm text-foreground leading-relaxed italic border-l-4 border-primary/30 pl-3">
                "{behaviorAnalysis.executive_summary}"
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              {behaviorAnalysis.overall_sentiment && (
                <div className="rounded-lg border bg-background p-2 text-center shadow-xs">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Sentimento</p>
                  <p className="font-semibold text-sm capitalize text-foreground flex items-center justify-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-red-400" />
                    {behaviorAnalysis.overall_sentiment}
                  </p>
                </div>
              )}
              {behaviorAnalysis.influence_level && (
                <div className="rounded-lg border bg-background p-2 text-center shadow-xs">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">Influência</p>
                  <p className="font-semibold text-sm capitalize text-foreground flex items-center justify-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    {behaviorAnalysis.influence_level}
                  </p>
                </div>
              )}
            </div>

            {/* Negotiation Tips from sales_insights */}
            {behaviorAnalysis.sales_insights && (
              <div className="space-y-3 bg-white/50 p-3 rounded-lg border border-primary/10">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" /> Estratégia de Negociação
                </p>
                <div className="grid gap-2">
                  {Object.entries(behaviorAnalysis.sales_insights as Record<string, string>).map(([key, insight], idx) => (
                    <div key={idx} className="bg-background p-2.5 rounded border border-border/50 text-xs">
                      <span className="font-bold text-muted-foreground block mb-1 uppercase text-[9px] tracking-tight">{key.replace(/_/g, ' ')}</span>
                      <p className="text-foreground leading-snug">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {behaviorAnalysis.interests && (behaviorAnalysis.interests as string[]).length > 0 && (
              <div className="bg-background/60 p-3 rounded-lg border border-border/50">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-red-500" />
                  Gatilhos de Rapport
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(behaviorAnalysis.interests as string[]).map(i => (
                    <Badge key={i} variant="secondary" className="text-xs px-2 py-0.5 bg-primary/5 text-primary border-primary/10">
                      {i}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {behaviorAnalysis.confidence != null && (
              <div className="flex items-center gap-2 pt-2 border-t border-primary/10">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Confiança Global</span>
                <Progress value={Number(behaviorAnalysis.confidence)} className="h-1.5 flex-1" />
                <span className="text-xs font-bold text-muted-foreground">{Number(behaviorAnalysis.confidence)}%</span>
              </div>
            )}
          </CardContent>

        </Card>
      )}

       {/* Social Performance Indicators (Captured Data) */}
       {historyInsights && historyInsights.length > 0 && (
         <Card className="border-indigo-500/10">
           <CardHeader className="pb-3 bg-indigo-50/30">
             <CardTitle className="flex items-center gap-2 text-sm text-indigo-950">
               <Activity className="h-4 w-4 text-indigo-600" />
               Indicadores de Perfil Social (Monitoramento)
             </CardTitle>
           </CardHeader>
           <CardContent className="pt-4">
             <div className="space-y-3">
               {historyInsights.map(insight => (
                 <div key={insight.id} className="p-2.5 rounded-lg border bg-white/50 space-y-2">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <Badge variant="outline" className="text-[9px] uppercase h-4">
                         {insight.platform}
                       </Badge>
                       <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                         {insight.insight_type.replace(/_/g, ' ')}
                       </span>
                     </div>
                     <div className="flex items-center gap-1.5">
                       {insight.sentiment === 'positive' ? (
                         <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                       ) : insight.sentiment === 'negative' ? (
                         <AlertCircle className="h-3 w-3 text-rose-500" />
                       ) : null}
                       <span className="text-[10px] font-black text-indigo-600">{insight.indicator_score}%</span>
                     </div>
                   </div>
                   <p className="text-xs text-foreground leading-snug">{insight.content}</p>
                   <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-indigo-500 transition-all" 
                       style={{ width: `${insight.indicator_score}%` }} 
                     />
                   </div>
                 </div>
               ))}
             </div>
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
