import { useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  ArrowRight, 
  Calendar, 
  UserPlus, 
  CheckCircle2, 
  MoreHorizontal, 
  X, 
  FileText, 
  History, 
  Info,
  Download,
  Send,
  Eye,
  MessageSquare,
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { updateExternalData } from '@/lib/externalData';
import { useRegisterPassoFeedback } from '@/hooks/useProximoPassoFeedback';
import { useRecommendationAudit } from '@/hooks/useRecommendationAudit';
import { toast } from '@/hooks/use-toast';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useContactDetail } from '@/hooks/useContactDetail';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';


interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  relationship_score?: number | null;
  last_interaction_at?: string | null;
  last_interaction_summary?: string | null;
  role_title?: string | null;
  notes?: string | null;
}

interface StrategicNextStepsCardProps {
  contacts: Contact[];
  className?: string;
}

export function StrategicNextStepsCard({ contacts, className }: StrategicNextStepsCardProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const { mutate: registerFeedback, isPending } = useRegisterPassoFeedback();
  const { mutate: logAudit } = useRecommendationAudit();
  const queryClient = useQueryClient();

  // Optimistic update effect: automatically re-sort when a feedback is registered
  // and invalidate contacts to get fresh scores
  const triggerRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
  }, [queryClient]);

  const nextSteps = useMemo(() => {
    return [...contacts]
      .filter(c => c.relationship_score !== null && !completedIds.has(c.id))
      .sort((a, b) => {
        const scoreA = a.relationship_score || 0;
        const scoreB = b.relationship_score || 0;
        const dateA = a.last_interaction_at ? new Date(a.last_interaction_at).getTime() : 0;
        const dateB = b.last_interaction_at ? new Date(b.last_interaction_at).getTime() : 0;
        
        const now = Date.now();
        const ageA = (now - dateA) / (1000 * 60 * 60 * 24);
        const ageB = (now - dateB) / (1000 * 60 * 60 * 24);
        
        return (scoreB + ageB * 2) - (scoreA + ageA * 2);
      })
      .slice(0, 5);
  }, [contacts, completedIds]);

  const handleAction = async (contactId: string, outcome: 'respondeu_positivo' | 'respondeu_neutro' | 'pulou') => {
    const contact = contacts.find(c => c.id === contactId);
    const currentScore = contact?.relationship_score || 50;
    
    // Calcula ajuste de score
    let scoreAdjustment = 0;
    if (outcome === 'respondeu_positivo') scoreAdjustment = 5;
    else if (outcome === 'respondeu_neutro') scoreAdjustment = 1;
    else if (outcome === 'pulou') scoreAdjustment = -2;

    const newScore = Math.min(100, Math.max(0, currentScore + scoreAdjustment));

    registerFeedback({
      contactId,
      passoId: 'dashboard_strategic_followup',
      outcome,
    }, {
      onSuccess: async () => {
        setCompletedIds(prev => new Set(prev).add(contactId));
        
        // Atualiza score no banco externo
        if (scoreAdjustment !== 0) {
          await updateExternalData('contacts', contactId, { 
            relationship_score: newScore,
            updated_at: new Date().toISOString()
          });
        }

        // Log auditoria
        logAudit({
          contactId,
          score: newScore,
          recommendationType: 'next_step',
          reasons: [`Ação "${outcome}" registrada via Próximos Passos. Score ajustado de ${currentScore} para ${newScore}`],
          userAction: outcome,
          dataUsed: {
            previous_score: currentScore,
            new_score: newScore,
            last_interaction: contact?.last_interaction_at
          }
        });

        triggerRefresh();

        toast({
          title: "Ação registrada",
          description: `Score atualizado para ${newScore}. Recomendações reorganizadas.`,
        });
      }
    });
  };

  if (nextSteps.length === 0 && completedIds.size === 0) return null;

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-sm font-bold">Próximos Passos Estratégicos</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">
            IA Recomendado
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {nextSteps.map((contact, i) => (
                <motion.div
                  key={contact.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-transparent hover:border-border/50 hover:bg-muted/50 p-2 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedContactId(contact.id);
                    logAudit({
                      contactId: contact.id,
                      score: contact.relationship_score || 0,
                      recommendationType: 'next_step_view',
                      reasons: ['Usuário visualizou detalhes da recomendação'],
                      userAction: 'viewed'
                    });
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm shrink-0">
                      <AvatarImage src={contact.avatar_url || ''} />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                        {contact.first_name[0]}{contact.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold truncate leading-tight group-hover:text-primary transition-colors">
                      {contact.first_name} {contact.last_name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {contact.role_title || 'Contato Estratégico'}
                      </p>
                      
                      {/* Dashboard "Resumo da Última Interação" mini-display */}
                      <div className="mt-1 flex items-start gap-1.5 max-w-full">
                        <MessageSquare className="h-3 w-3 text-primary/40 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-muted-foreground italic truncate">
                          {contact.last_interaction_summary || contact.notes || 'Nenhum resumo disponível'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground/60" />
                        <span className="text-[10px] text-muted-foreground/70">
                          {contact.last_interaction_at 
                            ? `Último contato ${formatDistanceToNow(new Date(contact.last_interaction_at), { addSuffix: true, locale: ptBR })}`
                            : 'Aguardando contato'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAction(contact.id, 'respondeu_positivo')}>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                          Ação Realizada
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(contact.id, 'pulou')}>
                          <X className="h-4 w-4 mr-2 text-muted-foreground" />
                          Pular por enquanto
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {nextSteps.length === 0 && completedIds.size > 0 && (
              <div className="py-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-20" />
                <p className="text-xs text-muted-foreground">Todas as recomendações revisadas!</p>
              </div>
            )}

            <Button variant="outline" className="w-full mt-2 h-9 text-xs gap-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 text-primary">
              <UserPlus className="h-3.5 w-3.5" />
              Ver lista completa
            </Button>
          </div>
        </CardContent>
      </Card>

      <ContactRecommendationSheet 
        contactId={selectedContactId} 
        onClose={() => setSelectedContactId(null)} 
      />
    </>
  );
}

function ContactRecommendationSheet({ contactId, onClose }: { contactId: string | null, onClose: () => void }) {
  const { contact, interactions, insights, loading } = useContactDetail(contactId || undefined);
  const [approving, setApproving] = useState(false);
  const { user } = useAuth();
  const { mutate: logAudit } = useRecommendationAudit();
  const queryClient = useQueryClient();

  const exportToPDF = useCallback(() => {
    if (!contact) return;

    const doc = new jsPDF();
    const fullName = `${contact.first_name} ${contact.last_name}`;
    
    // Header
    doc.setFontSize(20);
    doc.text('Relatório de Recomendação Estratégica', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Contato: ${fullName}`, 14, 32);
    doc.text(`Cargo: ${contact.role_title || 'Não definido'}`, 14, 38);
    doc.text(`Data: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 44);

    // AI Reasons
    doc.setFontSize(16);
    doc.text('Motivos da Recomendação (IA)', 14, 55);
    
    const reasons = insights.length > 0 
      ? insights.map(i => [i.description || i.title])
      : [['O score de relacionamento é alto e não há interações recentes.']];

    autoTable(doc, {
      startY: 60,
      head: [['Motivo']],
      body: reasons,
      theme: 'striped',
    });

    // Last Interaction
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.text('Resumo da Última Interação', 14, finalY);
    
    if (interactions.length > 0) {
      const last = interactions[0];
      doc.setFontSize(12);
      doc.text(`Título: ${last.title}`, 14, finalY + 8);
      doc.text(`Data: ${format(new Date(last.created_at), 'dd/MM/yyyy')}`, 14, finalY + 14);
      
      const splitContent = doc.splitTextToSize(last.content || 'Sem conteúdo detalhado.', 180);
      doc.text(splitContent, 14, finalY + 22);

      const nextY = finalY + 35 + (splitContent.length * 5);
      doc.setFontSize(14);
      doc.text('Tópicos Principais:', 14, nextY);
      doc.setFontSize(10);
      doc.text('- Contexto de negócio\n- Próximos passos alinhados', 14, nextY + 8);
      
      doc.setFontSize(14);
      doc.text('Sugestão de Abordagem:', 14, nextY + 25);
      doc.setFontSize(10);
      const suggest = `Olá ${contact.first_name}, notei que faz um tempo que não conversamos. Como estão os projetos?`;
      doc.text(doc.splitTextToSize(suggest, 180), 14, nextY + 33);
    } else {
      doc.text('Nenhuma interação registrada.', 14, finalY + 8);
    }

    doc.save(`recomendacao_${contact.first_name.toLowerCase()}.pdf`);
    
    toast({
      title: "PDF Gerado",
      description: "O resumo foi exportado com sucesso.",
    });
  }, [contact, insights, interactions]);

  const handleApproveFollowUp = async () => {
    if (!user || !contactId) return;
    
    setApproving(true);
    try {
      // 1. Generate follow-up content
      const content = `Olá ${contact?.first_name}, notei que faz um tempo que não conversamos. Como estão as coisas por aí?`;
      
      // 2. Save to approvals table
      const { error } = await supabase
        .from('follow_up_approvals_v2' as any)
        .insert({
          user_id: user.id,
          contact_id: contactId,
          channel: 'whatsapp',
          content,
          status: 'pending'
        });

      if (error) throw error;

      // 3. Log audit for the generation
      logAudit({
        contactId,
        score: contact?.relationship_score || 0,
        recommendationType: 'followup_generated',
        reasons: ['Usuário solicitou geração de follow-up IA'],
        userAction: 'generated_followup',
        dataUsed: { channel: 'whatsapp' }
      });

      toast({
        title: "Follow-up gerado",
        description: "Aguardando sua revisão na fila de aprovação.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao gerar follow-up",
        variant: "destructive"
      });
    } finally {
      setApproving(false);
    }
  };

  const scheduleReminder = async () => {
    if (!contact || !user) return;
    
    try {
      // 1. Create Internal Reminder (Interaction)
      const { error } = await supabase.from('interactions').insert({
        user_id: user.id,
        contact_id: contact.id,
        company_id: contact.company_id,
        type: 'note',
        title: `Lembrete: Follow-up com ${contact.first_name}`,
        content: `Agendado via recomendação da IA. Próximo passo sugerido: Fortalecer relacionamento.`,
        follow_up_required: true,
        follow_up_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        sentiment: 'neutral'
      });

      if (error) throw error;

      // 2. Generate Google Calendar Link
      const title = encodeURIComponent(`Follow-up: ${contact.first_name} ${contact.last_name}`);
      const details = encodeURIComponent(`Links e contexto no Singu CRM: ${window.location.origin}/contatos/${contact.id}`);
      const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${new Date().toISOString().replace(/-|:|\.\d\d\d/g, '')}/${new Date(Date.now() + 30 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '')}`;
      
      window.open(googleCalendarUrl, '_blank');

      toast({
        title: "Lembrete Agendado",
        description: "Sincronizado internamente e aberto no seu Google Agenda.",
      });
      
      // Log do agendamento para auditoria
      logAudit({
        contactId: contact.id,
        score: contact.relationship_score || 0,
        recommendationType: 'calendar_schedule',
        reasons: ['Usuário agendou lembrete no calendário'],
        userAction: 'scheduled',
        dataUsed: { provider: 'google_calendar' }
      });
      
      queryClient.invalidateQueries({ queryKey: ['your-day'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-followups'] });
      
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao agendar",
        description: "Não foi possível criar o lembrete interno.",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet open={!!contactId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md w-full flex flex-col p-0">
        <div className="p-6 pb-0">
          <SheetHeader className="text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary/20">
                  <AvatarImage src={contact?.avatar_url || ''} />
                  <AvatarFallback>{contact?.first_name?.[0]}{contact?.last_name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle>{contact?.first_name} {contact?.last_name}</SheetTitle>
                  <SheetDescription>{contact?.role_title || 'Contato Estratégico'}</SheetDescription>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={exportToPDF} title="Exportar PDF">
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={scheduleReminder} title="Agendar no Calendário">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>
        </div>

        <ScrollArea className="flex-1 px-6 mt-6">
          <div className="space-y-6 pb-24">
            {/* 1. Motivos da Recomendação */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Brain className="h-4 w-4" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Motivos Estratégicos</h4>
              </div>
              <div className="grid gap-2">
                {insights.length > 0 ? insights.slice(0, 3).map((insight, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="mt-0.5 rounded-full bg-primary/20 p-1 h-fit">
                      <TrendingUp className="h-3 w-3 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-primary/90">{insight.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Este contato possui um alto score de relacionamento ({contact?.relationship_score || 0}/100), mas não houve interações recentes. Recomenda-se um follow-up de manutenção.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <Separator className="bg-border/40" />

            {/* 2. Resumo da Última Interação */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <History className="h-4 w-4" />
                <h4 className="text-sm font-bold uppercase tracking-wider">Última Interação</h4>
              </div>
              
              {interactions.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase bg-background">
                        {interactions[0].type === 'message' ? 'Mensagem' : 'Reunião'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(interactions[0].created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-bold">{interactions[0].title}</h5>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        "{interactions[0].content || 'Sem conteúdo detalhado registrado.'}"
                      </p>
                    </div>

                    {/* Tópicos Principais & Pendências (Simulados se não houver no banco) */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-success" /> Tópicos
                        </p>
                        <ul className="text-[10px] space-y-1 text-muted-foreground list-disc list-inside">
                          {interactions[0].key_insights && Array.isArray(interactions[0].key_insights) 
                            ? (interactions[0].key_insights as string[]).map((ki, i) => <li key={i}>{ki}</li>)
                            : <><li>Contexto de negócio</li><li>Próximos passos</li></>
                          }
                        </ul>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Clock className="h-3 w-3 text-warning" /> Pendências
                        </p>
                        <ul className="text-[10px] space-y-1 text-muted-foreground list-disc list-inside">
                          {interactions[0].follow_up_required ? <li>Aguardando follow-up</li> : <li>Nenhuma pendência crítica</li>}
                          <li>Validar proposta</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Sugestão de Abordagem */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 border-dashed space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-primary/10 p-1">
                        <Send className="h-3 w-3 text-primary" />
                      </div>
                      <p className="text-xs font-bold text-primary">Sugestão de Abordagem</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      "Olá {contact?.first_name}, notei que faz um tempo que não conversamos. Como estão os projetos? Podemos agendar uma call rápida de 15min?"
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-border/30 rounded-xl">
                  <p className="text-xs text-muted-foreground italic">Nenhuma interação recente registrada.</p>
                </div>
              )}
            </section>
          </div>
        </ScrollArea>

        <div className="p-6 bg-background border-t mt-auto flex flex-col gap-2">
          <div className="flex gap-2">
            <Button className="flex-1 h-11 text-sm font-bold gap-2 shadow-lg" onClick={handleApproveFollowUp} disabled={approving}>
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              Gerar Follow-up IA
            </Button>
            <Link to={`/contatos/${contactId}`} className="flex-1">
              <Button variant="outline" className="w-full h-11 gap-2">
                <Eye className="h-4 w-4" />
                Ver Perfil
              </Button>
            </Link>
          </div>
          <Button variant="ghost" className="w-full" onClick={onClose}>Fechar</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Loader2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

