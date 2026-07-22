// ==============================================
// NOBLE CAUSE PANEL
// Display and suggest noble causes for contacts
// ==============================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Heart, 
  Users, 
  Home, 
  Compass, 
  TrendingUp,
  Scale,
  Lightbulb,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { useCarnegieAnalysis } from '@/hooks/useCarnegieAnalysis';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';

interface NobleCausePanelProps {
  contact?: Contact | null;
  className?: string;
}

const CATEGORY_ICONS = {
  altruism: Heart,
  legacy: Users,
  community: Users,
  family: Home,
  purpose: Compass,
  growth: TrendingUp,
  justice: Scale,
  innovation: Lightbulb
};

const CATEGORY_COLORS = {
  altruism: 'text-primary bg-primary/10',
  legacy: 'text-secondary bg-secondary/10',
  community: 'text-info bg-info/10',
  family: 'text-accent bg-accent/10',
  purpose: 'text-primary bg-primary/10',
  growth: 'text-success bg-success/10',
  justice: 'text-warning bg-warning/10',
  innovation: 'text-accent bg-accent/10'
};

const CATEGORY_LABELS = {
  altruism: 'Altruísmo',
  legacy: 'Legado',
  community: 'Comunidade',
  family: 'Família',
  purpose: 'Propósito',
  growth: 'Crescimento',
  justice: 'Justiça',
  innovation: 'Inovação'
};

export function NobleCausePanel({ contact = null, className }: NobleCausePanelProps) {
  const { nobleCauses, discProfile } = useCarnegieAnalysis(contact);
  const [expandedCause, setExpandedCause] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(`${label} copiado!`))
      .catch(() => toast.error('Não foi possível copiar'));
  };

  const getIntensityStars = (intensity: number) => {
    return Array(5).fill(0).map((_, i) => (
      <span 
        key={i} 
        className={cn(
          "text-xs",
          i < intensity ? "text-warning" : "text-muted"
        )}
      >
        ★
      </span>
    ));
  };

  return (
    <Card variant="elevated" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Causas Nobres
          </CardTitle>
          <Badge variant="outline">
            Perfil {discProfile}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          "Apele para motivos mais nobres" - Dale Carnegie
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {nobleCauses.map((cause) => {
          const Icon = CATEGORY_ICONS[cause.category];
          const colorClass = CATEGORY_COLORS[cause.category];
          const isExpanded = expandedCause === cause.id;

          return (
            <Collapsible 
              key={cause.id}
              open={isExpanded}
              onOpenChange={() => setExpandedCause(isExpanded ? null : cause.id)}
            >
              <div className="border rounded-lg overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left">
                    <div className={cn("p-2 rounded-full shrink-0", colorClass.split(' ')[1])}>
                      <Icon className={cn("h-4 w-4", colorClass.split(' ')[0])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm">{cause.name}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex">{getIntensityStars(cause.intensity)}</div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {cause.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={cn("text-xs", colorClass)}>
                          {CATEGORY_LABELS[cause.category]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          DISC {discProfile}: {cause.discCompatibility[discProfile]}%
                        </Badge>
                      </div>
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-3 pb-3 space-y-3 border-t bg-muted/30">
                    {/* Emotional Appeal */}
                    <div className="pt-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-3 w-3 text-warning" />
                        <span className="text-xs font-medium">Apelo Emocional</span>
                      </div>
                      <p className="text-sm italic text-muted-foreground">
                        "{cause.emotionalAppeal}"
                      </p>
                    </div>

                    {/* Templates */}
                    {cause.templates.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium">Scripts Prontos</span>
                        {cause.templates.slice(0, 2).map((template) => (
                          <div 
                            key={template.id}
                            className="p-2 rounded bg-background border space-y-2"
                          >
                            <div className="space-y-1">
                              <p className="text-xs">
                                <span className="font-medium text-primary">Abertura:</span>{' '}
                                <span className="text-muted-foreground">{template.opening}</span>
                              </p>
                              <p className="text-xs">
                                <span className="font-medium text-primary">Ponte:</span>{' '}
                                <span className="text-muted-foreground">{template.bridge}</span>
                              </p>
                              <p className="text-xs">
                                <span className="font-medium text-primary">CTA:</span>{' '}
                                <span className="text-muted-foreground">{template.callToAction}</span>
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs h-7"
                              onClick={() => copyToClipboard(
                                `${template.opening} ${template.bridge} ${template.callToAction}`,
                                'Script'
                              )}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar Script Completo
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Keywords */}
                    <div>
                      <span className="text-xs font-medium">Palavras-Chave</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cause.keywords.slice(0, 6).map((keyword, idx) => (
                          <Badge 
                            key={idx} 
                            variant="secondary" 
                            className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => copyToClipboard(keyword, 'Palavra-chave')}
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}

        {nobleCauses.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma causa nobre sugerida</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
