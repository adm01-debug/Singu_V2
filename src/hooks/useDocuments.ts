import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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

  const { data: documents = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!entityId) return [];
      if (!user) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Document[];
    },
    enabled: !!entityId,
    staleTime: 5 * 60_000,
  });

  const upload = useMutation({
    mutationFn: async ({ file, docType, description }: { file: File; docType: DocumentType; description?: string }) => {
      if (!entityId) throw new Error('Entity ID required');
      if (!user) throw new Error('Não autenticado');

      const ext = file.name.split('.').pop();
      const path = `${user.id}/${entityType}/${entityId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('documents').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);

      // For private bucket, we need signed URL
      const { data: signedData } = await supabase.storage.from('documents').createSignedUrl(path, 60 * 60 * 24 * 365);
      const fileUrl = signedData?.signedUrl || urlData.publicUrl;

      const { error } = await supabase.from('documents').insert({
        user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
        name: file.name,
        description: description || null,
        document_type: docType,
        file_url: fileUrl,
        file_size: file.size,
        mime_type: file.type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success('Documento enviado!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success('Documento removido!');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { documents, isLoading, upload, remove };
}
