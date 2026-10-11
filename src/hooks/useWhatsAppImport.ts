import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { parseApiError } from '@/lib/errorMessages';
import { z } from 'zod';

export type WhatsAppMessageType = 'text' | 'audio' | 'image' | 'video' | 'document' | 'sticker';

export interface WhatsAppImportInput {
  contact_id?: string | null;
  company_id?: string | null;
  instance_name?: string;
  remote_jid: string;
  message_id?: string | null;
  from_me?: boolean;
  message_type?: WhatsAppMessageType;
  content?: string | null;
  media_url?: string | null;
  media_mimetype?: string | null;
  sender_name?: string | null;
  duration_seconds?: number | null;
  timestamp?: string;
  transcription?: string | null;
  transcription_provider?: string | null;
  transcription_confidence?: number | null;
}

export interface WhatsAppImportResult {
  inserted_count: number;
  failed_count: number;
  inserted: string[];
  failed: Array<{ index: number; error: string }>;
}

export function useImportWhatsAppMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messages: WhatsAppImportInput[]): Promise<WhatsAppImportResult> => {
      const { data, error } = await supabase.functions.invoke<WhatsAppImportResult>(
        'whatsapp-import',
        { body: { messages } }
      );
      if (error) throw new Error(error.message);
      if (!data) throw new Error('Sem resposta do servidor');
      const result = z.object({
        inserted_count: z.number().int().nonnegative(),
        failed_count: z.number().int().nonnegative(),
        inserted: z.array(z.string()),
        failed: z.array(z.object({ index: z.number().int().nonnegative(), error: z.string() })),
      }).parse(data);
      return {
        inserted_count: result.inserted_count,
        failed_count: result.failed_count,
        inserted: result.inserted,
        failed: result.failed.map(failure => ({ index: failure.index, error: failure.error })),
      };
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['whatsapp-messages'] });
      if (r.failed_count > 0) {
        toast.warning(`${r.inserted_count} importada(s), ${r.failed_count} falharam`);
      } else {
        toast.success(`${r.inserted_count} mensagem(ns) importada(s)`);
      }
    },
    onError: (e: Error) => toast.error(`Falha na importação: ${parseApiError(e)}`),
  });
}

export async function uploadWhatsAppAudio(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'ogg';
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('whatsapp-audio').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'audio/ogg',
  });
  if (error) throw error;
  const { data, error: signedUrlError } = await supabase.storage.from('whatsapp-audio').createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signedUrlError) throw signedUrlError;
  if (!data?.signedUrl) throw new Error('Falha ao gerar URL do áudio');
  return data.signedUrl;
}

export interface WhatsAppMessageRow {
  id: string;
  contact_id: string | null;
  company_id: string | null;
  message_type: string | null;
  content: string | null;
  media_url: string | null;
  from_me: boolean;
  sender_name: string | null;
  timestamp: string;
  duration_seconds: number | null;
  transcription_status: string;
  whatsapp_transcriptions: Array<{ content: string; provider: string | null; confidence: number | null }>;
}

interface FilterInput { contactId?: string; companyId?: string; limit?: number }

export function useWhatsAppMessages({ contactId, companyId, limit = 100 }: FilterInput) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['whatsapp-messages', { contactId, companyId, limit }],
    enabled: !!user && (!!contactId || !!companyId),
    staleTime: 30_000,
    queryFn: async (): Promise<WhatsAppMessageRow[]> => {
      let q = supabase
        .from('whatsapp_messages')
        .select('id, contact_id, company_id, message_type, content, media_url, from_me, sender_name, timestamp, metadata')
        .eq('user_id', user!.id)
        .order('timestamp', { ascending: false })
        .limit(limit);
      if (contactId) q = q.eq('contact_id', contactId);
      if (companyId) q = q.eq('company_id', companyId);
      const { data, error } = await q;
      if (error) throw error;
      const messageIds = (data ?? []).map(message => message.id);
      const { data: transcriptions, error: transcriptionError } = messageIds.length > 0
        ? await supabase.from('whatsapp_transcriptions')
          .select('whatsapp_message_id, content, provider, confidence')
          .in('whatsapp_message_id', messageIds)
        : { data: [], error: null };
      if (transcriptionError) throw transcriptionError;
      return (data ?? []).map((message): WhatsAppMessageRow => {
        const metadata = z.object({
          duration_seconds: z.number().nonnegative().nullable().optional(),
          transcription_status: z.enum(['pending', 'processing', 'done', 'failed', 'not_applicable']).optional(),
        }).parse(message.metadata ?? {});
        const relatedTranscriptions = (transcriptions ?? [])
          .filter(transcription => transcription.whatsapp_message_id === message.id)
          .map(({ content, provider, confidence }) => ({ content, provider, confidence }));
        return {
          id: message.id,
          contact_id: message.contact_id,
          company_id: message.company_id,
          message_type: message.message_type,
          content: message.content,
          media_url: message.media_url,
          from_me: message.from_me,
          sender_name: message.sender_name,
          timestamp: message.timestamp,
          duration_seconds: metadata.duration_seconds ?? null,
          transcription_status: metadata.transcription_status
            ?? (message.message_type === 'audio' ? relatedTranscriptions.length > 0 ? 'done' : 'pending' : 'not_applicable'),
          whatsapp_transcriptions: relatedTranscriptions,
        };
      });
    },
  });
}