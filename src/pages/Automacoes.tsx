import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEOHead } from '@/components/seo/SEOHead';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Zap, Power, History, LayoutDashboard, Search, CalendarClock } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAutomationRules, type CreateRuleData } from '@/hooks/useAutomationRules';
import { AutomationTemplates } from '@/components/automation/AutomationTemplates';
import { RuleFormDialog } from './automacoes/RuleFormDialog';
import { AutomacoesRulesList } from './automacoes/AutomacoesRulesList';
import { CRMAutomationAuditLog } from '@/components/crm/CRMAutomationAuditLog';
import { RelationshipKPIsDashboard } from '@/components/crm/RelationshipKPIsDashboard';


import { CadenceRulesConfig } from '@/components/crm/CadenceRulesConfig';

export default function Automacoes() {

  usePageTitle('Automações');
  const { rules, logs, loading, createRule, updateRule, deleteRule, toggleRule, fetchLogs } = useAutomationRules();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<(CreateRuleData & { id: string }) | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [logsRuleId, setLogsRuleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('rules');

  const handleCreate = async (data: CreateRuleData) => { await createRule(data); };
  const handleUseTemplate = (data: CreateRuleData) => { setEditingRule({ ...data, id: '' }); setActiveTab('rules'); };
  const handleEdit = async (data: CreateRuleData) => {
    if (editingRule?.id) { await updateRule(editingRule.id, data); } else { await createRule(data); }
    setEditingRule(null);
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteRule(deleteId);
    setDeleteId(null);
  };
  const handleViewLogs = (ruleId: string) => { setLogsRuleId(ruleId); fetchLogs(ruleId); };

  const activeCount = rules.filter(r => r.is_active).length;
  const totalExecutions = rules.reduce((sum, r) => sum + r.execution_count, 0);

  return (
    <AppLayout title="Automações">
      <SEOHead title="Automações" description="Regras e fluxos automáticos para seu CRM" />
      <Header title="Automações & Workflows" subtitle="Crie regras automáticas: Se X acontecer → Faça Y" hideBack showAddButton addButtonLabel="Nova Automação" onAddClick={() => setFormOpen(true)} />
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Zap, value: rules.length, label: 'Total de Regras', cls: 'bg-primary/10', iconCls: 'text-primary' },
            { icon: Power, value: activeCount, label: 'Ativas', cls: 'bg-success/10', iconCls: 'text-success' },
            { icon: History, value: totalExecutions, label: 'Execuções', cls: 'bg-warning/10', iconCls: 'text-warning' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.cls} flex items-center justify-center`}><s.icon className={`w-5 h-5 ${s.iconCls}`} /></div>
                <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 p-1 h-auto flex flex-wrap gap-1">
            <TabsTrigger value="rules" className="gap-2"><Zap className="h-3.5 w-3.5" />Regras de Negócio</TabsTrigger>
            <TabsTrigger value="cadences" className="gap-2"><CalendarClock className="h-3.5 w-3.5" />Cadências CRM</TabsTrigger>
            <TabsTrigger value="crm-audit" className="gap-2"><Search className="h-3.5 w-3.5" />Auditoria CRM</TabsTrigger>
            <TabsTrigger value="kpis" className="gap-2"><LayoutDashboard className="h-3.5 w-3.5" />KPIs de Relacionamento</TabsTrigger>
            <TabsTrigger value="templates">📦 Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="cadences" className="mt-4">
            <CadenceRulesConfig />
          </TabsContent>

          <TabsContent value="crm-audit" className="mt-4">
            <CRMAutomationAuditLog />
          </TabsContent>
          <TabsContent value="kpis" className="mt-4">
            <RelationshipKPIsDashboard />
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <AutomationTemplates onUseTemplate={handleUseTemplate} />
          </TabsContent>
          <TabsContent value="rules" className="mt-4">
            <AutomacoesRulesList
              rules={rules}
              logs={logs}
              loading={loading}
              deleteId={deleteId}
              logsRuleId={logsRuleId}
              onSetFormOpen={setFormOpen}
              onEditRule={(rule) => setEditingRule({
                id: rule.id,
                name: rule.name,
                description: rule.description,
                trigger_type: rule.trigger_type,
                trigger_config: rule.trigger_config as Record<string, unknown>,
                conditions: rule.conditions ?? [],
                actions: rule.actions ?? [],
              })}
              onToggleRule={toggleRule}
              onDeleteRequest={setDeleteId}
              onDeleteConfirm={handleDelete}
              onViewLogs={handleViewLogs}
              onCloseLogsRuleId={() => setLogsRuleId(null)}
            />
          </TabsContent>
        </Tabs>
      </div>

      <RuleFormDialog open={formOpen} onOpenChange={setFormOpen} onSubmit={handleCreate} />
      <RuleFormDialog
        open={!!editingRule}
        onOpenChange={(o) => { if (!o) setEditingRule(null); }}
        onSubmit={handleEdit}
        initialData={editingRule ?? undefined}
      />
    </AppLayout>
  );
}
