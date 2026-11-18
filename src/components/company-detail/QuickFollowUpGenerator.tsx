import { memo, useState } from 'react';
import { Sparkles, MessageSquare, Phone, Mail, CheckCircle2, Loader2, Copy, Briefcase, Coffee, Smile } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PromptChips, type PromptChip } from '@/components/ui/prompt-chips';
import { useNextBestAction, useKeyContacts } from '@/hooks/useCompanyIntelligence';
import { useAIWritingAssistant, type MessageTone } from '@/hooks/useAIWritingAssistant';
import { useCreateTask } from '@/hooks/useTasks';

/**
 * Próximo passo e follow-up da conta.
 *
 * Antes este card anunciava "(IA)", esperava 1200 ms de propósito e devolvia
 * um roteiro fixo no código — endereçado a uma "Beatriz" que não existe, sobre
 * "licenças", com a justificativa também escrita à mão. O botão "Criar Tarefa"
 * não tinha handler.
 *
 * Tudo o que ele prometia já existia pronto no sistema e não estava ligado:
 * a ação e o motivo saem da RPC `get_next_best_action`, um motor de regras
 * sobre última interação, deals parados e tempo sem compra; o roteiro sai da
 * edge function `ai-writing-assistant`, a mesma que o compositor de e-mail
 * usa; e a tarefa é criada por `useCreateTask`.
 */

// Tons aceitos pela edge function (MessageTone): nem mais, nem menos.
const TONE_CHIPS: PromptChip[] = [
  { id: 'formal', label: 'Formal', icon: <Briefcase className="h-3 w-3 mr-1.5" /> },
  { id: 'casual', label: 'Casual', icon: <Coffee className="h-3 w-3 mr-1.5" /> },
  { id: 'friendly', label: 'Amigável', icon: <Smile className="h-3 w-3 mr-1.5" /> },
];
const TONE_LABEL: Record<MessageTone, string> = { formal: 'Formal', casual: 'Casual', friendly: 'Amigável' };

const CANAL_ICON: Record<string, typeof Phone> = { whatsapp: MessageSquare, call: Phone, email: Mail };

interface Props {
  companyId: string;
  companyName: string;
}

export const QuickFollowUpGenerator = memo(({ companyId, companyName }: Props) => {
  const [tom, setTom] = useState<MessageTone>('formal');
  const { data: proximaAcao, isLoading: carregandoAcao } = useNextBestAction(companyId);
  const { data: contatosChave = [] } = useKeyContacts(companyId);
  const { suggestions, loading: gerando, error, generateSuggestions, clearSuggestions } = useAIWritingAssistant();
  const criarTarefa = useCreateTask();

  const roteiro = suggestions[0]?.message ?? null;
  const principal = contatosChave[0];
  const CanalIcon = CANAL_ICON[proximaAcao?.channel ?? ''] ?? Mail;

  const gerar = async (escolhido: MessageTone) => {
    setTom(escolhido);
    if (!principal) {
      toast.error('Cadastre ao menos um contato nesta empresa para gerar o roteiro');
      return;
    }
    const [primeiro, ...resto] = principal.name.trim().split(/\s+/);
    await generateSuggestions({
      contact: { firstName: primeiro, lastName: resto.join(' '), roleTitle: principal.cargo ?? undefined, companyName },
      messageType: 'follow_up',
      tone: escolhido,
      customContext: proximaAcao ? `${proximaAcao.action}. ${proximaAcao.reason}` : undefined,
    });
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Próximo Passo & Follow-up
          </CardTitle>
          {proximaAcao && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-bold">
              {proximaAcao.priority}
            </Badge>
          )}
        </div>
        <CardDescription className="text-[11px]">
          Ação calculada sobre o histórico da conta; roteiro escrito por IA.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {carregandoAcao && <p className="text-xs text-muted-foreground py-2">Analisando o histórico da conta…</p>}

        {!carregandoAcao && !proximaAcao && (
          <p className="text-xs text-muted-foreground py-2">
            Ainda não há histórico suficiente nesta conta para sugerir um próximo passo.
          </p>
        )}

        {proximaAcao && (
          <div className="p-3 rounded-lg bg-background border border-border/50 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Ação sugerida</span>
              <Badge variant="secondary" className="text-[9px] h-4 uppercase">
                <CanalIcon className="h-3 w-3 mr-1" />
                {proximaAcao.channel}
              </Badge>
            </div>
            <p className="text-sm font-bold text-foreground leading-tight">{proximaAcao.action}</p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed italic border-l-2 border-primary/20 pl-2">
              {proximaAcao.reason}
            </p>
          </div>
        )}

        {!roteiro ? (
          <div className="py-1 text-center">
            <p className="text-[11px] text-muted-foreground mb-3">Escolha o tom do roteiro:</p>
            <PromptChips chips={TONE_CHIPS} onSelect={(id) => void gerar(id as MessageTone)} className="justify-center mb-4" />
            <Button onClick={() => void gerar(tom)} disabled={gerando} className="w-full h-9 gap-2 font-bold">
              {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Gerar roteiro {TONE_LABEL[tom]}
            </Button>
            {error && <p className="text-[11px] text-destructive mt-2">{error}</p>}
            {!principal && (
              <p className="text-[11px] text-muted-foreground mt-2">
                Nenhum contato cadastrado nesta empresa.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/10 bg-background p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Roteiro {TONE_LABEL[tom]} · {principal?.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] text-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(roteiro)
                      .then(() => toast.success('Roteiro copiado'))
                      .catch(() => toast.error('Não foi possível copiar'));
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copiar
                </Button>
              </div>
              <p className="text-xs text-foreground font-medium leading-relaxed whitespace-pre-wrap">{roteiro}</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-8 text-xs font-bold" onClick={clearSuggestions}>
                Trocar tom
              </Button>
              <Button
                className="flex-1 h-8 text-xs font-bold gap-1.5"
                disabled={!proximaAcao || criarTarefa.isPending}
                onClick={() => {
                  if (!proximaAcao) return;
                  criarTarefa.mutate({
                    title: proximaAcao.action,
                    description: `${proximaAcao.reason}\n\n${roteiro}`,
                    company_id: companyId,
                    contact_id: principal?.contact_id,
                    task_type: proximaAcao.channel,
                    priority: proximaAcao.priority?.toLowerCase() === 'alta' ? 'high'
                      : proximaAcao.priority?.toLowerCase() === 'baixa' ? 'low' : 'medium',
                  });
                }}
              >
                {criarTarefa.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Criar tarefa
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

QuickFollowUpGenerator.displayName = 'QuickFollowUpGenerator';
