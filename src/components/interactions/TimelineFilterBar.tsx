import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Search, X, MessageSquare, Phone, Mail, Users, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const CHANNEL_OPTIONS: Array<{ value: string; label: string; icon: typeof MessageSquare }> = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Reunião', icon: Users },
  { value: 'video_call', label: 'Vídeo', icon: Video },
  { value: 'note', label: 'Nota', icon: FileText },
];

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  channels: string[];
  onChannelsChange: (v: string[]) => void;
  dateFrom?: Date;
  dateTo?: Date;
  onDateFromChange: (d?: Date) => void;
  onDateToChange: (d?: Date) => void;
  onClear: () => void;
}

export const TimelineFilterBar = React.memo(function TimelineFilterBar({
  search, onSearchChange, channels, onChannelsChange, dateFrom, dateTo, onDateFromChange, onDateToChange, onClear,
}: Props) {
  const toggleChannel = (value: string) => {
    if (channels.includes(value)) onChannelsChange(channels.filter(c => c !== value));
    else onChannelsChange([...channels, value]);
  };

  const hasFilters = !!search || channels.length > 0 || dateFrom || dateTo;

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/60 pb-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa ou pessoa..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn('justify-start gap-2', !dateFrom && 'text-muted-foreground')}>
              <CalendarIcon className="w-4 h-4" />
              {dateFrom ? format(dateFrom, "dd MMM yy", { locale: ptBR }) : 'De'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={onDateFromChange} initialFocus className={cn('p-3 pointer-events-auto')} />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn('justify-start gap-2', !dateTo && 'text-muted-foreground')}>
              <CalendarIcon className="w-4 h-4" />
              {dateTo ? format(dateTo, "dd MMM yy", { locale: ptBR }) : 'Até'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={onDateToChange} initialFocus className={cn('p-3 pointer-events-auto')} />
          </PopoverContent>
        </Popover>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-1 text-muted-foreground">
            <X className="w-4 h-4" /> Limpar
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CHANNEL_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const active = channels.includes(opt.value);
          return (
            <Badge
              key={opt.value}
              variant={active ? 'default' : 'outline'}
              className={cn('cursor-pointer gap-1.5 px-2.5 py-1 transition-colors', !active && 'hover:bg-muted')}
              onClick={() => toggleChannel(opt.value)}
            >
              <Icon className="w-3 h-3" />
              {opt.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
});
