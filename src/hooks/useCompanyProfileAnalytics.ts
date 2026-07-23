import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AnalyticsContact {
  id: string;
  name: string;
}

export interface AnalyticsInteraction {
  id: string;
  contact_id: string;
  type: string;
  initiated_by: string | null;
  created_at: string;
  sentiment: string | null;
  title: string;
  content: string | null;
}

export interface AnalyticsPreference {
  contact_id: string;
  preferred_channel: string | null;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  response_rate_by_channel: Record<string, number> | null;
}

export interface AnalyticsProfile {
  contact_id: string;
  tone: string | null;
  preferences: Array<{ label: string; evidence?: string }>;
  hobbies: Array<{ label: string; evidence?: string }>;
  recurrent_topics: string[];
}

export interface InterestBucket {
  label: string;
  kind: 'preference' | 'hobby' | 'topic';
  count: number;
  contactIds: string[];
}

export interface ChannelStat {
  channel: string;
  total: number;
  inbound: number;
  outbound: number;
  responseRate: number;
}

export interface TimelinePoint {
  date: string;
  whatsapp: number;
  call: number;
  email: number;
  meeting: number;
  note: number;
  other: number;
}

export interface CompanyProfileAnalyticsResult {
  contacts: AnalyticsContact[];
  interactions: AnalyticsInteraction[];
  profiles: AnalyticsProfile[];
  preferences: AnalyticsPreference[];
  interests: InterestBucket[];
  timeline: TimelinePoint[];
  channels: ChannelStat[];
  recommendedChannel: string | null;
}

const CHANNEL_BUCKETS = ['whatsapp', 'call', 'email', 'meeting', 'note'] as const;

