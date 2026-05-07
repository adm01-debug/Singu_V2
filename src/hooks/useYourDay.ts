import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, parseISO, isToday, isPast } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";

type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;
type Insight = Tables<'insights'>;
type Company = Tables<'companies'>;

interface FollowUp {
  interaction: Interaction;
  contact: Contact | null;
  company: Company | null;
}

interface BirthdayContact {
  contact: Contact;
  company: Company | null;
  daysUntil: number;
}

interface NeedsAttention {
  contact: Contact;
  company: Company | null;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  daysSinceContact: number;
}

export interface YourDayData {
  todayFollowUps: FollowUp[];
  overdueFollowUps: FollowUp[];
  upcomingBirthdays: BirthdayContact[];
  needsAttention: NeedsAttention[];
  newInsights: Insight[];
  loading: boolean;
}

const CONTACT_LIGHT_SELECT = 'id, first_name, last_name, email, phone, avatar_url, birthday, company_id, role, relationship_score, sentiment, updated_at, created_at';
const COMPANY_LIGHT_SELECT = 'id, name';
const INTERACTION_FOLLOWUP_SELECT = 'id, type, title, content, sentiment, follow_up_required, follow_up_date, created_at, contact_id, company_id, user_id';

const isValidContactName = (c: Contact) => {
  const firstName = (c.first_name || '').trim();
  const lastName = (c.last_name || '').trim();
  const name = `${firstName} ${lastName}`.trim();
  if (!name || !firstName || !lastName) return false;
  if (/[—–-]\s*editar$/i.test(name)) return false;
  if (/^(contato|posto|cargo|teste?)\b/i.test(firstName) && firstName.length < 20) return false;
  if (/^\(\d+\)\s*\d+/.test(firstName)) return false;
  if (firstName.includes('@')) return false;
  if (/^test/i.test(name)) return false;
  if (firstName.toLowerCase() === 'whatsapp' && /^\d+$/.test(lastName)) return false;
  if (/^\d{10,}$/.test(lastName)) return false;
  if (firstName.split(/\s+/).length >= 2 && !lastName) return false;
  return true;
};

