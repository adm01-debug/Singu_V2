import { Brain, Check, X, MessageSquare, Mail, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIApprovals } from '@/hooks/useAIApprovals';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AIApprovalsWidget() {
  const { approvals, isLoading, updateApproval } = useAIApprovals();

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3"><div className="h-4 w-36 bg-muted rounded" /></CardHeader>
        <CardContent><div className="h-40 bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  if (approvals.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-bold uppercase tracking-wider text-primary">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Aprovação de Follow-ups IA
          </div>
          <Badge variant="default" className="bg-primary text-primary-foreground">
            {approvals.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[350px] pr-4">
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div key={approval.id} className="p-3 rounded-lg bg-background border border-border/50 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {approval.channel === 'whatsapp' ? (
                      <MessageSquare className="h-3 w-3 text-success" />
                    ) : (
                      <Mail className="h-3 w-3 text-info" />
                    )}
                    <span className="text-xs font-bold truncate">{approval.contact_name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground italic">
                    {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-3">
                  "{approval.content}"
                </p>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-8 text-[11px] gap-1 hover:bg-success/10 hover:text-success hover:border-success/30"
                    onClick={() => updateApproval.mutate({ id: approval.id, status: 'approved' })}
                    disabled={updateApproval.isPending}
                  >
                    <Check className="h-3 w-3" /> Aprovar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 h-8 text-[11px] gap-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                    onClick={() => updateApproval.mutate({ id: approval.id, status: 'rejected' })}
                    disabled={updateApproval.isPending}
                  >
                    <X className="h-3 w-3" /> Rejeitar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
