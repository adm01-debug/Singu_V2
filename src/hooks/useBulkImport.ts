import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import Papa from 'papaparse';
import type { TablesInsert } from '@/integrations/supabase/types';
import { parseApiError } from '@/lib/errorMessages';

interface ImportResult {
  total: number;
  success: number;
  errors: { row: number; message: string }[];
}

const CONTACT_FIELDS = [
  'first_name', 'last_name', 'email', 'phone', 'whatsapp',
  'role_title', 'tags', 'notes', 'birthday', 'linkedin', 'instagram',
];

const COMPANY_FIELDS = [
  'name', 'cnpj', 'razao_social', 'nome_fantasia', 'email', 'phone',
  'website', 'industry', 'city', 'state', 'address', 'tags', 'notes',
];

function normalizeHeaders(headers: string[]): string[] {
  const MAP: Record<string, string> = {
    'nome': 'first_name', 'primeiro_nome': 'first_name', 'first name': 'first_name',
    'sobrenome': 'last_name', 'last name': 'last_name',
    'e-mail': 'email', 'e_mail': 'email',
    'telefone': 'phone', 'tel': 'phone',
    'cargo': 'role_title', 'título': 'role_title', 'title': 'role_title',
    'empresa': 'name', 'company': 'name', 'razão social': 'razao_social',
    'nome fantasia': 'nome_fantasia', 'fantasia': 'nome_fantasia',
    'endereço': 'address', 'endereco': 'address',
    'cidade': 'city', 'estado': 'state', 'uf': 'state',
    'site': 'website', 'setor': 'industry', 'ramo': 'industry',
    'aniversário': 'birthday', 'aniversario': 'birthday',
    'observações': 'notes', 'observacoes': 'notes', 'obs': 'notes',
    'etiquetas': 'tags', 'marcadores': 'tags',
  };
  return headers.map(h => {
    const lower = h.trim().toLowerCase();
    return MAP[lower] ?? lower;
  });
}

export type ImportEntityType = 'contacts' | 'companies';

function mapImportRow(
  row: Record<string, string>,
  rawHeaders: string[],
  normalizedHeaders: string[],
  validFields: string[],
  userId: string,
  entityType: ImportEntityType,
): { data: Record<string, unknown> | null; error?: string } {
  const mapped: Record<string, unknown> = { user_id: userId };
  rawHeaders.forEach((header, index) => {
    const field = normalizedHeaders[index];
    if (!validFields.includes(field) || !row[header]?.trim()) return;
    mapped[field] = field === 'tags'
      ? row[header].split(/[,;|]/).map(tag => tag.trim()).filter(Boolean)
      : row[header].trim();
  });

  if (entityType === 'contacts') {
    if (!mapped.first_name) return { data: null, error: 'Nome obrigatório' };
    if (!mapped.last_name) mapped.last_name = '';
  } else if (!mapped.name) {
    return { data: null, error: 'Nome da empresa obrigatório' };
  }
  return { data: mapped };
}

interface MappedImportRecord {
  data: Record<string, unknown>;
  rowNumber: number;
}

export function mapImportBatch(
  rows: Record<string, string>[],
  rowOffset: number,
  rawHeaders: string[],
  normalizedHeaders: string[],
  validFields: string[],
  userId: string,
  entityType: ImportEntityType,
): { records: MappedImportRecord[]; errors: ImportResult['errors'] } {
  const errors: ImportResult['errors'] = [];
  const records = rows.flatMap((row, batchIndex) => {
    const rowNumber = rowOffset + batchIndex + 2;
    const mapped = mapImportRow(
      row,
      rawHeaders,
      normalizedHeaders,
      validFields,
      userId,
      entityType,
    );
    if (mapped.error) errors.push({ row: rowNumber, message: mapped.error });
    return mapped.data ? [{ data: mapped.data, rowNumber }] : [];
  });
  return { records, errors };
}

export function useBulkImport(entityType: ImportEntityType) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const validFields = entityType === 'contacts' ? CONTACT_FIELDS : COMPANY_FIELDS;

  const parseFile = useCallback((f: File) => {
    setFile(f);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      preview: 5,
      complete: (results) => {
        const rawHeaders = results.meta.fields ?? [];
        const normalized = normalizeHeaders(rawHeaders);
        setHeaders(normalized);
        const rows = (results.data as Record<string, string>[]).map(row => {
          const mapped: Record<string, string> = {};

          rawHeaders.forEach((h, i) => {
            mapped[normalized[i]] = row[h];
          });
          return mapped;
        });
        setPreview(rows);
      },
      error: () => toast.error('Erro ao ler o arquivo CSV'),
    });
  }, []);

  const importMutation = useMutation({
    mutationFn: async (): Promise<ImportResult> => {
      if (!file) throw new Error('Nenhum arquivo selecionado');

      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          encoding: 'UTF-8',
          complete: async (results) => {
            const rawHeaders = results.meta.fields ?? [];
            const normalized = normalizeHeaders(rawHeaders);
            const rows = results.data as Record<string, string>[];
            const errors: { row: number; message: string }[] = [];
            let success = 0;

            if (!user) { reject(new Error('Não autenticado')); return; }

            const BATCH_SIZE = 50;
            for (let i = 0; i < rows.length; i += BATCH_SIZE) {
              const batch = mapImportBatch(
                rows.slice(i, i + BATCH_SIZE),
                i,
                rawHeaders,
                normalized,
                validFields,
                user.id,
                entityType,
              );
              errors.push(...batch.errors);

              if (batch.records.length > 0) {
                const payloads = batch.records.map(record => record.data);
                const { error } = entityType === 'contacts'
                  ? await supabase.from('contacts').insert(payloads as TablesInsert<'contacts'>[])
                  : await supabase.from('companies').insert(payloads as TablesInsert<'companies'>[]);

                if (error) {
                  batch.records.forEach(record => {
                    errors.push({ row: record.rowNumber, message: error.message });
                  });
                } else {
                  success += batch.records.length;
                }
              }
            }

            resolve({ total: rows.length, success, errors });
          },
          error: (err) => reject(err),
        });
      });
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: [entityType] });
      qc.invalidateQueries({ queryKey: [entityType === 'contacts' ? 'external-contacts' : 'external-companies'] });
      toast.success(`Importação concluída: ${result.success}/${result.total} registros`);
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} erros encontrados`);
      }
    },
    onError: (err: Error) => toast.error(`Erro na importação: ${parseApiError(err)}`),
  });

  const reset = useCallback(() => {
    setPreview([]);
    setHeaders([]);
    setFile(null);
  }, []);

  return {
    parseFile,
    preview,
    headers,
    file,
    validFields,
    importMutation,
    reset,
    isImporting: importMutation.isPending,
  };
}
