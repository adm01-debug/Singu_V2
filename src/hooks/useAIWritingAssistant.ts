import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

export type MessageType = 'follow_up' | 'introduction' | 'proposal' | 'check_in' | 'thank_you' | 'meeting_request' | 'custom';
export type MessageTone = 'formal' | 'casual' | 'friendly';
export type PersuasionFramework = 'AIDA' | 'PAS' | 'FAB' | '4Ps' | 'Storytelling' | 'None';

interface ContactProfile {
  firstName: string;
  lastName: string;
  roleTitle?: string;
  companyName?: string;
  discProfile?: string | null;
  hobbies?: string[];
  interests?: string[];
}

interface InteractionSummary {
  type: string;
  sentiment: string;
  content?: string;
  createdAt: string;
}

interface AISuggestion {
  subject?: string;
  message: string;
  callToAction?: string;
  reasoning?: string;
}

interface UseAIWritingAssistantResult {
  suggestions: AISuggestion[];
  loading: boolean;
  error: string | null;
   generateSuggestions: (params: {
     contact: ContactProfile;
     recentInteractions?: InteractionSummary[];
     messageType: MessageType;
     customContext?: string;
     tone?: 'formal' | 'casual' | 'friendly';
     framework?: PersuasionFramework;
   }) => Promise<void>;
  clearSuggestions: () => void;
}

export function useAIWritingAssistant(): UseAIWritingAssistantResult {
  const { session } = useAuth();
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

   const generateSuggestions = useCallback(async (params: {
     contact: ContactProfile;
     recentInteractions?: InteractionSummary[];
     messageType: MessageType;
     customContext?: string;
     tone?: 'formal' | 'casual' | 'friendly';
     framework?: PersuasionFramework;
   }) => {
    if (!session?.access_token) {
      setError('Autenticação necessária');
      return;
    }

    setLoading(true);
    setError(null);

    try {
       const { data, error: fnError } = await supabase.functions.invoke('ai-writing-assistant', {
         body: {
           contact: params.contact,
           recentInteractions: params.recentInteractions || [],
           messageType: params.messageType,
           customContext: params.customContext,
           tone: params.tone || 'friendly',
           framework: params.framework || 'None',
         },
       });

      if (fnError) throw fnError;

      const parsed = data?.suggestions || data?.messages || [];
      if (Array.isArray(parsed)) {
        setSuggestions(parsed);
      } else if (data?.message) {
        setSuggestions([{ message: data.message }]);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao gerar sugestões';
      setError(msg);
      logger.error('AI Writing Assistant error:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return { suggestions, loading, error, generateSuggestions, clearSuggestions };
}
