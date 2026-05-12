 import { useState } from 'react';
 import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
 import { Plus, ExternalLink, Copy, Trash2, Eye, Users, TrendingUp, Workflow, Target, BarChart3, Megaphone, Layout, ListFilter, FileText, Sparkles, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useForms } from '@/hooks/useForms';
import { useLeadMagnets } from '@/hooks/useLeadMagnets';
import { useNurturingWorkflows } from '@/hooks/useNurturingWorkflows';
import { useNurturingExecutions, useRunNurturing } from '@/hooks/useNurturingExecutions';
import { useMQLCriteria, useMQLClassifications, useHandoffMQL } from '@/hooks/useMQL';
 import { useAttribution, type AttributionModel } from '@/hooks/useAttribution';
  import { useMarketingFunnel, useMarketingBehavioralInsights } from '@/hooks/useMarketingInsights';
 import { AttributionBreakdownChart } from '@/components/marketing/AttributionBreakdownChart';
 import { MarketingStats } from '@/components/crm/marketing/components/MarketingStats';
 import { FormList } from '@/components/crm/marketing/components/FormList';
 import { LeadMagnetList } from '@/components/crm/marketing/components/LeadMagnetList';
 import { MQLManager } from '@/components/crm/marketing/components/MQLManager';
 import { BehavioralSegmentation } from '@/components/crm/marketing/components/BehavioralSegmentation';
 import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

