import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { ReportConfig } from '@/lib/reports/reportEngine';

export interface SavedReport {
  id: string;
  user_id: string;
  name: string;
  config: ReportConfig;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'singu-custom-reports';

/** Persistência local (sem necessidade de migration). */
export function useSavedReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<SavedReport[]>([]);

  const load = useCallback(() => {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}-${user?.id}`);
      setReports(raw ? JSON.parse(raw) : []);
    } catch (e) {
      logger.error('Failed to load reports', e);
      setReports([]);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const persist = useCallback((next: SavedReport[]) => {
    setReports(next);
    if (user?.id) {
      try { localStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify(next)); } catch { /* quota/private */ }
    }
  }, [user?.id]);

  const saveReport = useCallback((config: ReportConfig) => {
    const now = new Date().toISOString();
    const existing = reports.find(r => r.name === config.name);
    if (existing) {
      const next = reports.map(r =>
        r.id === existing.id ? { ...r, config, updated_at: now } : r,
      );
      persist(next);
      toast.success('Relatório atualizado');
      return existing.id;
    }
    const id = crypto.randomUUID();
    const newReport: SavedReport = {
      id,
      user_id: user?.id || '',
      name: config.name,
      config,
      created_at: now,
      updated_at: now,
    };
    persist([...reports, newReport]);
    toast.success('Relatório salvo');
    return id;
  }, [reports, persist, user?.id]);

  const deleteReport = useCallback((id: string) => {
    persist(reports.filter(r => r.id !== id));
    toast.success('Relatório removido');
  }, [reports, persist]);

  return { reports, saveReport, deleteReport, refresh: load };
}
