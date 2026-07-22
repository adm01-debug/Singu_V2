import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Brain, Copy, Check, Search, Lightbulb, AlertTriangle, MessageSquare, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { BrainSystem, Neurochemical } from '@/types/neuromarketing';
import { BRAIN_SYSTEM_INFO, NEUROCHEMICAL_INFO } from '@/data/neuromarketingData';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { OBJECTION_TEMPLATES, ObjectionTemplate } from '@/data/neuroObjectionData';

interface NeuroObjectionHandlerProps {
  contactId: string;
  contactName: string;
  dominantBrain?: BrainSystem;
  dominantChemical?: Neurochemical;
  className?: string;
}

const NeuroObjectionHandler = ({ contactId, contactName, dominantBrain = 'limbic', dominantChemical = 'oxytocin', className }: NeuroObjectionHandlerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedObjection, setExpandedObjection] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const brainInfo = BRAIN_SYSTEM_INFO[dominantBrain];

  const filteredObjections = useMemo(() => {
    if (!searchQuery.trim()) return OBJECTION_TEMPLATES;
    const query = searchQuery.toLowerCase();
    return OBJECTION_TEMPLATES.filter(t => t.objection.toLowerCase().includes(query) || t.category.toLowerCase().includes(query) || t.commonVariations.some(v => v.toLowerCase().includes(query)));
  }, [searchQuery]);

  const getRecommendedResponse = (template: ObjectionTemplate) => template.responses.find(r => r.brain === dominantBrain) || template.responses[0];

  const handleCopy = async (text: string, id: string) => { try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch { /* clipboard unavailable */ } };

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
            <div><CardTitle className="text-lg">Neuro Objection Handler</CardTitle><p className="text-xs text-muted-foreground">Respostas otimizadas para o cérebro de {contactName}</p></div>
          </div>
          <Badge style={{ backgroundColor: `${brainInfo.color}20`, color: brainInfo.color, borderColor: brainInfo.color }} variant="outline" className="gap-1"><Brain className="h-3 w-3" />{brainInfo.namePt}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar objeção..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div>

        <div className="space-y-2">
          {filteredObjections.map((template) => {
            const recommended = getRecommendedResponse(template);
            const isExpanded = expandedObjection === template.id;
            return (
              <Collapsible key={template.id} open={isExpanded} onOpenChange={() => setExpandedObjection(isExpanded ? null : template.id)}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
                        <div>
                          <div className="flex items-center gap-2"><p className="font-medium text-sm">"{template.objection}"</p><Badge variant="secondary" className="text-xs">{template.category}</Badge></div>
                          <p className="text-xs text-muted-foreground">{template.commonVariations.slice(0, 2).join(' • ')}</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 pt-0 space-y-3">
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /><span className="text-xs font-medium text-primary">Resposta Recomendada (Cérebro {brainInfo.namePt})</span></div>
                          <Button variant="ghost" size="sm" onClick={() => handleCopy(recommended.response, `${template.id}-rec`)} className="h-7 gap-1">
                            {copiedId === `${template.id}-rec` ? <><Check className="h-3 w-3" />Copiado</> : <><Copy className="h-3 w-3" />Copiar</>}
                          </Button>
                        </div>
                        <p className="text-sm">{recommended.response}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs"><Lightbulb className="h-3 w-3 mr-1" />Frase-chave: "{recommended.keyPhrase}"</Badge>
                          <Badge variant="outline" className="text-xs" style={{ borderColor: NEUROCHEMICAL_INFO[recommended.neurochemicalTarget].color, color: NEUROCHEMICAL_INFO[recommended.neurochemicalTarget].color }}>Ativa {NEUROCHEMICAL_INFO[recommended.neurochemicalTarget].namePt}</Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Respostas Alternativas</p>
                        {template.responses.filter(r => r.brain !== dominantBrain).map(response => {
                          const respBrainInfo = BRAIN_SYSTEM_INFO[response.brain];
                          return (
                            <div key={response.brain} className="p-2 rounded-lg border bg-card">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="text-xs" style={{ borderColor: respBrainInfo.color, color: respBrainInfo.color }}><Brain className="h-3 w-3 mr-1" />{respBrainInfo.namePt}</Badge>
                                <Button variant="ghost" size="sm" onClick={() => handleCopy(response.response, `${template.id}-${response.brain}`)} className="h-6 px-2">
                                  {copiedId === `${template.id}-${response.brain}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">{response.response}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CollapsibleContent>
                </motion.div>
              </Collapsible>
            );
          })}
        </div>

        {filteredObjections.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhuma objeção encontrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NeuroObjectionHandler;
