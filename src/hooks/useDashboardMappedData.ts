import { useMemo } from 'react';
import type { Tables } from '@/integrations/supabase/types';
import type { Contact, Interaction, ContactRole, SentimentType, InteractionType, RelationshipStage, LifeEvent } from '@/types';
import { getBehavior } from '@/types/behavior';

type DbContact = Tables<'contacts'>;
type DbCompany = Tables<'companies'>;
type DbInteraction = Tables<'interactions'>;

/**
 * Maps raw Supabase data to typed domain models.
 * Only computes when `enabled` is true (i.e., the active tab needs it).
 */
export function useDashboardMappedData(
  contacts: DbContact[],
  companies: DbCompany[],
  interactions: DbInteraction[],
  enabled: boolean,
) {
  const companyMap = useMemo(() => new Map(companies.map(c => [c.id, c])), [companies]);

  const interactionsByContact = useMemo(() => {
    const map = new Map<string, DbInteraction[]>();
    for (const i of interactions) {
      const list = map.get(i.contact_id);
      if (list) list.push(i);
      else map.set(i.contact_id, [i]);
    }
    return map;
  }, [interactions]);

  const mappedContacts = useMemo((): Contact[] => {
    if (!enabled) return [];
    return contacts.map(c => {
      const company = c.company_id ? companyMap.get(c.company_id) : undefined;
      const contactInteractions = interactionsByContact.get(c.id) || [];
      const lastInteraction = contactInteractions.length > 0
        ? new Date(contactInteractions.reduce((latest, i) =>
            i.created_at > latest ? i.created_at : latest, contactInteractions[0].created_at
          ))
        : undefined;

      return {
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email || '',
        phone: c.phone || '',
        whatsapp: c.whatsapp || undefined,
        linkedin: c.linkedin || undefined,
        instagram: c.instagram || undefined,
        twitter: c.twitter || undefined,
        role: (c.role as ContactRole) || 'contact',
        companyId: c.company_id || '',
        companyName: company?.name || '',
        relationshipScore: c.relationship_score || 0,
        sentiment: (c.sentiment as SentimentType) || 'neutral',
        avatar: c.avatar_url || undefined,
        interactionCount: contactInteractions.length,
        lastInteraction,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
        tags: c.tags || [],
        notes: c.notes || '',
        hobbies: c.hobbies || [],
        interests: c.interests || [],
        familyInfo: c.family_info || undefined,
        personalNotes: c.personal_notes || undefined,
        behavior: getBehavior(c.behavior) || {
          discProfile: null,
          discConfidence: 0,
          preferredChannel: 'whatsapp',
          formalityLevel: 3 as const,
          decisionCriteria: [],
          needsApproval: false,
          decisionPower: 5,
          supportLevel: 5,
          influencedByIds: [],
          influencesIds: [],
          currentChallenges: [],
          competitorsUsed: [],
        },
        lifeEvents: (Array.isArray(c.life_events) ? c.life_events as unknown as LifeEvent[] : []),
        relationshipStage: (c.relationship_stage as RelationshipStage) || 'unknown',
        roleTitle: c.role_title || '',
        birthday: c.birthday ? new Date(c.birthday) : undefined,
      } as Contact;
    });
  }, [contacts, companyMap, interactionsByContact, enabled]);

  const mappedInteractions = useMemo((): Interaction[] => {
    if (!enabled) return [];
    return interactions.map(i => ({
      id: i.id,
      contactId: i.contact_id,
      companyId: i.company_id || '',
      type: (i.type as InteractionType) || 'note',
      title: i.title,
      content: i.content || '',
      sentiment: (i.sentiment as SentimentType) || 'neutral',
      followUpRequired: i.follow_up_required || false,
      followUpDate: i.follow_up_date ? new Date(i.follow_up_date) : undefined,
      tags: i.tags || [],
      keyInsights: i.key_insights || [],
      initiatedBy: (i.initiated_by as 'us' | 'them') || 'us',
      duration: i.duration || undefined,
      responseTime: i.response_time || undefined,
      attachments: i.attachments || [],
      createdAt: new Date(i.created_at),
    } as Interaction));
  }, [interactions, enabled]);

  return { mappedContacts, mappedInteractions };
}
