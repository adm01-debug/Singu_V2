import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar,
} from 'recharts';
import { CheckCircle2, AlertCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { DISCBadge } from '@/components/ui/disc-badge';
import { DISC_PROFILES } from '@/data/discAdvancedData';
import { DISCProfile } from '@/types';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const DISC_COLORS = { D: 'hsl(0, 84%, 60%)', I: 'hsl(45, 93%, 47%)', S: 'hsl(142, 76%, 36%)', C: 'hsl(217, 91%, 60%)' };
const DISC_BG_COLORS = { D: 'bg-destructive/10 text-destructive', I: 'bg-warning/10 text-warning', S: 'bg-success/10 text-success', C: 'bg-info/10 text-info' };

interface ContactWithDISC {
  id: string; firstName: string; lastName: string; avatar?: string;
  discProfile: DISCProfile; discConfidence?: number; relationshipScore: number; companyName?: string;
}

export function DistributionTab({ distributionData, blendData, totalProfiled }: { distributionData: Array<{ name: string; value: number; profile: string; color: string }>; blendData: Array<{ blend: string; count: number }>; totalProfiled: number }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg">Distribuição por Perfil</CardTitle><CardDescription>Proporção de cada perfil DISC no portfólio</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ profile, value }) => `${profile}: ${value}`}>
                    {distributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip content={({ payload }) => payload?.[0] ? <div className="bg-card border rounded-lg p-3 shadow-soft"><p className="font-medium">{payload[0].payload.name}</p><p className="text-sm text-muted-foreground">{payload[0].payload.value} contatos</p></div> : null} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg">Contagem por Perfil</CardTitle><CardDescription>Número de contatos em cada perfil DISC</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" /><XAxis dataKey="profile" /><YAxis /><Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>{distributionData.map((entry, index) => <Cell key={`bar-${index}`} fill={entry.color} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Perfis Blend Mais Comuns</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {blendData.map((item, index) => (
              <div key={item.blend} className="flex items-center gap-4">
                <div className="w-8 text-center text-sm font-medium text-muted-foreground">#{index + 1}</div>
                <DISCBadge profile={item.blend as DISCProfile} size="sm" />
                <div className="flex-1"><Progress value={(item.count / totalProfiled) * 100} className="h-2" /></div>
                <span className="text-sm font-medium w-12 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PerformanceTab({ compatibilityRadarData, contacts }: { compatibilityRadarData: Array<{ profile: string; score: number; fullMark: number }>; contacts: ContactWithDISC[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Score de Relacionamento por Perfil</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={compatibilityRadarData}><PolarGrid /><PolarAngleAxis dataKey="profile" /><PolarRadiusAxis angle={30} domain={[0, 100]} /><Radar name="Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} /><Tooltip /></RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-lg">Top Performers por Perfil</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(['D', 'I', 'S', 'C'] as const).map(profile => {
              const topContact = contacts.filter(c => c.discProfile === profile).sort((a, b) => b.relationshipScore - a.relationshipScore)[0];
              if (!topContact) return null;
              return (
                <div key={profile} className="flex items-center gap-3">
                  <DISCBadge profile={profile} size="sm" showLabel={false} />
                  <OptimizedAvatar src={topContact.avatar} alt={`${topContact.firstName} ${topContact.lastName}`} fallback={`${(topContact.firstName || '?')[0]}${(topContact.lastName || '?')[0]}`} size="sm" />
                  <div className="flex-1 min-w-0"><p className="font-medium truncate">{topContact.firstName} {topContact.lastName}</p><p className="text-xs text-muted-foreground truncate">{topContact.companyName || 'Sem empresa'}</p></div>
                  <Badge variant="outline" className={DISC_BG_COLORS[profile]}>{topContact.relationshipScore}%</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function InsightsTab({ dashboardData }: { dashboardData: { compatibilityInsights?: { bestPerforming?: string; needsImprovement?: string } } | null }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-success" />Melhor Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3"><DISCBadge profile={(dashboardData?.compatibilityInsights?.bestPerforming || 'I') as DISCProfile} size="lg" /><div><p className="font-medium">{DISC_PROFILES[(dashboardData?.compatibilityInsights?.bestPerforming || 'I') as DISCProfile]?.name}</p><p className="text-sm text-muted-foreground">Perfil com melhor taxa de conversão</p></div></div>
              <div className="p-3 bg-success/10 rounded-lg"><p className="text-sm text-success dark:text-success"><Lightbulb className="w-4 h-4 inline mr-1" />Priorize contatos com este perfil para maximizar resultados</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertCircle className="w-5 h-5 text-warning" />Oportunidade de Melhoria</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3"><DISCBadge profile={(dashboardData?.compatibilityInsights?.needsImprovement || 'C') as DISCProfile} size="lg" /><div><p className="font-medium">{DISC_PROFILES[(dashboardData?.compatibilityInsights?.needsImprovement || 'C') as DISCProfile]?.name}</p><p className="text-sm text-muted-foreground">Perfil com maior potencial de crescimento</p></div></div>
              <div className="p-3 bg-warning/10 rounded-lg"><p className="text-sm text-warning dark:text-warning"><Lightbulb className="w-4 h-4 inline mr-1" />Estude as estratégias específicas para este perfil</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Dicas por Perfil</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['D', 'I', 'S', 'C'] as const).map(profile => {
              const info = DISC_PROFILES[profile];
              return (
                <div key={profile} className={cn("p-4 rounded-lg border", DISC_BG_COLORS[profile].replace('text-', 'border-'))}>
                  <div className="flex items-center gap-2 mb-2"><DISCBadge profile={profile} size="sm" showLabel={false} /><span className="font-medium">{info?.name}</span></div>
                  <ul className="text-sm space-y-1 text-muted-foreground">{info?.salesApproach.presentation.slice(0, 2).map((tip, i) => <li key={i} className="flex items-start gap-2"><ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />{tip}</li>)}</ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ContactsTab({ contacts }: { contacts: ContactWithDISC[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Contatos Perfilados</CardTitle><CardDescription>Lista de contatos com análise DISC</CardDescription></CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {contacts.sort((a, b) => b.relationshipScore - a.relationshipScore).map(contact => (
              <Link key={contact.id} to={`/contatos/${contact.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <OptimizedAvatar src={contact.avatar} alt={`${contact.firstName} ${contact.lastName}`} fallback={`${(contact.firstName || '?')[0]}${(contact.lastName || '?')[0]}`} size="md" />
                <div className="flex-1 min-w-0"><p className="font-medium">{contact.firstName} {contact.lastName}</p><p className="text-sm text-muted-foreground truncate">{contact.companyName || 'Sem empresa'}</p></div>
                <DISCBadge profile={contact.discProfile} size="sm" />
                {contact.discConfidence && <Badge variant="outline" className="text-xs">{contact.discConfidence}% conf.</Badge>}
                <Badge variant="outline" className={cn(contact.relationshipScore >= 70 ? 'bg-success/10 text-success' : contact.relationshipScore >= 40 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive')}>{contact.relationshipScore}%</Badge>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
