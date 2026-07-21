import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Clock, Copy, Check, ChevronDown, ChevronRight, ArrowRight, Star, Heart, TrendingUp, Zap, Shield, Brain, Award, Target, ThumbsUp, ThumbsDown, MessageCircle, Phone, Mail, Video, Users, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { ApproachPhase } from '@/hooks/useApproachRecommendation';

// --- PhaseCard ---
export function PhaseCard({
  phase, index, isExpanded, onToggle, onCopy, copiedItem,
}: {
  phase: ApproachPhase; index: number; isExpanded: boolean; onToggle: () => void;
  onCopy: (text: string) => void; copiedItem: string | null;
}) {
  const phaseColors = ['bg-info', 'bg-secondary', 'bg-success', 'bg-accent', 'bg-primary'];
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className={cn('rounded-xl border transition-colors', isExpanded ? 'border-primary/50 bg-primary/5' : 'hover:border-primary/30')}>
          <CollapsibleTrigger className="w-full p-4">
            <div className="flex items-center gap-4">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold', phaseColors[index % phaseColors.length])}>{index + 1}</div>
              <div className="flex-1 text-left">
                <h4 className="font-medium flex items-center gap-2">{phase.name}{phase.warnings.length > 0 && <AlertTriangle className="w-4 h-4 text-warning" />}</h4>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{phase.timing}</span><span>•</span><span>{phase.duration}</span>
                </div>
              </div>
              {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 pt-0 space-y-4">
              <Separator />
              <div><h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">Ações</h5><ul className="space-y-1">{phase.actions.map((action, idx) => (<li key={idx} className="flex items-start gap-2 text-sm"><ArrowRight className="w-3 h-3 text-primary shrink-0 mt-1" /><span>{action}</span></li>))}</ul></div>
              <div><h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">Técnicas</h5><div className="flex flex-wrap gap-1">{phase.techniques.map((tech, idx) => (<Badge key={idx} variant="secondary" className="text-xs">{tech}</Badge>))}</div></div>
              {phase.scripts.length > 0 && (<div><h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">Scripts Sugeridos</h5><div className="space-y-2">{phase.scripts.map((script, idx) => (<div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"><p className="text-sm flex-1 italic">"{script}"</p><Button variant="ghost" size="icon" aria-label="Confirmar" className="h-6 w-6 shrink-0" onClick={() => onCopy(script)}>{copiedItem === `phase-${phase.id}` ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}</Button></div>))}</div></div>)}
              {phase.warnings.length > 0 && (<div className="p-2 rounded-lg bg-warning/10 border border-warning/30"><div className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" /><div className="text-sm">{phase.warnings.map((warning, idx) => (<p key={idx}>{warning}</p>))}</div></div></div>)}
              <div><h5 className="text-xs font-medium text-muted-foreground uppercase mb-2">Indicadores de Sucesso</h5><div className="flex flex-wrap gap-1">{phase.successIndicators.map((indicator, idx) => (<Badge key={idx} variant="outline" className="text-xs bg-success/5 border-success/30"><CheckCircle2 className="w-3 h-3 mr-1 text-success" />{indicator}</Badge>))}</div></div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </motion.div>
  );
}

