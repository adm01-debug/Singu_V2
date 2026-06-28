import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Eye, Ear, Hand, ChevronRight, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Contact, DISCProfile } from '@/types';
import { VAKType, VAKProfile } from '@/types/vak';
import { MetaprogramProfile, METAPROGRAM_LABELS } from '@/types/metaprograms';
import { VAK_ADAPTED_TEMPLATES } from '@/data/vakTemplates';
import { METAPROGRAM_TEMPLATES, getAdaptedMessage } from '@/data/metaprogramTemplates';
import { TemplatePreviewDialog, type SuggestedTemplate } from './profile-based/TemplatePreviewDialog';
import { generateCombinedMessage } from './profile-based/generateCombinedMessage';

interface ProfileBasedSuggestionsProps { contact: Contact; vakProfile: VAKProfile | null; metaprogramProfile: MetaprogramProfile | null; className?: string; }

const DISC_DESCRIPTIONS: Record<DISCProfile, { name: string; icon: string; color: string }> = {
  D: { name: 'Dominante', icon: '🔴', color: 'bg-destructive text-destructive border-destructive' },
  I: { name: 'Influente', icon: '🟡', color: 'bg-warning text-warning border-warning/30' },
  S: { name: 'Estável', icon: '🟢', color: 'bg-success text-success border-success/30' },
  C: { name: 'Consciente', icon: '🔵', color: 'bg-info text-info border-info' },
};

const VAK_DESCRIPTIONS: Record<VAKType, { name: string; icon: typeof Eye; color: string }> = {
  V: { name: 'Visual', icon: Eye, color: 'bg-info text-info' },
  A: { name: 'Auditivo', icon: Ear, color: 'bg-secondary text-secondary' },
  K: { name: 'Cinestésico', icon: Hand, color: 'bg-accent text-accent' },
  D: { name: 'Digital', icon: Brain, color: 'bg-muted text-muted-foreground' },
};

const categoryBadges = {
  vak: { color: 'bg-info text-info border-info', label: 'VAK' },
  metaprogram: { color: 'bg-secondary text-secondary border-secondary', label: 'Metaprograma' },
  combined: { color: 'bg-success text-success border-success/30', label: 'Combinado' },
};

