// ==============================================
// COPYWRITING SALES TOOLS - Orchestrator
// Delegates tab content to focused sub-components
// ==============================================

import React, { useState, useMemo, useCallback } from 'react';
import { FABTemplate, CTATemplate, HeadlineFormula, StorytellingTemplate } from '@/types/copywriting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Target, Zap, Sparkles, ArrowRight, Copy, CheckCircle,
   LayoutList, Quote, BarChart3, BookOpen, AlertTriangle, Smile, Eye, PenTool, ShieldAlert
} from 'lucide-react';
import { Contact } from '@/types';
import { useCopywritingTools } from '@/hooks/useCopywritingTools';
import { useCopywritingAdvanced } from '@/hooks/useCopywritingAdvanced';
import { DEMO_CONTACT } from '@/lib/demo-contact';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Sub-components
  import { CopywritingAiGeneratorTab } from './copywriting/CopywritingAiGeneratorTab';
  import { CopywritingObjectionTab } from './copywriting/CopywritingObjectionTab';
 import { CopywritingAnalyzerTab } from './copywriting/CopywritingAnalyzerTab';
import { CopywritingTemplateTab } from './copywriting/CopywritingTemplateTab';
import { CopywritingPreviewTab } from './copywriting/CopywritingPreviewTab';
import { CopywritingEmojiTab } from './copywriting/CopywritingEmojiTab';

interface CopywritingSalesToolsProps {
  contact?: Contact;
}

// Stage configs for reusable template tab
const PAS_STAGES: Record<string, { label: string; colorClass: string }> = {
  problem: { label: '❌ PROBLEMA', colorClass: 'bg-destructive/10 border-destructive' },
  agitate: { label: '🔥 AGITAR', colorClass: 'bg-accent/10 border-accent/30' },
  solution: { label: '✅ SOLUÇÃO', colorClass: 'bg-success/10 border-success' },
};

const FOUR_PS_STAGES: Record<string, { label: string; colorClass: string }> = {
  promise: { label: '🎯 PROMESSA', colorClass: 'bg-secondary/10 border-secondary' },
  picture: { label: '💭 PINTURA', colorClass: 'bg-info/10 border-info' },
  proof: { label: '✅ PROVA', colorClass: 'bg-success/10 border-success/30' },
  push: { label: '👉 EMPURRÃO', colorClass: 'bg-destructive/10 border-destructive' },
};

const AIDA_STAGES: Record<string, { label: string; colorClass: string }> = {
  attention: { label: 'ATTENTION', colorClass: 'bg-destructive/10 border-destructive' },
  interest: { label: 'INTEREST', colorClass: 'bg-warning/10 border-warning/30' },
  desire: { label: 'DESIRE', colorClass: 'bg-info/10 border-info' },
  action: { label: 'ACTION', colorClass: 'bg-success/10 border-success' },
};

