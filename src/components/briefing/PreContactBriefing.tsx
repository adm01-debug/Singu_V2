import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Phone, Video, Calendar, X, Clock, Brain, Target, Zap, CheckCircle, TrendingUp, TrendingDown, Minus, Eye, Ear, Hand, Cpu, Heart, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { usePreContactBriefing } from '@/hooks/usePreContactBriefing';
import { NeuroBriefingCard } from '@/components/neuromarketing';
import { cn } from '@/lib/utils';
import { OpeningTipsSection, WordsSection, ValuesSection, DISCStrategiesSection, ObjectionsWarning, ClosingReadiness } from './pre-contact/BriefingSections';

const interactionTypeIcons: Record<string, React.ElementType> = { call: Phone, meeting: Calendar, video_call: Video };
const vakIcons: Record<string, React.ElementType> = { Visual: Eye, Auditory: Ear, Kinesthetic: Hand, Digital: Cpu };
const vakColors: Record<string, string> = { Visual: 'text-info bg-info/10', Auditory: 'text-secondary bg-secondary/10', Kinesthetic: 'text-accent bg-accent/10', Digital: 'text-success bg-success/10' };

interface PreContactBriefingProps { className?: string; compact?: boolean; }

export function PreContactBriefing({ className, compact = false }: PreContactBriefingProps) {
  const { upcomingBriefings, activeBriefing, loading, dismissBriefing, showBriefingFor } = usePreContactBriefing();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['tips', 'words']));
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => { navigator.clipboard.writeText(text).then(() => { setCopiedText(id); setTimeout(() => setCopiedText(null), 2000); }).catch(() => {}); };
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) { next.delete(section); } else { next.add(section); }
      return next;
    });
  };

  if (loading || (upcomingBriefings.length === 0 && !activeBriefing)) return null;

  // Compact view
  if (compact && !activeBriefing) {
    return (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={className}>
        <Card className="border-primary/20 bg-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary"><Brain className="w-4 h-4" />Briefing Pré-Contato</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcomingBriefings.slice(0, 3).map((briefing) => {
              const Icon = interactionTypeIcons[briefing.interaction.type] || Phone;
              return (
                <motion.div key={briefing.interaction.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer group" onClick={() => showBriefingFor(briefing.interaction.id)}>
                  <Avatar className="h-8 w-8 border border-primary/20"><AvatarImage src={briefing.contact.avatar_url || ''} /><AvatarFallback className="bg-primary/10 text-primary text-xs">{briefing.contact.first_name?.[0]}{briefing.contact.last_name?.[0]}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{briefing.contact.first_name} {briefing.contact.last_name}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><Icon className="w-3 h-3" />{briefing.interaction.title}</p></div>
                  <Badge variant="outline" className="text-xs shrink-0"><Clock className="w-3 h-3 mr-1" />{briefing.minutesUntilMeeting}min</Badge>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Active briefing
  if (activeBriefing) {
    const briefing = activeBriefing;
    const Icon = interactionTypeIcons[briefing.interaction.type] || Phone;
    const VAKIcon = vakIcons[briefing.vakProfile.dominant] || Brain;
    const TrendIcon = briefing.emotionalProfile.trend === 'improving' ? TrendingUp : briefing.emotionalProfile.trend === 'declining' ? TrendingDown : Minus;

    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -20 }} className={cn("fixed inset-x-4 top-20 z-50 max-w-2xl mx-auto", className)}>
          <Card className="border border-primary/20 bg-background/95 backdrop-blur-lg">
            <CardHeader className="pb-3 bg-primary/5 rounded-t-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-14 w-14 border-2 border-primary/30"><AvatarImage src={briefing.contact.avatar_url || ''} /><AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{briefing.contact.first_name?.[0]}{briefing.contact.last_name?.[0]}</AvatarFallback></Avatar>
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary text-primary-foreground"><Icon className="w-3 h-3" /></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{briefing.contact.first_name} {briefing.contact.last_name}</h3>
                    <p className="text-sm text-muted-foreground">{briefing.company?.name || briefing.contact.role_title || 'Contato'}</p>
                    <div className="flex items-center gap-2 mt-1"><Badge className="bg-primary/10 text-primary border-primary/30"><Clock className="w-3 h-3 mr-1" />Em {briefing.minutesUntilMeeting} min</Badge><Badge variant="outline" className="text-xs">{briefing.interaction.title}</Badge></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/contatos/${briefing.contact.id}`}><Button variant="ghost" size="sm"><User className="w-4 h-4 mr-1" />Perfil</Button></Link>
                  <Button variant="ghost" size="icon" onClick={() => dismissBriefing(briefing.interaction.id)} aria-label="Dispensar" className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-4 gap-3">
                <div className={cn("p-3 rounded-lg text-center", vakColors[briefing.vakProfile.dominant])}><VAKIcon className="w-5 h-5 mx-auto mb-1" /><p className="text-xs font-medium">{briefing.vakProfile.dominant}</p><p className="text-[10px] opacity-70">Estilo PNL</p></div>
                <div className="p-3 rounded-lg text-center bg-secondary/50"><Target className="w-5 h-5 mx-auto mb-1 text-foreground" /><p className="text-xs font-medium">{briefing.discProfile.type || 'N/A'}</p><p className="text-[10px] text-muted-foreground">Perfil DISC</p></div>
                <div className={cn("p-3 rounded-lg text-center", briefing.emotionalProfile.currentState === 'Positivo' ? 'bg-success/10 text-success' : briefing.emotionalProfile.currentState === 'Cauteloso' ? 'bg-warning/10 text-warning' : 'bg-muted text-muted-foreground')}><TrendIcon className="w-5 h-5 mx-auto mb-1" /><p className="text-xs font-medium">{briefing.emotionalProfile.currentState}</p><p className="text-[10px] opacity-70">Estado</p></div>
                <div className={cn("p-3 rounded-lg text-center", briefing.rapportScore >= 70 ? 'bg-success/10 text-success' : briefing.rapportScore >= 40 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive')}><Heart className="w-5 h-5 mx-auto mb-1" /><p className="text-xs font-medium">{briefing.rapportScore}%</p><p className="text-[10px] opacity-70">Rapport</p></div>
              </div>

              {briefing.lastInteractionSummary && <div className="p-3 rounded-lg bg-muted/50 text-sm"><p className="text-xs text-muted-foreground mb-1">Última interação:</p><p className="font-medium">{briefing.lastInteractionSummary}</p></div>}
              <NeuroBriefingCard contactName={`${briefing.contact.first_name} ${briefing.contact.last_name}`} discProfile={briefing.discProfile?.type !== 'N/A' ? briefing.discProfile?.type : null} interactions={[]} />
              <Separator />

              <OpeningTipsSection tips={briefing.openingTips} isExpanded={expandedSections.has('tips')} onToggle={() => toggleSection('tips')} />
              <WordsSection wordsToUse={briefing.wordsToUse} wordsToAvoid={briefing.wordsToAvoid} copiedText={copiedText} onCopy={handleCopy} isExpanded={expandedSections.has('words')} onToggle={() => toggleSection('words')} />
              <ValuesSection values={briefing.topValues} isExpanded={expandedSections.has('values')} onToggle={() => toggleSection('values')} />
              <DISCStrategiesSection discProfile={briefing.discProfile} isExpanded={expandedSections.has('disc')} onToggle={() => toggleSection('disc')} />
              <ObjectionsWarning objections={briefing.recentObjections} />
              <ClosingReadiness closingMoment={briefing.closingMoment} />
            </CardContent>

            <div className="px-4 py-3 bg-muted/30 rounded-b-lg flex items-center justify-between">
              <p className="text-xs text-muted-foreground"><Zap className="w-3 h-3 inline mr-1" />Briefing de 30 segundos • Atualizado agora</p>
              <Button size="sm" onClick={() => dismissBriefing(briefing.interaction.id)}><CheckCircle className="w-4 h-4 mr-1" />Pronto para ligar</Button>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  // List of upcoming briefings
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={className}>
      <Card className="border-primary/20 bg-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary"><Brain className="w-4 h-4" />Briefings Próximos<Badge variant="secondary" className="ml-auto">{upcomingBriefings.length}</Badge></CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {upcomingBriefings.map((briefing) => {
            const Icon = interactionTypeIcons[briefing.interaction.type] || Phone;
            return (
              <motion.div key={briefing.interaction.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer group border border-transparent hover:border-primary/20" onClick={() => showBriefingFor(briefing.interaction.id)}>
                <Avatar className="h-10 w-10 border border-primary/20"><AvatarImage src={briefing.contact.avatar_url || ''} /><AvatarFallback className="bg-primary/10 text-primary text-sm">{briefing.contact.first_name?.[0]}{briefing.contact.last_name?.[0]}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{briefing.contact.first_name} {briefing.contact.last_name}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><Icon className="w-3 h-3" />{briefing.interaction.title}</p></div>
                <div className="text-right shrink-0"><Badge variant={briefing.minutesUntilMeeting <= 15 ? 'destructive' : 'outline'} className="text-xs"><Clock className="w-3 h-3 mr-1" />{briefing.minutesUntilMeeting} min</Badge><p className="text-[10px] text-muted-foreground mt-1">Clique para briefing</p></div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
