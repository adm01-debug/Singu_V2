import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

export type DocumentType = 'contract' | 'proposal' | 'nda' | 'invoice' | 'report' | 'presentation' | 'spreadsheet' | 'image' | 'other';

export interface Document {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  name: string;
  description: string | null;
  document_type: DocumentType;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  version: number;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export function useDocuments(entityType: string, entityId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['documents', user?.id, entityType, entityId];

  const { data: documents = [], isLoading, error: documentsError } = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!entityId) return [];
      if (!user) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('id, user_id, entity_type, entity_id, file_name, description, document_type, file_url, file_size, file_type, version, status, tags, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []).map(row => ({ ...row, name: row.file_name, mime_type: row.file_type })) as Document[];
    },
    enabled: !!entityId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const upload = useMutation({
    mutationFn: async ({ file, docType, description }: { file: File; docType: DocumentType; description?: string }) => {
      if (!entityId) throw new Error('Entity ID required');
      if (!user) throw new Error('Não autenticado');

      const ext = file.name.split('.').pop();
      const path = `${user.id}/${entityType}/${entityId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('documents').upload(path, file);
      if (uploadError) throw uploadError;

      try {
        const { data: signedData, error: signedUrlError } = await supabase.storage.from('documents').createSignedUrl(path, 60 * 60 * 24 * 365);
        if (signedUrlError) throw signedUrlError;
        if (!signedData?.signedUrl) throw new Error('Não foi possível gerar o link privado do documento');

        const { error } = await supabase.from('documents').insert({
          user_id: user.id,
          entity_type: entityType,
          entity_id: entityId,
          file_name: file.name,
          description: description || null,
          document_type: docType,
          file_url: signedData.signedUrl,
          file_size: file.size,
          file_type: file.type,
        });
        if (error) throw error;
      } catch (error) {
        try {
          const { error: cleanupError } = await supabase.storage.from('documents').remove([path]);
          if (cleanupError) toast.warning('O envio falhou e o arquivo incompleto não pôde ser removido.');
        } catch {
          toast.warning('O envio falhou e o arquivo incompleto não pôde ser removido.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success('Documento enviado!');
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('documents').delete().eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success('Documento removido!');
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  return { documents, isLoading, error: documentsError, upload, remove };
}
