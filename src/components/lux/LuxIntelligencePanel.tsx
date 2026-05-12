import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { LuxButton } from './LuxButton';
import { LuxHistoryTimeline } from './LuxHistoryTimeline';
import { StatusBadge } from './LuxSharedComponents';
import { CompanyIntelligence } from './CompanyIntelligence';
import { ContactIntelligence } from './ContactIntelligence';
import type { LuxIntelligenceRecord } from '@/hooks/useLuxIntelligence';

 import type { LuxStakeholder } from '@/hooks/useLuxIntelligence';
 
 interface LuxIntelligencePanelProps {
   record: LuxIntelligenceRecord | null;
   records?: LuxIntelligenceRecord[];
   entityType: 'contact' | 'company';
   loading?: boolean;
   onTrigger?: () => void;
   triggering?: boolean;
   onAddContact?: (s: LuxStakeholder) => Promise<void>;
 }
 
 export function LuxIntelligencePanel({ 
   record, 
   records = [], 
   entityType, 
   loading, 
   onTrigger, 
   triggering,
   onAddContact
 }: LuxIntelligencePanelProps) {
  const [selectedRecord, setSelectedRecord] = useState<LuxIntelligenceRecord | null>(record);
  const displayRecord = selectedRecord || record;
  const allRecords = records.length > 0 ? records : (record ? [record] : []);

  if (record && !selectedRecord) {
    setSelectedRecord(record);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Sparkles className="w-8 h-8 text-secondary" />
        </motion.div>
        <span className="ml-3 text-sm text-muted-foreground">Carregando dados Lux...</span>
      </div>
    );
  }

  if (!displayRecord) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-12 text-center">
        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity }}>
          <Sparkles className="w-16 h-16 text-secondary/40 mb-4" />
        </motion.div>
        <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma análise Lux ainda</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Ative o Lux Intelligence para coletar dados públicos da internet, analisar redes sociais e gerar insights valiosos sobre {entityType === 'company' ? 'esta empresa' : 'este contato'}.
        </p>
        {onTrigger && <LuxButton onClick={onTrigger} loading={triggering} processing={false} />}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-premium text-primary-foreground shadow-sm"><Sparkles className="w-5 h-5" /></div>
          <div>
            <h3 className="font-semibold text-foreground">Lux Intelligence</h3>
            <p className="text-xs text-muted-foreground">
              {displayRecord.completed_at 
                ? `Última análise: ${formatDistanceToNow(new Date(displayRecord.completed_at), { locale: ptBR, addSuffix: true })}`
                : displayRecord.started_at
                  ? `Iniciado ${formatDistanceToNow(new Date(displayRecord.started_at), { locale: ptBR, addSuffix: true })}`
                  : 'Aguardando processamento'}
            </p>
          </div>
        </div>
        <StatusBadge status={displayRecord.status} />
      </div>

      <AnimatePresence>
        {displayRecord.status === 'processing' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-secondary/30 dark:border-secondary/30 bg-gradient-to-r from-secondary to-secondary dark:from-secondary/30 dark:to-secondary/30">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Sparkles className="w-8 h-8 text-secondary" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Varredura em andamento...</p>
                    <p className="text-xs text-muted-foreground mt-1">Coletando dados de redes sociais, sites públicos e APIs oficiais</p>
                    <div className="mt-3">
                      <motion.div className="h-1.5 bg-gradient-to-r from-secondary via-secondary to-secondary rounded-full"
                        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ backgroundSize: '200% 100%' }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {displayRecord.status === 'error' && displayRecord.error_message && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Erro na varredura</p>
                <p className="text-xs text-destructive/80 mt-1">{displayRecord.error_message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {displayRecord.status === 'completed' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <LuxHistoryTimeline records={allRecords} selectedId={displayRecord.id} onSelect={(r) => setSelectedRecord(r)} />
          </div>
          <div className="lg:col-span-3">
           {entityType === 'company' 
             ? <CompanyIntelligence record={displayRecord} onAddContact={onAddContact} /> 
             : <ContactIntelligence record={displayRecord} />
           }
          </div>
        </div>
      )}
    </div>
  );
}
