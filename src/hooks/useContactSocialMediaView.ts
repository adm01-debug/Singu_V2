import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface ContactSocialMediaView {
  contact_id: string;
  full_name: string;
  cargo: string | null;
  company_id: string | null;
  empresa: string | null;
  linkedin_url: string | null;
  linkedin_handle: string | null;
  instagram_url: string | null;
  instagram_handle: string | null;
  facebook_url: string | null;
  facebook_handle: string | null;
  x_url: string | null;
  x_handle: string | null;
  total_redes_cadastradas: number | null;
}

export function useContactSocialMediaView(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contact-social-media-view', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<ContactSocialMediaView>({
        table: 'vw_contact_social_media',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
