 import { useMemo } from 'react';
 import { Contact, Interaction } from '@/types';
 import { differenceInDays, addYears, isBefore, addMonths } from 'date-fns';
 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from './useAuth';

export interface ImportantDate {
  id: string;
  contactId: string;
  contactName: string;
  type: 'birthday' | 'anniversary' | 'contract_renewal' | 'first_purchase' | 'milestone' | 'custom';
  title: string;
  date: Date;
  daysUntil: number;
  isPast: boolean;
  urgency: 'overdue' | 'today' | 'urgent' | 'upcoming' | 'future';
  suggestedAction: string;
  messageTemplate: string;
  reminderDays: number[];
}

export interface DateReminders {
  upcoming: ImportantDate[];
  today: ImportantDate[];
  overdue: ImportantDate[];
  thisWeek: ImportantDate[];
  thisMonth: ImportantDate[];
  allDates: ImportantDate[];
  hasUrgent: boolean;
  summary: string;
}

 export function useImportantDates(contacts: Contact[], interactions: Interaction[]) {
   const { user } = useAuth();

   const { data: lifeEvents = [] } = useQuery({
     queryKey: ['all-life-events', user?.id],
     queryFn: async () => {
       if (!user) return [];
       const { data, error } = await supabase
         .from('life_events')
         .select('*')
         .eq('user_id', user.id);
       if (error) throw error;
       return data;
     },
     enabled: !!user,
   });

   const reminders = useMemo<DateReminders>(() => {
    const now = new Date();
    const allDates: ImportantDate[] = [];

    contacts.forEach(contact => {
      const contactName = `${contact.firstName} ${contact.lastName}`;

      // 1. Birthday
      if (contact.birthday) {
        const birthday = new Date(contact.birthday);
        let nextBirthday = new Date(birthday);
        nextBirthday.setFullYear(now.getFullYear());
        
        if (isBefore(nextBirthday, now)) {
          nextBirthday = addYears(nextBirthday, 1);
        }
        
        const daysUntil = differenceInDays(nextBirthday, now);
        const isPast = daysUntil < 0;
        
        let urgency: ImportantDate['urgency'] = 'future';
        if (daysUntil === 0) urgency = 'today';
        else if (daysUntil < 0 && daysUntil >= -7) urgency = 'overdue';
        else if (daysUntil <= 7) urgency = 'urgent';
        else if (daysUntil <= 30) urgency = 'upcoming';

        allDates.push({
          id: `birthday-${contact.id}`,
          contactId: contact.id,
          contactName,
          type: 'birthday',
          title: `Aniversário de ${contact.firstName}`,
          date: nextBirthday,
          daysUntil,
          isPast,
          urgency,
          suggestedAction: daysUntil === 0 
            ? 'Envie uma mensagem de felicitações agora!' 
            : daysUntil <= 7 
              ? 'Prepare uma mensagem especial' 
              : 'Agende um lembrete',
          messageTemplate: `🎂 Feliz aniversário, ${contact.firstName}! Que este novo ano seja repleto de conquistas e alegrias. Um abraço!`,
          reminderDays: [7, 1, 0]
        });
      }

      // 2. Relationship Anniversary (first interaction date)
      const contactInteractions = interactions
        .filter(i => i.contactId === contact.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      if (contactInteractions.length > 0) {
        const firstInteraction = new Date(contactInteractions[0].createdAt);
        let nextAnniversary = new Date(firstInteraction);
        nextAnniversary.setFullYear(now.getFullYear());
        
        if (isBefore(nextAnniversary, now)) {
          nextAnniversary = addYears(nextAnniversary, 1);
        }
        
        const yearsOfRelationship = now.getFullYear() - firstInteraction.getFullYear();
        const daysUntil = differenceInDays(nextAnniversary, now);
        
        if (yearsOfRelationship >= 1) {
          let urgency: ImportantDate['urgency'] = 'future';
          if (daysUntil === 0) urgency = 'today';
          else if (daysUntil <= 7) urgency = 'urgent';
          else if (daysUntil <= 30) urgency = 'upcoming';

          allDates.push({
            id: `anniversary-${contact.id}`,
            contactId: contact.id,
            contactName,
            type: 'anniversary',
            title: `${yearsOfRelationship} ano(s) de relacionamento com ${contact.firstName}`,
            date: nextAnniversary,
            daysUntil,
            isPast: daysUntil < 0,
            urgency,
            suggestedAction: 'Comemore o marco de relacionamento com uma mensagem especial',
            messageTemplate: `🎉 Olá ${contact.firstName}! Hoje completamos ${yearsOfRelationship} ano(s) de parceria. Obrigado por fazer parte da nossa história!`,
            reminderDays: [7, 0]
          });
        }
      }

      // 3. Contract Renewal (simulated - in production would come from contracts table)
      if (contact.relationshipStage === 'customer' || contact.relationshipStage === 'loyal_customer') {
        // Simulate renewal 1 year after becoming customer
        const estimatedRenewal = addMonths(new Date(contact.createdAt), 12);
        let nextRenewal = new Date(estimatedRenewal);
        
        while (isBefore(nextRenewal, now)) {
          nextRenewal = addYears(nextRenewal, 1);
        }
        
        const daysUntil = differenceInDays(nextRenewal, now);
        
        let urgency: ImportantDate['urgency'] = 'future';
        if (daysUntil <= 0) urgency = 'overdue';
        else if (daysUntil <= 14) urgency = 'urgent';
        else if (daysUntil <= 60) urgency = 'upcoming';

        if (daysUntil <= 90) {
          allDates.push({
            id: `renewal-${contact.id}`,
            contactId: contact.id,
            contactName,
            type: 'contract_renewal',
            title: `Renovação de contrato de ${contact.firstName}`,
            date: nextRenewal,
            daysUntil,
            isPast: daysUntil < 0,
            urgency,
            suggestedAction: daysUntil <= 30 
              ? 'Inicie o processo de renovação' 
              : 'Prepare proposta de renovação',
            messageTemplate: `Olá ${contact.firstName}! Seu contrato está próximo da renovação. Gostaria de agendar uma conversa para discutirmos as melhores condições para continuarmos nossa parceria?`,
            reminderDays: [60, 30, 14, 7]
          });
        }
      }

      // 4. Milestones (interaction count)
      const milestones = [10, 25, 50, 100];
      const nextMilestone = milestones.find(m => m > contact.interactionCount);
      
      if (nextMilestone && contact.interactionCount >= nextMilestone - 3) {
        const remaining = nextMilestone - contact.interactionCount;
        
        allDates.push({
          id: `milestone-${contact.id}-${nextMilestone}`,
          contactId: contact.id,
          contactName,
          type: 'milestone',
          title: `${contact.firstName} chegando a ${nextMilestone} interações`,
          date: now, // Milestone is count-based, not date-based
          daysUntil: 0,
          isPast: false,
          urgency: remaining <= 1 ? 'urgent' : 'upcoming',
          suggestedAction: `Faltam apenas ${remaining} interações para o marco de ${nextMilestone}!`,
          messageTemplate: `🏆 Parabéns, ${contact.firstName}! Essa é nossa ${nextMilestone}ª interação. Obrigado pela confiança contínua!`,
          reminderDays: [0]
        });
      }

       // 5. Unified Life events from separate table
       const contactEvents = lifeEvents.filter(le => le.contact_id === contact.id);
       contactEvents.forEach(event => {
         const eventDate = new Date(event.event_date);
         let nextEventDate = new Date(eventDate);
         
         if (event.recurring) {
           nextEventDate.setFullYear(now.getFullYear());
           if (isBefore(nextEventDate, now)) {
             nextEventDate = addYears(nextEventDate, 1);
           }
         }
         
         const daysUntil = differenceInDays(nextEventDate, now);
         
         if (Math.abs(daysUntil) <= 90) { // Show up to 90 days out in calendar
           let urgency: ImportantDate['urgency'] = 'future';
           if (daysUntil === 0) urgency = 'today';
           else if (daysUntil < 0) urgency = 'overdue';
           else if (daysUntil <= 7) urgency = 'urgent';
           else urgency = 'upcoming';

           allDates.push({
             id: `event-${event.id}`,
             contactId: contact.id,
             contactName,
             type: 'custom',
             title: event.title,
             date: nextEventDate,
             daysUntil,
             isPast: daysUntil < 0,
             urgency,
             suggestedAction: event.description || 'Envie uma mensagem de reconhecimento',
             messageTemplate: `Olá ${contact.firstName}! Lembrei que em breve é um dia especial: ${event.title}. Espero que esteja tudo bem!`,
             reminderDays: [event.reminder_days_before || 7, 0]
           });
         }
       });
    });

    // Sort all dates by urgency and then by days until
    const urgencyOrder = { overdue: 0, today: 1, urgent: 2, upcoming: 3, future: 4 };
    allDates.sort((a, b) => {
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return a.daysUntil - b.daysUntil;
    });

    // Categorize
    const today = allDates.filter(d => d.urgency === 'today');
    const overdue = allDates.filter(d => d.urgency === 'overdue');
    const thisWeek = allDates.filter(d => d.daysUntil > 0 && d.daysUntil <= 7);
    const thisMonth = allDates.filter(d => d.daysUntil > 7 && d.daysUntil <= 30);
    const upcoming = allDates.filter(d => d.daysUntil > 0 && d.daysUntil <= 30);

    const hasUrgent = today.length > 0 || overdue.length > 0 || thisWeek.length > 0;

    // Generate summary
    let summary = '';
    if (today.length > 0) summary = `${today.length} data(s) hoje!`;
    else if (overdue.length > 0) summary = `${overdue.length} data(s) atrasada(s)`;
    else if (thisWeek.length > 0) summary = `${thisWeek.length} data(s) esta semana`;
    else if (thisMonth.length > 0) summary = `${thisMonth.length} data(s) este mês`;
    else summary = 'Nenhuma data importante próxima';

    return {
      upcoming,
      today,
      overdue,
      thisWeek,
      thisMonth,
      allDates,
      hasUrgent,
      summary
    };
  }, [contacts, interactions]);

  return reminders;
}
