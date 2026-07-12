import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type HistoryChannel = 'whatsapp' | 'call' | 'email' | 'meeting' | 'note' | 'social';

export interface HistoryItem {
  id: string;
  source: 'whatsapp_messages' | 'call_logs' | 'interactions';
  channel: HistoryChannel;
  timestamp: string;
  direction: 'inbound' | 'outbound' | 'unknown';
  title: string;
  preview: string;
  contact_id: string | null;
  company_id: string | null;
  duration_seconds?: number | null;
  status?: string | null;
  audio_url?: string | null;
  transcription?: string | null;
}

export interface UnifiedHistoryFilters {
  contactId?: string | null;
  companyId?: string | null;
  channels?: HistoryChannel[];
  from?: string | null; // ISO
  to?: string | null; // ISO
  search?: string;
  limit?: number;
}

function toItemFromWhatsapp(r: Record<string, unknown>): HistoryItem {
  const type = (r.message_type as string) || 'text';
  const content = (r.content as string) || '';
  return {
    id: `wa:${r.id}`,
    source: 'whatsapp_messages',
    channel: 'whatsapp',
    timestamp: (r.timestamp as string) || (r.created_at as string),
    direction: r.from_me ? 'outbound' : 'inbound',
    title: `WhatsApp · ${type}`,
    preview: type === 'audio' ? '🎙️ Áudio' : content.slice(0, 200),
    contact_id: (r.contact_id as string) ?? null,
    company_id: (r.company_id as string) ?? null,
    duration_seconds: (r.duration_seconds as number) ?? null,
    status: (r.status as string) ?? null,
    audio_url: (r.media_url as string) ?? null,
  };
}

function toItemFromCall(r: Record<string, unknown>): HistoryItem {
  return {
    id: `call:${r.id}`,
    source: 'call_logs',
    channel: 'call',
    timestamp: r.created_at as string,
    direction: (r.direction as 'inbound' | 'outbound') || 'unknown',
    title: `Ligação · ${r.status ?? 'registro'}`,
    preview: ((r.summary as string) || (r.transcription as string) || '').slice(0, 200),
    contact_id: (r.contact_id as string) ?? null,
    company_id: (r.company_id as string) ?? null,
    duration_seconds: (r.duration_seconds as number) ?? null,
    status: (r.status as string) ?? null,
    audio_url: (r.audio_url as string) ?? null,
    transcription: (r.transcription as string) ?? null,
  };
}

function toItemFromInteraction(r: Record<string, unknown>): HistoryItem {
  const type = (r.type as HistoryChannel) || 'note';
  return {
    id: `int:${r.id}`,
    source: 'interactions',
    channel: type,
    timestamp: r.created_at as string,
    direction: r.initiated_by === 'them' ? 'inbound' : 'outbound',
    title: (r.title as string) || `Interação · ${type}`,
    preview: ((r.content as string) || (r.transcription as string) || '').slice(0, 200),
    contact_id: (r.contact_id as string) ?? null,
    company_id: (r.company_id as string) ?? null,
    duration_seconds: (r.duration as number) ?? null,
    audio_url: (r.audio_url as string) ?? null,
    transcription: (r.transcription as string) ?? null,
  };
}

export function useUnifiedHistory(filters: UnifiedHistoryFilters) {
  const limit = filters.limit ?? 200;
  return useQuery({
    queryKey: ['unified-history', filters],
    staleTime: 30_000,
    queryFn: async (): Promise<HistoryItem[]> => {
      const channels = filters.channels && filters.channels.length > 0 ? filters.channels : null;
      const wantWA = !channels || channels.includes('whatsapp');
      const wantCall = !channels || channels.includes('call');
      const wantInt = !channels || channels.some(c => ['email', 'meeting', 'note', 'social'].includes(c));

      const tasks: Array<Promise<HistoryItem[]>> = [];

      if (wantWA) {
        let q = supabase
          .from('whatsapp_messages')
          .select('id, contact_id, company_id, from_me, message_type, content, media_url, status, timestamp, created_at, duration_seconds')
          .order('timestamp', { ascending: false })
          .limit(limit);
        if (filters.contactId) q = q.eq('contact_id', filters.contactId);
        if (filters.companyId) q = q.eq('company_id', filters.companyId);
        if (filters.from) q = q.gte('timestamp', filters.from);
        if (filters.to) q = q.lte('timestamp', filters.to);
        if (filters.search) q = q.ilike('content', `%${filters.search}%`);
        tasks.push(q.then(({ data, error }) => {
          if (error) throw error;
          return (data ?? []).map(toItemFromWhatsapp);
        }));
      }

      if (wantCall) {
        let q = supabase
          .from('call_logs')
          .select('id, contact_id, company_id, direction, status, duration_seconds, audio_url, transcription, summary, created_at')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (filters.contactId) q = q.eq('contact_id', filters.contactId);
        if (filters.companyId) q = q.eq('company_id', filters.companyId);
        if (filters.from) q = q.gte('created_at', filters.from);
        if (filters.to) q = q.lte('created_at', filters.to);
        if (filters.search) q = q.or(`transcription.ilike.%${filters.search}%,summary.ilike.%${filters.search}%`);
        tasks.push(q.then(({ data, error }) => {
          if (error) throw error;
          return (data ?? []).map(toItemFromCall);
        }));
      }

      if (wantInt) {
        const intChannels = channels
          ? channels.filter(c => ['email', 'meeting', 'note', 'social'].includes(c))
          : ['email', 'meeting', 'note', 'social'];
        let q = supabase
          .from('interactions')
          .select('id, contact_id, company_id, type, title, content, transcription, audio_url, duration, initiated_by, created_at')
          .in('type', intChannels)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (filters.contactId) q = q.eq('contact_id', filters.contactId);
        if (filters.companyId) q = q.eq('company_id', filters.companyId);
        if (filters.from) q = q.gte('created_at', filters.from);
        if (filters.to) q = q.lte('created_at', filters.to);
        if (filters.search) q = q.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
        tasks.push(q.then(({ data, error }) => {
          if (error) throw error;
          return (data ?? []).map(toItemFromInteraction);
        }));
      }

      const results = await Promise.all(tasks);
      const merged = results.flat();
      merged.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      return merged.slice(0, limit);
    },
  });
}
