import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { parseApiError } from '@/lib/errorMessages';

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
      return data;
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
  const { data } = await supabase.storage.from('whatsapp-audio').createSignedUrl(path, 60 * 60 * 24 * 365);
  if (!data?.signedUrl) throw new Error('Falha ao gerar URL do áudio');
  return data.signedUrl;
}

export interface WhatsAppMessageRow {
  id: string;
  contact_id: string | null;
  company_id: string | null;
  message_type: string;
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
        .select('id, contact_id, company_id, message_type, content, media_url, from_me, sender_name, timestamp, duration_seconds, transcription_status, whatsapp_transcriptions(content, provider, confidence)')
        .order('timestamp', { ascending: false })
        .limit(limit);
      if (contactId) q = q.eq('contact_id', contactId);
      if (companyId) q = q.eq('company_id', companyId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as WhatsAppMessageRow[];
    },
  });
}