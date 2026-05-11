import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ClipboardCheck, MessageSquare, ArrowRight, Zap, 
  Calendar, Target, Shield, LayoutList 
} from "lucide-react";
import type { Tables } from '@/integrations/supabase/types';
import { Badge } from "@/components/ui/badge";

interface ReportScriptsSectionProps {
  interactions: Tables<'interactions'>[];
  contactName?: string;
}

export function ReportScriptsSection({ interactions, contactName = "Cliente" }: ReportScriptsSectionProps) {
  const nextSteps = [
    { task: 'Follow-up de Conexão', date: addDays(new Date(), 2), priority: 'Alta' },
    { task: 'Apresentação de Estudo de Caso', date: addDays(new Date(), 5), priority: 'Média' },
    { task: 'Check-in de Satisfação', date: addDays(new Date(), 15), priority: 'Média' },
  ];

  return (
    <div className="space-y-8">
      {/* Próximos Passos Gerados por IA */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" /> Próximos Passos Recomendados
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nextSteps.map((step, i) => (
            <div key={i} className="p-4 bg-primary/5 rounded-xl border border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1">
                <Badge variant={step.priority === 'Alta' ? 'destructive' : 'secondary'} className="text-[9px] uppercase">
                  {step.priority}
                </Badge>
              </div>
              <p className="text-sm font-bold text-foreground mb-1">{step.task}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(step.date, "dd/MM/yy")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Estratégia de Abordagem Personalizada */}
      <section className="mb-8 page-break-before">
        <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-6 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Scripts de Abordagem (Neuro-PNL)
        </h2>
        <div className="space-y-6">
          {[
            { phase: 'FASE 1: ABERTURA', text: `"Oi ${contactName}! 😊\n\nEstava pensando na nossa conversa sobre as soluções que discutimos.\n\nLembrei de você agora porque chegou uma atualização importante que poucas empresas viram ainda - e acho que combina exatamente com o que você precisa!\n\nPosso te mostrar?"` },
            { phase: 'FASE 2: APRESENTAÇÃO', text: `"Olha só o que separei pra você:\n\n[ENVIAR CONTEÚDO IA]\n✨ Esta é a nova abordagem para 2026.\nDiferente de tudo que vimos antes: foco total em eficiência e resultados mensuráveis.\n\nO legal é que dá pra personalizar 100% pro seu cenário atual."` },
            { phase: 'FASE 3: VALIDAÇÃO + PROVA SOCIAL', text: `"Você tem toda razão em querer otimizar processos - quando a gente repete o mesmo modelo, os resultados tendem a estagnar, né?\n\nUma empresa do mesmo porte da sua escolheu essa linha recentemente e o feedback foi incrível. Os indicadores de performance subiram 25%!\n\nQual dessas abordagens você acha que faz mais sentido hoje?"` },
            { phase: 'FASE 4: FECHAMENTO', text: `"${contactName}, resumindo pra facilitar:\n\n📦 Opção A: Implementação Imediata\n📦 Opção B: Piloto de 30 dias\n📦 Opção C: Workshop Estratégico\n\nPosso montar o planejamento formal pra você? Me confirma só a disponibilidade da sua equipe!"` },
          ].map(({ phase, text }) => (
            <div key={phase} className="bg-muted/40 p-4 rounded-lg">
              <h3 className="font-bold text-foreground mb-2">{phase}</h3>
              <p className="text-foreground italic whitespace-pre-line">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Templates Rápidos */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" /> Templates de WhatsApp
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {[
            { title: 'Follow-up Inicial', text: `"Oi ${contactName}! Tudo bem? Lembrei de você - chegaram umas opções novas que são perfeitas pro que você precisa. Posso te mandar os detalhes?"` },
            { title: 'Envio de Opções', text: '"Olha essas opções que separei! 👇 [ARQUIVO] Essa linha é novidade, nenhum concorrente usou ainda. O que achou? 😊"' },
            { title: 'Pedido de Feedback', text: '"Amei que você gostou! 🎉 Me conta: como você visualiza isso funcionando aí no seu dia a dia? Assim já ajusto os detalhes!"' },
          ].map(({ title, text }) => (
            <div key={title} className="border p-3 rounded-lg">
              <h4 className="font-bold text-sm text-muted-foreground mb-1">{title}</h4>
              <p className="text-sm text-foreground bg-success/5 p-2 rounded">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Histórico de Interações */}
      {interactions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4 flex items-center gap-2">
            <LayoutList className="h-5 w-5 text-primary" /> Histórico Recente
          </h2>
          <div className="space-y-3">
            {interactions.slice(0, 5).map((interaction, i) => (
              <div key={i} className="border p-3 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm">{interaction.type || 'Interação'}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(interaction.created_at), "dd/MM/yyyy")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{interaction.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
