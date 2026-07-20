import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type EvidenceSource = 'whatsapp' | 'call' | 'interaction';

export interface EvidenceHit {
  id: string;
  source: EvidenceSource;
  title: string | null;
  excerpt: string;
  at: string;
  direction?: string | null;
  from_me?: boolean | null;
  sentiment?: string | null;
}

function highlight(text: string, term: string, radius = 140): string {
  if (!term.trim()) return text.slice(0, radius * 2);
  const idx = text.toLowerCase().indexOf(term.trim().toLowerCase());
  if (idx < 0) return text.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + term.length + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}

/** Escapa `%` e `_` para uso seguro em ILIKE. */
function ilikeEscape(v: string): string {
  return v.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export function useEvidenceForLabel(
  contactId: string | null | undefined,
  label: string | null | undefined,
  perSourceLimit = 8,
) {
  return useQuery({
    queryKey: ['evidence-for-label', contactId, label, perSourceLimit],
    enabled: !!contactId && !!label && label.trim().length >= 2,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<EvidenceHit[]> => {
      const term = label!.trim();
      const like = `%${ilikeEscape(term)}%`;

      const [wa, calls, ints] = await Promise.all([
        supabase
          .from('whatsapp_messages')
          .select('id, content, from_me, timestamp, message_type')
          .eq('contact_id', contactId!)
          .ilike('content', like)
          .order('timestamp', { ascending: false })
          .limit(perSourceLimit),
        supabase
          .from('call_logs')
          .select('id, summary, transcription, direction, sentiment, duration_seconds, created_at')
          .eq('contact_id', contactId!)
          .or(`summary.ilike.${like},transcription.ilike.${like}`)
          .order('created_at', { ascending: false })
          .limit(perSourceLimit),
        supabase
          .from('interactions')
          .select('id, type, title, content, transcription, sentiment, initiated_by, created_at')
          .eq('contact_id', contactId!)
          .or(`content.ilike.${like},title.ilike.${like},transcription.ilike.${like}`)
          .order('created_at', { ascending: false })
          .limit(perSourceLimit),
      ]);

      // Falha explícita: preferimos surfacing de erro no useQuery a "sem resultados" silencioso
      const firstError = wa.error ?? calls.error ?? ints.error;
      if (firstError) throw firstError;

      const hits: EvidenceHit[] = [];

      for (const m of (wa.data ?? []) as Array<{
        id: string; content: string | null; from_me: boolean | null; timestamp: string; message_type: string;
      }>) {
        const text = m.content ?? '';
        if (!text) continue;
        hits.push({
          id: m.id, source: 'whatsapp', title: m.from_me ? 'Enviada' : 'Recebida',
          excerpt: highlight(text, term), at: m.timestamp, from_me: m.from_me,
        });
      }

      for (const c of (calls.data ?? []) as Array<{
        id: string; summary: string | null; transcription: string | null; direction: string | null; sentiment: string | null; created_at: string;
      }>) {
        const text = c.summary || c.transcription || '';
        if (!text) continue;
        hits.push({
          id: c.id, source: 'call', title: c.summary ? 'Resumo' : 'Transcrição',
          excerpt: highlight(text, term), at: c.created_at, direction: c.direction, sentiment: c.sentiment,
        });
      }

      for (const i of (ints.data ?? []) as Array<{
        id: string; type: string; title: string | null; content: string | null; transcription: string | null; sentiment: string | null; created_at: string;
      }>) {
        const text = i.content || i.transcription || i.title || '';
        if (!text) continue;
        hits.push({
          id: i.id, source: 'interaction', title: i.title ?? i.type,
          excerpt: highlight(text, term), at: i.created_at, sentiment: i.sentiment,
        });
      }

      return hits.sort((a, b) => (a.at > b.at ? -1 : 1));
    },
  });
}