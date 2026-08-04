import { useState, useCallback, useMemo } from 'react';
import { WhatsAppDashboard } from '@/components/whatsapp/WhatsAppDashboard';
import { ExternalInteractionsTimeline } from './interactions-tab/ExternalInteractionsTimeline';
import { UnifiedTimeline } from './UnifiedTimeline';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Mail, MessageSquare, Users, Video, FileText,
  Clock, AlertCircle, ArrowUpRight, ArrowDownLeft,
   ChevronDown, ChevronUp, Plus, Search, Play, File
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { InteractionForm } from '@/components/forms/InteractionForm';
import { cn, safehref } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Interaction, Contact as ContactType } from '@/hooks/useContactDetail';
import { logger } from "@/lib/logger";
import { MeetingSummaryCard } from '@/components/meeting-summary/MeetingSummaryCard';
 import { ConversationAnalysisCard } from '@/components/conversation-intel/ConversationAnalysisCard';
 import { SleightOfMouthPanel } from '@/components/nlp/SleightOfMouthPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TYPE_CONFIG: Record<string, { icon: typeof Phone; label: string; color: string }> = {
  call: { icon: Phone, label: 'Ligação', color: 'text-info bg-info/10' },
  email: { icon: Mail, label: 'Email', color: 'text-warning bg-warning/10' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'text-success bg-success/10' },
  meeting: { icon: Users, label: 'Reunião', color: 'text-primary bg-primary/10' },
  note: { icon: FileText, label: 'Nota', color: 'text-muted-foreground bg-muted' },
  social: { icon: Video, label: 'Social', color: 'text-accent-foreground bg-accent' },
};

interface Props {
  interactions: Interaction[];
  contact: ContactType;
  companyId: string | null;
  onInteractionAdded?: () => void;
}

