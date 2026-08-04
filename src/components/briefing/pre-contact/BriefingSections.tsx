import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronUp, CheckCircle, X, Copy, Check,
  Lightbulb, MessageSquare, Target, AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export function CollapsibleSection({ id, icon, title, isExpanded, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div>
      <button onClick={onToggle} aria-expanded={isExpanded} aria-label={`Expandir ${title}`} className="flex items-center justify-between w-full text-left">
        <div className="flex items-center gap-2">{icon}<span className="font-semibold text-sm">{title}</span></div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function OpeningTipsSection({ tips, isExpanded, onToggle }: { tips: string[]; isExpanded: boolean; onToggle: () => void }) {
  return (
    <CollapsibleSection id="tips" icon={<Lightbulb className="w-4 h-4 text-warning" />} title="Dicas de Abertura" isExpanded={isExpanded} onToggle={onToggle}>
      <div className="mt-2 space-y-1">
        {tips.map((tip, idx) => (
          <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-warning/5 text-sm"><CheckCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" /><span>{tip}</span></div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

export function WordsSection({ wordsToUse, wordsToAvoid, copiedText, onCopy, isExpanded, onToggle }: { wordsToUse: string[]; wordsToAvoid: string[]; copiedText: string | null; onCopy: (text: string, id: string) => void; isExpanded: boolean; onToggle: () => void }) {
  return (
    <CollapsibleSection id="words" icon={<MessageSquare className="w-4 h-4 text-primary" />} title="Palavras Mágicas" isExpanded={isExpanded} onToggle={onToggle}>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-success/5 border border-success/20">
          <p className="text-xs font-medium text-success mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> USE</p>
          <div className="flex flex-wrap gap-1">
            {wordsToUse.map((word, idx) => (
              <button key={idx} onClick={() => onCopy(word, `use-${idx}`)} aria-label={`Copiar: ${word}`} className="text-xs px-2 py-1 rounded-full bg-success/10 text-success hover:bg-success/20 transition-colors flex items-center gap-1">
                {word}{copiedText === `use-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 opacity-50" />}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <p className="text-xs font-medium text-destructive mb-2 flex items-center gap-1"><X className="w-3 h-3" /> EVITE</p>
          <div className="flex flex-wrap gap-1">
            {wordsToAvoid.map((word, idx) => <span key={idx} className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive">{word}</span>)}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

export function ValuesSection({ values, isExpanded, onToggle }: { values: string[]; isExpanded: boolean; onToggle: () => void }) {
  return (
    <CollapsibleSection id="values" icon={<Target className="w-4 h-4 text-accent" />} title="Valores Importantes" isExpanded={isExpanded} onToggle={onToggle}>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value, idx) => <Badge key={idx} variant="secondary" className="capitalize">{value}</Badge>)}
      </div>
    </CollapsibleSection>
  );
}

export function DISCStrategiesSection({ discProfile, isExpanded, onToggle }: { discProfile: { type: string; salesStrategies: { opening: string[]; closing: string[] }; avoidBehaviors: string[] }; isExpanded: boolean; onToggle: () => void }) {
  if (discProfile.type === 'N/A') return null;
  return (
    <CollapsibleSection id="disc" icon={<Target className="w-4 h-4 text-primary" />} title={`Estratégias DISC (${discProfile.type})`} isExpanded={isExpanded} onToggle={onToggle}>
      <div className="mt-2 space-y-3">
        <div className="p-2 rounded-lg bg-primary/5 border border-primary/20"><p className="text-xs font-medium text-primary mb-1">🎯 Abertura</p><ul className="text-xs space-y-0.5 text-muted-foreground">{discProfile.salesStrategies.opening.slice(0, 2).map((tip, i) => <li key={i} className="flex items-start gap-1"><CheckCircle className="w-3 h-3 text-primary shrink-0 mt-0.5" />{tip}</li>)}</ul></div>
        <div className="p-2 rounded-lg bg-success/5 border border-success/20"><p className="text-xs font-medium text-success mb-1">🏆 Fechamento</p><ul className="text-xs space-y-0.5 text-muted-foreground">{discProfile.salesStrategies.closing.slice(0, 2).map((tip, i) => <li key={i} className="flex items-start gap-1"><CheckCircle className="w-3 h-3 text-success shrink-0 mt-0.5" />{tip}</li>)}</ul></div>
        <div className="p-2 rounded-lg bg-destructive/5 border border-destructive/20"><p className="text-xs font-medium text-destructive mb-1">⚠️ Evite</p><ul className="text-xs space-y-0.5 text-muted-foreground">{discProfile.avoidBehaviors.slice(0, 2).map((avoid, i) => <li key={i} className="flex items-start gap-1"><X className="w-3 h-3 text-destructive shrink-0 mt-0.5" />{avoid}</li>)}</ul></div>
      </div>
    </CollapsibleSection>
  );
}

export function ObjectionsWarning({ objections }: { objections: string[] }) {
  if (objections.length === 0) return null;
  return (
    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
      <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-warning" /><span className="text-sm font-medium text-warning">Atenção: Objeções Detectadas</span></div>
      <div className="flex flex-wrap gap-2">{objections.map((obj, idx) => <Badge key={idx} variant="outline" className="border-warning/30 text-warning">{obj}</Badge>)}</div>
    </div>
  );
}

export function ClosingReadiness({ closingMoment }: { closingMoment: string }) {
  return (
    <div className="p-3 rounded-lg bg-secondary/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Potencial de Fechamento</span>
        <Badge className={cn(closingMoment === 'Alto potencial' ? 'bg-success text-success-foreground' : closingMoment === 'Moderado' ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground')}>{closingMoment}</Badge>
      </div>
      <Progress value={closingMoment === 'Alto potencial' ? 85 : closingMoment === 'Moderado' ? 50 : 25} className="h-2" />
    </div>
  );
}
