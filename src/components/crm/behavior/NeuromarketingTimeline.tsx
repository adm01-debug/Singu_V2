import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import { Brain, Heart, TrendingUp, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Props {
  contactId: string;
}

export function NeuromarketingTimeline({ contactId }: Props) {
  const { data: history, isLoading } = useQuery({
    queryKey: ['neuro-behavioral-history', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neuro_behavioral_history')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) return <Skeleton className="h-[400px] w-full" />;

  const chartData = history?.map(item => ({
    date: format(new Date(item.created_at), 'dd/MM', { locale: ptBR }),
    empathy: Number(item.empathy_score) || 0,
    dominance: (item.dominance_data as any)?.dominance || 0,
    influence: (item.dominance_data as any)?.influence || 0,
    steadiness: (item.dominance_data as any)?.steadiness || 0,
    compliance: (item.dominance_data as any)?.compliance || 0,
    timestamp: item.created_at
  })) || [];

  const latest = history?.[history.length - 1];

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
                  <XAxis dataKey="date" fontSize={10} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} fontSize={10} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="dominance" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorDom)" name="Dominância" />
                  <Area type="monotone" dataKey="influence" stroke="#f59e0b" fill="transparent" name="Influência" />
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

      {latest && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              Recomendações Atuais de Neuromarketing
              <Badge variant="outline" className="text-[10px]">Atualizado {format(new Date(latest.created_at), 'dd/MM/yy')}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.isArray(latest.recommendations) && latest.recommendations.map((rec: string, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/20 p-2 rounded border border-dashed">
        <Info className="h-3 w-3" />
        <span>Estes indicadores correlacionam tom de voz, velocidade de resposta e complexidade da linguagem para medir a conexão emocional e dominância cognitiva.</span>
      </div>
    </div>
  );
}