// --- MessagesTab ---
export function MessagesTab({ personalizedMessages, objectionHandling, copyToClipboard, copiedItem }: {
  personalizedMessages: Array<{ context: string; message: string; tone: string; keyPhrases: string[] }>;
  objectionHandling: Array<{ objection: string; response: string; technique: string }>;
  copyToClipboard: (text: string, id: string) => void;
  copiedItem: string | null;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {personalizedMessages.map((msg, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="p-4 rounded-xl bg-muted/50 border hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
              <Badge variant="outline">{msg.context}</Badge>
              <Button variant="ghost" size="icon" aria-label="Copiar mensagem" className="h-8 w-8" onClick={() => copyToClipboard(msg.message, `msg-${idx}`)}>
                {copiedItem === `msg-${idx}` ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-sm mb-3 leading-relaxed">"{msg.message}"</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">Tom: {msg.tone}</Badge>
              {msg.keyPhrases.map((phrase, pidx) => <Badge key={pidx} variant="outline" className="text-xs">{phrase}</Badge>)}
            </div>
          </motion.div>
        ))}
      </div>
      <Separator />
      <div>
        <h4 className="font-medium flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-warning" />Tratamento de Objeções</h4>
        <div className="space-y-3">
          {objectionHandling.map((obj, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-warning/5 border border-warning/20">
              <div className="flex items-start gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" /><div><p className="text-sm font-medium">{obj.objection}</p><p className="text-sm text-muted-foreground mt-1">↳ {obj.response}</p></div></div>
              <Badge variant="secondary" className="text-xs mt-2">Técnica: {obj.technique}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- ChannelsTab ---
const channelIcons: Record<string, React.ElementType> = {
  'Ligação telefônica': Phone, 'E-mail detalhado': Mail, 'Mensagem direta (WhatsApp)': MessageSquare,
  'Reunião presencial': Users, 'Videochamada': Video,
};

export function ChannelsTab({ channels }: { channels: Array<{ channel: string; effectiveness: number; reason: string; bestTimeSlot: string; tips: string[] }> }) {
  return (
    <div className="space-y-4">
      {channels.map((channel, idx) => {
        const Icon = channelIcons[channel.channel] || MessageCircle;
        return (
          <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="p-4 rounded-xl border hover:border-primary/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className={cn('p-3 rounded-xl', channel.effectiveness > 85 ? 'bg-success/10 text-success' : channel.effectiveness > 70 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}><Icon className="w-5 h-5" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1"><h4 className="font-medium">{channel.channel}</h4><div className="flex items-center gap-2"><Progress value={channel.effectiveness} className="w-20 h-2" /><span className="text-sm font-medium">{channel.effectiveness}%</span></div></div>
                <p className="text-sm text-muted-foreground mb-2">{channel.reason}</p>
                <div className="flex items-center gap-2 mb-2"><Clock className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Melhor horário: {channel.bestTimeSlot}</span></div>
                <div className="flex flex-wrap gap-1">{channel.tips.map((tip, tidx) => <Badge key={tidx} variant="secondary" className="text-xs">{tip}</Badge>)}</div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// --- TechniquesTab ---
export function TechniquesTab({ closingTechniques, urgencyTriggers, trustBuilders, decisionAccelerators, copyToClipboard, copiedItem }: {
  closingTechniques: Array<{ technique: string; script: string; effectiveness: number; bestFor: string }>;
  urgencyTriggers: string[]; trustBuilders: string[]; decisionAccelerators: string[];
  copyToClipboard: (text: string, id: string) => void; copiedItem: string | null;
}) {
  return (
    <div className="space-y-4">
      <div><h4 className="font-medium flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-primary" />Técnicas de Fechamento</h4>
        <div className="space-y-3">{closingTechniques.map((tech, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="p-3 rounded-lg bg-primary/5 border border-primary/20 hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between mb-2"><div className="flex items-center gap-2"><Award className="w-4 h-4 text-primary" /><span className="font-medium text-sm">{tech.technique}</span></div>
              <div className="flex items-center gap-1">{[...Array(5)].map((_, i) => <Star key={i} className={cn('w-3 h-3', i < Math.round(tech.effectiveness / 20) ? 'text-warning fill-warning' : 'text-muted')} />)}</div></div>
            <p className="text-sm text-muted-foreground mb-2">"{tech.script}"</p>
            <Badge variant="secondary" className="text-xs">Melhor para: {tech.bestFor}</Badge>
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => copyToClipboard(tech.script, `tech-${idx}`)}>{copiedItem === `tech-${idx}` ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}</Button>
          </motion.div>
        ))}</div></div>
      <Separator />
      <div><h4 className="font-medium flex items-center gap-2 mb-3"><Zap className="w-4 h-4 text-warning" />Gatilhos de Urgência</h4><div className="flex flex-wrap gap-2">{urgencyTriggers.map((t, idx) => <Badge key={idx} variant="outline" className="bg-warning/5 border-warning/30">{t}</Badge>)}</div></div>
      <Separator />
      <div><h4 className="font-medium flex items-center gap-2 mb-3"><Heart className="w-4 h-4 text-primary" />Construtores de Confiança</h4><div className="flex flex-wrap gap-2">{trustBuilders.map((b, idx) => <Badge key={idx} variant="outline" className="bg-primary/5 border-primary/30">{b}</Badge>)}</div></div>
      <Separator />
      <div><h4 className="font-medium flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-success" />Aceleradores de Decisão</h4><div className="flex flex-wrap gap-2">{decisionAccelerators.map((a, idx) => <Badge key={idx} variant="outline" className="bg-success/5 border-success/30">{a}</Badge>)}</div></div>
    </div>
  );
}

// --- TipsTab ---
export function TipsTab({ doAndDont, overallStrategy, channels, closingTechniques }: {
  doAndDont: { do: string[]; dont: string[] };
  overallStrategy: { name: string; confidence: number };
  channels: Array<{ channel: string }>;
  closingTechniques: Array<{ technique: string }>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-success/5 border border-success/20">
          <h4 className="font-medium flex items-center gap-2 mb-3 text-success"><ThumbsUp className="w-4 h-4" />Faça</h4>
          <ul className="space-y-2">{doAndDont.do.map((item, idx) => <li key={idx} className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" /><span>{item}</span></li>)}</ul>
        </div>
        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
          <h4 className="font-medium flex items-center gap-2 mb-3 text-destructive"><ThumbsDown className="w-4 h-4" />Evite</h4>
          <ul className="space-y-2">{doAndDont.dont.map((item, idx) => <li key={idx} className="flex items-start gap-2 text-sm"><XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" /><span>{item}</span></li>)}</ul>
        </div>
      </div>
      <Separator />
      <div className="p-4 rounded-xl bg-muted/50 border">
        <h4 className="font-medium flex items-center gap-2 mb-3"><Brain className="w-4 h-4 text-primary" />Referência Rápida</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Estratégia:</span><p className="font-medium">{overallStrategy.name}</p></div>
          <div><span className="text-muted-foreground">Confiança:</span><p className="font-medium">{overallStrategy.confidence}%</p></div>
          <div><span className="text-muted-foreground">Melhor Canal:</span><p className="font-medium">{channels[0]?.channel}</p></div>
          <div><span className="text-muted-foreground">Melhor Técnica:</span><p className="font-medium">{closingTechniques[0]?.technique}</p></div>
        </div>
      </div>
    </div>
  );
}