export function ContactInteractionsTab({ interactions, contact, companyId, onInteractionAdded }: Props) {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [activeTab, setActiveTab] = useState('unified');

  const filteredInteractions = useMemo(() => {
    let result = interactions;
    
    // Filter by Tab
    if (activeTab === 'whatsapp') {
      result = result.filter(i => i.type === 'whatsapp');
    } else if (activeTab === 'calls') {
      result = result.filter(i => i.type === 'call');
    }
    
    // Filter by Search Term
    if (!searchTerm.trim()) return result;
    const lower = searchTerm.toLowerCase();
    return result.filter(i => 
      (i.title?.toLowerCase().includes(lower)) || 
      (i.content?.toLowerCase().includes(lower)) ||
      (i.transcription?.toLowerCase().includes(lower)) ||
      (i.type?.toLowerCase().includes(lower))
    );
  }, [interactions, searchTerm, activeTab]);

  const contactForForm = {
    id: contact.id,
    first_name: contact.first_name,
    last_name: contact.last_name,
    company_id: contact.company_id,
  } as unknown as import('@/hooks/useContacts').Contact;

  const handleSubmit = useCallback(async (data: Record<string, unknown>) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const insertData = {
        title: String(data.title ?? ''),
        type: String(data.type ?? 'note'),
        contact_id: contact.id,
        company_id: companyId ?? null,
        user_id: user.id,
        content: data.content != null ? String(data.content) : null,
        sentiment: data.sentiment != null ? String(data.sentiment) : null,
        follow_up_required: data.follow_up_required != null ? Boolean(data.follow_up_required) : null,
        follow_up_date: data.follow_up_date != null ? String(data.follow_up_date) : null,
        duration: data.duration != null ? Number(data.duration) : null,
        initiated_by: data.initiated_by != null ? String(data.initiated_by) : null,
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : null,
        attachments: Array.isArray(data.attachments) ? (data.attachments as string[]) : null,
        response_time: data.response_time != null ? Number(data.response_time) : null,
        key_insights: Array.isArray(data.key_insights) ? (data.key_insights as string[]) : null,
        audio_url: data.audio_url != null ? String(data.audio_url) : null,
        transcription: data.transcription != null ? String(data.transcription) : null,
        neuro_pnl_technique: data.neuro_pnl_technique != null ? String(data.neuro_pnl_technique) : null,
        neuro_pnl_result: data.neuro_pnl_result != null ? String(data.neuro_pnl_result) : null,
      };
       const { data: interaction, error } = await supabase.from('interactions').insert(insertData as never).select().maybeSingle();
       if (error) throw error;
       
       toast.success('Interação registrada');
 
       // Trigger AI Analysis if content is sufficient
       if (interaction && insertData.content && insertData.content.length >= 80) {
         toast.info('IA analisando conversa e comportamento...', { duration: 3000 });

         // Call both analysis functions (fire-and-forget with catch)
         Promise.all([
           supabase.functions.invoke('conversation-analyzer', {
             body: { interaction_id: interaction.id }
           }),
           supabase.functions.invoke('disc-analyzer', {
             body: {
               texts: [insertData.content],
               contactId: contact.id,
               interactionId: interaction.id
             }
           })
         ]).then(([convRes, discRes]) => {
           if (!convRes.error && !discRes.error) {
             toast.success('Análises de IA e comportamental concluídas');
             onInteractionAdded?.();
           } else if (convRes.error || discRes.error) {
             logger.error('AI Analysis partial failure', { conv: convRes.error, disc: discRes.error });
           }
         }).catch((err: unknown) => {
           logger.error('AI analysis invocation error:', err);
         });
       }
 
      setShowForm(false);
      onInteractionAdded?.();
    } catch (err) {
      logger.error(err);
      toast.error('Erro ao registrar interação');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, contact.id, companyId, onInteractionAdded]);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <TabsList className="grid grid-cols-5 w-full sm:w-auto h-9">
              <TabsTrigger value="unified" className="text-xs">Timeline</TabsTrigger>
              <TabsTrigger value="all" className="text-xs">Histórico Simples</TabsTrigger>
              <TabsTrigger value="whatsapp" className="text-xs">WhatsApp</TabsTrigger>
              <TabsTrigger value="calls" className="text-xs">Ligações</TabsTrigger>
              <TabsTrigger value="external" className="text-xs">Externo</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar nas atividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
              <Button size="sm" className="h-9 px-3" onClick={() => setShowForm(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nova
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="unified" className="space-y-4 mt-0">
          <UnifiedTimeline contactId={contact.id} />
        </TabsContent>

        <TabsContent value="all" className="space-y-4 mt-0">
          {filteredInteractions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/70" />
                <p className="text-sm font-medium text-muted-foreground">Nenhuma interação registrada</p>
                <p className="text-xs text-muted-foreground/70">Registre a primeira interação com este contato</p>
              </CardContent>
            </Card>
          ) : (
            <div className="relative space-y-0">
              <div className="absolute left-5 top-3 bottom-3 w-px bg-border" />

              {filteredInteractions.map((interaction, i) => {
                const config = TYPE_CONFIG[interaction.type] || TYPE_CONFIG.note;
                const Icon = config.icon;
                const isExpanded = expandedId === interaction.id;

                return (
                  <motion.div
                    key={interaction.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="relative pl-12"
                  >
                    <div className={cn(
                      'absolute left-2.5 top-4 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-card',
                      config.color
                    )}>
                      <Icon className="h-3 w-3" />
                    </div>

                    <Card
                      className={cn(
                        'mb-2 cursor-pointer transition-all hover:shadow-sm',
                        isExpanded && 'ring-1 ring-primary/20'
                      )}
                      onClick={() => setExpandedId(isExpanded ? null : interaction.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm text-foreground truncate">
                                {interaction.title}
                              </span>
                              <Badge variant="outline" className="flex-shrink-0 text-xs">
                                {config.label}
                              </Badge>
                              {interaction.initiated_by && (
                                interaction.initiated_by === 'us' ? (
                                  <ArrowUpRight className="h-3 w-3 text-info flex-shrink-0" />
                                ) : (
                                  <ArrowDownLeft className="h-3 w-3 text-success flex-shrink-0" />
                                )
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{format(new Date(interaction.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}</span>
                              <span>·</span>
                              <span>{formatDistanceToNow(new Date(interaction.created_at), { addSuffix: true, locale: ptBR })}</span>
                              {interaction.duration && (
                                <>
                                  <span>·</span>
                                  <Clock className="h-3 w-3" />
                                  <span>{Math.floor(interaction.duration / 60)}min</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <SentimentIndicator sentiment={(interaction.sentiment as 'positive' | 'neutral' | 'negative') || 'neutral'} size="sm" />
                            {interaction.follow_up_required && (
                              <AlertCircle className="h-4 w-4 text-warning" />
                            )}
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 space-y-2 border-t pt-3">
                                 {interaction.content && (
                                   <p className="text-sm text-foreground whitespace-pre-wrap">{interaction.content}</p>
                                 )}
 
                                 {interaction.audio_url && (
                                   <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg border border-primary/10">
                                     <Play className="w-4 h-4 text-primary" />
                                     <audio controls className="h-8 flex-1">
                                       <source src={interaction.audio_url} type="audio/webm" />
                                       Seu navegador não suporta o player de áudio.
                                     </audio>
                                   </div>
                                 )}
 
                                 {interaction.attachments && (interaction.attachments as string[]).length > 0 && (
                                   <div className="space-y-1.5">
                                     <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Anexos:</span>
                                     <div className="flex flex-wrap gap-2">
                                       {(interaction.attachments as string[]).map((url, idx) => (
                                         <a 
                                           key={idx} 
                                           href={safehref(url)}
                                           target="_blank"
                                           rel="noopener noreferrer"
                                           className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded text-[10px] hover:bg-muted/80 transition-colors"
                                         >
                                           <File className="w-3 h-3" />
                                           {url.split('/').pop()?.split('-').slice(1).join('-') || 'Arquivo'}
                                         </a>
                                       ))}
                                     </div>
                                   </div>
                                 )}
                                {interaction.key_insights && interaction.key_insights.length > 0 && (
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">Insights-chave:</span>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {interaction.key_insights.map((insight, j) => (
                                        <Badge key={j} variant="secondary" className="text-xs">{insight}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {interaction.tags && interaction.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {interaction.tags.map(tag => (
                                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                    ))}
                                  </div>
                                )}
                                {interaction.follow_up_required && interaction.follow_up_date && (
                                  <div className="flex items-center gap-1.5 text-xs text-warning">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Follow-up: {format(new Date(interaction.follow_up_date), "dd/MM/yyyy")}
                                  </div>
                                )}
                                <MeetingSummaryCard
                                  interactionId={interaction.id}
                                  hasContent={!!(interaction.content && interaction.content.length >= 30)}
                                />
                                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                   <ConversationAnalysisCard
                                     interactionId={interaction.id}
                                     hasContent={!!(interaction.content && interaction.content.length >= 80)}
                                   />
                                   <SleightOfMouthPanel contactId={contact.id} interactionId={interaction.id} />
                                 </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-0">
          <WhatsAppDashboard contactId={contact.id} />
        </TabsContent>

        <TabsContent value="calls" className="mt-0">
          <div className="space-y-4">
            {filteredInteractions.filter(i => i.type === 'call').length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Phone className="mb-3 h-10 w-10 text-muted-foreground/70" />
                  <p className="text-sm font-medium text-muted-foreground">Nenhuma ligação encontrada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="relative space-y-0">
                <div className="absolute left-5 top-3 bottom-3 w-px bg-border" />
                {filteredInteractions.filter(i => i.type === 'call').map((interaction, i) => {
                  const config = TYPE_CONFIG.call;
                  const Icon = config.icon;
                  const isExpanded = expandedId === interaction.id;
                  return (
                    <motion.div
                      key={interaction.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="relative pl-12"
                    >
                      <div className={cn('absolute left-2.5 top-4 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-card', config.color)}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <Card className={cn('mb-2 cursor-pointer hover:shadow-sm', isExpanded && 'ring-1 ring-primary/20')} onClick={() => setExpandedId(isExpanded ? null : interaction.id)}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{interaction.title}</span>
                                {interaction.duration && <span className="text-[10px] text-muted-foreground">{Math.floor(interaction.duration / 60)}min {interaction.duration % 60}s</span>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{format(new Date(interaction.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}</p>
                            </div>
                            <SentimentIndicator sentiment={((interaction.sentiment as import('@/types').SentimentType) || 'neutral')} size="sm" />
                          </div>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 pt-3 border-t">
                                {interaction.transcription ? (
                                  <div className="bg-muted/30 p-2.5 rounded text-xs space-y-2">
                                    <span className="font-medium">Transcrição:</span>
                                    <p className="italic">{interaction.transcription}</p>
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground italic">Sem transcrição disponível</p>
                                )}
                                {interaction.content && <p className="text-sm mt-2">{interaction.content}</p>}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="external" className="mt-0">
          <ExternalInteractionsTimeline contactId={contact.id} />
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <InteractionForm
            contacts={[contactForForm]}
            defaultContactId={contact.id}
            defaultCompanyId={companyId || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
