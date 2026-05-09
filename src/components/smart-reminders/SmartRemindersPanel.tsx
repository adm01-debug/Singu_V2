import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Bell, Sparkles, RefreshCw, Filter, EyeOff, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSmartReminders, SmartReminder } from '@/hooks/useSmartReminders';
import { useCelebration } from '@/components/celebrations/CelebrationProvider';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ReminderCard } from './smart-reminders-parts/ReminderCard';
import { motion } from 'framer-motion';

interface SmartRemindersPanelProps { className?: string; compact?: boolean; contacts?: any[]; interactions?: any[]; }

const typeLabels = { follow_up: 'Follow-up', birthday: 'Aniversário', decay: 'Esfriando', milestone: 'Marco' };

export const SmartRemindersPanel = ({ className, compact = false, contacts, interactions }: SmartRemindersPanelProps) => {
  const navigate = useNavigate();
  const { celebrate } = useCelebration();
  const { reminders, summary, aiInsights, isLoading, fetchReminders, dismissReminder, snoozeReminder, completeReminder } = useSmartReminders();
  const [activeTab, setActiveTab] = useState('all');
  const [showInsights, setShowInsights] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredReminders = activeTab === 'all' ? reminders : reminders.filter(r => r.type === activeTab);

  const handleContactClick = (contactId: string) => navigate(`/contatos/${contactId}`);

  const handleComplete = (reminder: SmartReminder) => {
    completeReminder(reminder);
    const celebrationConfig = {
      follow_up: { type: 'follow-up-complete' as const, title: 'Follow-up Concluído! 🎉', subtitle: `Ótimo trabalho com ${reminder.contactName}!` },
      birthday: { type: 'birthday-wished' as const, title: 'Parabéns Enviados! 🎂', subtitle: `${reminder.contactName} vai adorar sua mensagem!` },
      decay: { type: 'relationship-milestone' as const, title: 'Relacionamento Reativado! 💝', subtitle: `Você reconectou com ${reminder.contactName}!` },
      milestone: { type: 'goal-achieved' as const, title: 'Marco Alcançado! 🎯', subtitle: `Celebre este momento com ${reminder.contactName}!` },
    };
    celebrate({ ...celebrationConfig[reminder.type], duration: 3000 });
  };

  if (compact) {
    const highPriorityReminders = reminders.filter(r => r.priority === 'high').slice(0, 3);
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" /> Lembretes
              {summary && summary.byPriority.high > 0 && <Badge variant="destructive" className="text-xs">{summary.byPriority.high}</Badge>}
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => navigate('/notificacoes')} className="text-xs">Ver todos<ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}</div>
          ) : highPriorityReminders.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {highPriorityReminders.map((reminder, index) => (
                <ReminderCard key={reminder.id} reminder={reminder} index={index} isExpanded={expandedId === reminder.id} onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)} onComplete={handleComplete} onDismiss={dismissReminder} onSnooze={snoozeReminder} onContactClick={handleContactClick} />
              ))}
            </AnimatePresence>
          ) : (
            <div className="text-center py-6 text-muted-foreground"><Bell className="w-8 h-8 mx-auto mb-2 opacity-50" /><p className="text-sm">Nenhum lembrete urgente</p></div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg"><Bell className="w-5 h-5 text-primary" /></div>
            <div>
              <CardTitle className="flex items-center gap-2">Smart Reminders{summary && summary.total > 0 && <Badge variant="secondary">{summary.total}</Badge>}</CardTitle>
              <p className="text-sm text-muted-foreground">Lembretes inteligentes para seus relacionamentos</p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><Button size="icon" variant="ghost" onClick={() => fetchReminders(true)} disabled={isLoading}><RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} /></Button></TooltipTrigger>
              <TooltipContent>Atualizar com insights IA</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {summary && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            <div className="p-2 rounded-lg bg-info/10 text-center"><p className="text-lg font-bold text-info">{summary.byType.follow_up}</p><p className="text-[10px] text-muted-foreground">Follow-ups</p></div>
            <div className="p-2 rounded-lg bg-warning/10 text-center"><p className="text-lg font-bold text-warning">{summary.byType.birthday}</p><p className="text-[10px] text-muted-foreground">Aniversários</p></div>
            <div className="p-2 rounded-lg bg-destructive/10 text-center"><p className="text-lg font-bold text-destructive">{summary.byType.decay}</p><p className="text-[10px] text-muted-foreground">Esfriando</p></div>
            <div className="p-2 rounded-lg bg-success/10 text-center"><p className="text-lg font-bold text-success">{summary.byType.milestone}</p><p className="text-[10px] text-muted-foreground">Marcos</p></div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence>
          {aiInsights && showInsights && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg shrink-0"><Sparkles className="w-4 h-4 text-primary" /></div>
                      <div><h4 className="font-medium text-sm text-foreground mb-1">Insights da IA</h4><p className="text-xs text-muted-foreground whitespace-pre-wrap">{aiInsights}</p></div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => setShowInsights(false)}><EyeOff className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Todos</TabsTrigger>
            {Object.entries(typeLabels).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="flex-1">{label}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={activeTab} className="mt-3">
            <ScrollArea className="h-[400px] pr-2">
              {isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />)}</div>
              ) : filteredReminders.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-2">
                    {filteredReminders.map((reminder, index) => (
                      <ReminderCard key={reminder.id} reminder={reminder} index={index} isExpanded={expandedId === reminder.id} onToggleExpand={(id) => setExpandedId(expandedId === id ? null : id)} onComplete={handleComplete} onDismiss={dismissReminder} onSnooze={snoozeReminder} onContactClick={handleContactClick} />
                    ))}
                  </div>
                </AnimatePresence>
              ) : (
                <div className="text-center py-12 text-muted-foreground"><Bell className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-medium">Nenhum lembrete</p><p className="text-sm mt-1">Todos os lembretes foram resolvidos!</p></div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
