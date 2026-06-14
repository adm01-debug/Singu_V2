// ==============================================
// FACE-SAVING TECHNIQUES PANEL
// Let the other person save face
// ==============================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield,
  Copy,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Sparkles
} from 'lucide-react';
import { FaceSavingTechnique } from '@/types/carnegie';
import { FACE_SAVING_TECHNIQUES } from '@/data/carnegieFaceSaving';
import { useCarnegieAnalysis } from '@/hooks/useCarnegieAnalysis';
import { cn } from '@/lib/utils';
import { Contact } from '@/types';
import { toast } from 'sonner';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface FaceSavingPanelProps {
  contact?: Contact | null;
  className?: string;
}

const SCENARIO_LABELS = {
  price_objection: 'Objeção de Preço',
  product_limitation: 'Limitação do Produto',
  missed_deadline: 'Prazo Perdido',
  service_failure: 'Falha de Serviço',
  misunderstanding: 'Mal-entendido',
  competitor_comparison: 'Comparação com Concorrente',
  budget_constraint: 'Restrição Orçamentária',
  internal_resistance: 'Resistência Interna',
  changed_requirements: 'Requisitos Alterados',
  delayed_decision: 'Decisão Adiada'
};

export function FaceSavingPanel({ contact = null, className }: FaceSavingPanelProps) {
  const { discProfile } = useCarnegieAnalysis(contact);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null);

  const filteredTechniques = selectedScenario
    ? FACE_SAVING_TECHNIQUES.filter(t => t.scenario === selectedScenario)
    : FACE_SAVING_TECHNIQUES;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const copyFullScript = (technique: FaceSavingTechnique) => {
    const discScript = technique.discVariations[discProfile];
    copyToClipboard(discScript || technique.fullScript, 'Script completo');
  };

  return (
    <Card variant="elevated" className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-info" />
            Técnicas de Salvar a Face
          </CardTitle>
          <Badge variant="outline">Perfil {discProfile}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          "Deixe a outra pessoa salvar a própria face" - Dale Carnegie
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Scenario Filter */}
        <Select value={selectedScenario || ''} onValueChange={(v) => setSelectedScenario(v || null)}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por cenário..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os cenários</SelectItem>
            {Object.entries(SCENARIO_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Techniques List */}
        <div className="space-y-3">
          {filteredTechniques.map((technique) => {
            const isExpanded = expandedTechnique === technique.id;

            return (
              <Collapsible 
                key={technique.id}
                open={isExpanded}
                onOpenChange={() => setExpandedTechnique(isExpanded ? null : technique.id)}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left">
                      <div className="p-2 rounded-full bg-info/10 shrink-0">
                        <Shield className="h-4 w-4 text-info" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-sm">{technique.name}</h4>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {technique.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {SCENARIO_LABELS[technique.scenario]}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-primary">
                            {technique.principle}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-4 border-t bg-muted/30">
                      {/* Script Phases */}
                      <div className="pt-3 space-y-2">
                        <h5 className="text-xs font-medium flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-primary" />
                          Estrutura do Script
                        </h5>
                        <div className="space-y-2">
                          <div className="p-2 rounded bg-background border">
                            <span className="text-xs font-medium text-primary">1. Reconhecimento:</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              "{technique.acknowledgmentPhrase}"
                            </p>
                          </div>
                          <div className="p-2 rounded bg-background border">
                            <span className="text-xs font-medium text-primary">2. Ponte:</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              "{technique.bridgePhrase}"
                            </p>
                          </div>
                          <div className="p-2 rounded bg-background border">
                            <span className="text-xs font-medium text-primary">3. Solução:</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              "{technique.solutionPhrase}"
                            </p>
                          </div>
                          <div className="p-2 rounded bg-background border">
                            <span className="text-xs font-medium text-primary">4. Fechamento:</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              "{technique.closingPhrase}"
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* DISC Variation */}
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">Script para Perfil {discProfile}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs"
                            onClick={() => copyFullScript(technique)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                        </div>
                        <p className="text-xs italic text-muted-foreground">
                          "{technique.discVariations[discProfile]}"
                        </p>
                      </div>

                      {/* Do's and Don'ts */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded bg-success/5 border border-success/20">
                          <div className="flex items-center gap-1 text-xs font-medium text-success mb-2">
                            <Check className="h-3 w-3" />
                            Faça Isso
                          </div>
                          <ul className="space-y-1">
                            {technique.doThis.slice(0, 3).map((item, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                                <span className="text-success mt-0.5">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-2 rounded bg-destructive/5 border border-destructive/20">
                          <div className="flex items-center gap-1 text-xs font-medium text-destructive mb-2">
                            <X className="h-3 w-3" />
                            Evite Isso
                          </div>
                          <ul className="space-y-1">
                            {technique.avoidThis.slice(0, 3).map((item, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                                <span className="text-destructive mt-0.5">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>

        {filteredTechniques.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma técnica encontrada para este cenário</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
