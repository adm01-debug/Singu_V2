import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCampaignRecipients } from '@/hooks/useCampaignRecipients';
import { useEmailCampaigns, type EmailCampaign } from '@/hooks/useEmailCampaigns';
import { Mail, Eye, MousePointerClick, AlertTriangle, Send, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  campaign: EmailCampaign | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pendente',   cls: 'bg-muted text-muted-foreground' },
  sent:      { label: 'Enviado',    cls: 'bg-primary/10 text-primary' },
  opened:    { label: 'Aberto',     cls: 'bg-success/10 text-success' },
  clicked:   { label: 'Clicado',    cls: 'bg-success text-success-foreground' },
  bounced:   { label: 'Bounce',     cls: 'bg-destructive/10 text-destructive' },
  unsubscribed: { label: 'Cancelou', cls: 'bg-warning/10 text-warning' },
};

export function CampaignDetailDrawer({ campaign, open, onOpenChange }: Props) {
  const { data: recipients, isLoading } = useCampaignRecipients(campaign?.id);
  const { sendCampaign } = useEmailCampaigns();

  if (!campaign) return null;

  const openRate = campaign.total_recipients > 0
    ? Math.round((campaign.total_opened / campaign.total_recipients) * 100)
    : 0;
  const clickRate = campaign.total_recipients > 0
    ? Math.round((campaign.total_clicked / campaign.total_recipients) * 100)
    : 0;
  const bounceRate = campaign.total_recipients > 0
    ? Math.round((campaign.total_bounced / campaign.total_recipients) * 100)
    : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            {campaign.name}
          </SheetTitle>
          <SheetDescription className="line-clamp-2">{campaign.subject}</SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <MetricBox icon={Mail} label="Destinatários" value={campaign.total_recipients} tone="primary" />
            <MetricBox icon={Eye} label="Abertura" value={`${openRate}%`} tone="success" />
            <MetricBox icon={MousePointerClick} label="Cliques" value={`${clickRate}%`} tone="primary" />
            <MetricBox icon={AlertTriangle} label="Bounces" value={`${bounceRate}%`} tone="warning" />
          </div>

          {/* Ações */}
          {campaign.status === 'draft' && (
            <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground mb-2">
                Esta campanha ainda é um rascunho. Ao enviar, todos os contatos com email válido
                serão materializados como destinatários.
              </p>
              <Button
                size="sm"
                onClick={() => sendCampaign.mutate(campaign.id)}
                disabled={sendCampaign.isPending}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {sendCampaign.isPending ? 'Enviando…' : 'Materializar & Enviar'}
              </Button>
            </div>
          )}

          {campaign.status === 'sent' && campaign.sent_at && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Enviada {formatDistanceToNow(new Date(campaign.sent_at), { addSuffix: true, locale: ptBR })}
            </div>
          )}

          {/* Lista de destinatários */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Destinatários</h3>
              <Badge variant="outline" className="text-[10px]">
                {recipients?.length ?? 0}
              </Badge>
            </div>
            <ScrollArea className="h-[40vh] rounded-md border">
              {isLoading ? (
                <div className="p-3 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
                </div>
              ) : !recipients || recipients.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Nenhum destinatário ainda. {campaign.status === 'draft' && 'Envie a campanha para materializar.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {recipients.map(r => {
                    const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.pending;
                    return (
                      <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{r.email}</p>
                          {r.sent_at && (
                            <p className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(r.sent_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          )}
                        </div>
                        <Badge className={`text-[10px] ${badge.cls}`} variant="secondary">
                          {badge.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function MetricBox({
  icon: Icon, label, value, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone: 'primary' | 'success' | 'warning';
}) {
  const toneCls =
    tone === 'success' ? 'text-success' :
    tone === 'warning' ? 'text-warning' :
    'text-primary';
  return (
    <div className="rounded-lg border bg-card p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${toneCls}`} />
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
