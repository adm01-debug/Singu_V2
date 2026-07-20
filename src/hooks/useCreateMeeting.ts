import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { insertExternalData } from '@/lib/externalData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type MeetingModality = 'video' | 'presencial' | 'phone';

export interface CreateMeetingPayload {
  contactId: string;
  companyId?: string | null;
  title: string;
  scheduledAt: string; // ISO
  durationMinutes: number;
  meetingType?: MeetingModality;
  meetingUrl?: string | null;
  notes?: string | null;
}

export interface CreatedMeeting {
  id: string;
  contact_id: string;
  company_id: string | null;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_type: string | null;
  meeting_url: string | null;
  notes: string | null;
  status: string;
}

export function useCreateMeeting() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateMeetingPayload): Promise<CreatedMeeting> => {
      if (!user) throw new Error('Usuário não autenticado');
      const userId = user.id;

      const record: Record<string, unknown> = {
        contact_id: payload.contactId,
        company_id: payload.companyId ?? null,
        title: payload.title,
        scheduled_at: payload.scheduledAt,
        duration_minutes: payload.durationMinutes,
        meeting_type: payload.meetingType ?? 'video',
        meeting_url: payload.meetingUrl ?? null,
        notes: payload.notes ?? null,
        status: 'scheduled',
        user_id: userId,
      };

      const { data, error } = await insertExternalData<CreatedMeeting>('meetings', record);
      if (error) throw error;
      if (!data) throw new Error('Falha ao criar reunião');
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contact-meetings', variables.contactId] });
      if (variables.companyId) {
        queryClient.invalidateQueries({ queryKey: ['company-meetings', variables.companyId] });
      }
    },
    onError: (error: Error) => {
      toast.error('Não foi possível agendar a reunião', {
        description: error.message,
      });
    },
  });
}
