import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompany360 } from '@/hooks/useCompanyIntelligence';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Brain } from 'lucide-react';

export function CompanyBenchmarkRadar({ companyId }: { companyId: string }) {
  const { data: company360, isLoading } = useCompany360(companyId);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Benchmark Competitivo</CardTitle></CardHeader><CardContent><Skeleton className="h-48" /></CardContent></Card>;
  if (!company360) return null;

  // Mock data for benchmark (would ideally come from an RPC)
  const benchmarkData = [
    { subject: 'Saúde Fin.', A: company360.health_score || 50, B: 65, fullMark: 100 },
    { subject: 'Engajamento', A: (company360.total_contacts || 0) * 10, B: 40, fullMark: 100 },
    { subject: 'Receita', A: 70, B: 60, fullMark: 100 },
    { subject: 'Risco Churn', A: 100 - (company360.churn_risk || 0), B: 80, fullMark: 100 },
    { subject: 'Fidelidade', A: 85, B: 70, fullMark: 100 },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> 
            Benchmark do Setor
          </span>
          <Badge variant="outline" className="text-[10px]">Competitivo</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64 pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={benchmarkData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
            <Radar
              name="Empresa"
              dataKey="A"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.5}
            />
            <Radar
              name="Média Setor"
              dataKey="B"
              stroke="#94a3b8"
              fill="#94a3b8"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 -mt-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[10px] text-muted-foreground font-medium">Empresa</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="text-[10px] text-muted-foreground font-medium">Média Setor</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
