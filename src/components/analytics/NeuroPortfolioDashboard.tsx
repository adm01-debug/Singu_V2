import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain } from 'lucide-react';
import { useContacts } from '@/hooks/useContacts';
import { useNeuromarketing } from '@/hooks/useNeuromarketing';
import { BrainSystem, Neurochemical, PrimalStimulus } from '@/types/neuromarketing';
import { NeuroPortfolioTabs } from './neuro-portfolio/NeuroPortfolioTabs';

type DiscProfile = 'D' | 'I' | 'S' | 'C';

const NeuroPortfolioDashboard = () => {
  const { contacts } = useContacts(undefined, { fetchAll: true });
  const { BRAIN_SYSTEM_INFO, NEUROCHEMICAL_INFO, PRIMAL_STIMULUS_INFO, DISC_BRAIN_CORRELATION } = useNeuromarketing();
  const [activeTab, setActiveTab] = useState('overview');

  const brainDistribution = useMemo(() => {
    const dist: Record<BrainSystem, { count: number; contacts: string[] }> = { reptilian: { count: 0, contacts: [] }, limbic: { count: 0, contacts: [] }, neocortex: { count: 0, contacts: [] } };
    contacts.forEach(c => { const b = c.behavior as { discProfile?: string } | null; const d = b?.discProfile as DiscProfile | null; if (d && DISC_BRAIN_CORRELATION[d]) { const bs = DISC_BRAIN_CORRELATION[d].primaryBrain; dist[bs].count++; dist[bs].contacts.push(`${c.first_name} ${c.last_name}`); } });
    return dist;
  }, [contacts, DISC_BRAIN_CORRELATION]);

  const brainPieData = useMemo(() => [
    { name: BRAIN_SYSTEM_INFO.reptilian.namePt, value: brainDistribution.reptilian.count, color: '#EF4444', icon: '🦎' },
    { name: BRAIN_SYSTEM_INFO.limbic.namePt, value: brainDistribution.limbic.count, color: '#EC4899', icon: '❤️' },
    { name: BRAIN_SYSTEM_INFO.neocortex.namePt, value: brainDistribution.neocortex.count, color: '#3B82F6', icon: '🧠' },
  ], [brainDistribution, BRAIN_SYSTEM_INFO]);

  const neurochemicalBarData = useMemo(() => {
    const dist: Record<Neurochemical, number> = { dopamine: 0, oxytocin: 0, cortisol: 0, serotonin: 0, endorphin: 0, adrenaline: 0 };
    contacts.forEach(c => { const b = c.behavior as { discProfile?: string } | null; const d = b?.discProfile as DiscProfile | null; if (d && DISC_BRAIN_CORRELATION[d]) dist[DISC_BRAIN_CORRELATION[d].dominantNeurochemical]++; });
    return Object.entries(dist).map(([chem, count]) => ({ name: NEUROCHEMICAL_INFO[chem as Neurochemical].namePt, count, icon: NEUROCHEMICAL_INFO[chem as Neurochemical].icon })).sort((a, b) => b.count - a.count);
  }, [contacts, DISC_BRAIN_CORRELATION, NEUROCHEMICAL_INFO]);

  const portfolioStimuli = useMemo(() => {
    const sc: Record<PrimalStimulus, number> = { self_centered: 0, contrast: 0, tangible: 0, memorable: 0, visual: 0, emotional: 0 };
    contacts.forEach(c => { const b = c.behavior as { discProfile?: string } | null; const d = b?.discProfile as DiscProfile | null; if (d && DISC_BRAIN_CORRELATION[d]) DISC_BRAIN_CORRELATION[d].responsiveStimuli.forEach(s => { sc[s]++; }); });
    return Object.entries(sc).map(([stim, count]) => ({ stimulus: stim, count, info: PRIMAL_STIMULUS_INFO[stim as PrimalStimulus] })).sort((a, b) => b.count - a.count);
  }, [contacts, DISC_BRAIN_CORRELATION, PRIMAL_STIMULUS_INFO]);

  const strategyRadarData = useMemo(() => {
    const total = contacts.length || 1;
    return [
      { strategy: 'Urgência/Medo', value: Math.round((brainDistribution.reptilian.count / total) * 100), fullMark: 100 },
      { strategy: 'Emoção/Confiança', value: Math.round((brainDistribution.limbic.count / total) * 100), fullMark: 100 },
      { strategy: 'Dados/Lógica', value: Math.round((brainDistribution.neocortex.count / total) * 100), fullMark: 100 },
      { strategy: 'Visual', value: Math.round((portfolioStimuli.find(s => s.stimulus === 'visual')?.count || 0) / total * 100), fullMark: 100 },
      { strategy: 'Contraste', value: Math.round((portfolioStimuli.find(s => s.stimulus === 'contrast')?.count || 0) / total * 100), fullMark: 100 },
      { strategy: 'Tangível', value: Math.round((portfolioStimuli.find(s => s.stimulus === 'tangible')?.count || 0) / total * 100), fullMark: 100 },
    ];
  }, [brainDistribution, portfolioStimuli, contacts.length]);

  const decisionSpeedData = useMemo(() => {
    let impulsive = 0, moderate = 0, analytical = 0;
    contacts.forEach(c => { const b = c.behavior as { discProfile?: string } | null; const d = b?.discProfile as string | null; if (d === 'D') impulsive++; else if (d === 'C') analytical++; else moderate++; });
    return [{ name: 'Impulsivo', value: impulsive, color: '#EF4444' }, { name: 'Moderado', value: moderate, color: '#F59E0B' }, { name: 'Analítico', value: analytical, color: '#3B82F6' }];
  }, [contacts]);

  const totalWithProfile = brainPieData.reduce((sum, item) => sum + item.value, 0);
  const profileCoverage = contacts.length > 0 ? Math.round((totalWithProfile / contacts.length) * 100) : 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle className="text-xl flex items-center gap-2"><Brain className="h-6 w-6 text-primary" />Dashboard Neuromarketing</CardTitle><CardDescription>Análise neural do seu portfólio de {contacts.length} contatos</CardDescription></div>
          <Badge variant={profileCoverage >= 70 ? 'default' : 'secondary'}>{profileCoverage}% Perfilados</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <NeuroPortfolioTabs activeTab={activeTab} onTabChange={setActiveTab} brainDistribution={brainDistribution} brainPieData={brainPieData} strategyRadarData={strategyRadarData} decisionSpeedData={decisionSpeedData} portfolioStimuli={portfolioStimuli} neurochemicalBarData={neurochemicalBarData} contacts={contacts} BRAIN_SYSTEM_INFO={BRAIN_SYSTEM_INFO} NEUROCHEMICAL_INFO={NEUROCHEMICAL_INFO} profileCoverage={profileCoverage} />
      </CardContent>
    </Card>
  );
};

export default NeuroPortfolioDashboard;
