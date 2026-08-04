// ==============================================
// CARNEGIE QUICK ACCESS PANEL
// Quick access to Carnegie principles from contact page
// ==============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Star,
  Thermometer,
  Target,
  Award,
  MessageSquare,
  Gift,
  ChevronRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Contact } from '@/types';
import { useCarnegieAnalysis } from '@/hooks/useCarnegieAnalysis';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WarmthAnalyzerPanel } from './WarmthAnalyzerPanel';
import { NobleCausePanel } from './NobleCausePanel';
import { IdentityLabelingPanel } from './IdentityLabelingPanel';
import { TalkRatioPanel } from './TalkRatioPanel';
import { AppreciationPanel } from './AppreciationPanel';

interface CarnegieQuickAccessProps {
  contact: Contact;
  className?: string;
}

const QUICK_PRINCIPLES = [
  { 
    id: 'warmth', 
    icon: Thermometer, 
    label: 'Calor Humano', 
    color: 'text-accent',
    bg: 'bg-accent/10',
    description: 'Analise o calor da sua comunicação'
  },
  { 
    id: 'noble', 
    icon: Target, 
    label: 'Causa Nobre', 
    color: 'text-primary',
    bg: 'bg-primary/10',
    description: 'Apele para motivos mais nobres'
  },
  { 
    id: 'identity', 
    icon: Award, 
    label: 'Identidade', 
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    description: 'Reforce a identidade positiva'
  },
  { 
    id: 'talk', 
    icon: MessageSquare, 
    label: 'Fala/Escuta', 
    color: 'text-info',
    bg: 'bg-info/10',
    description: 'Monitore sua proporção de fala'
  },
  { 
    id: 'appreciation', 
    icon: Gift, 
    label: 'Apreciação', 
    color: 'text-primary',
    bg: 'bg-primary/10',
    description: 'Demonstre apreciação genuína'
  },
];

export function CarnegieQuickAccess({ contact, className }: CarnegieQuickAccessProps) {
  const [selectedPrinciple, setSelectedPrinciple] = useState<string | null>(null);
  const { calculateCarnegieScore, discProfile } = useCarnegieAnalysis(contact);
  
  // Calculate a demo score
  const score = calculateCarnegieScore(65);

  const renderPrincipleContent = () => {
    switch (selectedPrinciple) {
      case 'warmth':
        return <WarmthAnalyzerPanel contact={contact} />;
      case 'noble':
        return <NobleCausePanel contact={contact} />;
      case 'identity':
        return <IdentityLabelingPanel contact={contact} />;
      case 'talk':
        return <TalkRatioPanel contact={contact} />;
      case 'appreciation':
        return <AppreciationPanel contact={contact} />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreLabel = (level: string) => {
    const labels: Record<string, string> = {
      master: 'Mestre',
      expert: 'Especialista',
      proficient: 'Proficiente',
      developing: 'Em Desenvolvimento',
      novice: 'Iniciante'
    };
    return labels[level] || level;
  };

  return (
    <Card variant="elevated" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 rounded-full bg-gradient-to-br from-warning/20 to-primary/20">
              <Star className="h-4 w-4 text-warning" />
            </div>
            Princípios de Carnegie
          </CardTitle>
          <Link to="/insights?tab=carnegie">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              Ver Todos
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Como Fazer Amigos e Influenciar Pessoas
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Score Overview */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-warning/20 to-primary/20 flex items-center justify-center">
                <span className={cn("text-lg font-bold", getScoreColor(score.overall))}>
                  {score.overall}
                </span>
              </div>
              <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium">Score Carnegie</p>
              <p className={cn("text-xs", getScoreColor(score.overall))}>
                {getScoreLabel(score.level)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            DISC {discProfile}
          </Badge>
        </div>

        {/* Quick Access Buttons */}
        <div className="grid grid-cols-1 gap-2">
          {QUICK_PRINCIPLES.map((principle) => {
            const Icon = principle.icon;
            return (
              <Dialog 
                key={principle.id}
                open={selectedPrinciple === principle.id}
                onOpenChange={(open) => setSelectedPrinciple(open ? principle.id : null)}
              >
                <DialogTrigger asChild>
                  <button className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left w-full group">
                    <div className={cn("p-2 rounded-full shrink-0", principle.bg)}>
                      <Icon className={cn("h-4 w-4", principle.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{principle.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {principle.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <div className={cn("p-2 rounded-full", principle.bg)}>
                        <Icon className={cn("h-5 w-5", principle.color)} />
                      </div>
                      {principle.label}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    {renderPrincipleContent()}
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>

        {/* Strengths */}
        {score.strengths.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Pontos Fortes</p>
            <div className="flex flex-wrap gap-1">
              {score.strengths.map((strength, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs bg-success/10 text-success">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Areas for Improvement */}
        {score.areasForImprovement.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Áreas para Melhorar</p>
            <div className="flex flex-wrap gap-1">
              {score.areasForImprovement.map((area, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
