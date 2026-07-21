import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Target, Info, Network, GitBranch, FlaskConical, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStakeholderAnalysis, StakeholderData } from '@/hooks/useStakeholderAnalysis';
import { useStakeholderAlerts } from '@/hooks/useStakeholderAlerts';
import { StakeholderAlertsList } from './StakeholderAlertsList';
import { StakeholderInfluenceNetwork } from './StakeholderInfluenceNetwork';
import { CoalitionDetectionPanel } from './CoalitionDetectionPanel';
import { StakeholderSimulator } from './StakeholderSimulator';
import { StakeholderCard, PowerInterestGrid, StakeholderDetail } from './stakeholder-map/StakeholderMapComponents';
import type { Tables } from '@/integrations/supabase/types';

type Contact = Tables<'contacts'>;
type Interaction = Tables<'interactions'>;

interface StakeholderMapProps {
  contacts: Contact[];
  interactions: Interaction[];
  companyId?: string;
}

export function StakeholderMap({ contacts, interactions, companyId }: StakeholderMapProps) {
  const [selectedStakeholder, setSelectedStakeholder] = useState<StakeholderData | null>(null);
  const { stakeholders, summary, recommendations } = useStakeholderAnalysis(contacts, interactions);
  const { checkForChanges, alerts } = useStakeholderAlerts(companyId);

  useEffect(() => {
    if (stakeholders.length > 0) {
      stakeholders.forEach(stakeholder => {
        const contactName = `${stakeholder.contact.first_name} ${stakeholder.contact.last_name}`;
        checkForChanges(stakeholder.contact.id, contactName, companyId || null, {
          power: stakeholder.metrics.power * 10, interest: stakeholder.metrics.interest * 10,
          influence: stakeholder.metrics.influence * 10, support: stakeholder.metrics.support * 10 + 50,
          engagement: stakeholder.metrics.engagement * 10, quadrant: stakeholder.quadrant, riskLevel: stakeholder.riskLevel,
        });
      });
    }
  }, [stakeholders, companyId, checkForChanges]);

  if (contacts.length === 0) {
    return (<Card><CardContent className="py-12 text-center"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">Nenhum Stakeholder</h3><p className="text-muted-foreground">Adicione contatos à empresa para visualizar o mapa de stakeholders.</p></CardContent></Card>);
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Mapa de Stakeholders</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-success/10 text-success"><UserCheck className="w-3 h-3 mr-1" />{summary.champions} Champions</Badge>
            <Badge variant="outline" className="bg-destructive/10 text-destructive"><UserX className="w-3 h-3 mr-1" />{summary.blockers} Blockers</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <AnimatePresence>{selectedStakeholder && <StakeholderDetail stakeholder={selectedStakeholder} onClose={() => setSelectedStakeholder(null)} />}</AnimatePresence>
        <Tabs defaultValue="matrix">
          <TabsList className="grid w-full grid-cols-7 mb-4">
            <TabsTrigger value="matrix">Matriz</TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-1"><Network className="w-3.5 h-3.5" />Rede</TabsTrigger>
            <TabsTrigger value="coalitions" className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" />Coalizões</TabsTrigger>
            <TabsTrigger value="simulator" className="flex items-center gap-1"><FlaskConical className="w-3.5 h-3.5" />Simulador</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="alerts" className="relative">Alertas{alerts.length > 0 && <Badge className="ml-1.5 h-5 w-5 p-0 justify-center text-xs bg-destructive">{alerts.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          <TabsContent value="matrix"><PowerInterestGrid stakeholders={stakeholders} onSelect={setSelectedStakeholder} /></TabsContent>
          <TabsContent value="network"><StakeholderInfluenceNetwork stakeholders={stakeholders} height={450} /></TabsContent>
          <TabsContent value="coalitions"><CoalitionDetectionPanel stakeholders={stakeholders} /></TabsContent>
          <TabsContent value="simulator"><StakeholderSimulator stakeholders={stakeholders} /></TabsContent>
          <TabsContent value="list"><div className="space-y-2">{stakeholders.map(stakeholder => <StakeholderCard key={stakeholder.contact.id} stakeholder={stakeholder} onClick={() => setSelectedStakeholder(stakeholder)} />)}</div></TabsContent>
          <TabsContent value="alerts"><StakeholderAlertsList companyId={companyId} maxItems={10} showHeader={false} /></TabsContent>
          <TabsContent value="insights">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold text-primary">{summary.totalStakeholders}</div><div className="text-xs text-muted-foreground">Total</div></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold">{summary.avgPower}</div><div className="text-xs text-muted-foreground">Poder Médio</div></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><div className="text-2xl font-bold">{summary.avgInterest}</div><div className="text-xs text-muted-foreground">Interesse Médio</div></CardContent></Card>
                <Card><CardContent className="p-3 text-center"><div className={`text-2xl font-bold ${summary.riskScore > 50 ? 'text-destructive' : summary.riskScore > 25 ? 'text-warning' : 'text-success'}`}>{summary.riskScore}%</div><div className="text-xs text-muted-foreground">Score de Risco</div></CardContent></Card>
              </div>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Info className="w-4 h-4 text-info" />Recomendações Estratégicas</CardTitle></CardHeader>
                <CardContent><ul className="space-y-2">{recommendations.map((rec, index) => (<motion.li key={`${rec.slice(0, 24)}-${index}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="text-sm text-muted-foreground flex items-start gap-2"><span className="block mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />{rec}</motion.li>))}</ul></CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
