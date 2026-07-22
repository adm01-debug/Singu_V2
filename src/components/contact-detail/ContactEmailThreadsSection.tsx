import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailThreadSummaryCard } from '@/components/ai/EmailThreadSummaryCard';

interface Props {
  contactId: string;
}

interface EmailRow {
  id: string;
  title: string | null;
  content: string | null;
  transcription: string | null;
  created_at: string;
  type: string;
}

interface ThreadGroup {
  subject: string;
  count: number;
  totalChars: number;
  latestAt: string;
}

function normalizeSubject(s: string): string {
  return s.toLowerCase().replace(/^(re:|fw:|fwd:)\s*/gi, '').trim();
}

export function ContactEmailThreadsSection({ contactId }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: emails, isLoading } = useQuery({
    queryKey: ['contact-emails', contactId],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('interactions')
        .select('id,title,content,transcription,created_at,type')
        .eq('contact_id', contactId)
        .in('type', ['email', 'email_received', 'email_sent'])
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as EmailRow[];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const threads = useMemo<ThreadGroup[]>(() => {
    if (!emails) return [];
    const map = new Map<string, ThreadGroup>();
    for (const e of emails) {
      const subj = e.title ?? '(sem assunto)';
      const key = normalizeSubject(subj);
      const chars = (e.transcription || e.content || '').length;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.totalChars += chars;
        if (e.created_at > existing.latestAt) existing.latestAt = e.created_at;
      } else {
        map.set(key, { subject: subj, count: 1, totalChars: chars, latestAt: e.created_at });
      }
    }
    return Array.from(map.values())
      .filter((t) => t.count > 1 || t.totalChars > 800)
      .sort((a, b) => (a.latestAt > b.latestAt ? -1 : 1))
      .slice(0, 10);
  }, [emails]);

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (threads.length === 0) return null;

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          Threads de Email
          <Badge variant="secondary" className="text-[10px]">{threads.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {threads.map((t) => {
          const key = normalizeSubject(t.subject);
          const isOpen = expanded.has(key);
          return (
            <div key={key} className="border rounded-lg p-2 space-y-2">
              <button
                type="button"
                onClick={() => toggle(key)}
                className="w-full flex items-center justify-between gap-2 text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                  <span className="text-xs font-medium truncate">{t.subject}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[10px]">{t.count} msg{t.count > 1 ? 's' : ''}</Badge>
                  <Badge variant="outline" className="text-[10px]">{Math.round(t.totalChars / 100) / 10}k chars</Badge>
                </div>
              </button>
              {isOpen && (
                <div className="pl-5">
                  <EmailThreadSummaryCard
                    contactId={contactId}
                    subject={t.subject}
                    threadCount={t.count}
                  />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