function normalizeChannel(type: string | null | undefined): string {
  const t = (type ?? '').toLowerCase();
  if (t.includes('whats')) return 'whatsapp';
  if (t.includes('call') || t.includes('ligac') || t.includes('phone')) return 'call';
  if (t.includes('mail')) return 'email';
  if (t.includes('meet') || t.includes('reuni')) return 'meeting';
  if (t.includes('note') || t.includes('nota')) return 'note';
  return 'other';
}

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function useCompanyProfileAnalytics(
  companyId: string | undefined,
  options: { days: 30 | 90 | 180; contactId?: string | null } = { days: 90 },
) {
  const { user } = useAuth();
  const { days, contactId } = options;

  return useQuery<CompanyProfileAnalyticsResult>({
    queryKey: ['company-profile-analytics', companyId, user?.id, days, contactId ?? '__all__'],
    enabled: !!user && !!companyId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      // 1. Contatos da empresa (local supabase)
      const contactsQ = supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .eq('user_id', user!.id)
        .eq('company_id', companyId!);
      const { data: contactsRaw, error: contactsErr } = await contactsQ;
      if (contactsErr) throw contactsErr;
      const contacts: AnalyticsContact[] = safeArray<{ id: string; first_name: string | null; last_name: string | null }>(contactsRaw).map((c) => ({
        id: c.id,
        name: [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || 'Sem nome',
      }));
      const contactIds = contacts.map((c) => c.id);
      const targetIds = contactId ? contactIds.filter((id) => id === contactId) : contactIds;

      if (targetIds.length === 0) {
        return {
          contacts,
          interactions: [],
          profiles: [],
          preferences: [],
          interests: [],
          timeline: [],
          channels: [],
          recommendedChannel: null,
        };
      }

      // 2. Paralelo: interações + perfis + preferências
      const [interactionsRes, profilesRes, prefsRes] = await Promise.all([
        supabase
          .from('interactions')
          .select('id, contact_id, type, initiated_by, created_at, sentiment, title, content')
          .eq('user_id', user!.id)
          .in('contact_id', targetIds)
          .gte('created_at', sinceIso)
          .order('created_at', { ascending: false })
          .limit(1000),
        supabase
          .from('contact_analytical_profiles')
          .select('contact_id, tone, preferences, hobbies, recurrent_topics')
          .in('contact_id', targetIds),
        supabase
          .from('communication_preferences')
          .select('contact_id, preferred_channel, preferred_time_start, preferred_time_end, response_rate_by_channel')
          .eq('user_id', user!.id)
          .in('contact_id', targetIds),
      ]);

      if (interactionsRes.error) throw interactionsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (prefsRes.error) throw prefsRes.error;

      const interactions = safeArray<AnalyticsInteraction>(interactionsRes.data);
      const profiles: AnalyticsProfile[] = safeArray<Record<string, unknown>>(profilesRes.data).map((p) => ({
        contact_id: String(p.contact_id),
        tone: (p.tone as string) ?? null,
        preferences: safeArray<{ label: string; evidence?: string }>(p.preferences),
        hobbies: safeArray<{ label: string; evidence?: string }>(p.hobbies),
        recurrent_topics: safeArray<string>(p.recurrent_topics),
      }));
      const preferences: AnalyticsPreference[] = safeArray<Record<string, unknown>>(prefsRes.data).map((p) => ({
        contact_id: String(p.contact_id),
        preferred_channel: (p.preferred_channel as string) ?? null,
        preferred_time_start: (p.preferred_time_start as string) ?? null,
        preferred_time_end: (p.preferred_time_end as string) ?? null,
        response_rate_by_channel: (p.response_rate_by_channel as Record<string, number>) ?? null,
      }));

      // 3. Agregação: interesses (top por frequência)
      const bucketMap = new Map<string, InterestBucket>();
      const bump = (label: string, kind: InterestBucket['kind'], cid: string) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        const key = `${kind}::${trimmed.toLowerCase()}`;
        const existing = bucketMap.get(key);
        if (existing) {
          existing.count += 1;
          if (!existing.contactIds.includes(cid)) existing.contactIds.push(cid);
        } else {
          bucketMap.set(key, { label: trimmed, kind, count: 1, contactIds: [cid] });
        }
      };
      for (const p of profiles) {
        for (const pref of p.preferences) bump(pref.label, 'preference', p.contact_id);
        for (const h of p.hobbies) bump(h.label, 'hobby', p.contact_id);
        for (const t of p.recurrent_topics) bump(t, 'topic', p.contact_id);
      }
      const interests = Array.from(bucketMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      // 4. Timeline diária
      const dayMap = new Map<string, TimelinePoint>();
      for (const it of interactions) {
        const day = it.created_at.slice(0, 10);
        const point = dayMap.get(day) ?? {
          date: day,
          whatsapp: 0,
          call: 0,
          email: 0,
          meeting: 0,
          note: 0,
          other: 0,
        };
        const ch = normalizeChannel(it.type) as keyof Omit<TimelinePoint, 'date'>;
        point[ch] += 1;
        dayMap.set(day, point);
      }
      const timeline = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

      // 5. Distribuição de canais + taxa de resposta
      const channelAgg = new Map<string, { total: number; inbound: number; outbound: number }>();
      for (const it of interactions) {
        const ch = normalizeChannel(it.type);
        const entry = channelAgg.get(ch) ?? { total: 0, inbound: 0, outbound: 0 };
        entry.total += 1;
        if (it.initiated_by === 'them' || it.initiated_by === 'client') entry.inbound += 1;
        else entry.outbound += 1;
        channelAgg.set(ch, entry);
      }
      const channels: ChannelStat[] = [...CHANNEL_BUCKETS, 'other']
        .map((ch) => {
          const e = channelAgg.get(ch) ?? { total: 0, inbound: 0, outbound: 0 };
          const responseRate = e.outbound > 0 ? e.inbound / e.outbound : 0;
          return { channel: ch, total: e.total, inbound: e.inbound, outbound: e.outbound, responseRate };
        })
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total);

      // Canal recomendado: preferência explícita mais votada; fallback = maior responseRate com >= 3 outbound
      const prefCount = new Map<string, number>();
      for (const p of preferences) {
        if (p.preferred_channel) {
          const key = p.preferred_channel.toLowerCase();
          prefCount.set(key, (prefCount.get(key) ?? 0) + 1);
        }
      }
      let recommendedChannel: string | null = null;
      if (prefCount.size > 0) {
        recommendedChannel = Array.from(prefCount.entries()).sort((a, b) => b[1] - a[1])[0][0];
      } else {
        const best = [...channels].filter((c) => c.outbound >= 3).sort((a, b) => b.responseRate - a.responseRate)[0];
        recommendedChannel = best?.channel ?? null;
      }

      return {
        contacts,
        interactions,
        profiles,
        preferences,
        interests,
        timeline,
        channels,
        recommendedChannel,
      };
    },
  });
}

export function useCompanyAnalyticsMemo<T>(fn: () => T, deps: unknown[]): T {
  return useMemo(fn, deps); // eslint-disable-line react-hooks/exhaustive-deps
}