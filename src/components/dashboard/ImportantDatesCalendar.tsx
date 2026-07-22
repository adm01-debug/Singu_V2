import { useState, useMemo, forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useImportantDates } from '@/hooks/useImportantDates';
import { Contact, Interaction } from '@/types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EventCard, getEventColor, getEventIcon, getUrgencyColor } from './important-dates/EventCard';

interface ImportantDatesCalendarProps {
  contacts: Contact[];
  interactions: Interaction[];
  compact?: boolean;
}

export const ImportantDatesCalendar = forwardRef<HTMLDivElement, ImportantDatesCalendarProps>(({ contacts, interactions, compact = false }, _ref) => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { allDates, today, thisWeek, hasUrgent } = useImportantDates(contacts, interactions);

  const daysWithEvents = useMemo(() => {
    const eventMap = new Map<string, typeof allDates>();
    allDates.forEach(date => {
      const dateKey = format(date.date, 'yyyy-MM-dd');
      if (!eventMap.has(dateKey)) eventMap.set(dateKey, []);
      eventMap.get(dateKey)!.push(date);
    });
    return eventMap;
  }, [allDates]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 0 }), end: endOfWeek(monthEnd, { weekStartsOn: 0 }) });
  }, [currentMonth]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return daysWithEvents.get(format(selectedDate, 'yyyy-MM-dd')) || [];
  }, [selectedDate, daysWithEvents]);

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Datas Importantes
              {hasUrgent && <Badge variant="destructive" className="ml-2">{today.length + thisWeek.length}</Badge>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allDates.slice(0, 5).map((date) => (
              <div key={date.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 cursor-pointer transition-colors" onClick={() => navigate(`/contato/${date.contactId}`)}>
                <div className={`p-2 rounded-full ${getEventColor(date.type)} bg-opacity-20`}>{getEventIcon(date.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{date.title}</p>
                  <p className={`text-xs ${getUrgencyColor(date.urgency)}`}>
                    {date.daysUntil === 0 ? 'Hoje!' : date.daysUntil < 0 ? `${Math.abs(date.daysUntil)} dias atrás` : `Em ${date.daysUntil} dias`}
                  </p>
                </div>
              </div>
            ))}
            {allDates.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma data importante próxima</p>}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Calendário de Datas Importantes
            {hasUrgent && <Badge variant="destructive" className="ml-2">{today.length + thisWeek.length} urgente(s)</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Anterior" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-sm font-medium min-w-[120px] text-center">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
            <Button variant="ghost" size="icon" aria-label="Próximo" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEvents = daysWithEvents.get(dateKey) || [];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isDayToday = isToday(day);
                
                return (
                  <motion.button key={idx} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSelectedDate(day)}
                    className={`relative p-2 min-h-[60px] rounded-lg text-sm transition-all flex flex-col items-center
                      ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40'}
                      ${isSelected ? 'bg-primary text-primary-foreground ring-2 ring-primary' : 'hover:bg-secondary/50'}
                      ${isDayToday && !isSelected ? 'bg-primary/10 font-bold' : ''}`}
                  >
                    <span className={isDayToday ? 'text-primary' : ''}>{format(day, 'd')}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                        {dayEvents.slice(0, 3).map((event, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${getEventColor(event.type)}`} />)}
                        {dayEvents.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3}</span>}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              {[{ color: 'bg-primary', label: 'Aniversário' }, { color: 'bg-info', label: 'Renovação' }, { color: 'bg-destructive', label: 'Parceria' }, { color: 'bg-warning', label: 'Marco' }].map(l => (
                <div key={l.label} className="flex items-center gap-2 text-xs text-muted-foreground"><div className={`w-2 h-2 rounded-full ${l.color}`} />{l.label}</div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-0">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                {selectedDate ? (<><CalendarIcon className="h-4 w-4" />{format(selectedDate, "d 'de' MMMM", { locale: ptBR })}</>) : (<><Star className="h-4 w-4 text-warning" />Próximos Eventos</>)}
              </h4>
              
              <ScrollArea className="h-[300px] pr-4">
                <AnimatePresence mode="wait">
                  {selectedDate ? (
                    selectedDateEvents.length > 0 ? (
                      <motion.div key="selected-events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2">
                        {selectedDateEvents.map((event) => <EventCard key={event.id} event={event} onNavigate={() => navigate(`/contato/${event.contactId}`)} />)}
                      </motion.div>
                    ) : (
                      <motion.p key="no-events" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground text-center py-8">Nenhum evento nesta data</motion.p>
                    )
                  ) : (
                    <motion.div key="upcoming-events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2">
                      {allDates.slice(0, 8).map((event) => <EventCard key={event.id} event={event} showDate onNavigate={() => navigate(`/contato/${event.contactId}`)} />)}
                      {allDates.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma data importante encontrada</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
ImportantDatesCalendar.displayName = 'ImportantDatesCalendar';
