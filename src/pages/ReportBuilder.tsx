import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Helmet } from 'react-helmet-async';
import { LayoutGrid, Plus, X, BarChart3, Users, Building2, TrendingUp, Clock, Target, Activity, PieChart } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/navigation/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';

const AVAILABLE_WIDGETS = [
  { id: 'kpis', label: 'KPIs Diários', icon: BarChart3, category: 'overview' },
  { id: 'contacts-count', label: 'Total de Contatos', icon: Users, category: 'contacts' },
  { id: 'companies-count', label: 'Total de Empresas', icon: Building2, category: 'companies' },
  { id: 'interactions-week', label: 'Interações da Semana', icon: Activity, category: 'interactions' },
  { id: 'pipeline-value', label: 'Valor do Pipeline', icon: TrendingUp, category: 'pipeline' },
  { id: 'deals-by-stage', label: 'Deals por Estágio', icon: PieChart, category: 'pipeline' },
  { id: 'churn-risk', label: 'Contatos em Risco', icon: Target, category: 'intelligence' },
  { id: 'best-time', label: 'Melhor Horário', icon: Clock, category: 'intelligence' },
  { id: 'sentiment-dist', label: 'Distribuição de Sentimento', icon: PieChart, category: 'interactions' },
  { id: 'recent-activity', label: 'Atividade Recente', icon: Activity, category: 'overview' },
  { id: 'top-contacts', label: 'Top Contatos por Score', icon: Users, category: 'contacts' },
  { id: 'tickets-open', label: 'Tickets Abertos', icon: Target, category: 'support' },
] as const;

type WidgetId = typeof AVAILABLE_WIDGETS[number]['id'];

interface DashboardLayout {
  name: string;
  widgets: WidgetId[];
}

const DEFAULT_LAYOUTS: DashboardLayout[] = [
  { name: 'Executivo', widgets: ['kpis', 'pipeline-value', 'churn-risk', 'recent-activity'] },
  { name: 'Comercial', widgets: ['deals-by-stage', 'pipeline-value', 'top-contacts', 'interactions-week'] },
  { name: 'Operacional', widgets: ['contacts-count', 'companies-count', 'tickets-open', 'sentiment-dist'] },
];

function WidgetRenderer({ widgetId }: { widgetId: WidgetId }) {
  const widget = AVAILABLE_WIDGETS.find(w => w.id === widgetId);
  if (!widget) return null;
  const Icon = widget.icon;

  // Placeholder widget rendering - these would connect to real hooks in production
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-primary" />
          {widget.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-24 text-muted-foreground">
          <div className="text-center">
            <Icon className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Widget: {widget.label}</p>
            <p className="text-[10px] text-muted-foreground">Categoria: {widget.category}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportBuilder() {
  const { user } = useAuth();
  const dashboardKey = `singu-custom-dashboards-${user?.id ?? 'anon'}`;

  const [layouts, setLayouts] = useState<DashboardLayout[]>(DEFAULT_LAYOUTS);
  const [activeLayout, setActiveLayout] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(dashboardKey);
      setLayouts(saved ? (JSON.parse(saved) as DashboardLayout[]) : DEFAULT_LAYOUTS);
    } catch {
      setLayouts(DEFAULT_LAYOUTS);
    }
    setActiveLayout(0);
  }, [dashboardKey]);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');

  const currentLayout = layouts[activeLayout] || layouts[0];

  const saveLayouts = (updated: DashboardLayout[]) => {
    setLayouts(updated);
    try { localStorage.setItem(dashboardKey, JSON.stringify(updated)); } catch { /* private browsing */ }
  };

  const addWidget = (widgetId: WidgetId) => {
    if (currentLayout.widgets.includes(widgetId)) return;
    const updated = [...layouts];
    updated[activeLayout] = { ...currentLayout, widgets: [...currentLayout.widgets, widgetId] };
    saveLayouts(updated);
  };

  const removeWidget = (widgetId: WidgetId) => {
    const updated = [...layouts];
    updated[activeLayout] = { ...currentLayout, widgets: currentLayout.widgets.filter(w => w !== widgetId) };
    saveLayouts(updated);
  };

  const addLayout = () => {
    const name = newName.trim() || `Dashboard ${layouts.length + 1}`;
    saveLayouts([...layouts, { name, widgets: ['kpis'] }]);
    setActiveLayout(layouts.length);
    setNewName('');
  };

  const removeLayout = (idx: number) => {
    if (layouts.length <= 1) return;
    const updated = layouts.filter((_, i) => i !== idx);
    saveLayouts(updated);
    if (activeLayout >= updated.length) setActiveLayout(updated.length - 1);
  };

  const availableToAdd = AVAILABLE_WIDGETS.filter(w => !currentLayout.widgets.includes(w.id));

  return (
    <AppLayout>
      <Helmet>
        <title>Report Builder | SINGU</title>
        <meta name="description" content="Crie dashboards personalizados com widgets arrastáveis." />
      </Helmet>
      <div className="min-h-screen p-4 md:p-6 space-y-4">
        <PageHeader backTo="/" backLabel="Dashboard" title="Report Builder" />

        {/* Layout selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {layouts.map((layout, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <Button
                variant={idx === activeLayout ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setActiveLayout(idx)}
              >
                {layout.name}
              </Button>
              {isEditing && layouts.length > 1 && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removeLayout(idx)}>
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          {isEditing && (
            <div className="flex items-center gap-1">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome..." className="h-7 w-32 text-xs" />
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addLayout}><Plus className="h-3 w-3" /></Button>
            </div>
          )}
          <Button variant={isEditing ? 'default' : 'outline'} size="sm" className="h-7 text-xs ml-auto" onClick={() => setIsEditing(!isEditing)}>
            <LayoutGrid className="h-3 w-3 mr-1" />
            {isEditing ? 'Salvar' : 'Editar'}
          </Button>
        </div>

        {/* Available widgets (when editing) */}
        {isEditing && availableToAdd.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Widgets Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {availableToAdd.map(w => (
                  <Button key={w.id} variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => addWidget(w.id)}>
                    <Plus className="h-3 w-3" />
                    <w.icon className="h-3 w-3" />
                    {w.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Widget Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currentLayout.widgets.map(widgetId => (
            <div key={widgetId} className="relative group">
              <DashboardErrorBoundary sectionName={widgetId}>
                <WidgetRenderer widgetId={widgetId} />
              </DashboardErrorBoundary>
              {isEditing && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeWidget(widgetId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {currentLayout.widgets.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <LayoutGrid className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Dashboard vazio</p>
            <p className="text-xs">Clique em "Editar" para adicionar widgets.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
