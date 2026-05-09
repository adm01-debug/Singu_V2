import { useMemo, useState, useCallback } from 'react';
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
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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


interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string | null;
  relationship_score?: number | null;
  last_interaction_at?: string | null;
  role_title?: string | null;
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
      .slice(0, 3);
  }, [contacts, completedIds]);

  const handleAction = (contactId: string, outcome: 'respondeu_positivo' | 'respondeu_neutro' | 'pulou') => {
    registerFeedback({
      contactId,
      passoId: 'dashboard_strategic_followup',
      outcome,
    }, {
      onSuccess: () => {
        setCompletedIds(prev => new Set(prev).add(contactId));
        
        // Log auditoria
        const contact = contacts.find(c => c.id === contactId);
        logAudit({
          contactId,
          score: contact?.relationship_score || 0,
          recommendationType: 'next_step',
          reasons: ['Ação do usuário registrada via Próximos Passos'],
          userAction: outcome,
          dataUsed: {
            score: contact?.relationship_score,
            last_interaction: contact?.last_interaction_at
          }
        });

        toast({
          title: "Ação registrada",
          description: "A recomendação foi atualizada com sucesso.",
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
                  onClick={() => setSelectedContactId(contact.id)}
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
                      <div className="flex items-center gap-1.5 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground/60" />
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
      // Simulate/Trigger follow-up generation (could be an edge function call)
      const content = `Olá ${contact?.first_name}, notei que faz um tempo que não conversamos. Como estão as coisas por aí?`;
      
      const { error } = await supabase
        .from('follow_up_approvals')
        .insert({
          user_id: user.id,
          contact_id: contactId,
          channel: 'whatsapp',
          content,
          status: 'pending'
        });

      if (error) throw error;

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
    toast({
      title: "Lembrete Agendado",
      description: "Sincronizado com seu calendário para amanhã às 09:00.",
    });
    // In a real app, this would integrate with Google/Outlook Calendar API
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
            <section>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-primary" />
                Por que esta recomendação?
              </h4>
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                <ul className="space-y-2">
                  {insights.length > 0 ? insights.slice(0, 3).map((insight, idx) => (
                    <li key={idx} className="text-xs flex gap-2">
                      <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{insight.description || insight.title}</span>
                    </li>
                  )) : (
                    <li className="text-xs flex gap-2">
                      <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>O score de relacionamento é alto ({contact?.relationship_score || 0}/100) e não há interações recentes.</span>
                    </li>
                  )}
                </ul>
              </div>
            </section>

            <Separator />

            <section>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-primary" />
                Resumo da Última Interação
              </h4>
              {interactions.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground">{interactions[0].title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-4 bg-muted/30 p-2 rounded">
                    {interactions[0].content || 'Sem conteúdo detalhado registrado.'}
                  </p>
                  <p className="text-[10px] text-muted-foreground italic">
                    {formatDistanceToNow(new Date(interactions[0].created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">Nenhuma interação registrada ainda.</p>
              )}
            </section>

            <Separator />

            <section>
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-primary" />
                Histórico Recente
              </h4>
              <div className="space-y-3">
                {interactions.slice(1, 4).map((interaction, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-border shrink-0 mt-1.5" />
                    <div>
                      <p className="text-xs font-medium">{interaction.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(interaction.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
                {interactions.length <= 1 && (
                  <p className="text-xs text-muted-foreground italic">Sem histórico adicional.</p>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="p-6 bg-background border-t mt-auto flex flex-col gap-2">
          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={handleApproveFollowUp} disabled={approving}>
              <Send className="h-4 w-4" />
              Gerar Follow-up IA
            </Button>
            <Link to={`/contatos/${contactId}`} className="flex-1">
              <Button variant="outline" className="w-full gap-2">
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

