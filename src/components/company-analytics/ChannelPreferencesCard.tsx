import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, MessageCircle, Phone, Mail, Users, StickyNote, Circle } from 'lucide-react';
import type { ChannelStat, AnalyticsPreference, AnalyticsContact } from '@/hooks/useCompanyProfileAnalytics';

interface Props {
  channels: ChannelStat[];
  preferences: AnalyticsPreference[];
  contacts: AnalyticsContact[];
  recommendedChannel: string | null;
}

const CHANNEL_META: Record<string, { label: string; icon: typeof MessageCircle }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  call: { label: 'Ligação', icon: Phone },
  email: { label: 'E-mail', icon: Mail },
  meeting: { label: 'Reunião', icon: Users },
  note: { label: 'Nota', icon: StickyNote },
  other: { label: 'Outro', icon: Circle },
};

function formatWindow(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  const s = start?.slice(0, 5) ?? '--:--';
  const e = end?.slice(0, 5) ?? '--:--';
  return `${s} – ${e}`;
}

export function ChannelPreferencesCard({ channels, preferences, contacts, recommendedChannel }: Props) {
  const contactNameById = new Map(contacts.map((c) => [c.id, c.name]));
  const hasChannels = Array.isArray(channels) && channels.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Canais Preferidos de Comunicação</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Taxa de resposta = inbound ÷ outbound no período
          </p>
        </div>
        {recommendedChannel && (
          <Badge variant="default" className="gap-1.5 shrink-0">
            <Trophy className="w-3.5 h-3.5" />
            Recomendado: {CHANNEL_META[recommendedChannel]?.label ?? recommendedChannel}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {hasChannels ? (
          <div className="space-y-3">
            {channels.map((c) => {
              const meta = CHANNEL_META[c.channel] ?? CHANNEL_META.other;
              const Icon = meta.icon;
              const ratePct = Math.min(100, Math.round(c.responseRate * 100));
              return (
                <div key={c.channel} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{meta.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {c.total} interações · {c.outbound} enviadas · {c.inbound} recebidas
                      </span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{ratePct}%</span>
                  </div>
                  <Progress value={ratePct} className="h-1.5" aria-label={`Taxa de resposta ${ratePct}%`} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sem dados de canais no período.
          </p>
        )}

        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Preferências por contato</h3>
          {preferences.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum contato configurou preferências ainda.
            </p>
          ) : (
            <ul className="space-y-2">
              {preferences.map((p) => {
                const window = formatWindow(p.preferred_time_start, p.preferred_time_end);
                const chan = p.preferred_channel?.toLowerCase() ?? null;
                const meta = chan ? CHANNEL_META[chan] ?? CHANNEL_META.other : null;
                return (
                  <li key={p.contact_id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-muted/30">
                    <span className="text-sm truncate">{contactNameById.get(p.contact_id) ?? 'Contato'}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {meta && (
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <meta.icon className="w-3 h-3" />
                          {meta.label}
                        </Badge>
                      )}
                      {window && <span className="text-xs text-muted-foreground tabular-nums">{window}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}