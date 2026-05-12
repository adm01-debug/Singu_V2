import { useState, useCallback } from 'react';
import { 
  Target, 
  Loader2, 
  Brain, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Copy,
  ChevronRight,
  MessageSquare,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useEdgeFunctionActions } from '@/hooks/useEdgeFunctionActions';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactId: string;
}

export function NextBestAction({ contactId }: Props) {
  const { user } = useAuth();
  const { loading, suggestNextAction } = useEdgeFunctionActions();
  const [suggestion, setSuggestion] = useState<any>(null);
  const [script, setScript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSuggest = useCallback(async () => {
    const result = await suggestNextAction(contactId);
    if (result && result.suggestion) {
      setSuggestion(result.suggestion);
      setScript(result.suggestion.suggested_message || '');
    }
  }, [contactId, suggestNextAction]);

  const handleComplete = async () => {
    if (!suggestion || !user) return;
    setIsSubmitting(true);
    try {
      // Save feedback and mark as completed
      const { error } = await supabase
        .from('proximo_passo_feedback')
        .insert([{
          contact_id: contactId,
          user_id: user.id,
          passo_id: suggestion.passo_id || 'ai-suggested',
          outcome: 'respondeu_positivo',
          notes: `Feedback: ${feedback}\nScript: ${script}`,
          channel_used: suggestion.action_type || 'other',
          executed_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Also create an interaction record
      const { error: intError } = await supabase
        .from('interactions')
        .insert([{
          contact_id: contactId,
          user_id: user.id,
          title: `Concluído: ${suggestion.title}`,
          content: `Ação sugerida pela IA concluída.\nFeedback: ${feedback}\nScript utilizado: ${script}`,
          type: suggestion.action_type === 'whatsapp' ? 'message' : (['call', 'email', 'meeting'].includes(suggestion.action_type) ? suggestion.action_type : 'other'),
          sentiment: 'positive'
        }]);

      if (intError) throw intError;

      toast.success('Ação marcada como concluída e histórico alimentado!');
      setSuggestion(null);
      setFeedback('');
      setScript('');
    } catch (error: any) {
      toast.error('Erro ao concluir ação: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader className="pb-3 border-b bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-sm font-bold">Próxima Melhor Ação (IA)</CardTitle>
              <CardDescription className="text-[10px]">Inteligência preditiva para maximizar conversão</CardDescription>
            </div>
          </div>
          {!suggestion && (
            <Button 
              size="sm" 
              className="h-8 gap-2 text-xs" 
              onClick={handleSuggest}
              disabled={loading['suggest-next-action']}
            >
              {loading['suggest-next-action'] ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Zap className="h-3 w-3" />
              )}
              Analisar Contexto
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {suggestion ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                  {suggestion.title}
                  <Badge variant={suggestion.urgency === 'high' || suggestion.urgency === 'critical' ? 'destructive' : 'secondary'} className="text-[9px] px-1.5 h-4 uppercase">
                    {suggestion.urgency}
                  </Badge>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {suggestion.description}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                <Brain className="h-2.5 w-2.5" /> {suggestion.confidence}% match
              </Badge>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 border border-dashed space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Script Sugerido (Editável)
                </Label>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(script)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <Textarea 
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="text-xs bg-background min-h-[80px] focus-visible:ring-primary/30"
                placeholder="O script aparecerá aqui..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="space-y-1">
                <span className="font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Melhor Momento
                </span>
                <p className="font-medium text-foreground">{suggestion.best_time || 'Imediato'}</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Raciocínio IA
                </span>
                <p className="font-medium text-foreground line-clamp-2" title={suggestion.reasoning}>
                  {suggestion.reasoning}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t space-y-3">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Observações da Conclusão</Label>
              <Textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="text-xs min-h-[60px]"
                placeholder="Como foi o contato? O cliente reagiu bem? Isso alimenta nossa IA..."
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 h-9 text-xs" 
                  onClick={() => setSuggestion(null)}
                >
                  Descartar
                </Button>
                <Button 
                  className="flex-[2] h-9 text-xs gap-2" 
                  onClick={handleComplete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  Marcar como Concluído
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center">
              <Brain className="h-6 w-6 text-primary/40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Nenhuma ação ativa</p>
              <p className="text-[10px] text-muted-foreground max-w-[200px]">
                Clique em "Analisar Contexto" para que a IA encontre a melhor oportunidade agora.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}