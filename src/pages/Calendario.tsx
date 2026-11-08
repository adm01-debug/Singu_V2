import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEOHead } from '@/components/seo/SEOHead';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { addMonths, subMonths, isToday, parseISO, isPast } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { MorphingNumber } from '@/components/micro-interactions/MorphingNumber';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCelebration } from '@/components/celebrations/CelebrationProvider';
import type { Tables } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";
import { parseApiError } from '@/lib/errorMessages';
import { CalendarioContent, type FollowUp } from './calendario/CalendarioContent';
import { FollowUpDetailDialog } from './calendario/FollowUpDetailDialog';

type ContactRow = Pick<Tables<'contacts'>, 'id' | 'first_name' | 'last_name'>;
type CompanyRow = Pick<Tables<'companies'>, 'id' | 'nome_crm'>;

const Calendario = () => {
  usePageTitle('Calendário');
  const { user } = useAuth();
  const { celebrate } = useCelebration();
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null);

  const { data: followUps = [] } = useQuery({
    queryKey: ['calendario-followups', user?.id],
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    gcTime: 5 * 60_000,
    queryFn: async (): Promise<FollowUp[]> => {
      const [interactionsRes, contactsRes, companiesRes] = await Promise.all([
        supabase.from('interactions').select('id, user_id, contact_id, company_id, title, type, content, follow_up_date, follow_up_required').eq('user_id', user.id).eq('follow_up_required', true).not('follow_up_date', 'is', null).order('follow_up_date', { ascending: true }).limit(500),
        supabase.from('contacts').select('id, first_name, last_name').eq('user_id', user.id).limit(500),
        supabase.from('companies').select('id, nome_crm').eq('user_id', user.id).limit(500),
      ]);
      if (interactionsRes.error) throw interactionsRes.error;
      if (contactsRes.error) throw contactsRes.error;
      if (companiesRes.error) throw companiesRes.error;

      const contactsMap: Record<string, ContactRow> = {};
      contactsRes.data?.forEach(c => { contactsMap[c.id] = c; });
      const companiesMap: Record<string, CompanyRow> = {};
      companiesRes.data?.forEach(c => { companiesMap[c.id] = c; });

      return (interactionsRes.data || []).map(i => ({
        ...i,
        contact: i.contact_id ? contactsMap[i.contact_id] : null,
        company: i.company_id ? companiesMap[i.company_id] : null,
      }));
    },
  });

  const markAsCompleted = async (id: string) => {
    if (!user) return;
    try {
      const followUp = followUps.find(f => f.id === id);
      const { error } = await supabase.from('interactions').update({ follow_up_required: false }).eq('user_id', user.id).eq('id', id);
      if (error) throw error;
      queryClient.setQueryData<FollowUp[]>(['calendario-followups', user?.id], prev => (prev || []).filter(f => f.id !== id));
      setSelectedFollowUp(null);
      celebrate({ type: 'follow-up-complete', title: 'Follow-up Concluído! 🎉', subtitle: followUp?.contact ? `Ótimo trabalho com ${followUp.contact.first_name}!` : 'Continue mantendo seus relacionamentos em dia!', duration: 3000 });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao concluir follow-up';
      logger.error('Error marking as completed:', { error: msg });
      toast.error(parseApiError(error, 'Erro ao concluir follow-up'));
    }
  };

  const followUpsByDate = useMemo(() => {
    const grouped: Record<string, FollowUp[]> = {};
    followUps.forEach(f => {
      if (f.follow_up_date) {
        if (!grouped[f.follow_up_date]) { grouped[f.follow_up_date] = []; }
        grouped[f.follow_up_date].push(f);
      }
    });
    return grouped;
  }, [followUps]);

  const stats = useMemo(() => {
    const overdue = followUps.filter(f => f.follow_up_date && isPast(parseISO(f.follow_up_date)) && !isToday(parseISO(f.follow_up_date)));
    const todayFollowUps = followUps.filter(f => f.follow_up_date && isToday(parseISO(f.follow_up_date)));
    const upcoming = followUps.filter(f => f.follow_up_date && !isPast(parseISO(f.follow_up_date)) && !isToday(parseISO(f.follow_up_date)));
    return { total: followUps.length, overdue: overdue.length, today: todayFollowUps.length, upcoming: upcoming.length };
  }, [followUps]);

  return (
    <AppLayout>
      <SEOHead title="Calendário" description="Agenda de eventos e follow-ups de relacionamento" />
      <Header title="Calendário" subtitle="Acompanhe e gerencie seus follow-ups pendentes" hideBack />
      <div className="p-6 space-y-6">
        <SmartBreadcrumbs />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: CalendarIcon, value: stats.total, label: 'Total', cls: 'border-border/50', iconCls: 'bg-primary/10 text-primary', valCls: '' },
            { icon: AlertCircle, value: stats.overdue, label: 'Atrasados', cls: 'border-destructive/30 bg-destructive/5', iconCls: 'bg-destructive/10 text-destructive', valCls: 'text-destructive' },
            { icon: Clock, value: stats.today, label: 'Hoje', cls: 'border-warning/30 bg-warning/5', iconCls: 'bg-warning/10 text-warning', valCls: 'text-warning' },
            { icon: CheckCircle2, value: stats.upcoming, label: 'Próximos', cls: 'border-success/30 bg-success/5', iconCls: 'bg-success/10 text-success', valCls: 'text-success' },
          ].map(s => (
            <Card key={s.label} className={s.cls}><CardContent className="p-4 flex items-center gap-4"><div className={`p-3 rounded-xl ${s.iconCls}`}><s.icon className="w-5 h-5" /></div><div><MorphingNumber value={s.value} className={`text-2xl font-bold ${s.valCls}`} /><p className="text-sm text-muted-foreground">{s.label}</p></div></CardContent></Card>
          ))}
        </motion.div>

        <CalendarioContent
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          followUps={followUps}
          followUpsByDate={followUpsByDate}
          onSelectDate={setSelectedDate}
          onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
          onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
          onToday={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}
          onSelectFollowUp={setSelectedFollowUp}
        />
      </div>

      <FollowUpDetailDialog
        followUp={selectedFollowUp}
        onClose={() => setSelectedFollowUp(null)}
        onMarkCompleted={markAsCompleted}
      />
    </AppLayout>
  );
};

export default Calendario;
