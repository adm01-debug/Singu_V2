import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, Settings, Clock, RefreshCw, BarChart3,
  AlertTriangle, Users, TrendingUp, Cake, Target, ChevronRight, Mail
} from 'lucide-react';
import { useWeeklyReport, WeeklyReportData } from '@/hooks/useWeeklyReport';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WeeklyReportSettingsTab } from './weekly-report/WeeklyReportSettingsTab';

export function WeeklyReportPanel() {
  const {
    settings, reports, loading, generating,
    saveSettings, generateReport, sendTestEmail, dayOptions
  } = useWeeklyReport();

  const [activeTab, setActiveTab] = useState('preview');
  const [localSettings, setLocalSettings] = useState({
    enabled: true,
    send_day: 'monday',
    send_time: '09:00',
    email_address: '',
    include_portfolio_summary: true,
    include_at_risk_clients: true,
    include_health_alerts: true,
    include_upcoming_dates: true,
    include_recommendations: true,
    include_performance_metrics: true
  });
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        enabled: settings.enabled,
        send_day: settings.send_day,
        send_time: settings.send_time,
        email_address: settings.email_address || '',
        include_portfolio_summary: settings.include_portfolio_summary,
        include_at_risk_clients: settings.include_at_risk_clients,
        include_health_alerts: settings.include_health_alerts,
        include_upcoming_dates: settings.include_upcoming_dates,
        include_recommendations: settings.include_recommendations,
        include_performance_metrics: settings.include_performance_metrics
      });
    }
  }, [settings]);

  const handleGeneratePreview = async () => {
    const data = await generateReport();
    if (data) setPreviewData(data);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Relatório Semanal
            {settings?.enabled && <Badge variant="secondary" className="ml-2">Ativo</Badge>}
          </div>
          <Button variant="outline" size="sm" onClick={handleGeneratePreview} disabled={generating}>
            <RefreshCw className={`h-4 w-4 mr-1 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Gerando...' : 'Gerar Agora'}
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="preview" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />Preview
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />Configurar
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview">
            <ReportPreview data={previewData} generating={generating} />
          </TabsContent>

          <TabsContent value="settings">
            <WeeklyReportSettingsTab
              localSettings={localSettings}
              setLocalSettings={setLocalSettings}
              dayOptions={dayOptions}
              onSave={() => saveSettings(localSettings)}
              onSendTest={sendTestEmail}
            />
          </TabsContent>

          <TabsContent value="history">
            <ReportHistory reports={reports} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface ReportPreviewData {
  stats?: { totalInteractions?: number; newContacts?: number; upcomingBirthdays?: number; atRiskContacts?: number };
  highlights?: string[];
  recommendations?: string[];
}

function ReportPreview({ data, generating }: { data: ReportPreviewData | null; generating: boolean }) {
  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Gerando relatório...</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground mb-2">Nenhum relatório gerado ainda</p>
        <p className="text-sm text-muted-foreground">Clique em "Gerar Agora" para visualizar</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Interações" value={data.stats?.totalInteractions || 0} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Novos Contatos" value={data.stats?.newContacts || 0} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Aniversários" value={data.stats?.upcomingBirthdays || 0} icon={<Cake className="h-4 w-4" />} />
        <StatCard label="Em Risco" value={data.stats?.atRiskContacts || 0} icon={<AlertTriangle className="h-4 w-4" />} variant={(data.stats?.atRiskContacts ?? 0) > 5 ? 'warning' : 'default'} />
      </div>
      {(data.highlights?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" />Destaques</h4>
          <div className="space-y-2">
            {data.highlights!.map((h, i) => (
              <div key={`highlight-${i}-${h.slice(0, 15)}`} className="p-3 rounded-lg bg-success/10 text-sm">{h}</div>
            ))}
          </div>
        </div>
      )}
      {(data.recommendations?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2"><Target className="h-4 w-4 text-warning" />Recomendações</h4>
          <div className="space-y-2">
            {data.recommendations!.map((r, i) => (
              <div key={`rec-${i}-${r.slice(0, 15)}`} className="p-3 rounded-lg bg-warning/10 text-sm flex items-start gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />{r}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, variant = 'default' }: { label: string; value: number; icon: React.ReactNode; variant?: 'default' | 'warning' }) {
  return (
    <div className={`p-4 rounded-lg border text-center ${variant === 'warning' ? 'border-warning/50 bg-warning/5' : 'bg-secondary/30'}`}>
      <div className="flex items-center justify-center mb-2 text-muted-foreground">{icon}</div>
      <p className={`text-2xl font-bold ${variant === 'warning' ? 'text-warning' : ''}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ReportHistory({ reports }: { reports: WeeklyReportData[] }) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Nenhum relatório no histórico</p>
      </div>
    );
  }
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report.id} className="p-4 rounded-lg border hover:bg-secondary/30 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">
                {format(new Date(report.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <Badge variant="outline" className="text-xs">
                {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ptBR })}
              </Badge>
            </div>
            {report.sent_via?.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                Enviado por {report.sent_via.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
