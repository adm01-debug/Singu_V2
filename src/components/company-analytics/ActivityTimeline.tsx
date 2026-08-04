import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Phone, Mail, Users, StickyNote, Circle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AnalyticsInteraction, TimelinePoint, AnalyticsContact } from '@/hooks/useCompanyProfileAnalytics';

interface Props {
  timeline: TimelinePoint[];
  recentEvents: AnalyticsInteraction[];
  contacts: AnalyticsContact[];
}

const CHANNEL_META: Record<string, { label: string; icon: typeof MessageCircle; color: string }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'hsl(var(--chart-1))' },
  call: { label: 'Ligação', icon: Phone, color: 'hsl(var(--chart-2))' },
  email: { label: 'E-mail', icon: Mail, color: 'hsl(var(--chart-3))' },
  meeting: { label: 'Reunião', icon: Users, color: 'hsl(var(--chart-4))' },
  note: { label: 'Nota', icon: StickyNote, color: 'hsl(var(--chart-5))' },
  other: { label: 'Outro', icon: Circle, color: 'hsl(var(--muted-foreground))' },
};

function normalizeChannel(type: string | null | undefined): string {
  const t = (type ?? '').toLowerCase();
  if (t.includes('whats')) return 'whatsapp';
  if (t.includes('call') || t.includes('ligac') || t.includes('phone')) return 'call';
  if (t.includes('mail')) return 'email';
  if (t.includes('meet') || t.includes('reuni')) return 'meeting';
  if (t.includes('note') || t.includes('nota')) return 'note';
  return 'other';
}

export function ActivityTimeline({ timeline, recentEvents, contacts }: Props) {
  const contactNameById = new Map(contacts.map((c) => [c.id, c.name]));
  const hasData = Array.isArray(timeline) && timeline.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Timeline de Atividades</CardTitle>
        <p className="text-xs text-muted-foreground">
          Volume diário de interações por canal + últimos 20 eventos
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasData ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => format(parseISO(v), 'dd/MM', { locale: ptBR })}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  labelFormatter={(v) => format(parseISO(String(v)), "dd 'de' MMMM", { locale: ptBR })}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {(Object.keys(CHANNEL_META) as Array<keyof typeof CHANNEL_META>).map((k) => (
                  <Area
                    key={k}
                    type="monotone"
                    dataKey={k}
                    stackId="1"
                    stroke={CHANNEL_META[k].color}
                    fill={CHANNEL_META[k].color}
                    fillOpacity={0.6}
                    name={CHANNEL_META[k].label}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Sem interações no período selecionado.
          </p>
        )}

        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Eventos recentes</h3>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum evento no período.</p>
          ) : (
            <ul className="space-y-2">
              {recentEvents.slice(0, 20).map((ev) => {
                const ch = normalizeChannel(ev.type);
                const meta = CHANNEL_META[ch] ?? CHANNEL_META.other;
                const Icon = meta.icon;
                return (
                  <li key={ev.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="mt-0.5 p-1.5 rounded-md bg-muted">
                      <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium truncate">{ev.title || meta.label}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{meta.label}</Badge>
                        {ev.sentiment && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{ev.sentiment}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {contactNameById.get(ev.contact_id) ?? 'Contato'} · {format(parseISO(ev.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
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