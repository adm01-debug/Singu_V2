import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, User, Building2, Phone, Mail, MessageSquare, Video, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, isSameDay, isToday, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Tables } from '@/integrations/supabase/types';

type Interaction = Tables<'interactions'>;
type Contact = Tables<'contacts'>;
type Company = Tables<'companies'>;

export interface FollowUp extends Interaction { contact?: Contact | null; company?: Company | null; }

const interactionTypeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="w-4 h-4" />, email: <Mail className="w-4 h-4" />, meeting: <Users className="w-4 h-4" />,
  video_call: <Video className="w-4 h-4" />, whatsapp: <MessageSquare className="w-4 h-4" />, other: <MessageSquare className="w-4 h-4" />,
};
export const interactionTypeLabels: Record<string, string> = { call: 'Ligação', email: 'Email', meeting: 'Reunião', video_call: 'Videochamada', whatsapp: 'WhatsApp', other: 'Outro' };
const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface Props {
  currentMonth: Date;
  selectedDate: Date | null;
  followUps: FollowUp[];
  followUpsByDate: Record<string, FollowUp[]>;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectFollowUp: (followUp: FollowUp) => void;
}

export function CalendarioContent({ currentMonth, selectedDate, followUps, followUpsByDate, onSelectDate, onPrevMonth, onNextMonth, onToday, onSelectFollowUp }: Props) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayOfMonth = monthStart.getDay();
  const paddingDays = Array(firstDayOfMonth).fill(null);

  const selectedDateFollowUps = useMemo(() => {
    if (!selectedDate) return [];
    return followUpsByDate[format(selectedDate, 'yyyy-MM-dd')] || [];
  }, [selectedDate, followUpsByDate]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl capitalize">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={onPrevMonth}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={onToday}>Hoje</Button>
                <Button variant="outline" size="icon" onClick={onNextMonth}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">{weekDays.map(day => <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">{day}</div>)}</div>
            <div className="grid grid-cols-7 gap-1">
              {paddingDays.map((_, index) => <div key={`padding-${index}`} className="h-24" />)}
              {daysInMonth.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayFollowUps = followUpsByDate[dateKey] || [];
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasOverdue = dayFollowUps.some(f => isPast(parseISO(f.follow_up_date!)) && !isToday(parseISO(f.follow_up_date!)));
                return (
                  <button key={dateKey} onClick={() => onSelectDate(day)} className={cn('h-24 p-1 rounded-lg border transition-all duration-200 flex flex-col', isSelected ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border/50 hover:border-primary/50 hover:bg-muted/50', isToday(day) && !isSelected && 'border-primary/50 bg-primary/5', !isSameMonth(day, currentMonth) && 'opacity-50')}>
                    <span className={cn('text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full', isToday(day) && 'bg-primary text-primary-foreground', isSelected && !isToday(day) && 'bg-primary/20')}>{format(day, 'd')}</span>
                    {dayFollowUps.length > 0 && (
                      <div className="flex-1 mt-1 space-y-1 overflow-hidden">
                        {dayFollowUps.slice(0, 2).map(followUp => <div key={followUp.id} className={cn('text-xs px-1.5 py-0.5 rounded truncate', hasOverdue ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary')}>{followUp.title}</div>)}
                        {dayFollowUps.length > 2 && <div className="text-xs text-muted-foreground px-1">+{dayFollowUps.length - 2} mais</div>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-border/50 shadow-sm h-full">
          <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />{selectedDate ? format(selectedDate, "d 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}</CardTitle></CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <AnimatePresence mode="popLayout">
                {selectedDateFollowUps.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground/70 mb-4" /><p className="text-muted-foreground">Nenhum follow-up para esta data</p>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateFollowUps.map((followUp, index) => {
                      const isOverdue = followUp.follow_up_date && isPast(parseISO(followUp.follow_up_date)) && !isToday(parseISO(followUp.follow_up_date));
                      return (
                        <motion.div key={followUp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: index * 0.05 }}
                          className={cn('p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md', isOverdue ? 'border-destructive/50 bg-destructive/5 hover:border-destructive' : 'border-border/50 hover:border-primary/50')}
                          onClick={() => onSelectFollowUp(followUp)}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <div className={cn('p-2 rounded-lg', isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>{interactionTypeIcons[followUp.type] || <MessageSquare className="w-4 h-4" />}</div>
                              <div><p className="font-medium text-sm">{followUp.title}</p><p className="text-xs text-muted-foreground">{interactionTypeLabels[followUp.type] || followUp.type}</p></div>
                            </div>
                            {isOverdue && <Badge variant="destructive" className="text-xs">Atrasado</Badge>}
                          </div>
                          {followUp.contact && <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><User className="w-3 h-3" /><span>{followUp.contact.first_name} {followUp.contact.last_name}</span></div>}
                          {followUp.company && <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="w-3 h-3" /><span>{followUp.company.name}</span></div>}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
