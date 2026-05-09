import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Brain, ArrowRight, Calendar, UserPlus, CheckCircle2, MoreHorizontal, X, FileText, History, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRegisterPassoFeedback } from '@/hooks/useProximoPassoFeedback';
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
  const { mutate: registerFeedback, isPending } = useRegisterPassoFeedback();

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
      passoId: 'dashboard_strategic_followup', // ID genérico para ações do dashboard
      outcome,
    }, {
      onSuccess: () => {
        setCompletedIds(prev => new Set(prev).add(contactId));
        toast({
          title: "Ação registrada",
          description: "A recomendação foi atualizada com sucesso.",
        });
      },
      onError: () => {
        toast({
          title: "Erro ao registrar",
          description: "Não foi possível salvar sua ação no momento.",
          variant: "destructive"
        });
      }
    });
  };

  if (nextSteps.length === 0 && completedIds.size === 0) return null;

  return (
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
                className="group flex items-center justify-between gap-4 rounded-xl border border-transparent hover:border-border/50 hover:bg-muted/50 p-2 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-10 w-10 border-2 border-background shadow-sm shrink-0">
                    <AvatarImage src={contact.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                      {contact.first_name[0]}{contact.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold truncate leading-tight">
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
                          : 'Aguardando primeiro contato'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
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

                  <Link to={`/contatos/${contact.id}`}>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {nextSteps.length === 0 && completedIds.size > 0 && (
            <div className="py-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2 opacity-20" />
              <p className="text-xs text-muted-foreground">Todas as recomendações de hoje foram revisadas!</p>
            </div>
          )}

          <Button variant="outline" className="w-full mt-2 h-9 text-xs gap-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 text-primary">
            <UserPlus className="h-3.5 w-3.5" />
            Ver lista completa de prospecção
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
