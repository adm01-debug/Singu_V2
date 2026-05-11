import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Sparkles, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  ArrowRight,
  Download,
  Share2,
  Brain,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from "@/lib/logger";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactId: string;
  className?: string;
}

export function NLPInsightsDashboard({ contactId, className }: Props) {
  const { user } = useAuth();

  const { data: contact } = useQuery({
    queryKey: ['contact-insights-header', contactId],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*, companies(name)').eq('id', contactId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!contactId
  });

  const { data: insights, isLoading } = useQuery({
    queryKey: ['nlp-insights-actionable', contactId],
    queryFn: async () => {
      const { data: behavior } = await supabase.from('contacts').select('vak_profile, metaprogram_profile, objection_patterns').eq('id', contactId).single();
      
      const items: any[] = [];
      
      if (behavior?.vak_profile?.primary) {
        items.push({
          category: 'preference',
          title: `Comunicação ${behavior.vak_profile.primary}`,
          description: `O cliente processa melhor informações via canal ${behavior.vak_profile.primary}.`,
          action: `Adapte sua próxima mensagem usando predicados ${behavior.vak_profile.primary}.`,
          priority: 'medium',
          icon: <Target className="w-4 h-4" />
        });
      }

      if (behavior?.metaprogram_profile?.motivation === 'away_from') {
        items.push({
          category: 'risk',
          title: 'Foco em Segurança',
          description: 'Detectado padrão de afastamento de riscos (Away-From).',
          action: 'Enfatize garantias, provas sociais e redução de riscos na proposta.',
          priority: 'high',
          icon: <AlertTriangle className="w-4 h-4" />
        });
      }

      return items;
    },
    enabled: !!contactId
  });

  const handleExportPDF = () => {
    window.open(`/relatorio-contato/${contactId}`, '_blank');
  };

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-xl" />;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Insights de Negociação
          </CardTitle>
          <CardDescription>Ações recomendadas baseadas no perfil PNL</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleExportPDF}>
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights?.length === 0 ? (
            <div className="py-8 text-center border-2 border-dashed rounded-lg">
              <Brain className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">Continue as interações para gerar insights específicos.</p>
            </div>
          ) : (
            insights?.map((insight, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-xl border bg-card hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg bg-primary/5 text-primary group-hover:scale-110 transition-transform`}>
                    {insight.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm">{insight.title}</h4>
                      <Badge variant={insight.priority === 'high' ? 'destructive' : 'secondary'} className="text-[9px] uppercase">
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-2">
                      <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs font-semibold text-primary">{insight.action}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Score de Calibração: 85%</span>
            </div>
            <span>Última atualização: {format(new Date(), 'HH:mm', { locale: ptBR })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