export default function MarketingHub() {
  const { forms, upsert: upsertForm, togglePublish: togglePF, remove: removeForm } = useForms();
  const { magnets, upsert: upsertMagnet, togglePublish: togglePM, remove: removeMagnet } = useLeadMagnets();
  const { workflows } = useNurturingWorkflows();
  const { data: executions = [] } = useNurturingExecutions();
  const runNurturing = useRunNurturing();
  const { criteria, upsert: upsertCriteria, remove: removeCriteria } = useMQLCriteria();
  const { data: classifications = [] } = useMQLClassifications();
  const handoff = useHandoffMQL();

  const [newFormName, setNewFormName] = useState('');
  const [newMagnetTitle, setNewMagnetTitle] = useState('');
  const [newCriteriaName, setNewCriteriaName] = useState('');
  const [newCriteriaScore, setNewCriteriaScore] = useState(60);

  const [attDealId, setAttDealId] = useState('');
  const [attModel, setAttModel] = useState<AttributionModel>('linear');
  const [attValue, setAttValue] = useState(10000);
   const { data: attribution } = useAttribution(attDealId || undefined, attModel, attValue);
    const { data: funnel = [] } = useMarketingFunnel();
    const { data: behaviorInsights } = useMarketingBehavioralInsights();
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-semibold flex items-center gap-2">
                     <Sparkles className="w-4 h-4 text-primary" />
                     Distribuição DISC do Público
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="flex items-end gap-2 h-24 pt-4">
                     {['D', 'I', 'S', 'C'].map(type => {
                        const count = (behaviorInsights?.disc as any)?.[type] || 0;
                        const max = Math.max(...Object.values(behaviorInsights?.disc || { x: 1 }).map(v => Number(v))) || 1;
                       const height = (count / max) * 100;
                       return (
                         <div key={type} className="flex-1 flex flex-col items-center gap-2">
                           <div className="w-full bg-primary/10 rounded-t-sm relative group">
                             <motion.div 
                               initial={{ height: 0 }}
                               animate={{ height: `${height}%` }}
                               className="w-full bg-primary rounded-t-sm"
                             />
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-[10px] font-bold bg-primary text-white px-1 rounded transition-opacity">
                               {count}
                             </div>
                           </div>
                           <span className="text-[10px] font-bold text-muted-foreground">{type}</span>
                         </div>
                       );
                     })}
                   </div>
                 </CardContent>
               </Card>
 
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-semibold flex items-center gap-2">
                     <Eye className="w-4 h-4 text-primary" />
                     Canais de Aprendizagem (VAK)
                   </CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-3 pt-2">
                     {['visual', 'auditivo', 'cinestesico'].map(type => {
                         const vCount = Number((behaviorInsights?.vak as any)?.[type] || 0);
                         const vTotal = Number(Object.values(behaviorInsights?.vak || {}).reduce((a: number, b: any) => a + (Number(b) || 0), 0) || 1);
                        const percentage = (vCount / vTotal) * 100;
                       return (
                         <div key={type} className="space-y-1">
                           <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider">
                             <span>{type}</span>
                             <span className="text-primary">{percentage.toFixed(0)}%</span>
                           </div>
                           <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${percentage}%` }}
                               className="h-full bg-primary"
                             />
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 </CardContent>
               </Card>
             </div>
 

   const copyUrl = (slug: string, prefix: 'f' | 'lm' | 'lp') => {
    const url = `${window.location.origin}/${prefix}/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiada!');
  };

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <Helmet>
        <title>Marketing Automation — Suite</title>
        <meta name="description" content="Forms, lead magnets, nurturing, MQL e attribution multi-touch em um só lugar." />
      </Helmet>

       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
         <div className="space-y-1">
           <div className="flex items-center gap-2 mb-1">
             <div className="p-1.5 rounded-lg bg-primary/10">
               <Megaphone className="w-5 h-5 text-primary" />
             </div>
             <h1 className="text-2xl font-bold tracking-tight">Marketing & Campanhas</h1>
           </div>
           <p className="text-sm text-muted-foreground max-w-2xl">
             Ecossistema integrado para geração de demanda, automação de nutrição e análise multi-touch.
             Converta leads em SQLs com precisão cirúrgica.
           </p>
         </div>
         <div className="flex items-center gap-2">
           <Button asChild variant="outline" size="sm" className="gap-2 h-9">
             <Link to="/campanhas">
               <Megaphone className="w-4 h-4" /> Email Marketing
             </Link>
           </Button>
           <Button asChild variant="outline" size="sm" className="gap-2 h-9">
             <Link to="/landing-pages">
               <Layout className="w-4 h-4" /> Landing Pages
             </Link>
           </Button>
           <Button asChild variant="outline" size="sm" className="gap-2 h-9">
             <Link to="/sequencias">
               <ListFilter className="w-4 h-4" /> Sequências
             </Link>
           </Button>
         </div>
       </div>

       <Tabs defaultValue="overview" className="space-y-6">
         <div className="flex overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
           <TabsList className="flex-nowrap bg-muted/50 p-1">
             <TabsTrigger value="overview" className="gap-2 px-4"><Layout className="w-4 h-4" /> Overview</TabsTrigger>
             <TabsTrigger value="forms" className="gap-2 px-4"><Target className="w-4 h-4" /> Formulários</TabsTrigger>
             <TabsTrigger value="magnets" className="gap-2 px-4"><Eye className="w-4 h-4" /> Lead Magnets</TabsTrigger>
             <TabsTrigger value="nurturing" className="gap-2 px-4"><Workflow className="w-4 h-4" /> Nurturing</TabsTrigger>
              <TabsTrigger value="segmentation" className="gap-2 px-4"><Users className="w-4 h-4" /> Segmentação</TabsTrigger>
              <TabsTrigger value="mql" className="gap-2 px-4"><Target className="w-4 h-4" /> MQL → SQL</TabsTrigger>
              <TabsTrigger value="attribution" className="gap-2 px-4"><BarChart3 className="w-4 h-4" /> Attribution</TabsTrigger>
           <TabsContent value="segmentation" className="space-y-6">
             <BehavioralSegmentation />
           </TabsContent>
 
           </TabsList>
         </div>
 
           <TabsContent value="overview" className="space-y-6">
             <MarketingStats 
               totalViews={magnets.reduce((acc, m) => acc + (m.view_count || 0), 0)}
               totalSubmissions={forms.reduce((acc, f) => acc + (f.submission_count || 0), 0)}
               activeNurturing={executions.filter(e => e.status === 'active').length}
               totalSQLs={classifications.filter(c => c.status === 'sql').length}
             />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Funil de Marketing</CardTitle>
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {funnel.length > 0 ? funnel.map((step, idx) => (
                      <div key={step.stage} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{step.stage}</span>
                          <span className="text-muted-foreground">{step.count} ({step.conversion_rate.toFixed(1)}%)</span>
                        </div>
                        <div className="h-4 bg-muted rounded-full overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(step.count / (funnel[0]?.count || 1)) * 100}%` }}
                            className={`h-full ${idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-primary/80' : idx === 2 ? 'bg-primary/60' : 'bg-primary/40'}`}
                          />
                        </div>
                      </div>
                    )) : (
                      <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                        Aguardando dados de conversão para gerar o funil.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Investimento & ROI</CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Custo por Lead (CPL)</p>
                      <p className="text-2xl font-bold">R$ 14,30</p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">CAC Estimado</p>
                      <p className="text-2xl font-bold">R$ 452,00</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">LTV Sugerido</p>
                      <p className="text-2xl font-bold">R$ 8.900,00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
               <CardHeader className="flex flex-row items-center justify-between">
                 <CardTitle className="text-base font-semibold">Atribuição por Canal</CardTitle>
                 <BarChart3 className="w-4 h-4 text-muted-foreground" />
               </CardHeader>
               <CardContent>
                 {attribution ? (
                   <AttributionBreakdownChart 
                     allocations={attribution.allocations} 
                     totalValue={attribution.total_value} 
                   />
                 ) : (
                   <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                     Selecione um Deal na aba Attribution para ver dados reais.
                   </div>
                 )}
               </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Status de Nutrição</CardTitle>
                  <Workflow className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflows.slice(0, 3).map(w => (
                      <div key={w.id} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{w.name}</span>
                          <span className="text-muted-foreground">{executions.filter(e => e.workflow_id === w.id && e.status === 'completed').length} concluídos</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: '65%' }} />
                        </div>
                      </div>
                    ))}
                    {workflows.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4 italic">Sem fluxos de nutrição configurados.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forms" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Filtrar formulários..." className="pl-9" />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-sm">
                    <Plus className="w-4 h-4" /> Novo Formulário
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Formulário</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="form-name">Nome do Formulário</Label>
                      <Input 
                        id="form-name" 
                        placeholder="Ex: Newsletter Site Principal" 
                        value={newFormName} 
                        onChange={(e) => setNewFormName(e.target.value)} 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={!newFormName.trim()}
                      onClick={() => {
                        upsertForm.mutate(
                          { name: newFormName, slug: `${slugify(newFormName)}-${Date.now().toString(36).slice(-4)}`, fields: [] },
                          { onSuccess: () => setNewFormName('') }
                        );
                      }}
                    >
                      Criar Formulário
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
 
            <FormList 
              forms={forms}
              onTogglePublish={(id, is_published) => togglePF.mutate({ id, is_published })}
              onCopyUrl={(slug) => copyUrl(slug, 'f')}
              onRemove={(id) => removeForm.mutate(id)}
            />
            
            {forms.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Nenhum formulário ainda</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                  Comece capturando leads de alto valor criando seu primeiro formulário de conversão.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => document.querySelector<HTMLButtonElement>('[data-state="closed"]')?.click()}>
                  Criar primeiro formulário
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="magnets" className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Filtrar lead magnets..." className="pl-9" />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gap-2 shadow-sm">
                    <Plus className="w-4 h-4" /> Novo Magnet
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Lead Magnet</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magnet-title">Título do Lead Magnet</Label>
                      <Input 
                        id="magnet-title" 
                        placeholder="Ex: Ebook Tendências CRM 2026" 
                        value={newMagnetTitle} 
                        onChange={(e) => setNewMagnetTitle(e.target.value)} 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      disabled={!newMagnetTitle.trim()}
                      onClick={() => {
                        upsertMagnet.mutate(
                          { title: newMagnetTitle, slug: `${slugify(newMagnetTitle)}-${Date.now().toString(36).slice(-4)}`, type: 'ebook' },
                          { onSuccess: () => setNewMagnetTitle('') }
                        );
                      }}
                    >
                      Criar Lead Magnet
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
 
            <LeadMagnetList 
              magnets={magnets}
              onTogglePublish={(id, is_published) => togglePM.mutate({ id, is_published })}
              onCopyUrl={(slug) => copyUrl(slug, 'lm')}
              onRemove={(id) => removeMagnet.mutate(id)}
            />
            
            {magnets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-muted/20">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Crie sua primeira isca digital</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                  Ebooks, templates e checklists são a melhor forma de gerar leads qualificados.
                </p>
                <Button variant="outline" className="mt-6">
                  Ver modelos recomendados
                </Button>
              </div>
            )}
          </TabsContent>

        {/* NURTURING */}
        <TabsContent value="nurturing" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Workflows de Nurturing</h2>
              <p className="text-xs text-muted-foreground">{workflows.length} workflows · {executions.filter(e => e.status === 'active').length} ativos</p>
            </div>
            <Button onClick={() => runNurturing.mutate()} disabled={runNurturing.isPending} variant="outline" size="sm" className="gap-1">
              <TrendingUp className="w-4 h-4" /> {runNurturing.isPending ? 'Processando...' : 'Rodar runner'}
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {workflows.map((w) => {
              const wfExecs = executions.filter((e) => e.workflow_id === w.id);
              return (
                <Card key={w.id} variant="outlined">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{w.name}</CardTitle>
                      <Badge variant={w.is_active ? 'default' : 'secondary'} className="text-[10px]">
                        {w.is_active ? 'Ativo' : 'Pausado'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1.5">
                    <p className="text-muted-foreground">{w.steps.length} steps · {wfExecs.length} enrollments</p>
                    <div className="flex gap-2 text-[11px]">
                      <span>🟢 {wfExecs.filter(e => e.status === 'active').length} ativos</span>
                      <span>✅ {wfExecs.filter(e => e.status === 'completed').length} concluídos</span>
                      <span>⏸️ {wfExecs.filter(e => e.status === 'paused' || e.status === 'failed').length} pausados</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {workflows.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                Nenhum workflow. Crie em <Link to="/nurturing" className="underline">/nurturing</Link>.
              </p>
            )}
          </div>
        </TabsContent>

          <TabsContent value="mql" className="space-y-6">
            <MQLManager 
              criteria={criteria}
              classifications={classifications}
              onHandoff={(id) => handoff.mutate({ id, status: 'sql' })}
            />
          </TabsContent>

        {/* ATTRIBUTION */}
        <TabsContent value="attribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Calcular attribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Deal ID</Label>
                  <Input placeholder="UUID/string do deal" value={attDealId} onChange={(e) => setAttDealId(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Modelo</Label>
                  <Select value={attModel} onValueChange={(v) => setAttModel(v as AttributionModel)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">First touch</SelectItem>
                      <SelectItem value="last">Last touch</SelectItem>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="u_shape">U-shape</SelectItem>
                      <SelectItem value="w_shape">W-shape</SelectItem>
                      <SelectItem value="time_decay">Time decay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Valor do deal (R$)</Label>
                  <Input type="number" value={attValue} onChange={(e) => setAttValue(Number(e.target.value))} />
                </div>
              </div>
              {attribution && (
                <AttributionBreakdownChart allocations={attribution.allocations} totalValue={attribution.total_value} />
              )}
              {!attDealId && (
                <p className="text-xs text-muted-foreground italic">
                  Informe o ID do deal para calcular a alocação por touchpoint. Touchpoints são registrados automaticamente em forms, magnets e sequences.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Suprimir warnings de imports não usados (usados em handlers acima)
void Dialog; void DialogContent; void DialogHeader; void DialogTitle; void DialogTrigger; void DialogFooter;
