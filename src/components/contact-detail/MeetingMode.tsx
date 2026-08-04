import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Phone, MessageSquare, AlertTriangle,
   Brain, Target, Heart, Zap, Clock, ChevronRight, Minimize2, MessageCircle
} from 'lucide-react';
 import { Textarea } from '@/components/ui/textarea';
 import { NLPRealtimeCoach } from '@/components/nlp/NLPRealtimeCoach';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatContactName } from '@/lib/formatters';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import type { Contact, Interaction } from '@/hooks/useContactDetail';

interface MeetingModeProps {
  contact: Contact;
  interactions: Interaction[];
  open: boolean;
  onClose: () => void;
}

const DISC_CONFIG: Record<string, { label: string; color: string; tips: string[] }> = {
  D: {
    label: 'Dominante',
    color: 'bg-destructive/15 text-destructive border-destructive/20',
    tips: ['Seja direto e objetivo', 'Foque em resultados', 'Evite detalhes excessivos', 'Dê opções de escolha'],
  },
  I: {
    label: 'Influente',
    color: 'bg-warning/15 text-warning border-warning/20',
    tips: ['Seja entusiasmado', 'Use histórias e exemplos', 'Dê reconhecimento', 'Evite ser muito formal'],
  },
  S: {
    label: 'Estável',
    color: 'bg-success/15 text-success border-success/20',
    tips: ['Seja paciente e calmo', 'Dê tempo para pensar', 'Evite pressão', 'Mostre estabilidade'],
  },
  C: {
    label: 'Conforme',
    color: 'bg-info/15 text-info border-info/20',
    tips: ['Apresente dados e fatos', 'Seja preciso', 'Dê tempo para análise', 'Evite ambiguidade'],
  },
};

function useTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const toggle = useCallback(() => setRunning(r => !r), []);
  const reset = useCallback(() => { setSeconds(0); setRunning(false); }, []);

  const formatted = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return { seconds, running, toggle, reset, formatted };
}