export function ProfileBasedSuggestions({ contact, vakProfile, metaprogramProfile, className }: ProfileBasedSuggestionsProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'vak' | 'metaprogram' | 'combined'>('all');
  const discProfile = contact.behavior?.discProfile as DISCProfile | undefined;

  const suggestions = useMemo<SuggestedTemplate[]>(() => {
    const results: SuggestedTemplate[] = [];

    if (vakProfile?.primary) {
      VAK_ADAPTED_TEMPLATES.forEach(template => {
        const variation = template.variations.find(v => v.vakType === vakProfile.primary);
        if (!variation) return;
        let matchScore = 50;
        const matchReasons: string[] = [];
        matchScore += vakProfile.confidence * 0.3;
        matchReasons.push(`Adaptado para perfil ${VAK_DESCRIPTIONS[vakProfile.primary].name} (${vakProfile.confidence.toFixed(0)}% confiança)`);
        if (template.discProfile === null || template.discProfile === discProfile) {
          if (discProfile) { matchScore += 15; matchReasons.push(`Compatível com perfil DISC ${DISC_DESCRIPTIONS[discProfile].name}`); }
        }
        results.push({ id: `vak-${template.id}`, title: template.baseTitle, category: 'vak', scenario: template.scenario || 'Geral', message: variation.template, variables: template.variables, matchScore, matchReasons, tips: [...variation.tips, ...template.universalTips], source: 'VAK' });
      });
    }

    if (metaprogramProfile) {
      METAPROGRAM_TEMPLATES.forEach(template => {
        const { motivation, reference, working } = getAdaptedMessage(template, metaprogramProfile.motivationDirection, metaprogramProfile.referenceFrame, metaprogramProfile.workingStyle);
        let matchScore = 40;
        const matchReasons: string[] = [];
        const tips: string[] = [];
        if (metaprogramProfile.motivationDirection !== 'balanced') { matchScore += metaprogramProfile.motivationConfidence * 0.2; const motLabel = METAPROGRAM_LABELS.motivationDirection[metaprogramProfile.motivationDirection]; matchReasons.push(`Motivação: ${motLabel.name} (${metaprogramProfile.motivationConfidence.toFixed(0)}%)`); tips.push(...motLabel.communicationTips.slice(0, 2)); }
        if (metaprogramProfile.referenceFrame !== 'balanced') { matchScore += metaprogramProfile.referenceConfidence * 0.15; const refLabel = METAPROGRAM_LABELS.referenceFrame[metaprogramProfile.referenceFrame]; matchReasons.push(`Referência: ${refLabel.name} (${metaprogramProfile.referenceConfidence.toFixed(0)}%)`); tips.push(...refLabel.communicationTips.slice(0, 1)); }
        if (metaprogramProfile.workingStyle !== 'balanced') { matchScore += metaprogramProfile.workingConfidence * 0.15; const workLabel = METAPROGRAM_LABELS.workingStyle[metaprogramProfile.workingStyle]; matchReasons.push(`Estilo: ${workLabel.name} (${metaprogramProfile.workingConfidence.toFixed(0)}%)`); tips.push(...workLabel.communicationTips.slice(0, 1)); }
        let primaryMessage = motivation;
        if (metaprogramProfile.referenceConfidence > metaprogramProfile.motivationConfidence) primaryMessage = reference;
        if (metaprogramProfile.workingConfidence > Math.max(metaprogramProfile.motivationConfidence, metaprogramProfile.referenceConfidence)) primaryMessage = working;
        results.push({ id: `meta-${template.id}`, title: template.baseTitle, category: 'metaprogram', scenario: template.scenario, message: primaryMessage, variables: template.variables, matchScore, matchReasons, tips, source: 'Metaprograma' });
      });
    }

    if (vakProfile?.primary && metaprogramProfile) {
      [
        { id: 'combined-approach', title: 'Abordagem Inicial Personalizada', scenario: 'Primeiro contato adaptado ao perfil completo', type: 'opening' as const },
        { id: 'combined-objection', title: 'Resposta a Objeções Personalizada', scenario: 'Lidar com resistências usando perfil completo', type: 'objection' as const },
        { id: 'combined-closing', title: 'Fechamento Personalizado', scenario: 'Momento de decisão adaptado ao perfil', type: 'closing' as const },
        { id: 'combined-followup', title: 'Follow-up Personalizado', scenario: 'Retomar contato usando preferências do cliente', type: 'followup' as const },
      ].forEach(t => {
        const matchReasons: string[] = []; const tips: string[] = []; let matchScore = 80;
        matchReasons.push(`Linguagem ${VAK_DESCRIPTIONS[vakProfile.primary].name} (VAK)`);
        if (metaprogramProfile.motivationDirection !== 'balanced') { const motLabel = METAPROGRAM_LABELS.motivationDirection[metaprogramProfile.motivationDirection]; matchReasons.push(`Motivação ${motLabel.name}`); tips.push(motLabel.communicationTips[0]); }
        if (discProfile) matchReasons.push(`Perfil DISC ${DISC_DESCRIPTIONS[discProfile].name}`);
        matchScore += (vakProfile.confidence + metaprogramProfile.overallConfidence) * 0.1;
        results.push({ id: t.id, title: t.title, category: 'combined', scenario: t.scenario, message: generateCombinedMessage(vakProfile, metaprogramProfile, discProfile, t.type), variables: ['nome', 'empresa', 'beneficio', 'problema'], matchScore, matchReasons, tips, source: 'Combinado' });
      });
    }

    return results.sort((a, b) => b.matchScore - a.matchScore);
  }, [vakProfile, metaprogramProfile, discProfile]);

  const filteredSuggestions = useMemo(() => activeCategory === 'all' ? suggestions : suggestions.filter(s => s.category === activeCategory), [suggestions, activeCategory]);

  if (!vakProfile && !metaprogramProfile) {
    return <Card className={className}><CardContent className="pt-6"><div className="text-center py-8"><Brain className="w-12 h-12 mx-auto text-muted-foreground/70 mb-3" /><p className="text-sm text-muted-foreground">Analise o perfil do contato para receber sugestões personalizadas</p></div></CardContent></Card>;
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="w-5 h-5 text-primary" />Sugestões Baseadas no Perfil<Badge variant="secondary" className="ml-auto text-xs">{suggestions.length} templates</Badge></CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {vakProfile?.primary && <Badge variant="outline" className={cn('text-xs', VAK_DESCRIPTIONS[vakProfile.primary].color)}>{React.createElement(VAK_DESCRIPTIONS[vakProfile.primary].icon, { className: 'w-3 h-3 mr-1' })}{VAK_DESCRIPTIONS[vakProfile.primary].name}</Badge>}
          {discProfile && <Badge variant="outline" className={cn('text-xs', DISC_DESCRIPTIONS[discProfile].color)}>{DISC_DESCRIPTIONS[discProfile].icon} {DISC_DESCRIPTIONS[discProfile].name}</Badge>}
          {metaprogramProfile && metaprogramProfile.motivationDirection !== 'balanced' && <Badge variant="outline" className={cn('text-xs', METAPROGRAM_LABELS.motivationDirection[metaprogramProfile.motivationDirection].color)}>{METAPROGRAM_LABELS.motivationDirection[metaprogramProfile.motivationDirection].icon} {METAPROGRAM_LABELS.motivationDirection[metaprogramProfile.motivationDirection].name}</Badge>}
        </div>
        <Tabs value={activeCategory} onValueChange={v => setActiveCategory(v as typeof activeCategory)}>
          <TabsList className="w-full grid grid-cols-4 h-8">
            <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
            <TabsTrigger value="vak" className="text-xs">VAK</TabsTrigger>
            <TabsTrigger value="metaprogram" className="text-xs">Meta</TabsTrigger>
            <TabsTrigger value="combined" className="text-xs">Combinado</TabsTrigger>
          </TabsList>
        </Tabs>
        <ScrollArea className="h-[300px] pr-2">
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filteredSuggestions.slice(0, 8).map((suggestion, index) => (
                <motion.div key={suggestion.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: index * 0.05 }}>
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer transition-all group">
                        <div className="relative w-10 h-10 shrink-0">
                          <svg className="w-10 h-10 -rotate-90"><circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="none" className="text-muted/20" /><circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray={`${(suggestion.matchScore / 100) * 100.5} 100.5`} className="text-primary" /></svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{suggestion.matchScore.toFixed(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-medium truncate">{suggestion.title}</p><Badge variant="outline" className={cn('text-xs', categoryBadges[suggestion.category].color)}>{categoryBadges[suggestion.category].label}</Badge></div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{suggestion.scenario}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                      <DialogHeader><DialogTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" />{suggestion.title}</DialogTitle></DialogHeader>
                      <TemplatePreviewDialog template={suggestion} contact={contact} onCopy={() => {}} />
                    </DialogContent>
                  </Dialog>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredSuggestions.length === 0 && <div className="text-center py-8"><p className="text-sm text-muted-foreground">Nenhuma sugestão para esta categoria</p></div>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