export default function CopywritingSalesTools({ contact }: CopywritingSalesToolsProps) {
  const safeContact = contact || DEMO_CONTACT as unknown as Contact;
   const [activeTab, setActiveTab] = useState('ai-generator');
  const [analyzeText, setAnalyzeText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const {
    fabTemplates, aidaTemplates, ctaTemplates, getRecommendedCTAs,
    headlineFormulas, discProfile, vakType
  } = useCopywritingTools(safeContact);

  const {
    analyzeCopy, pasTemplates, fourPsTemplates, storytellingTemplates,
    emojiContexts, getEmojiSuggestions, generateChannelPreviews
  } = useCopywritingAdvanced(safeContact);

  const recommendedCTAs = useMemo(() => getRecommendedCTAs(3), [getRecommendedCTAs]);

  const analysisResult = useMemo(() => {
    if (analyzeText.length < 20) return null;
    return analyzeCopy(analyzeText);
  }, [analyzeText, analyzeCopy]);

  const emojiSuggestions = useMemo(() => {
    if (analyzeText.length < 10) return [];
    return getEmojiSuggestions(analyzeText, 'whatsapp');
  }, [analyzeText, getEmojiSuggestions]);

  const channelPreviews = useMemo(() => {
    if (analyzeText.length < 10) return [];
    return generateChannelPreviews(analyzeText);
  }, [analyzeText, generateChannelPreviews]);

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PenTool className="h-5 w-5 text-primary" />
          Copywriting Sales Tools
          <Badge variant="secondary" className="ml-2">{discProfile} | {vakType}</Badge>
          <Badge className="bg-primary/20 text-primary">Enterprise</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 lg:grid-cols-12 gap-1 mb-4 h-auto flex-wrap">
              <TabsTrigger value="objection" className="text-xs px-2 py-1.5 bg-destructive/5 text-destructive hover:bg-destructive/10"><ShieldAlert className="h-3 w-3 mr-1" />Objeções</TabsTrigger>
             <TabsTrigger value="ai-generator" className="text-xs px-2 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"><Sparkles className="h-3 w-3 mr-1" />Gerador IA</TabsTrigger>
             <TabsTrigger value="analyzer" className="text-xs px-2 py-1.5"><BarChart3 className="h-3 w-3 mr-1" />Analisador</TabsTrigger>
            <TabsTrigger value="pas" className="text-xs px-2 py-1.5"><AlertTriangle className="h-3 w-3 mr-1" />PAS</TabsTrigger>
            <TabsTrigger value="4ps" className="text-xs px-2 py-1.5"><Target className="h-3 w-3 mr-1" />4Ps</TabsTrigger>
            <TabsTrigger value="story" className="text-xs px-2 py-1.5"><BookOpen className="h-3 w-3 mr-1" />Story</TabsTrigger>
            <TabsTrigger value="preview" className="text-xs px-2 py-1.5"><Eye className="h-3 w-3 mr-1" />Preview</TabsTrigger>
            <TabsTrigger value="fab" className="text-xs px-2 py-1.5"><LayoutList className="h-3 w-3 mr-1" />FAB</TabsTrigger>
            <TabsTrigger value="aida" className="text-xs px-2 py-1.5"><ArrowRight className="h-3 w-3 mr-1" />AIDA</TabsTrigger>
            <TabsTrigger value="cta" className="text-xs px-2 py-1.5"><Zap className="h-3 w-3 mr-1" />CTAs</TabsTrigger>
            <TabsTrigger value="emoji" className="text-xs px-2 py-1.5"><Smile className="h-3 w-3 mr-1" />Emoji</TabsTrigger>
            <TabsTrigger value="headlines" className="text-xs px-2 py-1.5"><Quote className="h-3 w-3 mr-1" />Headlines</TabsTrigger>
          </TabsList>

           <TabsContent value="ai-generator" className="space-y-4">
             <CopywritingAiGeneratorTab contact={safeContact} />
           </TabsContent>
 
           <TabsContent value="analyzer" className="space-y-4">
            <CopywritingAnalyzerTab
              analyzeText={analyzeText}
              onTextChange={setAnalyzeText}
              analysisResult={analysisResult}
            />
          </TabsContent>

          <TabsContent value="pas" className="space-y-4">
            <CopywritingTemplateTab
              icon={<AlertTriangle className="h-4 w-4 text-primary" />}
              title="PAS (Problem → Agitate → Solution)"
              description="Identifique o problema, agite a dor, apresente a solução"
              templates={pasTemplates}
              stageConfig={PAS_STAGES}
              copiedId={copiedId}
              onCopy={copyToClipboard}
              showConversion
            />
          </TabsContent>

          <TabsContent value="4ps" className="space-y-4">
            <CopywritingTemplateTab
              icon={<Target className="h-4 w-4 text-primary" />}
              title="4Ps (Promise → Picture → Proof → Push)"
              description="Promessa forte, visualização do futuro, prova social, empurrão final"
              templates={fourPsTemplates}
              stageConfig={FOUR_PS_STAGES}
              copiedId={copiedId}
              onCopy={copyToClipboard}
            />
          </TabsContent>

          <TabsContent value="story" className="space-y-4">
            <StorySectionTab
              templates={storytellingTemplates}
              copiedId={copiedId}
              onCopy={copyToClipboard}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <CopywritingPreviewTab
              analyzeText={analyzeText}
              onTextChange={setAnalyzeText}
              channelPreviews={channelPreviews}
            />
          </TabsContent>

          <TabsContent value="fab" className="space-y-4">
            <FabSectionTab templates={fabTemplates} />
          </TabsContent>

          <TabsContent value="aida" className="space-y-4">
            <CopywritingTemplateTab
              icon={<Sparkles className="h-4 w-4 text-primary" />}
              title="Estrutura AIDA"
              description="Attention → Interest → Desire → Action"
              templates={aidaTemplates}
              stageConfig={AIDA_STAGES}
              copiedId={copiedId}
              onCopy={copyToClipboard}
            />
          </TabsContent>

          <TabsContent value="cta" className="space-y-4">
            <CtaSectionTab
              discProfile={discProfile}
              recommendedCTAs={recommendedCTAs}
              copiedId={copiedId}
              onCopy={copyToClipboard}
            />
          </TabsContent>

          <TabsContent value="emoji" className="space-y-4">
            <CopywritingEmojiTab
              discProfile={discProfile}
              emojiContexts={emojiContexts}
              emojiSuggestions={emojiSuggestions}
              analyzeText={analyzeText}
              onCopy={copyToClipboard}
            />
          </TabsContent>

          <TabsContent value="headlines" className="space-y-4">
            <HeadlinesSectionTab
              headlineFormulas={headlineFormulas}
              copiedId={copiedId}
              onCopy={copyToClipboard}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// ---- Inline lightweight sections (kept here to avoid over-fragmentation) ----

function StorySectionTab({ templates, copiedId, onCopy }: { templates: StorytellingTemplate[]; copiedId: string | null; onCopy: (t: string, id: string) => void }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <h4 className="font-medium mb-2 flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-primary" />
        Estruturas de Storytelling
      </h4>
      <ScrollArea className="h-[400px]">
        {templates.map((template) => (
          <div key={template.id} className="bg-background rounded-lg p-4 mb-3 border">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium">{template.name}</h5>
              <Badge className="bg-primary/20 text-primary">{template.arc.replace('_', ' ')}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
            <div className="space-y-2 mb-3">
              {template.elements.map((element, idx: number) => (
                <div
                  key={element.id}
                  className={cn(
                    "rounded p-2 flex items-start gap-2",
                    template.emotionalPeaks.includes(element.name) ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'
                  )}
                >
                  <span className="text-xs font-mono bg-background px-1.5 py-0.5 rounded">{idx + 1}</span>
                  <div>
                    <span className="text-sm font-medium">{element.name}</span>
                    {template.emotionalPeaks.includes(element.name) && (
                      <Badge className="ml-2 text-xs bg-primary">Pico Emocional</Badge>
                    )}
                    <p className="text-xs text-muted-foreground">{element.description}</p>
                    <p className="text-xs italic text-primary mt-1">"{element.example}"</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-muted rounded p-3">
              <span className="text-xs font-medium">Exemplo Completo:</span>
              <p className="text-sm mt-1">{template.example}</p>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {template.bestFor.map((use: string) => (
                  <Badge key={use} variant="outline" className="text-xs">{use}</Badge>
                ))}
              </div>
              <Button size="sm" variant="outline" onClick={() => onCopy(template.example, template.id)}>
                {copiedId === template.id ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}

function FabSectionTab({ templates }: { templates: FABTemplate[] }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <h4 className="font-medium mb-2 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        Estrutura FAB (Feature → Advantage → Benefit)
      </h4>
      <ScrollArea className="h-[300px]">
        {templates.map((template) => (
          <div key={template.id} className="bg-background rounded-lg p-4 mb-3 border">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium">{template.name}</h5>
              <Badge variant="outline">{template.category}</Badge>
            </div>
            <div className="space-y-3">
              <div className="bg-info/10 rounded p-3">
                <span className="text-xs font-medium text-info">FEATURE</span>
                <p className="text-sm mt-1">{template.example.feature}</p>
              </div>
              <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
              <div className="bg-warning/10 rounded p-3">
                <span className="text-xs font-medium text-warning">ADVANTAGE</span>
                <p className="text-sm mt-1">{template.example.advantage}</p>
              </div>
              <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-muted-foreground" /></div>
              <div className="bg-success/10 rounded p-3">
                <span className="text-xs font-medium text-success">BENEFIT</span>
                <p className="text-sm mt-1">{template.example.benefit}</p>
                {template.example.emotionalHook && (
                  <Badge className="mt-2 bg-success">{template.example.emotionalHook}</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}

function CtaSectionTab({ discProfile, recommendedCTAs, copiedId, onCopy }: { discProfile: string; recommendedCTAs: CTATemplate[]; copiedId: string | null; onCopy: (t: string, id: string) => void }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <h4 className="font-medium mb-2 flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        CTAs Recomendados para {discProfile}
      </h4>
      <ScrollArea className="h-[300px]">
        <div className="grid gap-3">
          {recommendedCTAs.map((cta) => (
            <div key={cta.id} className="bg-background rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <Badge className={cn(
                  cta.type === 'primary' && 'bg-primary',
                  cta.type === 'urgent' && 'bg-destructive',
                  cta.type === 'soft' && 'bg-info',
                  cta.type === 'exclusive' && 'bg-secondary',
                  cta.type === 'social' && 'bg-primary',
                  cta.type === 'guarantee' && 'bg-success'
                )}>
                  {cta.type.toUpperCase()}
                </Badge>
                <div className="flex gap-1">
                  {Array.from({ length: cta.urgencyLevel }).map((_, i) => (
                    <Zap key={i} className="h-3 w-3 text-warning fill-warning" />
                  ))}
                </div>
              </div>
              <p className="font-medium text-sm mb-1">{cta.template}</p>
              <p className="text-sm text-muted-foreground italic">"{cta.example}"</p>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => onCopy(cta.example, cta.id)}>
                {copiedId === cta.id ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function HeadlinesSectionTab({ headlineFormulas, copiedId, onCopy }: { headlineFormulas: HeadlineFormula[]; copiedId: string | null; onCopy: (t: string, id: string) => void }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <h4 className="font-medium mb-2 flex items-center gap-2">
        <Quote className="h-4 w-4 text-primary" />
        Fórmulas de Headlines
      </h4>
      <ScrollArea className="h-[300px]">
        {headlineFormulas.map((formula) => (
          <div key={formula.id} className="bg-background rounded-lg p-4 mb-3 border">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline">{formula.type.replace('_', ' ').toUpperCase()}</Badge>
              <div className="flex items-center gap-1">
                {Array.from({ length: formula.effectiveness }).map((_, i) => (
                  <span key={i} className="text-warning text-xs">★</span>
                ))}
              </div>
            </div>
            <p className="font-mono text-sm bg-muted p-2 rounded mb-2">{formula.formula}</p>
            <p className="text-sm text-primary italic">"{formula.example}"</p>
            <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => onCopy(formula.example, formula.id)}>
              {copiedId === formula.id ? <CheckCircle className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
              Copiar
            </Button>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
