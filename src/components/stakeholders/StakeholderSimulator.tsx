import { useState } from 'react';
import { FlaskConical, Play, RotateCcw, Save, Trash2, Sparkles, FolderOpen, UserX, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStakeholderSimulator } from '@/hooks/useStakeholderSimulator';
import type { StakeholderData } from '@/hooks/useStakeholderAnalysis';
import { StakeholderSelector, SimulationResultPanel } from './stakeholder-simulator/SimulatorSubComponents';

interface StakeholderSimulatorProps {
  stakeholders: StakeholderData[];
  className?: string;
}

export function StakeholderSimulator({ stakeholders, className }: StakeholderSimulatorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');

  const { changes, addChange, removeChange, clearChanges, applyPreset, savedScenarios, saveScenario, loadScenario, deleteScenario, simulationResult } = useStakeholderSimulator(stakeholders);

  const handleChangeSupport = (stakeholder: StakeholderData, newSupport: number) => {
    if (newSupport === stakeholder.metrics.support) {
      removeChange(stakeholder.contact.id);
    } else {
      addChange({
        contactId: stakeholder.contact.id,
        contactName: `${stakeholder.contact.first_name} ${stakeholder.contact.last_name}`,
        originalMetrics: stakeholder.metrics, newMetrics: { support: newSupport },
        action: newSupport > stakeholder.metrics.support ? 'convert' : 'neutralize',
        description: `Alterar suporte de ${stakeholder.metrics.support} para ${newSupport}`,
      });
    }
  };

  const handleSaveScenario = () => {
    if (scenarioName.trim()) { saveScenario(scenarioName, scenarioDescription); setSaveDialogOpen(false); setScenarioName(''); setScenarioDescription(''); }
  };

  if (stakeholders.length === 0) {
    return (<Card className={className}><CardContent className="flex flex-col items-center justify-center py-12 text-center"><FlaskConical className="w-12 h-12 text-muted-foreground/30 mb-4" /><h3 className="font-semibold text-lg mb-2">Sem stakeholders</h3><p className="text-muted-foreground text-sm">Adicione contatos para simular cenários de conversão.</p></CardContent></Card>);
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="w-4 h-4 text-primary" />Simulador de Cenários</CardTitle>
            <div className="flex items-center gap-2">{changes.length > 0 && <Badge variant="secondary">{changes.length} alteração{changes.length !== 1 ? 'ões' : ''}</Badge>}</div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Teste estratégias de conversão antes de executá-las. Simule mudanças no suporte dos stakeholders e veja o impacto no balanço de poder.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <TooltipProvider>
              <Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={() => applyPreset('convert_blockers')} className="text-xs"><UserX className="w-3 h-3 mr-1" />Neutralizar Blockers</Button></TooltipTrigger><TooltipContent><p>Simular conversão de todos os bloqueadores para neutros</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={() => applyPreset('boost_champions')} className="text-xs"><Sparkles className="w-3 h-3 mr-1" />Fortalecer Champions</Button></TooltipTrigger><TooltipContent><p>Simular fortalecimento de apoiadores para champions</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" onClick={() => applyPreset('convert_neutrals')} className="text-xs"><Users className="w-3 h-3 mr-1" />Converter Neutros</Button></TooltipTrigger><TooltipContent><p>Simular conversão de neutros para apoiadores</p></TooltipContent></Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2">
            {changes.length > 0 && (<><Button size="sm" variant="destructive" onClick={clearChanges} className="text-xs"><RotateCcw className="w-3 h-3 mr-1" />Limpar</Button>
              <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}><DialogTrigger asChild><Button size="sm" variant="outline" className="text-xs"><Save className="w-3 h-3 mr-1" />Salvar</Button></DialogTrigger>
                <DialogContent><DialogHeader><DialogTitle>Salvar Cenário</DialogTitle><DialogDescription>Dê um nome para este cenário de simulação</DialogDescription></DialogHeader>
                  <div className="space-y-4 py-4"><Input placeholder="Nome do cenário" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} /><Textarea placeholder="Descrição (opcional)" value={scenarioDescription} onChange={(e) => setScenarioDescription(e.target.value)} rows={3} /></div>
                  <DialogFooter><Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancelar</Button><Button onClick={handleSaveScenario} disabled={!scenarioName.trim()}>Salvar</Button></DialogFooter>
                </DialogContent></Dialog></>)}
            {savedScenarios.length > 0 && (
              <Dialog><DialogTrigger asChild><Button size="sm" variant="outline" className="text-xs"><FolderOpen className="w-3 h-3 mr-1" />Cenários ({savedScenarios.length})</Button></DialogTrigger>
                <DialogContent><DialogHeader><DialogTitle>Cenários Salvos</DialogTitle></DialogHeader>
                  <ScrollArea className="max-h-[400px]"><div className="space-y-2">{savedScenarios.map(scenario => (
                    <div key={scenario.id} className="p-3 rounded-lg border hover:border-primary/50 transition-colors">
                      <div className="flex items-center justify-between mb-1"><span className="font-medium text-sm">{scenario.name}</span>
                        <div className="flex items-center gap-1"><Button size="sm" variant="ghost" onClick={() => loadScenario(scenario)}><Play className="w-3 h-3" /></Button><Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteScenario(scenario.id)}><Trash2 className="w-3 h-3" /></Button></div></div>
                      {scenario.description && <p className="text-xs text-muted-foreground">{scenario.description}</p>}
                      <Badge variant="outline" className="text-xs mt-1">{scenario.changes.length} alterações</Badge>
                    </div>))}</div></ScrollArea>
                </DialogContent></Dialog>)}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Stakeholders</h4>
          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-2">
              {stakeholders.map(stakeholder => (
                <StakeholderSelector key={stakeholder.contact.id} stakeholder={stakeholder} isSelected={selectedId === stakeholder.contact.id}
                  currentChange={changes.find(c => c.contactId === stakeholder.contact.id)}
                  onSelect={() => setSelectedId(selectedId === stakeholder.contact.id ? null : stakeholder.contact.id)}
                  onChangeSupport={(support) => handleChangeSupport(stakeholder, support)} />
              ))}
            </div>
          </ScrollArea>
        </div>
        <div>
          <h4 className="text-sm font-medium mb-2">Resultado da Simulação</h4>
          {simulationResult ? <SimulationResultPanel result={simulationResult} /> : (
            <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center"><Play className="w-10 h-10 text-muted-foreground/30 mb-3" /><p className="text-sm text-muted-foreground">Selecione stakeholders e ajuste o suporte para ver a simulação</p></CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
