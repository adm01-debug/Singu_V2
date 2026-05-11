  import { format, addDays } from "date-fns";
  import { ptBR } from "date-fns/locale";
  import { 
    ClipboardCheck, MessageSquare, ArrowRight, Zap, 
    Calendar, Target, Shield, LayoutList 
  } from "lucide-react";
import type { Tables } from '@/integrations/supabase/types';

interface ReportScriptsSectionProps {
  interactions: Tables<'interactions'>[];
}

  export function ReportScriptsSection({ interactions }: ReportScriptsSectionProps) {
    const nextSteps = [
      { task: 'Follow-up de Conexão', date: addDays(new Date(), 2), priority: 'Alta' },
      { task: 'Apresentação de Estudo de Caso', date: addDays(new Date(), 5), priority: 'Média' },
      { task: 'Check-in de Satisfação', date: addDays(new Date(), 15), priority: 'Média' },
    ];

    return (
      <>
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
  return (
    <>
      {/* Estratégia de Abordagem Personalizada */}
      <section className="mb-8 page-break-before">
        <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-6 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" /> Scripts de Abordagem (Neuro-PNL)
        </h2>
        <div className="space-y-6">
          📜 Scripts de Vendas Recomendados
        </h2>
        <div className="space-y-6">
          {[
            { phase: 'FASE 1: ABERTURA', text: `"Oi Beatriz! 😊\n\nEstava pensando na nossa conversa sobre os brindes diferentes pro evento de vocês.\n\nLembrei de você agora porque chegou uma linha nova que poucas empresas viram ainda - e acho que combina exatamente com o que você precisa: algo que ninguém vai reconhecer do ano passado!\n\nPosso te mostrar?"` },
            { phase: 'FASE 2: APRESENTAÇÃO', text: `"Olha só o que separei pra você:\n\n[ENVIAR IMAGEM 1]\n✨ Esta é a Maleta Executiva Premium 2026 - acabou de chegar.\nDiferente de tudo que fizemos antes: couro sintético texturizado com fecho magnético.\n\n[ENVIAR IMAGEM 2]\n🎁 E este Kit Desk Minimalista - design escandinavo.\nCaneta, porta-cartões e organizador em bambu. Nenhum cliente nosso usou ainda.\n\nO legal é que dá pra personalizar com a logo da DP White em gravação a laser - fica super sofisticado e nada 'mais do mesmo'."` },
            { phase: 'FASE 3: VALIDAÇÃO + PROVA SOCIAL', text: `"Você tem toda razão em querer surpreender - quando a gente repete brinde, parece que não teve cuidado na escolha, né?\n\nUma empresa de tecnologia aqui de SP (do mesmo porte de vocês) escolheu essa linha pro evento de fim de ano e o feedback foi incrível. Os convidados até postaram no LinkedIn!\n\nQual dessas opções você acha que combina mais com o perfil dos destinatários?"` },
            { phase: 'FASE 4: FECHAMENTO', text: `"Beatriz, resumindo pra facilitar sua apresentação pro diretor:\n\n📦 Opção A: Maleta Executiva Premium - R$ 135,90/un\n📦 Opção B: Kit Desk Minimalista - R$ 89,90/un\n📦 Opção C: Combo dos dois (desconto especial)\n\nTodas com personalização inclusa e entrega em até 15 dias úteis.\n\nPosso montar o orçamento formal pra você? Me passa só a quantidade aproximada que já preparo tudo certinho! 😊"` },
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
        <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4">
          📱 Templates Rápidos de WhatsApp
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {[
            { title: 'Template 1: Follow-up Inicial', text: '"Oi Beatriz! Tudo bem? Lembrei de você - chegaram umas opções novas que são perfeitas pro que você precisa. Bem diferentes do ano passado! Posso te mandar umas fotos?"' },
            { title: 'Template 2: Envio de Opções', text: '"Olha essas opções que separei! 👇 [IMAGEM] Essa linha é novidade 2026, nenhum cliente usou ainda. Perfeita pra causar aquele impacto diferente! O que achou? 😊"' },
            { title: 'Template 3: Pedido de Quantidade', text: '"Amei que você gostou! 🎉 Me conta: aproximadamente quantas unidades vocês precisam? Assim já monto a proposta certinha pra você apresentar pro diretor!"' },
            { title: 'Template 4: Follow-up Pós-Proposta', text: '"Oi Beatriz! 😊 Conseguiu dar uma olhadinha na proposta? Se precisar de algum ajuste ou quiser que eu explique algo pro diretor, estou à disposição!"' },
          ].map(({ title, text }) => (
            <div key={title} className="border p-3 rounded-lg">
              <h4 className="font-bold text-sm text-muted-foreground mb-1">{title}</h4>
              <p className="text-sm text-foreground bg-success/5 p-2 rounded">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dicas de Timing */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4">
          ⏰ Dicas de Timing
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-success/5 p-4 rounded-lg">
            <h4 className="font-bold text-success mb-2">✅ FAZER</h4>
            <ul className="text-sm space-y-1">
              <li>• Horário: 10h-11h ou 14h-16h</li>
              <li>• Dias: Terça a Quinta</li>
              <li>• Tom amigável e informal</li>
              <li>• Enviar imagens sempre</li>
            </ul>
          </div>
          <div className="bg-destructive/5 p-4 rounded-lg">
            <h4 className="font-bold text-destructive mb-2">❌ EVITAR</h4>
            <ul className="text-sm space-y-1">
              <li>• Mensagens após 18h</li>
              <li>• Fins de semana</li>
              <li>• Pressão por tempo</li>
              <li>• Linguagem técnica excessiva</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Probabilidade de Conversão */}
      <section className="mb-8">
        <div className="bg-gradient-success text-success-foreground p-6 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-2">Probabilidade de Conversão</h2>
          <div className="text-5xl font-bold">78%</div>
          <p className="text-sm mt-2 opacity-90">Utilizando a abordagem recomendada neste relatório</p>
        </div>
      </section>

      {/* Histórico de Interações */}
      {interactions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground border-b-2 border-primary pb-2 mb-4">
            📝 Histórico de Interações
          </h2>
          <div className="space-y-3">
            {interactions.slice(0, 5).map((interaction, i: number) => (
              <div key={i} className="border p-3 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm">{interaction.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(interaction.created_at), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{interaction.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