export function MeetingMode({ contact, interactions, open, onClose }: MeetingModeProps) {
   const timer = useTimer();
   const [liveNotes, setLiveNotes] = useState('');
  const behavior = contact.behavior as Record<string, unknown> | null;
  const discProfile = (behavior?.discProfile as string) || null;
  const discConfig = discProfile ? DISC_CONFIG[discProfile] : null;
  const contactName = formatContactName(contact.first_name, contact.last_name);
  const score = contact.relationship_score ?? 0;

  // Last 5 interactions for quick reference
  const recentInteractions = interactions.slice(0, 5);

  // Key insights from recent interactions
  const allInsights = interactions
    .flatMap(i => i.key_insights || [])
    .filter(Boolean)
    .slice(0, 6);

  // Pending follow-ups
  const pendingFollowUps = interactions.filter(i => i.follow_up_required && i.follow_up_date);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-background"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <OptimizedAvatar
                src={contact.avatar_url || undefined}
                alt={contactName}
                fallback={`${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`}
                size="md"
                className="w-10 h-10 ring-2 ring-primary/20"
              />
              <div>
                <h1 className="text-lg font-bold text-foreground">{contactName}</h1>
                <div className="flex items-center gap-2">
                  {contact.role && (
                    <span className="text-xs text-muted-foreground">{contact.role}</span>
                  )}
                  {discConfig && (
                    <Badge variant="outline" className={cn('text-[10px]', discConfig.color)}>
                      {discConfig.label}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className={cn(
                'font-mono text-xl font-bold tabular-nums',
                timer.running ? 'text-primary' : 'text-foreground'
              )}>
                {timer.formatted}
              </span>
            </div>
            <Button
              variant={timer.running ? 'outline' : 'default'}
              size="sm"
              onClick={timer.toggle}
              className="gap-1.5"
            >
              {timer.running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {timer.running ? 'Pausar' : 'Iniciar'}
            </Button>
            <Button variant="ghost" size="sm" onClick={timer.reset}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <Button variant="outline" size="sm" onClick={onClose} className="gap-1.5">
              <Minimize2 className="w-3.5 h-3.5" />
              Sair
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-6 h-[calc(100vh-65px)] overflow-auto">
          {/* Left Column: Score + DISC */}
          <div className="space-y-4">
            {/* Relationship Score */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Heart className="w-4 h-4 text-primary" />
                  Score do Relacionamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <div className={cn(
                    'w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4',
                    score >= 75 ? 'border-success text-success bg-success/5' :
                    score >= 50 ? 'border-warning text-warning bg-warning/5' :
                    'border-destructive text-destructive bg-destructive/5'
                  )}>
                    {score}
                  </div>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="text-xs">
                    {contact.relationship_stage || 'Novo'}
                  </Badge>
                  {contact.sentiment && (
                    <Badge variant="outline" className="text-xs ml-2">
                      {contact.sentiment}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* DISC Communication Tips */}
            {discConfig && (
              <Card className={cn('border-l-4', discProfile === 'D' ? 'border-l-destructive' : discProfile === 'I' ? 'border-l-warning' : discProfile === 'S' ? 'border-l-success' : 'border-l-info')}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    Dicas de Comunicação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {discConfig.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Contact Info Quick Access */}
            <Card>
              <CardContent className="pt-4 space-y-2">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted">
                    <Phone className="w-4 h-4" />
                    {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted">
                    <MessageSquare className="w-4 h-4" />
                    {contact.email}
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

           {/* Center Column: NLP Coach + Live Notes */}
           <div className="space-y-4 lg:col-span-1">
             <Card className="border-primary/20 bg-primary/5">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm flex items-center gap-2">
                   <MessageCircle className="w-4 h-4 text-primary" />
                   Roteiro / Notas em Tempo Real
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <Textarea 
                   placeholder="Digite o que pretende falar ou notas da conversa..."
                   className="min-h-[150px] bg-background/50 border-primary/20"
                   value={liveNotes}
                   onChange={(e) => setLiveNotes(e.target.value)}
                 />
                 
                 <NLPRealtimeCoach 
                   content={liveNotes} 
                   contactId={contact.id}
                   onApplySuggestion={(text) => setLiveNotes(prev => prev ? `${prev}\n\n${text}` : text)}
                 />
               </CardContent>
             </Card>

            {/* Key Insights */}
            <Card className="h-fit">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Insights Chave
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allInsights.length > 0 ? (
                  <ul className="space-y-2">
                    {allInsights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-primary/5 border border-primary/10">
                        <Target className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground">{insight}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum insight registrado ainda.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Pending Follow-ups */}
            {pendingFollowUps.length > 0 && (
              <Card className="border-warning/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    Follow-ups Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {pendingFollowUps.map(fu => (
                      <li key={fu.id} className="text-sm p-2 rounded-lg bg-warning/5 border border-warning/10">
                        <p className="font-medium text-foreground">{fu.title}</p>
                        {fu.follow_up_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Prazo: {new Date(fu.follow_up_date).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Tags & Interests */}
            {(contact.tags?.length || contact.interests?.length || contact.hobbies?.length) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Interesses & Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {contact.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                    {contact.interests?.map(interest => (
                      <Badge key={interest} variant="outline" className="text-xs bg-primary/5">{interest}</Badge>
                    ))}
                    {contact.hobbies?.map(hobby => (
                      <Badge key={hobby} variant="outline" className="text-xs bg-accent/5">{hobby}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Recent Interactions */}
          <div className="space-y-4">
            <Card className="h-fit">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Interações Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  {recentInteractions.length > 0 ? (
                    <div className="space-y-3">
                      {recentInteractions.map(interaction => (
                        <div key={interaction.id} className="p-3 rounded-lg border border-border/50 hover:border-border transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{interaction.title}</p>
                            <Badge variant="outline" className="text-[10px] shrink-0">{interaction.type}</Badge>
                          </div>
                          {interaction.content && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{interaction.content}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-2">
                            {new Date(interaction.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma interação registrada.
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Notes */}
            {contact.personal_notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Notas Pessoais</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {contact.personal_notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
