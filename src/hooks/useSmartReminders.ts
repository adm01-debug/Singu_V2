import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from "@/lib/logger";

export interface SmartReminder {
  id: string;
  type: 'follow_up' | 'birthday' | 'decay' | 'milestone';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  contactId: string;
  contactName: string;
  dueDate: string | null;
  metadata: Record<string, unknown>;
}

export interface ReminderSummary {
  total: number;
  byType: {
    follow_up: number;
    birthday: number;
    decay: number;
    milestone: number;
  };
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface SmartRemindersResponse {
  success: boolean;
  reminders: SmartReminder[];
  summary: ReminderSummary;
  aiInsights: string | null;
}

export const useSmartReminders = (autoFetch = true) => {
  const [reminders, setReminders] = useState<SmartReminder[]>([]);
  const [summary, setSummary] = useState<ReminderSummary | null>(null);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { user } = useAuth();

  // Load dismissed reminders from localStorage
  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem('dismissedReminders'); } catch { /* quota/private */ }
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Clean up old dismissed items (older than 24 hours for follow-ups, 1 year for birthdays)
        const now = Date.now();
        const cleaned: Record<string, number> = {};
        for (const [id, timestamp] of Object.entries(parsed)) {
          const age = now - (timestamp as number);
          const maxAge = id.startsWith('birthday-') ? 365 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
          if (age < maxAge) {
            cleaned[id] = timestamp as number;
          }
        }
        localStorage.setItem('dismissedReminders', JSON.stringify(cleaned));
        setDismissedIds(new Set(Object.keys(cleaned)));
      } catch {
        localStorage.removeItem('dismissedReminders');
      }
    }
  }, []);

  const fetchReminders = useCallback(async (analyze = false) => {
    setIsLoading(true);
    setError(null);

    // Timeout to prevent infinite loading — 5s for dashboard UX
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    try {
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      const { data, error: invokeError } = await supabase.functions.invoke('smart-reminders', {
        body: { 
          userId: user.id,
          action: analyze ? 'analyze' : 'fetch'
        }
      });

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      const response = data as SmartRemindersResponse;
      
      if (response.success) {
        // Filter out dismissed reminders
        const filteredReminders = response.reminders.filter(r => !dismissedIds.has(r.id));
        setReminders(filteredReminders);
        setSummary(response.summary);
        setAiInsights(response.aiInsights);
      } else {
        throw new Error('Failed to fetch reminders');
      }
    } catch (err) {
      logger.error('Error fetching smart reminders:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Silent fail on dashboard — don't show toast for expected edge function errors
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }, [dismissedIds, user]);

  const dismissReminder = useCallback((id: string) => {
    setDismissedIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      
      // Persist to localStorage with timestamp
      const stored = localStorage.getItem('dismissedReminders');
      const parsed = stored ? (() => { try { return JSON.parse(stored); } catch { return {}; } })() : {};
      parsed[id] = Date.now();
      try { localStorage.setItem('dismissedReminders', JSON.stringify(parsed)); } catch { /* quota/private */ }

      return updated;
    });

    setReminders(prev => prev.filter(r => r.id !== id));

    toast({
      title: 'Lembrete dispensado',
      description: 'O lembrete foi removido da sua lista.'
    });
  }, [toast]);

  const snoozeReminder = useCallback((id: string, hours: number) => {
    // Store snooze time in localStorage
    const snoozeUntil = Date.now() + hours * 60 * 60 * 1000;
    const stored = localStorage.getItem('snoozedReminders');
    const parsed = stored ? (() => { try { return JSON.parse(stored); } catch { return {}; } })() : {};
    parsed[id] = snoozeUntil;
    try { localStorage.setItem('snoozedReminders', JSON.stringify(parsed)); } catch { /* quota/private */ }
    
    setReminders(prev => prev.filter(r => r.id !== id));
    
    toast({
      title: 'Lembrete adiado',
      description: `Você será lembrado novamente em ${hours} hora${hours > 1 ? 's' : ''}.`
    });
  }, [toast]);

  const completeReminder = useCallback((reminder: SmartReminder) => {
    // Dismiss from local state
    setDismissedIds(prev => {
      const updated = new Set(prev);
      updated.add(reminder.id);
      
      const stored = localStorage.getItem('dismissedReminders');
      const parsed = stored ? (() => { try { return JSON.parse(stored); } catch { return {}; } })() : {};
      parsed[reminder.id] = Date.now();
      try { localStorage.setItem('dismissedReminders', JSON.stringify(parsed)); } catch { /* quota/private */ }
      
      return updated;
    });
    
    setReminders(prev => prev.filter(r => r.id !== reminder.id));
    
    return reminder; // Return for celebration handling
  }, []);

  const getHighPriorityCount = useCallback(() => {
    return reminders.filter(r => r.priority === 'high').length;
  }, [reminders]);

  const getRemindersByType = useCallback((type: SmartReminder['type']) => {
    return reminders.filter(r => r.type === type);
  }, [reminders]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchReminders();
    }
  }, [autoFetch, fetchReminders]);

  // Set up periodic refresh (every 30 minutes)
  useEffect(() => {
    if (!autoFetch) return;
    
    const intervalId = setInterval(() => {
      fetchReminders();
    }, 30 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [autoFetch, fetchReminders]);

  return {
    reminders,
    summary,
    aiInsights,
    isLoading,
    error,
    fetchReminders,
    dismissReminder,
    snoozeReminder,
    completeReminder,
    getHighPriorityCount,
    getRemindersByType
  };
};