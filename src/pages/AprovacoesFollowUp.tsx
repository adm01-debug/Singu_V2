import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareCheck, Check, X, Clock, User, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useFollowUpApprovals,
  useDecideFollowUp,
  type FollowUpApproval,
} from '@/hooks/useFollowUpApprovals';

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  sms: 'SMS',
  call: 'Ligação',
  linkedin: 'LinkedIn',
};

function formatarData(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return format(d, "dd 'de' MMM 'às' HH:mm", { locale: ptBR });
}

export default function AprovacoesFollowUp() {
  const { data: approvals = [], isLoading, error } = useFollowUpApprovals();
  const decide = useDecideFollowUp();
  const [decidindo, setDecidindo] = useState<string | null>(null);

  const linhas = useMemo(
    () =>
      approvals.map(a => ({
        ...a,
        criadoEm: formatarData(a.created_at),
        agendadoPara: formatarData(a.scheduled_at),
      })),
    [approvals],
  );

  const handleDecide = (approval: FollowUpApproval, decision: 'approved' | 'rejected') => {
    setDecidindo(approval.id);
    decide.mutate(
      { id: approval.id, decision },
      { onSettled: () => setDecidindo(null) },
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <MessageSquareCheck className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Aprovações de follow-up</h1>
          <span className="text-sm text-muted-foreground">({linhas.length})</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Follow-ups gerados pela IA que aguardam sua decisão antes de sair.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            Não foi possível carregar a fila de aprovação.
          </CardContent>
        </Card>
      ) : linhas.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum follow-up aguardando aprovação.</p>
            <p className="text-xs mt-1">
              Gere um follow-up no card de próximos passos da ficha do contato.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {linhas.map(a => {
            const pending = decide.isPending && decidindo === a.id;
            return (
              <Card key={a.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      {a.contact_id ? (
                        <Link
                          to={`/contatos/${a.contact_id}`}
                          className="text-sm font-medium truncate hover:underline"
                        >
                          {a.contact_name || 'Ver contato'}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">
                          Contato não informado
                        </span>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {CHANNEL_LABEL[a.channel ?? ''] ?? a.channel ?? 'Canal não definido'}
                    </Badge>
                  </div>

                  <p className="text-sm whitespace-pre-wrap rounded-md bg-muted/40 p-3">
                    {a.content}
                  </p>

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      {a.criadoEm && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Gerado em {a.criadoEm}
                        </span>
                      )}
                      {a.agendadoPara && <span>Agendado para {a.agendadoPara}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => handleDecide(a, 'rejected')}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => handleDecide(a, 'approved')}
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}