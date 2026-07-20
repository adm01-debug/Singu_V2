import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, TrendingUp, Star, Target, ChevronRight, Award, Copy, Check, Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { PersuasionTemplate, MENTAL_TRIGGERS, TriggerType } from '@/types/triggers';
import { toast } from 'sonner';
import { useSmartTemplateSuggestions, SmartSuggestion } from '@/hooks/useSmartTemplateSuggestions';

interface SmartTemplateSuggestionsProps {
  contact: Contact;
  className?: string;
  onSelectTemplate?: (template: PersuasionTemplate) => void;
}

const TAG_CONFIG = {
  top_performer: { label: 'Top Performer', icon: Award, color: 'bg-warning/10 text-warning border-warning/30' },
  disc_match: { label: 'Match DISC', icon: Users, color: 'bg-info/10 text-info border-info' },
  rising_star: { label: 'Em Alta', icon: TrendingUp, color: 'bg-success/10 text-success border-success/30' },
  recommended: { label: 'Recomendado', icon: Sparkles, color: 'bg-primary/10 text-primary border-primary/30' },
};

export function SmartTemplateSuggestions({ contact, className, onSelectTemplate }: SmartTemplateSuggestionsProps) {
  const { suggestions, loading, handleUseTemplate } = useSmartTemplateSuggestions(contact);

  const onUse = async (template: PersuasionTemplate) => {
    await handleUseTemplate(template);
    onSelectTemplate?.(template);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3"><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-primary" />
          Sugestões Inteligentes
          <Badge variant="secondary" className="ml-auto text-xs">Baseado no histórico</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-2">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {suggestions.map((suggestion, index) => (
                <SuggestionCard key={suggestion.template.id} suggestion={suggestion} index={index} contact={contact} onUse={onUse} />
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function SuggestionCard({ suggestion, index, contact, onUse }: { suggestion: SmartSuggestion; index: number; contact: Contact; onUse: (t: PersuasionTemplate) => void }) {
  const { template, reason, score, successData, tag } = suggestion;
  const trigger = MENTAL_TRIGGERS[template.trigger as TriggerType];
  const TagIcon = TAG_CONFIG[tag].icon;

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: index * 0.1 }}>
      <Dialog>
        <DialogTrigger asChild>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all group">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">{index + 1}</div>
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0', trigger?.color)}>{trigger?.icon || '🎯'}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium truncate">{template.title}</p>
                <Badge variant="outline" className={cn('text-xs gap-1', TAG_CONFIG[tag].color)}>
                  <TagIcon className="w-3 h-3" />{TAG_CONFIG[tag].label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{reason}</p>
              {successData && successData.totalUsages > 0 && (
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground"><span className="text-success font-medium">{successData.successRate.toFixed(0)}%</span> sucesso</span>
                  <span className="text-xs text-muted-foreground">{successData.totalUsages} usos</span>
                  {successData.avgRating > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-warning fill-warning" />{successData.avgRating.toFixed(1)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><Target className="w-3 h-3" /><span className="font-medium">{score.toFixed(0)}</span></div>
              <Progress value={score} className="h-1 w-12 mt-1" />
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xl">{trigger?.icon}</span>
              {template.title}
              <Badge variant="outline" className={cn('text-xs gap-1 ml-auto', TAG_CONFIG[tag].color)}>
                <TagIcon className="w-3 h-3" />{TAG_CONFIG[tag].label}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <TemplatePreview suggestion={suggestion} contact={contact} onUse={onUse} />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function TemplatePreview({ suggestion, contact, onUse }: { suggestion: SmartSuggestion; contact: Contact; onUse: (t: PersuasionTemplate) => void }) {
  const { template, successData } = suggestion;
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.variables.forEach(v => {
      if (v === 'nome') initial[v] = contact.firstName;
      else if (v === 'empresa_cliente') initial[v] = contact.companyName || '';
      else initial[v] = '';
    });
    return initial;
  });
  const [copied, setCopied] = useState(false);

  const filledTemplate = template.template.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
  const allFilled = template.variables.every(v => variables[v]?.trim());

  const handleCopy = () => {
    navigator.clipboard.writeText(filledTemplate)
      .then(() => { setCopied(true); toast.success('Mensagem copiada!'); onUse(template); setTimeout(() => setCopied(false), 2000); })
      .catch(() => toast.error('Não foi possível copiar'));
  };

  return (
    <div className="space-y-4">
      {successData && successData.totalUsages > 0 && (
        <div className="p-3 rounded-lg bg-success/5 border border-success/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">Histórico de Sucesso</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-lg font-bold text-success">{successData.totalUsages}</p><p className="text-xs text-muted-foreground">Usos</p></div>
            <div><p className="text-lg font-bold text-success">{successData.successRate.toFixed(0)}%</p><p className="text-xs text-muted-foreground">Sucesso</p></div>
            <div><p className="text-lg font-bold text-warning">{successData.avgRating > 0 ? successData.avgRating.toFixed(1) : '-'}</p><p className="text-xs text-muted-foreground">Nota</p></div>
          </div>
        </div>
      )}
      <div className="grid gap-3">
        {template.variables.map(variable => (
          <div key={variable}>
            <Label htmlFor={variable} className="text-sm capitalize">{variable.replace(/_/g, ' ')}</Label>
            <Input id={variable} value={variables[variable] || ''} onChange={(e) => setVariables(prev => ({ ...prev, [variable]: e.target.value }))} placeholder={`Digite ${variable.replace(/_/g, ' ')}`} className="mt-1" />
          </div>
        ))}
      </div>
      <div>
        <Label className="text-sm">Prévia da mensagem:</Label>
        <Textarea value={filledTemplate} readOnly className="mt-1 h-32 bg-secondary/30" />
      </div>
      {template.tips.length > 0 && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-xs font-medium text-warning mb-2">💡 Dicas:</p>
          <ul className="space-y-1">{template.tips.map((tip, i) => <li key={i} className="text-xs text-muted-foreground">• {tip}</li>)}</ul>
        </div>
      )}
      <Button onClick={handleCopy} disabled={!allFilled} className="w-full gap-2">
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copiado!' : 'Copiar Mensagem'}
      </Button>
    </div>
  );
}
