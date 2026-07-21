import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { Brain, Heart, TrendingUp, Info, MessageSquare, Mic, Activity, Smile, Meh, Frown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Props {
  contactId: string;
}

interface DominanceData {
  dominance?: number;
  influence?: number;
  steadiness?: number;
  compliance?: number;
}

interface EmotionAnalysis {
  emotions?: string[];
}

export function NeuromarketingTimeline({ contactId }: Props) {
  const { user } = useAuth();
  const { data: neuroData, isLoading } = useQuery({
    queryKey: ['neuro-unified-data', contactId, user?.id],
    queryFn: async () => {
      const [historyRes, interactionsRes] = await Promise.all([
        supabase
          .from('neuro_behavioral_history')
          .select('*')
          .eq('contact_id', contactId)
          .eq('user_id', user!.id)
          .order('created_at', { ascending: true })
          .limit(200),
        supabase
          .from('interactions')
          .select('*')
          .eq('contact_id', contactId)
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      
      if (historyRes.error) throw historyRes.error;
      return {
        history: historyRes.data || [],
        interactions: interactionsRes.data || []
      };
    },
    enabled: !!contactId && !!user,
    staleTime: 5 * 60_000,
  });

  const history = neuroData?.history;
  const interactions = neuroData?.interactions;

   const chartData = history?.map(item => {
     const dom = (item.dominance_data ?? {}) as DominanceData;
     const dominance = dom.dominance || 0;
     const influence = dom.influence || 0;
     const steadiness = dom.steadiness || 0;
     const compliance = dom.compliance || 0;
     
     return {
       date: format(new Date(item.created_at), 'dd/MM', { locale: ptBR }),
       empathy: Number(item.empathy_score) || 0,
       dominance,
       influence,
       steadiness,
       compliance,
       complexity: item.language_complexity_score || 0,
       sync: item.response_synchronicity || 0,
       timestamp: item.created_at
     };
   }) || [];

  const latest = history?.[history?.length - 1];
  
  // Real correlation calculation
  const correlations = useMemo(() => {
    if (!interactions || interactions.length === 0) return null;
    
    const positiveCount = interactions.filter(i => i.sentiment === 'positive').length;
    const negativeCount = interactions.filter(i => i.sentiment === 'negative').length;
    
    let tone = 'Estável';
    if (positiveCount > negativeCount * 2) tone = 'Positivo';
    else if (negativeCount > positiveCount) tone = 'Tenso';
    
    const avgResponseTime = interactions.reduce((acc, i) => acc + (i.response_time || 0), 0) / interactions.length;
    let responseRate = 'Normal';
    if (avgResponseTime < 60 && avgResponseTime > 0) responseRate = 'Sincronizado';
    else if (avgResponseTime > 1440) responseRate = 'Lento';

    return {
      tone,
      language: 'Analítico', // This would need more NLP data
      responseRate
    };
  }, [interactions]);

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  const SentimentIcon = ({ sentiment }: { sentiment: string }) => {
    if (sentiment === 'positive') return <Smile className="h-3 w-3 text-success" />;
    if (sentiment === 'negative') return <Frown className="h-3 w-3 text-destructive" />;
    return <Meh className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
              <Brain className="h-4 w-4" />
              Evolução da Dominância Cerebral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorDom" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" fontSize={10} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} fontSize={10} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', fontSize: '12px' }}
                  />
                   <Area type="monotone" dataKey="dominance" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorDom)" name="Dominância" />
                   <Area type="monotone" dataKey="influence" stroke="#f59e0b" fill="transparent" name="Influência" />
                   <Area type="monotone" dataKey="steadiness" stroke="#10b981" fill="transparent" name="Estabilidade" />
                   <Area type="monotone" dataKey="compliance" stroke="#3b82f6" fill="transparent" name="Conformidade" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-background to-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-success">
              <Heart className="h-4 w-4" />
              Indicador de Empatia Temporal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" fontSize={10} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 10]} fontSize={10} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', fontSize: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="empathy" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: 'hsl(var(--success))' }}
                    name="Empatia" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Recomendações Atuais de Neuromarketing
              {latest && <Badge variant="outline" className="text-[10px]">Atualizado {format(new Date(latest.created_at), 'dd/MM/yy')}</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {latest && Array.isArray(latest.recommendations) && latest.recommendations.map((rec: string, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
              {!latest && <p className="text-xs text-muted-foreground italic">Gere uma análise para ver recomendações.</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Correlações de Empatia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
               <div className="flex justify-between items-center text-[10px]">
                 <span className="flex items-center gap-1"><Mic className="h-3 w-3" /> Tom de Voz</span>
                 <Badge variant="secondary" className="text-[9px] px-1 h-4">{correlations?.tone}</Badge>
               </div>
               <div className="flex justify-between items-center text-[10px]">
                 <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Complexidade IA</span>
                 <Badge variant="secondary" className="text-[9px] px-1 h-4">{(latest?.language_complexity_score || 0) > 0.7 ? 'Alta' : 'Moderada'}</Badge>
               </div>
               <div className="flex justify-between items-center text-[10px]">
                 <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Sincronia</span>
                 <Badge variant="secondary" className="text-[9px] px-1 h-4">{Math.round((latest?.response_synchronicity || 0) * 100)}%</Badge>
               </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-2 leading-tight">
              A empatia é calculada correlacionando a frequência de interações, espelhamento de linguagem e sentimentos detectados.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Timeline Unificada de Sentimento & Interações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {interactions?.slice(0, 5).map((interaction) => (
              <div key={interaction.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/20 border border-border/50 text-xs">
                <div className="mt-0.5">
                  <SentimentIcon sentiment={interaction.sentiment} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{interaction.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(interaction.created_at), 'dd MMM, HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-muted-foreground line-clamp-1">{interaction.content}</p>
                  {interaction.emotion_analysis && (
                    <div className="flex gap-1 mt-1">
                      {((interaction.emotion_analysis as EmotionAnalysis | null)?.emotions)?.slice(0, 2).map((e: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[8px] py-0 h-3 capitalize">
                          {e}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {(!interactions || interactions.length === 0) && (
              <p className="text-xs text-muted-foreground italic text-center py-4">Nenhuma interação recente para unificar na timeline.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/20 p-2 rounded border border-dashed">
        <Info className="h-3 w-3" />
        <span>Estes indicadores correlacionam tom de voz, velocidade de resposta e complexidade da linguagem para medir a conexão emocional e dominância cognitiva em tempo real.</span>
      </div>
    </div>
  );
}