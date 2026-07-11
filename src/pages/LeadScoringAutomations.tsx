import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Zap } from 'lucide-react';
import { SmartBackButton } from '@/components/navigation/SmartBackButton';
import { useScoreAutomations, useAutomationLog, type ScoreAutomation } from '@/hooks/useScoreAutomations';
import { AutomationCard } from '@/components/lead-scoring/AutomationCard';
import { AutomationWizard } from '@/components/lead-scoring/AutomationWizard';
import { AutomationTemplatesGrid } from '@/components/lead-scoring/AutomationTemplatesGrid';
import { AutomationLogTable } from '@/components/lead-scoring/AutomationLogTable';
import type { AutomationTemplate } from '@/components/lead-scoring/automation-templates';

export default function LeadScoringAutomationsPage() {
  const { data: automations = [], isLoading } = useScoreAutomations();
  const { data: log = [] } = useAutomationLog(undefined, 30);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ScoreAutomation | AutomationTemplate | null>(null);

  function openNew() { setEditing(null); setOpen(true); }
  function openTemplate(t: AutomationTemplate) { setEditing(t); setOpen(true); }
  function openEdit(a: ScoreAutomation) { setEditing(a); setOpen(true); }

  return (
    <>
      <Helmet>
        <title>Automações de Lead Score | SINGU CRM</title>
        <meta name="description" content="Crie automações que reagem a mudanças de grade e score: notificar, criar tarefa, inscrever em sequência ou disparar webhook." />
      </Helmet>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <SmartBackButton fallback="/lead-scoring" label="Voltar para Lead Scoring" className="mb-2" />
            <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" /> Automações de Score
            </h1>
            <p className="text-sm text-muted-foreground">Reaja automaticamente quando um lead atinge faixas críticas.</p>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nova automação</Button>
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Ativas ({automations.filter(a => a.active).length})</TabsTrigger>
            <TabsTrigger value="all">Todas ({automations.length})</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="log">Histórico ({log.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-6 text-center">Carregando…</div>
            ) : automations.filter(a => a.active).length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
                Nenhuma automação ativa. Crie uma a partir do botão ou de um template.
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {automations.filter(a => a.active).map(a => (
                  <AutomationCard key={a.id} automation={a} onEdit={openEdit} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            {automations.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
                Sem automações ainda.
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {automations.map(a => <AutomationCard key={a.id} automation={a} onEdit={openEdit} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <AutomationTemplatesGrid onUse={openTemplate} />
          </TabsContent>

          <TabsContent value="log" className="mt-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Últimos 30 dias</CardTitle></CardHeader>
              <CardContent><AutomationLogTable rows={log} /></CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <AutomationWizard open={open} onOpenChange={setOpen} initial={editing} />
      </div>
    </>
  );
}
