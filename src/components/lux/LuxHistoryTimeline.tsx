import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  Clock, CheckCircle2, AlertCircle, Loader2,
  ChevronRight, History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LuxIntelligenceRecord } from '@/hooks/useLuxIntelligence';

interface LuxHistoryTimelineProps {
  records: LuxIntelligenceRecord[];
  selectedId?: string;
  onSelect: (record: LuxIntelligenceRecord) => void;
  loading?: boolean;
}

const statusConfig: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: typeof CheckCircle2 
}> = {
  pending: { 
    label: 'Pendente', 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted',
    icon: Clock 
  },
  processing: { 
    label: 'Analisando', 
    color: 'text-warning', 
    bgColor: 'bg-warning dark:bg-warning/30',
    icon: Loader2 
  },
  completed: { 
    label: 'Concluído', 
    color: 'text-success', 
    bgColor: 'bg-success dark:bg-success/30',
    icon: CheckCircle2 
  },
  error: { 
    label: 'Erro', 
    color: 'text-destructive', 
    bgColor: 'bg-destructive/10',
    icon: AlertCircle 
  },
};

export function LuxHistoryTimeline({ records, selectedId, onSelect, loading }: LuxHistoryTimelineProps) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-secondary" />
        </CardContent>
      </Card>
    );
  }

  if (records.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-40 text-center">
          <History className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma varredura realizada ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-secondary" />
          Histórico de Varreduras
          <Badge variant="secondary" className="ml-auto">
            {records.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="px-4 pb-4 space-y-2">
            {records.map((record, index) => {
              const config = statusConfig[record.status] || statusConfig.pending;
              const Icon = config.icon;
              const isSelected = record.id === selectedId;
              const fieldsUpdated = Array.isArray(record.fields_updated) ? record.fields_updated.length : 0;

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-auto py-3 px-3 ${
                      isSelected 
                        ? 'bg-secondary dark:bg-secondary/30 border border-secondary/30 dark:border-secondary/30' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => onSelect(record)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {/* Status Icon */}
                      <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                        <Icon className={`w-3.5 h-3.5 ${config.color} ${
                          record.status === 'processing' ? 'animate-spin' : ''
                        }`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium truncate">
                            {format(new Date(record.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {index === 0 && record.status === 'completed' && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-secondary dark:bg-secondary/20 border-secondary/30 dark:border-secondary/30">
                              Mais recente
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${config.color}`}>
                            {config.label}
                          </Badge>
                          {fieldsUpdated > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {fieldsUpdated} campos atualizados
                            </span>
                          )}
                        </div>
                        {record.error_message && (
                          <p className="text-[10px] text-destructive mt-1 truncate">
                            {record.error_message}
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${
                        isSelected ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
