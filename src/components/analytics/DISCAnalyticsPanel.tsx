import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, Users, Target, Award, Activity, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { DISCBadge } from '@/components/ui/disc-badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDISCAnalysis } from '@/hooks/useDISCAnalysis';
import { DISC_PROFILES } from '@/data/discAdvancedData';
import { DISCProfile } from '@/types';
import { getContactBehavior } from '@/lib/contact-utils';
import { logger } from '@/lib/logger';
import { DistributionTab, PerformanceTab, InsightsTab, ContactsTab } from './disc-analytics/DISCAnalyticsSubComponents';

interface ContactWithDISC {
  id: string; firstName: string; lastName: string; avatar?: string;
  discProfile: DISCProfile; discConfidence?: number; relationshipScore: number; companyName?: string;
}

const DISC_COLORS = { D: 'hsl(0, 84%, 60%)', I: 'hsl(45, 93%, 47%)', S: 'hsl(142, 76%, 36%)', C: 'hsl(217, 91%, 60%)' };

const DISCAnalyticsPanel = () => {
  const { user } = useAuth();
  const { dashboardData, fetchDashboardData } = useDISCAnalysis();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<ContactWithDISC[]>([]);
  const [stats, setStats] = useState({ totalProfiled: 0, avgConfidence: 0, mostCommon: 'I' as DISCProfile, recentAnalyses: 0 });

  const loadData = useCallback(async (signal?: { cancelled: boolean }) => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: contactsData }, { count: recentCount }] = await Promise.all([
        supabase.from('contacts').select('id, first_name, last_name, avatar_url, behavior, relationship_score, companies(name)').eq('user_id', user.id).limit(500),
        supabase.from('disc_analysis_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('analyzed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);
      if (signal?.cancelled) return;
      const mappedContacts: ContactWithDISC[] = (contactsData || []).map(c => {
        const behavior = getContactBehavior(c);
        return { id: c.id, firstName: c.first_name, lastName: c.last_name, avatar: c.avatar_url || undefined, discProfile: behavior?.discProfile as DISCProfile, discConfidence: behavior?.discConfidence, relationshipScore: c.relationship_score || 0, companyName: (c.companies as { name: string } | null)?.name };
      }).filter(c => c.discProfile);
      setContacts(mappedContacts);

      const profileCounts: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
      let totalConfidence = 0, confidenceCount = 0;
      mappedContacts.forEach(c => {
        if (c.discProfile && c.discProfile in profileCounts) { profileCounts[c.discProfile]++; }
        if (c.discConfidence) { totalConfidence += c.discConfidence; confidenceCount++; }
      });
      const mostCommon = (Object.entries(profileCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'I') as DISCProfile;
      setStats({ totalProfiled: mappedContacts.length, avgConfidence: confidenceCount > 0 ? Math.round(totalConfidence / confidenceCount) : 0, mostCommon, recentAnalyses: recentCount || 0 });
      await fetchDashboardData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error loading DISC data:', { error: msg });
    } finally { setLoading(false); }
  }, [user, fetchDashboardData]);

  useEffect(() => {
    const signal = { cancelled: false };
    loadData(signal);
    return () => { signal.cancelled = true; };
  }, [loadData]);

  if (loading) return (<div className="space-y-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[1,2,3,4].map(i => <Skeleton key={i} className="h-80" />)}</div></div>);

  const distributionData = (['D','I','S','C'] as const).map(p => ({ name: DISC_PROFILES[p]?.name || p, value: contacts.filter(c => c.discProfile === p).length, profile: p, color: DISC_COLORS[p] }));
  const compatibilityRadarData = (['D','I','S','C'] as const).map(p => { const pc = contacts.filter(c => c.discProfile === p); return { profile: DISC_PROFILES[p]?.name || p, score: pc.length > 0 ? Math.round(pc.reduce((s, c) => s + c.relationshipScore, 0) / pc.length) : 0, fullMark: 100 }; });
  const blendCounts: Record<string, number> = {}; contacts.forEach(c => { if (c.discProfile) blendCounts[c.discProfile] = (blendCounts[c.discProfile] || 0) + 1; });
  const blendData = Object.entries(blendCounts).map(([blend, count]) => ({ blend, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  const statCards = [
    { icon: Users, label: 'Contatos perfilados', value: stats.totalProfiled, badge: 'Total', color: 'text-primary' },
    { icon: Target, label: 'Confiança média', value: `${stats.avgConfidence}%`, badge: `${stats.avgConfidence}%`, color: 'text-success' },
    { icon: Award, label: 'Perfil predominante', value: DISC_PROFILES[stats.mostCommon || 'I']?.name, badge: null, color: DISC_COLORS[stats.mostCommon] },
    { icon: Activity, label: 'Análises recentes', value: stats.recentAnalyses, badge: '7 dias', color: 'text-secondary' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-foreground flex items-center gap-2"><Brain className="w-6 h-6 text-primary" />DISC Analytics</h2><p className="text-muted-foreground">Análise comportamental do portfólio de contatos</p></div>
        <Button onClick={loadData} variant="outline" size="sm" className="gap-2"><RefreshCw className="w-4 h-4" />Atualizar</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card><CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <card.icon className="w-8 h-8" style={{ color: card.color.startsWith('text-') ? undefined : card.color }} />
                {card.badge ? <Badge variant="outline">{card.badge}</Badge> : <DISCBadge profile={stats.mostCommon} size="sm" />}
              </div>
              <p className="text-3xl font-bold mt-2">{card.value}</p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="distribution" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
        </TabsList>
        <TabsContent value="distribution"><DistributionTab distributionData={distributionData} blendData={blendData} totalProfiled={stats.totalProfiled} /></TabsContent>
        <TabsContent value="performance"><PerformanceTab compatibilityRadarData={compatibilityRadarData} contacts={contacts} /></TabsContent>
        <TabsContent value="insights"><InsightsTab dashboardData={dashboardData} /></TabsContent>
        <TabsContent value="contacts"><ContactsTab contacts={contacts} /></TabsContent>
      </Tabs>
    </div>
  );
};

export default DISCAnalyticsPanel;