export function useYourDay(): YourDayData & { refresh: () => Promise<void> } {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['your-day', user?.id],
    queryFn: async (): Promise<Omit<YourDayData, 'loading'>> => {
      try {
        const today = new Date();

        const [followUpsResult, birthdayContactsResult, attentionContactsResult, insightsResult] = await Promise.all([
          supabase.from('interactions').select(INTERACTION_FOLLOWUP_SELECT).eq('follow_up_required', true).not('follow_up_date', 'is', null).order('follow_up_date', { ascending: true }).limit(50),
          supabase.from('contacts').select(CONTACT_LIGHT_SELECT).not('birthday', 'is', null).limit(200),
          supabase.from('contacts').select(CONTACT_LIGHT_SELECT).or('relationship_score.lt.30,sentiment.eq.negative,role.eq.decision_maker,role.eq.owner').order('updated_at', { ascending: true }).limit(50),
          supabase.from('insights').select('*').eq('dismissed', false).order('created_at', { ascending: false }).limit(5),
        ]);

        const followUpInteractions = (followUpsResult.data || []) as Interaction[];
        const birthdayContacts = (birthdayContactsResult.data || []) as Contact[];
        const attentionContacts = (attentionContactsResult.data || []) as Contact[];
        const insights = (insightsResult.data || []) as Insight[];

        const companyIds = new Set<string>();
        const contactIds = new Set<string>();
        followUpInteractions.forEach(i => { if (i.company_id) companyIds.add(i.company_id); contactIds.add(i.contact_id); });
        birthdayContacts.forEach(c => { if (c.company_id) companyIds.add(c.company_id); });
        attentionContacts.forEach(c => { if (c.company_id) companyIds.add(c.company_id); });

        const [contactsForFollowUps, companiesBatch] = await Promise.all([
          contactIds.size > 0 ? supabase.from('contacts').select(CONTACT_LIGHT_SELECT).in('id', Array.from(contactIds)).limit(100) : Promise.resolve({ data: [] }),
          companyIds.size > 0 ? supabase.from('companies').select(COMPANY_LIGHT_SELECT).in('id', Array.from(companyIds)).limit(100) : Promise.resolve({ data: [] }),
        ]);

        const contactMap = new Map((contactsForFollowUps.data || []).map(c => [c.id, c as Contact]));
        const companyMap = new Map((companiesBatch.data || []).map(c => [c.id, c as Company]));

        const todayFollowUps: FollowUp[] = [];
        const overdueFollowUps: FollowUp[] = [];
        followUpInteractions.forEach(interaction => {
          if (!interaction.follow_up_date) return;
          const followUpDate = parseISO(interaction.follow_up_date);
          const contact = contactMap.get(interaction.contact_id) || null;
          const company = interaction.company_id ? companyMap.get(interaction.company_id) || null : null;
          const followUp: FollowUp = { interaction, contact, company };
          if (isToday(followUpDate)) todayFollowUps.push(followUp);
          else if (isPast(followUpDate)) overdueFollowUps.push(followUp);
        });

        const upcomingBirthdays: BirthdayContact[] = [];
        birthdayContacts.forEach(contact => {
          if (!contact.birthday) return;
          const birthday = parseISO(contact.birthday);
          const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
          if (thisYearBirthday < today) thisYearBirthday.setFullYear(today.getFullYear() + 1);
          const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntil <= 7) {
            const company = contact.company_id ? companyMap.get(contact.company_id) || null : null;
            upcomingBirthdays.push({ contact, company, daysUntil });
          }
        });
        upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);

        const needsAttention: NeedsAttention[] = [];
        const seenContactIds = new Set<string>();
        const uniqueAttentionContacts = attentionContacts.filter(isValidContactName).filter(c => {
          if (seenContactIds.has(c.id)) return false;
          seenContactIds.add(c.id);
          return true;
        });

        uniqueAttentionContacts.forEach(contact => {
          const company = contact.company_id ? companyMap.get(contact.company_id) || null : null;
          const lastUpdate = contact.updated_at ? new Date(contact.updated_at) : new Date(contact.created_at);
          const daysSinceContact = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

          if ((contact.relationship_score || 0) < 30 && daysSinceContact > 14) {
            const companyHint = company?.name ? ` · ${company.name}` : '';
            needsAttention.push({ contact, company, reason: `Score ${contact.relationship_score || 0}% — sem contato há ${daysSinceContact}d${companyHint}`, priority: 'high', daysSinceContact });
          } else if ((contact.role === 'decision_maker' || contact.role === 'owner') && daysSinceContact > 21) {
            const roleLabel = contact.role === 'owner' ? 'Sócio' : 'Decisor';
            needsAttention.push({ contact, company, reason: `${roleLabel} — último contato há ${daysSinceContact} dias`, priority: 'medium', daysSinceContact });
          } else if (contact.sentiment === 'negative' && daysSinceContact > 7) {
            needsAttention.push({ contact, company, reason: `Sentimento negativo detectado há ${daysSinceContact}d — ação recomendada`, priority: 'low', daysSinceContact });
          }
        });

        const deduped = new Map<string, NeedsAttention>();
        needsAttention.forEach(item => {
          const existing = deduped.get(item.contact.id);
          const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
          if (!existing || priorityOrder[item.priority] < priorityOrder[existing.priority]) deduped.set(item.contact.id, item);
        });
        const byName = new Map<string, NeedsAttention>();
        deduped.forEach(item => {
          const displayName = `${item.contact.first_name} ${item.contact.last_name}`.trim().toLowerCase();
          const existing = byName.get(displayName);
          const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
          if (!existing || priorityOrder[item.priority] < priorityOrder[existing.priority]) byName.set(displayName, item);
        });
        const dedupedAttention = Array.from(byName.values());
        dedupedAttention.sort((a, b) => {
          const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) return priorityOrder[a.priority] - priorityOrder[b.priority];
          return b.daysSinceContact - a.daysSinceContact;
        });

        return {
          todayFollowUps,
          overdueFollowUps,
          upcomingBirthdays: upcomingBirthdays.slice(0, 5),
          needsAttention: dedupedAttention.slice(0, 5),
          newInsights: insights,
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error fetching your day data:', { error: msg });
        return { todayFollowUps: [], overdueFollowUps: [], upcomingBirthdays: [], needsAttention: [], newInsights: [] };
      }
    },
    enabled: !!user,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['your-day', user?.id] });
  }, [queryClient, user?.id]);

  return {
    todayFollowUps: data?.todayFollowUps || [],
    overdueFollowUps: data?.overdueFollowUps || [],
    upcomingBirthdays: data?.upcomingBirthdays || [],
    needsAttention: data?.needsAttention || [],
    newInsights: data?.newInsights || [],
    loading: !data,
    refresh,
  };
}
