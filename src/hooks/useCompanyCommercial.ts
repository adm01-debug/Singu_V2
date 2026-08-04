import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import type { ContactDeal } from './useContactDeals';
import type { ContactProposal } from './useContactProposals';
import type { ContactMeeting } from './useContactMeetings';
import type { ContactTask } from './useContactTasks';

export function useCompanyDeals(companyId?: string) {
  return useQuery({
    queryKey: ['company-deals', companyId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ContactDeal>({
        table: 'deals',
        select: '*',
        filters: [{ type: 'eq', column: 'company_id', value: companyId }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanyProposals(companyId?: string) {
  return useQuery({
    queryKey: ['company-proposals', companyId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ContactProposal & { company_id?: string }>({
        table: 'proposals',
        select: '*',
        filters: [{ type: 'eq', column: 'company_id', value: companyId }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanyMeetings(companyId?: string) {
  return useQuery({
    queryKey: ['company-meetings', companyId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ContactMeeting & { company_id?: string }>({
        table: 'meetings',
        select: '*',
        filters: [{ type: 'eq', column: 'company_id', value: companyId }],
        order: { column: 'scheduled_at', ascending: false },
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanyTasks(companyId?: string) {
  return useQuery({
    queryKey: ['company-tasks', companyId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ContactTask & { company_id?: string }>({
        table: 'tasks',
        select: '*',
        filters: [{ type: 'eq', column: 'company_id', value: companyId }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanySalesActivities(companyId?: string) {
  return useQuery({
    queryKey: ['company-sales-activities', companyId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<{
        id: string;
        company_id?: string;
        activity_type?: string;
        outcome?: string;
        notes?: string;
        duration_minutes?: number;
        contact_name?: string;
        created_at?: string;
      }>({
        table: 'sales_activities',
        select: '*',
        filters: [{ type: 'eq', column: 'company_id', value: companyId }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}
