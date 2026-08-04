import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Network, Users, Zap, Lightbulb, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCoalitionDetection } from '@/hooks/useCoalitionDetection';
import type { StakeholderData } from '@/hooks/useStakeholderAnalysis';
import { PowerBalanceIndicator, CoalitionCard, InfluenceClusterCard, CoalitionDetail } from './coalition-detection/CoalitionSubComponents';
import { motion } from 'framer-motion';

interface CoalitionDetectionPanelProps { stakeholders: StakeholderData[]; className?: string; }

export function CoalitionDetectionPanel({ stakeholders, className }: CoalitionDetectionPanelProps) {
  const [selectedCoalition, setSelectedCoalition] = useState<Parameters<typeof CoalitionDetail>[0]['coalition'] | null>(null);
  const analysis = useCoalitionDetection(stakeholders);

  if (stakeholders.length === 0) {
    return (<Card className={className}><CardContent className="flex flex-col items-center justify-center py-12 text-center"><Network className="w-12 h-12 text-muted-foreground/30 mb-4" /><h3 className="font-semibold text-lg mb-2">Sem stakeholders</h3><p className="text-muted-foreground text-sm">Adicione contatos para detectar coalizões e grupos de influência.</p></CardContent></Card>);
  }

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>{selectedCoalition && <CoalitionDetail coalition={selectedCoalition} onClose={() => setSelectedCoalition(null)} />}</AnimatePresence>
      <div className="space-y-4">
        <PowerBalanceIndicator powerBalance={analysis.powerBalance} />
        {analysis.insights.length > 0 && (
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="w-4 h-4 text-warning" />Insights</CardTitle></CardHeader><CardContent><ul className="space-y-2">{analysis.insights.map((insight, idx) => <motion.li key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="text-sm text-muted-foreground flex items-start gap-2"><span>{insight}</span></motion.li>)}</ul></CardContent></Card>
        )}
        {analysis.coalitions.length > 0 && (<div><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Coalizões Detectadas ({analysis.coalitions.length})</h3><div className="space-y-3">{analysis.coalitions.map(c => <CoalitionCard key={c.id} coalition={c} onSelect={() => setSelectedCoalition(c)} />)}</div></div>)}
        {analysis.influenceClusters.length > 0 && (<div><h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-info" />Centros de Influência ({analysis.influenceClusters.length})</h3><div className="space-y-2">{analysis.influenceClusters.slice(0, 5).map(c => <InfluenceClusterCard key={c.id} cluster={c} />)}</div></div>)}
        {analysis.keyConnections.length > 0 && (<Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Link2 className="w-4 h-4 text-primary" />Conexões-Chave</CardTitle></CardHeader><CardContent><div className="grid grid-cols-3 gap-2 text-center"><div className="p-2 rounded-lg bg-info/10"><p className="text-lg font-bold text-info">{analysis.keyConnections.filter(c => c.type === 'influence').length}</p><p className="text-[10px] text-muted-foreground">Influência</p></div><div className="p-2 rounded-lg bg-success/10"><p className="text-lg font-bold text-success">{analysis.keyConnections.filter(c => c.type === 'alignment').length}</p><p className="text-[10px] text-muted-foreground">Alinhamento</p></div><div className="p-2 rounded-lg bg-destructive/10"><p className="text-lg font-bold text-destructive">{analysis.keyConnections.filter(c => c.type === 'conflict').length}</p><p className="text-[10px] text-muted-foreground">Conflito</p></div></div></CardContent></Card>)}
      </div>
    </div>
  );
}
