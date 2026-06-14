// ==============================================
// NEURO ALERTS - Real-time Neural Profile Change Alerts
// Notifies when contact's brain system changes
// ==============================================

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bell,
  ArrowRight,
  Zap,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import { cn } from '@/lib/utils';

interface NeuroAlert {
  id: string;
  type: 'brain_shift' | 'chemical_spike' | 'stimuli_change' | 'opportunity' | 'warning';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  icon: string;
  fromState?: string;
  toState?: string;
  actionSuggestion: string;
  timestamp: Date;
  dismissed: boolean;
}

export interface NeuroAlertsProps {
  contactId: string;
  contactName: string;
  discProfile?: string | null;
  interactions?: { content: string; transcription?: string; createdAt?: string; created_at?: string }[];
  maxAlerts?: number;
  className?: string;
}

const NeuroAlerts = ({ 
  contactId, 
  contactName, 
  discProfile,
  interactions = [],
  maxAlerts = 5,
  className
}: NeuroAlertsProps) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const {
    analyzeText,
    BRAIN_SYSTEM_INFO
  } = useNeuromarketing();

  // Generate alerts based on analyzing current interactions
  const alerts = useMemo(() => {
    const alertsList: NeuroAlert[] = [];
    
    // Analyze current state
    const currentText = interactions
      .map(i => `${i.content || ''} ${i.transcription || ''}`)
      .join('\n\n');
    
    // Split interactions into current (last 50%) and previous (first 50%) for comparison
    const midPoint = Math.floor(interactions.length / 2);
    const previousInteractions = interactions.slice(0, midPoint);

    const previousText = previousInteractions
      .map(i => `${i.content || ''} ${i.transcription || ''}`)
      .join('\n\n');
    
    if (currentText.length < 50) return alertsList;
    
    const currentAnalysis = analyzeText(currentText);
    const previousAnalysis = previousText.length >= 50 ? analyzeText(previousText) : null;
    
    // 1. Brain System Shift Alert
    if (previousAnalysis && 
        previousAnalysis.detectedBrainSystem !== currentAnalysis.detectedBrainSystem) {
      const fromBrain = previousAnalysis.detectedBrainSystem;
      const toBrain = currentAnalysis.detectedBrainSystem;
      
      let severity: 'high' | 'medium' | 'low' = 'medium';
      let description = '';
      let actionSuggestion = '';
      
      if (toBrain === 'reptilian') {
        severity = 'high';
        description = `${contactName.split(' ')[0]} está entrando em modo de sobrevivência. Detectamos linguagem de medo, urgência ou ameaça.`;
        actionSuggestion = 'Forneça garantias, segurança e provas tangíveis imediatamente.';
      } else if (fromBrain === 'reptilian' && toBrain === 'limbic') {
        severity = 'low';
        description = `${contactName.split(' ')[0]} está saindo do modo de alerta para um estado mais emocional e aberto.`;
        actionSuggestion = 'Aproveite para construir rapport e conexão emocional.';
      } else if (toBrain === 'neocortex') {
        severity = 'medium';
        description = `${contactName.split(' ')[0]} está em modo analítico. Espere questionamentos e pedidos de dados.`;
        actionSuggestion = 'Prepare evidências, estatísticas e comparações detalhadas.';
      } else {
        description = `Mudança no estilo de processamento de decisões detectada.`;
        actionSuggestion = 'Adapte sua comunicação ao novo padrão.';
      }
      
      alertsList.push({
        id: `brain-shift-${toBrain}`,
        type: 'brain_shift',
        severity,
        title: 'Mudança de Cérebro Dominante',
        description,
        icon: BRAIN_SYSTEM_INFO[toBrain].icon,
        fromState: BRAIN_SYSTEM_INFO[fromBrain].namePt,
        toState: BRAIN_SYSTEM_INFO[toBrain].namePt,
        actionSuggestion,
        timestamp: new Date(),
        dismissed: false
      });
    }
    
    // 2. Cortisol Spike Alert (Stress Detection)
    const currentCortisol = currentAnalysis.neurochemicalProfile.find(n => n.chemical === 'cortisol');
    const previousCortisol = previousAnalysis?.neurochemicalProfile.find(n => n.chemical === 'cortisol');
    
    if (currentCortisol && currentCortisol.intensity > 60 && 
        (!previousCortisol || previousCortisol.intensity < 40)) {
      alertsList.push({
        id: 'cortisol-spike',
        type: 'chemical_spike',
        severity: 'high',
        title: 'Pico de Estresse Detectado',
        description: `Níveis elevados de linguagem de estresse/cortisol. ${contactName.split(' ')[0]} pode estar sob pressão.`,
        icon: '⚡',
        actionSuggestion: 'Reduza a pressão, ofereça suporte e evite criar mais urgência agora.',
        timestamp: new Date(),
        dismissed: false
      });
    }
    
    // 3. Dopamine/Oxytocin Opportunity
    const currentDopamine = currentAnalysis.neurochemicalProfile.find(n => n.chemical === 'dopamine');
    const currentOxytocin = currentAnalysis.neurochemicalProfile.find(n => n.chemical === 'oxytocin');
    
    if ((currentDopamine && currentDopamine.intensity > 50) || 
        (currentOxytocin && currentOxytocin.intensity > 50)) {
      alertsList.push({
        id: 'positive-chemistry',
        type: 'opportunity',
        severity: 'low',
        title: 'Momento Favorável Detectado',
        description: `${contactName.split(' ')[0]} demonstra sinais de entusiasmo e/ou confiança elevados.`,
        icon: '✨',
        actionSuggestion: 'Este é um bom momento para avançar a conversa ou fazer uma proposta.',
        timestamp: new Date(),
        dismissed: false
      });
    }
    
    // 4. Pain Point Detection
    if (currentAnalysis.painIndicators.length >= 3) {
      alertsList.push({
        id: 'pain-detected',
        type: 'warning',
        severity: 'medium',
        title: 'Múltiplas Dores Identificadas',
        description: `Detectamos ${currentAnalysis.painIndicators.length} indicadores de dor/frustração nas últimas interações.`,
        icon: '🎯',
        actionSuggestion: 'Use o Pain-Claim-Gain Builder para estruturar sua abordagem.',
        timestamp: new Date(),
        dismissed: false
      });
    }
    
    // 5. Reptilian Brain Dominant (Warning)
    if (currentAnalysis.detectedBrainSystem === 'reptilian' && 
        currentAnalysis.brainSystemScores.reptilian > 60) {
      alertsList.push({
        id: 'reptilian-dominant',
        type: 'warning',
        severity: 'high',
        title: 'Cérebro Reptiliano Dominante',
        description: `${contactName.split(' ')[0]} está operando em modo de sobrevivência. Decisões serão baseadas em medo/proteção.`,
        icon: '🦎',
        actionSuggestion: 'Não force a venda. Foque em segurança, garantias e remoção de riscos.',
        timestamp: new Date(),
        dismissed: false
      });
    }
    
    return alertsList.filter(a => !dismissedIds.has(a.id)).slice(0, maxAlerts);
  }, [interactions, contactName, analyzeText, dismissedIds, maxAlerts, BRAIN_SYSTEM_INFO]);

  const dismissAlert = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
  };

  const dismissAll = () => {
    setDismissedIds(new Set(alerts.map(a => a.id)));
  };

  const getSeverityStyles = (severity: NeuroAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-destructive/50 bg-destructive/5';
      case 'medium':
        return 'border-warning/50 bg-warning/5';
      case 'low':
        return 'border-success/50 bg-success/5';
    }
  };

  const getSeverityBadge = (severity: NeuroAlert['severity']) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs bg-warning/20 text-warning">Atenção</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs bg-success/20 text-success">Oportunidade</Badge>;
    }
  };

  if (alerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("p-4 rounded-lg border border-muted bg-muted/20 text-center", className)}
      >
        <CheckCircle className="h-8 w-8 text-success mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Nenhum alerta neural ativo para {contactName.split(' ')[0]}
        </p>
      </motion.div>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bell className="h-5 w-5 text-primary" />
            </motion.div>
            Alertas Neurais
            <Badge variant="outline" className="ml-2">
              {alerts.length}
            </Badge>
          </CardTitle>
          {alerts.length > 1 && (
            <Button variant="ghost" size="sm" onClick={dismissAll}>
              Limpar Todos
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <AnimatePresence>
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-4 rounded-lg border-2 relative overflow-hidden",
                getSeverityStyles(alert.severity)
              )}
            >
              {/* Animated accent bar */}
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{
                  background: alert.severity === 'high' ? 'hsl(var(--destructive))' :
                             alert.severity === 'medium' ? 'hsl(var(--warning))' :
                             'hsl(var(--success))'
                }}
                animate={{ scaleY: [0, 1] }}
                transition={{ duration: 0.3 }}
              />
              
              <div className="flex items-start gap-3 pl-2">
                <motion.span 
                  className="text-2xl"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  {alert.icon}
                </motion.span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {alert.description}
                  </p>
                  
                  {/* State Transition */}
                  {alert.fromState && alert.toState && (
                    <div className="flex items-center gap-2 text-xs mb-2 p-2 rounded bg-background/50">
                      <span className="font-medium">{alert.fromState}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-medium text-primary">{alert.toState}</span>
                    </div>
                  )}
                  
                  {/* Action Suggestion */}
                  <div className="flex items-start gap-2 p-2 rounded bg-primary/5 text-xs">
                    <Zap className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                    <span className="text-primary">{alert.actionSuggestion}</span>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-6 w-6"
                  onClick={() => dismissAlert(alert.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default NeuroAlerts;
