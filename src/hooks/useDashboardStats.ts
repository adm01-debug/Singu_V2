import { useMemo } from 'react';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

type Contact = Tables<'contacts'>;
type Company = Tables<'companies'>;
type Interaction = Tables<'interactions'>;

interface TopContact {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  companyName: string;
  role: string;
  relationshipScore: number;
  sentiment: string;
  interactionCount: number;
  lastInteraction: Date | null;
}

interface RecentActivity {
  id: string;
  entityName: string;
  description: string;
  createdAt: Date;
  type: string;
  contactId: string;
}

export interface DashboardStats {
  totalCompanies: number;
  totalContacts: number;
  weeklyInteractions: number;
  averageScore: number;
  companyChange: string;
  contactChange: string;
  interactionChange: string;
  scoreChange: string;
  topContacts: TopContact[];
  recentActivities: RecentActivity[];
  interactionSparkline: number[];
  loading: boolean;
}

interface UseDashboardStatsParams {
  contacts: Contact[];
  companies: Company[];
  interactions: Interaction[];
  loading: boolean;
}

export function useDashboardStats({ contacts = [], companies = [], interactions = [], loading = true }: UseDashboardStatsParams = {} as UseDashboardStatsParams): DashboardStats {
  const stats = useMemo(() => {
    if (loading) {
      return {
        totalCompanies: 0,
        totalContacts: 0,
        weeklyInteractions: 0,
        averageScore: 0,
        companyChange: '',
        contactChange: '',
        interactionChange: '',
        scoreChange: '',
        topContacts: [],
        recentActivities: [],
        interactionSparkline: [],
        loading: true,
      };
    }

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastWeekEnd = subWeeks(thisWeekEnd, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const companiesThisMonth = companies.filter(c => 
      new Date(c.created_at) >= thisMonthStart
    ).length;
    
    const contactsThisMonth = contacts.filter(c => 
      new Date(c.created_at) >= thisMonthStart
    ).length;

    const thisWeekInteractions = interactions.filter(i => {
      const date = new Date(i.created_at);
      return date >= thisWeekStart && date <= thisWeekEnd;
    }).length;

    const lastWeekInteractions = interactions.filter(i => {
      const date = new Date(i.created_at);
      return date >= lastWeekStart && date <= lastWeekEnd;
    }).length;

    const interactionDiff = thisWeekInteractions - lastWeekInteractions;

    // Real sparkline: count interactions per week for last 7 weeks
    const interactionSparkline: number[] = [];
    for (let w = 6; w >= 0; w--) {
      const wStart = subWeeks(thisWeekStart, w);
      const wEnd = subWeeks(thisWeekEnd, w);
      const count = interactions.filter(i => {
        const d = new Date(i.created_at);
        return d >= wStart && d <= wEnd;
      }).length;
      interactionSparkline.push(count);
    }
    const scoresWithValue = contacts.filter(c => c.relationship_score !== null && c.relationship_score !== undefined);
    const avgScore = scoresWithValue.length > 0
      ? Math.round(scoresWithValue.reduce((sum, c) => sum + (c.relationship_score || 0), 0) / scoresWithValue.length)
      : 0;

    const companyMap = new Map(companies.map(c => [c.id, c]));

    // Pre-build interaction counts by contact for O(1) lookup
    const interactionCountByContact = new Map<string, number>();
    const latestInteractionByContact = new Map<string, string>();
    for (const i of interactions) {
      interactionCountByContact.set(i.contact_id, (interactionCountByContact.get(i.contact_id) || 0) + 1);
      const current = latestInteractionByContact.get(i.contact_id);
      if (!current || i.created_at > current) latestInteractionByContact.set(i.contact_id, i.created_at);
    }

    const topContacts = [...contacts]
      .filter(c => {
        if (c.relationship_score === null) return false;
        const firstName = (c.first_name || '').trim();
        const lastName = (c.last_name || '').trim();
        if (!firstName || !lastName) return false;
        // Filter out placeholder/technical names
        const fullNameLower = `${firstName} ${lastName}`.toLowerCase();
        if (/sem\s*nome|null|undefined/i.test(fullNameLower)) return false;
        if (/^(test|whatsapp|contato|unknown|compras|posto|cliente|fornecedor)/i.test(firstName)) return false;
        if (/^(null|undefined|test|\d{10,})$/i.test(lastName)) return false;
        if (firstName.includes('@') || lastName.includes('@')) return false;
        if (/^\(\d+\)\s*\d+/.test(firstName)) return false;
        if (firstName.toLowerCase() === 'whatsapp' && /^\d+$/.test(lastName)) return false;
        // Filter company-like names (contain " - " pattern typical of branch names)
        if (/\s-\s/.test(fullNameLower) && fullNameLower.length > 30) return false;
        // Must have at least 2 vowels to be a real name
        const vowels = (fullNameLower.match(/[aeiouáéíóúâêîôûãõ]/gi) || []).length;
        if (vowels < 2) return false;
        return true;
      })
      .sort((a, b) => ((b as any).relationship_score || 0) - ((a as any).relationship_score || 0))
      .slice(0, 4)
      .map(contact => {
        const company = contact.company_id ? companyMap.get(contact.company_id) : undefined;
        const latestDate = latestInteractionByContact.get(contact.id);
        
        return {
          id: contact.id,
          firstName: contact.first_name,
          lastName: contact.last_name,
          avatar: (contact as any).avatar_url || '',
          companyName: company?.name || (contact as any).role_title || '',
          role: (contact as any).role || 'contact',
          relationshipScore: (contact as any).relationship_score || 0,
          sentiment: (contact as any).sentiment || 'neutral',
          interactionCount: interactionCountByContact.get(contact.id) || 0,
          lastInteraction: latestDate ? new Date(latestDate) : null,
        };
      });

    const contactMap = new Map(contacts.map(c => [c.id, c]));

    // Helper: check if a name is a real human name (not technical/generic)
    const isRealName = (name: string): boolean => {
      if (!name || name.length < 3) return false;
      if (/^\(\d+\)/.test(name) || /^\d{6,}/.test(name)) return false;
      if (/^(whatsapp|mensagem|teste|contato|posto|cargo|unknown|admin|user)$/i.test(name.split(' ')[0])) return false;
      if (/[—–-]\s*editar$/i.test(name)) return false;
      if (name.includes('@')) return false;
      const vowels = (name.match(/[aeiouáéíóúâêîôûãõ]/gi) || []).length;
      return vowels >= 2;
    };

    const recentActivities = interactions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 15) // fetch more, then filter
      .map(interaction => {
        const contact = contactMap.get(interaction.contact_id);
        const rawName = contact
          ? `${contact.first_name} ${contact.last_name}`.trim()
          : null;
        const contactName = rawName && isRealName(rawName) ? rawName : null;
        // Extract name from title patterns like "Mensagem de João (WhatsApp)" or "Mensagem Enviada"
        const titleMatch = interaction.title?.match(/de\s+(.+?)(?:\s*\(|$)/)?.[1]?.trim();
        const cleanTitleMatch = titleMatch && isRealName(titleMatch) ? titleMatch : null;
        // For "Mensagem Enviada" type titles, try to use a cleaner description
        const isGenericTitle = /^Mensagem\s+Enviada/i.test(interaction.title || '');
        const displayName = contactName || cleanTitleMatch || (isGenericTitle ? 'Mensagem' : 'Contato');
        // Clean description: extract channel/type instead of repeating name
        const title = interaction.title || '';
        const channelMatch = title.match(/\(([^)]+)\)/)?.[1]; // e.g. "WhatsApp", "Email"
        const cleanDesc = channelMatch 
          ? `${interaction.type === 'message' ? 'Mensagem' : interaction.type === 'call' ? 'Ligação' : interaction.type === 'meeting' ? 'Reunião' : 'Interação'} via ${channelMatch}`
          : title.replace(new RegExp(`de\\s+${displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i'), '').trim() || title;
        return {
          id: interaction.id,
          contactId: interaction.contact_id,
          entityName: displayName,
          description: cleanDesc,
          createdAt: new Date(interaction.created_at),
          type: interaction.type,
        };
      })
      .filter(a => a.entityName !== 'Contato' && a.entityName !== 'Mensagem') // Remove unresolved generic entries
      .slice(0, 5);

    return {
      totalCompanies: companies.length,
      totalContacts: contacts.length,
      weeklyInteractions: thisWeekInteractions,
      averageScore: avgScore,
      companyChange: companiesThisMonth > 0 ? `+${companiesThisMonth} este mês` : '~ Estável',
      contactChange: contactsThisMonth > 0 ? `+${contactsThisMonth} este mês` : '~ Estável',
      interactionChange: interactionDiff >= 0 
        ? `+${interactionDiff} vs semana anterior` 
        : `${interactionDiff} vs semana anterior`,
      scoreChange: '+0% vs mês anterior',
      topContacts,
      recentActivities,
      interactionSparkline,
      loading: false,
    };
  }, [contacts, companies, interactions, loading]);

  return stats;
}
