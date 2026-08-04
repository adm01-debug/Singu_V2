import { useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

export function useMergeCompanies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ primaryId, secondaryId }: { primaryId: string; secondaryId: string }) => {
      const { data, error } = await callExternalRpc('merge_companies', {
        p_primary_id: primaryId,
        p_secondary_id: secondaryId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['external-companies'] });
      toast.success('Empresas mescladas com sucesso');
    },
    onError: (err: Error) => toast.error(`Erro ao mesclar: ${parseApiError(err)}`),
  });
}

export function useExportCompaniesCsv() {
  return useMutation({
    mutationFn: async (filters?: Record<string, unknown>) => {
      const { data, error } = await callExternalRpc<string>('export_companies_csv', {
        p_filters: filters ?? {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (csvContent) => {
      if (!csvContent) {
        toast.error('Nenhum dado para exportar');
        return;
      }
      const blob = new Blob([csvContent as string], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `empresas_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Exportação concluída');
    },
    onError: (err: Error) => toast.error(`Erro na exportação: ${parseApiError(err)}`),
  });
}
