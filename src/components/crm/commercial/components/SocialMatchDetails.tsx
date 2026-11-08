import { 
  Info, 
  Globe, 
  Hash, 
  ExternalLink, 
  ListFilter, 
  Search,
  ThumbsUp,
  MessageSquare,
  Calendar,
   ArrowUpRight,
   Heart,
   FileText,
   Briefcase,
   HelpCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSocialInsights } from '@/hooks/useSocialInsights';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { SocialInsightsError } from '@/components/contact-detail/SocialInsightsError';

interface Props {
  contactId: string;
  metadata: {
    sources?: string[];
    keywords?: string[];
    social_insight_ids?: string[];
  };
  offerName: string;
}

export function SocialMatchDetails({ contactId, metadata, offerName }: Props) {
  const { data: allInsights, isLoading, isError, refetch, isFetching } = useSocialInsights(contactId);

  // Filter insights that match the IDs in metadata, or fallback to fuzzy matching by keywords if IDs aren't present
  const matchedInsights = allInsights?.filter(insight => {
    if (metadata.social_insight_ids?.includes(insight.id)) return true;
    if (metadata.keywords?.some(kw => insight.content.toLowerCase().includes(kw.toLowerCase()))) return true;
    return false;
  }) || [];

  if (!metadata || (!metadata.sources && !metadata.keywords)) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-2 w-full h-8 flex items-center justify-center gap-2 text-[10px] font-bold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/50 border border-indigo-100/30 rounded-lg group"
        >
          <ListFilter className="h-3 w-3 group-hover:scale-110 transition-transform" />
          VER DETALHES DO MATCH
          <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-indigo-200">
        <div className="bg-indigo-600 p-6 text-primary-foreground">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                <Globe className="h-5 w-5 text-primary-foreground" />
              </div>
              <DialogTitle className="text-xl font-bold text-primary-foreground">Explicação do Social Match</DialogTitle>
            </div>
            <DialogDescription className="text-indigo-100 text-sm">
              Rastreabilidade de fontes e comportamentos sociais que validaram a oferta: <span className="font-bold text-primary-foreground">{offerName}</span>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-hidden bg-slate-50">
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Evidências de Comportamento ({matchedInsights.length})
                </h4>
                
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {isError && <SocialInsightsError onRetry={() => { void refetch(); }} isRetrying={isFetching} />}
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2].map(i => (
                          <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-xl" />
                        ))}
                      </div>
                    ) : matchedInsights.length > 0 ? (
                      matchedInsights.map((insight) => (
                        <div key={insight.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3 hover:border-indigo-300 transition-colors">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <Badge variant="outline" className={cn(
                                 "text-[10px] uppercase font-bold gap-1",
                                 insight.platform === 'linkedin' ? "border-blue-200 text-blue-700 bg-blue-50" :
                                 insight.platform === 'instagram' ? "border-pink-200 text-pink-700 bg-pink-50" :
                                 "border-slate-200 text-slate-700 bg-slate-50"
                               )}>
                                 <ExternalLink className="h-2.5 w-2.5" />
                                 {insight.platform}
                               </Badge>
                               <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 border-none gap-1 px-1.5 h-5">
                                 {insight.insight_type === 'like' && <Heart className="h-2.5 w-2.5" />}
                                 {insight.insight_type === 'post' && <FileText className="h-2.5 w-2.5" />}
                                 {insight.insight_type === 'career_move' && <Briefcase className="h-2.5 w-2.5" />}
                                 {insight.insight_type === 'interest' && <ThumbsUp className="h-2.5 w-2.5" />}
                                 {(!insight.insight_type || (insight.insight_type !== 'like' && insight.insight_type !== 'post' && insight.insight_type !== 'career_move' && insight.insight_type !== 'interest')) && <HelpCircle className="h-2.5 w-2.5" />}
                                 {insight.insight_type || 'interação'}
                               </Badge>
                             </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(insight.created_at), "dd MMM yyyy", { locale: ptBR })}
                            </div>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            {insight.content}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500 rounded-full" 
                                style={{ width: `${insight.indicator_score}%` }} 
                              />
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600">{insight.indicator_score}% Match</span>
                          </div>
                        </div>
                      ))
                    ) : !isError && (
                      <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                        <Search className="h-8 w-8 text-slate-300 mb-2" />
                        <p className="text-xs text-slate-500 max-w-[200px]">
                          Nenhuma evidência social encontrada para esta oferta.
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Hash className="h-3 w-3" />
                    Keywords Gatilho
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {metadata.keywords?.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="bg-white text-indigo-700 border-indigo-100 text-[10px] py-0.5">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator className="bg-indigo-200/50" />

                <div>
                  <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Globe className="h-3 w-3" />
                    Fontes de Dados
                  </h4>
                  <div className="space-y-2">
                    {metadata.sources?.map((source, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] text-indigo-600 bg-white/50 p-1.5 rounded-lg border border-indigo-100/50">
                        <span className="capitalize font-medium">{source}</span>
                        <ThumbsUp className="h-3 w-3 opacity-50" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-primary-foreground space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Info className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Neuro-Analytic Insight</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300 italic">
                  "A alta recorrência de termos como {metadata.keywords?.[0] || 'relevantes'} em múltiplas plataformas indica uma janela de oportunidade imediata para {offerName}."
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}