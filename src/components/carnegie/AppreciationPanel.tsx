// ==============================================
// APPRECIATION TRACKER PANEL
// Give honest and sincere appreciation
// ==============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart,
  Copy,
  Star,
  Gift,
  Award,
  TrendingUp,
  Sparkles,
  MessageCircleHeart,
  ThumbsUp,
  Gem
} from 'lucide-react';
import { AppreciationType } from '@/types/carnegie';
import { APPRECIATION_TEMPLATES } from '@/data/carnegieAppreciation';
import { useCarnegieAnalysis } from '@/hooks/useCarnegieAnalysis';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { toast } from 'sonner';

interface AppreciationPanelProps {
  contact?: Contact | null;
  className?: string;
}

const TYPE_ICONS: Record<AppreciationType, React.ComponentType<{ className?: string }>> = {
  sincere_compliment: Heart,
  specific_recognition: Star,
  effort_acknowledgment: TrendingUp,
  character_praise: Award,
  achievement_celebration: Gift,
  growth_recognition: Sparkles,
  contribution_thanks: ThumbsUp,
  quality_admiration: Gem
};

const TYPE_COLORS: Record<AppreciationType, string> = {
  sincere_compliment: 'text-primary bg-primary/10',
  specific_recognition: 'text-warning bg-warning/10',
  effort_acknowledgment: 'text-primary bg-primary/10',
  character_praise: 'text-secondary bg-secondary/10',
  achievement_celebration: 'text-success bg-success/10',
  growth_recognition: 'text-accent-foreground bg-accent/10',
  contribution_thanks: 'text-warning bg-warning/10',
  quality_admiration: 'text-primary bg-primary/10'
};

export function AppreciationPanel({ contact = null, className }: AppreciationPanelProps) {
  const { discProfile } = useCarnegieAnalysis(contact);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const appreciationData = Object.entries(APPRECIATION_TEMPLATES).map(([type, data]) => ({
    type: type as AppreciationType,
    ...data,
    templates: data.examples,
    keywords: data.whenToUse,
    emotionalImpact: data.impact
  }));

  return (
    <Card variant="elevated" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircleHeart className="h-5 w-5 text-primary" />
            Biblioteca de Apreciação
          </CardTitle>
          <Badge variant="outline">Perfil {discProfile}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          "Dê apreciação honesta e sincera" - Dale Carnegie
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {appreciationData.map((appreciation) => {
          const Icon = TYPE_ICONS[appreciation.type];
          const colorClass = TYPE_COLORS[appreciation.type];

          return (
            <div 
              key={appreciation.type}
              className="border rounded-lg p-4 space-y-3 hover:border-primary/30 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-full shrink-0", colorClass.split(' ')[1])}>
                  <Icon className={cn("h-5 w-5", colorClass.split(' ')[0])} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-base">{appreciation.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {appreciation.description}
                  </p>
                </div>
              </div>

              {/* DISC Profile Hint */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-1 mb-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium">Adaptado para Perfil {discProfile}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use expressões genuínas e específicas para este perfil.
                </p>
              </div>

              {/* Templates */}
              <div className="space-y-2">
                <span className="text-xs font-medium">Templates Prontos</span>
                <div className="grid gap-2">
                  {appreciation.templates.slice(0, 3).map((template, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-muted/50 group hover:bg-muted"
                    >
                      <span className="text-xs italic flex-1 mr-2">"{template}"</span>
                      <Button
                        size="icon" aria-label="Copiar"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => copyToClipboard(template, 'Template')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <span className="text-xs font-medium">Quando Usar</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {appreciation.keywords.slice(0, 6).map((keyword, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="text-xs"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-success/5 border border-success/20">
                  <span className="font-medium text-success">Dica:</span>
                  <p className="text-muted-foreground mt-0.5">
                    Seja específico e genuíno
                  </p>
                </div>
                <div className="p-2 rounded bg-warning/5 border border-warning/20">
                  <span className="font-medium text-warning">Impacto:</span>
                  <p className="text-muted-foreground mt-0.5">
                    {appreciation.emotionalImpact === 'very_high' ? 'Muito Alto' :
                     appreciation.emotionalImpact === 'high' ? 'Alto' :
                     appreciation.emotionalImpact === 'medium' ? 'Médio' : 'Baixo'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
