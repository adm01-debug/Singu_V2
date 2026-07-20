// ==============================================
// IDENTITY LABELING PANEL
// Give people a reputation to live up to
// ==============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Award,
  Star,
  Copy,
  Sparkles,
  Target,
  Lightbulb,
  Users,
  Zap,
  Heart,
  Eye,
  Brain
} from 'lucide-react';
import { useCarnegieAnalysis } from '@/hooks/useCarnegieAnalysis';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { toast } from 'sonner';

interface IdentityLabelingPanelProps {
  contact?: Contact | null;
  className?: string;
}

const CATEGORY_ICONS = {
  achiever: Star,
  innovator: Lightbulb,
  leader: Zap,
  expert: Brain,
  pioneer: Target,
  caregiver: Heart,
  visionary: Eye,
  perfectionist: Award,
  problem_solver: Lightbulb,
  connector: Users,
  mentor: Users,
  trailblazer: Zap
};

const CATEGORY_LABELS = {
  achiever: 'Realizador',
  innovator: 'Inovador',
  leader: 'Líder',
  expert: 'Especialista',
  pioneer: 'Pioneiro',
  caregiver: 'Cuidador',
  visionary: 'Visionário',
  perfectionist: 'Perfeccionista',
  problem_solver: 'Solucionador',
  connector: 'Conector',
  mentor: 'Mentor',
  trailblazer: 'Desbravador'
};

export function IdentityLabelingPanel({ contact = null, className }: IdentityLabelingPanelProps) {
  const { identityLabels, discProfile, vakProfile } = useCarnegieAnalysis(contact);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copiado!`))
      .catch(() => toast.error('Não foi possível copiar'));
  };

  const getAlignmentColor = (value: number) => {
    if (value >= 80) return 'text-success';
    if (value >= 60) return 'text-primary';
    if (value >= 40) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <Card variant="elevated" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-warning" />
            Rótulos de Identidade
          </CardTitle>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs">
              DISC: {discProfile}
            </Badge>
            <Badge variant="outline" className="text-xs">
              VAK: {vakProfile}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          "Dê à pessoa uma reputação a zelar" - Dale Carnegie
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {identityLabels.map((labelData) => {
          const Icon = CATEGORY_ICONS[labelData.category];
          const categoryLabel = CATEGORY_LABELS[labelData.category];

          return (
            <div 
              key={labelData.id}
              className="border rounded-lg p-4 space-y-3 hover:border-primary/30 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-warning/10">
                  <Icon className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-base">{labelData.label}</h4>
                    <Badge variant="outline" className="text-xs">
                      {categoryLabel}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {labelData.description}
                  </p>
                </div>
              </div>

              {/* Alignment Scores */}
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">DISC {discProfile}:</span>
                  <span className={cn("font-medium", getAlignmentColor(labelData.discAlignment[discProfile]))}>
                    {labelData.discAlignment[discProfile]}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">VAK {vakProfile}:</span>
                  <span className={cn("font-medium", getAlignmentColor(labelData.vakAlignment[vakProfile]))}>
                    {labelData.vakAlignment[vakProfile]}%
                  </span>
                </div>
              </div>

              {/* Reinforcement Phrases */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 text-xs font-medium">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Frases de Reforço
                </div>
                <div className="grid gap-1">
                  {labelData.reinforcementPhrases.slice(0, 3).map((phrase, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-muted/50 group hover:bg-muted"
                    >
                      <span className="text-xs italic">"{phrase}"</span>
                      <Button
                        size="icon" aria-label="Copiar"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(phrase, 'Frase')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Future Projection & Past Validation */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-success/5 border border-success/20">
                  <div className="text-xs font-medium text-success mb-1 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Projeção Futura
                  </div>
                  <p className="text-xs text-muted-foreground">
                    "{labelData.futureProjection}"
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full mt-1 h-6 text-xs"
                    onClick={() => copyToClipboard(labelData.futureProjection, 'Projeção')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </div>
                <div className="p-2 rounded bg-primary/5 border border-primary/20">
                  <div className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Validação do Passado
                  </div>
                  <p className="text-xs text-muted-foreground">
                    "{labelData.pastValidation}"
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full mt-1 h-6 text-xs"
                    onClick={() => copyToClipboard(labelData.pastValidation, 'Validação')}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {identityLabels.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum rótulo de identidade disponível</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
