import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Target, Brain, TrendingUp, Search, AlertTriangle, Heart, Lightbulb, Zap, CheckCircle2, User, ArrowRight, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Contact = Tables<'contacts'>;

interface AIInsight {
  category: string; title: string; description: string; action_suggestion: string;
  confidence: number; actionable: boolean; contact_id?: string; priority: string;
}

const categoryIcons: Record<string, React.ElementType> = { personality: Brain, preference: Target, behavior: TrendingUp, opportunity: Sparkles, risk: AlertTriangle, relationship: Heart, sentiment: Lightbulb, action: Zap };
const categoryColors: Record<string, string> = { personality: 'bg-secondary/10 text-secondary border-secondary/20', preference: 'bg-info/10 text-info border-info/20', behavior: 'bg-success/10 text-success border-success/20', opportunity: 'bg-warning/10 text-warning border-amber-500/20', risk: 'bg-destructive/10 text-destructive border-destructive/20', relationship: 'bg-accent/10 text-accent border-accent/20', sentiment: 'bg-info/10 text-info border-info/20', action: 'bg-primary/10 text-primary border-primary/20' };
const categoryLabels: Record<string, string> = { personality: 'Personalidade', preference: 'Preferência', behavior: 'Comportamento', opportunity: 'Oportunidade', risk: 'Risco', relationship: 'Relacionamento', sentiment: 'Sentimento', action: 'Ação' };
const priorityColors: Record<string, string> = { high: 'bg-destructive/10 text-destructive border-destructive/30', medium: 'bg-warning/10 text-warning border-warning/30', low: 'bg-success/10 text-success border-success/30' };

interface Props {
  insights: AIInsight[];
  contacts: Contact[];
  loading: boolean;
  generating: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  isSearching: boolean;
  clearSearch: () => void;
  fuzzyResults: AIInsight[];
}

export function InsightsContent({ insights, contacts, loading, generating, searchTerm, setSearchTerm, isSearching, clearSearch, fuzzyResults }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = Object.keys(categoryLabels);

  const filteredInsights = useMemo(() => fuzzyResults.filter(i => !selectedCategory || i.category === selectedCategory), [fuzzyResults, selectedCategory]);
  const getContactName = (contactId?: string) => { if (!contactId) return null; const c = contacts.find(ct => ct.id === contactId); return c ? `${c.first_name} ${c.last_name}` : null; };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Brain, value: insights.length, label: 'Total', cls: 'bg-primary/10 text-primary' },
          { icon: Sparkles, value: insights.filter(i => i.category === 'opportunity').length, label: 'Oportunidades', cls: 'bg-warning/10 text-warning' },
          { icon: AlertTriangle, value: insights.filter(i => i.category === 'risk').length, label: 'Riscos', cls: 'bg-destructive/10 text-destructive' },
          { icon: CheckCircle2, value: insights.filter(i => i.actionable).length, label: 'Acionáveis', cls: 'bg-success/10 text-success' },
        ].map(s => (
          <Card key={s.label} className="border-border/50"><CardContent className="p-4 flex items-center gap-4"><div className={`p-3 rounded-xl ${s.cls}`}><s.icon className="w-5 h-5" /></div><div><p className="text-2xl font-bold">{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></div></CardContent></Card>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar insights..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-10 ${isSearching ? 'pr-10' : ''}`} />
          {isSearching && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={clearSearch}><X className="h-4 w-4" /></Button>}
        </div>
        <ScrollArea className="w-full sm:w-auto"><div className="flex items-center gap-2 pb-2">
          <Button variant={selectedCategory === null ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(null)}>Todos</Button>
          {categories.map(cat => { const Icon = categoryIcons[cat] || Lightbulb; return <Button key={cat} variant={selectedCategory === cat ? 'default' : 'outline'} size="sm" onClick={() => setSelectedCategory(cat)} className="gap-1.5 whitespace-nowrap"><Icon className="w-3.5 h-3.5" />{categoryLabels[cat]}</Button>; })}
        </div></ScrollArea>
      </motion.div>

      {(loading || generating) && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <Card key={i} className="border-border/50"><CardContent className="p-5"><div className="flex items-start justify-between mb-4"><Skeleton className="w-12 h-12 rounded-xl" /><Skeleton className="w-24 h-6 rounded-full" /></div><Skeleton className="w-3/4 h-5 mb-2" /><Skeleton className="w-full h-4 mb-1" /><Skeleton className="w-2/3 h-4" /></CardContent></Card>)}</div>}

      {!loading && !generating && (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredInsights.map((insight, index) => {
              const Icon = categoryIcons[insight.category] || Lightbulb;
              const contactName = getContactName(insight.contact_id);
              return (
                <motion.div key={`${insight.title}-${index}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3, delay: index * 0.05 }}>
                  <Card className="h-full border-border/50 hover:border-primary/30 transition-all hover:shadow-sm group"><CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", categoryColors[insight.category]?.split(' ')[0] || 'bg-primary/10')}><Icon className={cn("w-5 h-5", categoryColors[insight.category]?.split(' ')[1] || 'text-primary')} /></div>
                      <div className="flex items-center gap-2">{insight.priority && <Badge variant="outline" className={cn("text-xs", priorityColors[insight.priority])}>{insight.priority === 'high' ? 'Alta' : insight.priority === 'medium' ? 'Média' : 'Baixa'}</Badge>}<Badge variant="outline" className={cn("text-xs", categoryColors[insight.category])}>{categoryLabels[insight.category] || insight.category}</Badge></div>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{insight.description}</p>
                    {insight.action_suggestion && <div className="p-3 rounded-lg bg-muted/50 mb-4"><div className="flex items-start gap-2"><ArrowRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" /><p className="text-sm text-foreground">{insight.action_suggestion}</p></div></div>}
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-4">{contactName && <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><User className="w-3.5 h-3.5" /><span>{contactName}</span></div>}{insight.actionable && <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="w-3 h-3" />Acionável</Badge>}</div>
                      <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Confiança</span><div className="w-16"><Progress value={insight.confidence} className="h-1.5" /></div><span className="text-xs font-medium">{insight.confidence}%</span></div>
                    </div>
                  </CardContent></Card>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {!loading && !generating && filteredInsights.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><Sparkles className="w-8 h-8 text-primary" /></div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{insights.length === 0 ? 'Nenhum insight gerado' : 'Nenhum insight encontrado'}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">{insights.length === 0 ? 'Adicione contatos e registre interações para gerar insights.' : 'Tente ajustar os filtros de busca.'}</p>
        </motion.div>
      )}
    </div>
  );
}
