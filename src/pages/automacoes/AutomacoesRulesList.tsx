import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Zap, Trash2, Edit2, History,
  ChevronRight, AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TRIGGER_OPTIONS, ACTION_OPTIONS, type AutomationRule, type AutomationLog } from '@/hooks/useAutomationRules';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AutomacoesRulesListProps {
  rules: AutomationRule[];
  logs: AutomationLog[];
  loading: boolean;
  deleteId: string | null;
  logsRuleId: string | null;
  onSetFormOpen: (open: boolean) => void;
  onEditRule: (rule: AutomationRule) => void;
  onToggleRule: (id: string) => void;
  onDeleteRequest: (id: string | null) => void;
  onDeleteConfirm: () => void;
  onViewLogs: (ruleId: string) => void;
  onCloseLogsRuleId: () => void;
}

export function AutomacoesRulesList({
  rules, logs, loading, deleteId, logsRuleId,
  onSetFormOpen, onEditRule, onToggleRule, onDeleteRequest, onDeleteConfirm,
  onViewLogs, onCloseLogsRuleId,
}: AutomacoesRulesListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Zap className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma automação criada</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Automatize tarefas repetitivas. Crie regras como "Quando não houver contato por 30 dias → Criar alerta"
          </p>
          <Button onClick={() => onSetFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Criar Primeira Automação
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <AnimatePresence>
          {rules.map((rule, index) => {
            const trigger = TRIGGER_OPTIONS.find(t => t.value === rule.trigger_type);
            const actionLabels = (Array.isArray(rule.actions) ? rule.actions : []).map(
              (a: { type: string }) => ACTION_OPTIONS.find(o => o.value === a.type)?.label ?? a.type
            );

            return (
              <motion.div key={rule.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: index * 0.05 }}>
                <Card className={!rule.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        <Switch checked={rule.is_active} onCheckedChange={() => onToggleRule(rule.id)} aria-label={`${rule.is_active ? 'Desativar' : 'Ativar'} ${rule.name}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{rule.name}</h3>
                          {rule.last_error && (
                            <Badge variant="destructive" className="text-[10px]">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Erro
                            </Badge>
                          )}
                        </div>
                        {rule.description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{rule.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] gap-1"><span>{trigger?.icon}</span>{trigger?.label}</Badge>
                          </span>
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          <div className="flex gap-1 flex-wrap">
                            {actionLabels.map((label: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">{label}</Badge>
                            ))}
                          </div>
                        </div>
                        {(rule.execution_count > 0 || rule.last_executed_at) && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1"><History className="w-3 h-3" />{rule.execution_count} execuções</span>
                            {rule.last_executed_at && (
                              <span>Última: {formatDistanceToNow(new Date(rule.last_executed_at), { locale: ptBR, addSuffix: true })}</span>
                            )}
                          </div>
                        )}
                        {rule.last_error && (
                          <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> {rule.last_error}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewLogs(rule.id)}
                          aria-label="Ver logs">
                          <History className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Editar" className="h-8 w-8" onClick={() => onEditRule(rule)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
    <Button variant="ghost" size="icon" aria-label="Remover" className="h-8 w-8 text-destructive" onClick={() => onDeleteRequest(rule.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>           </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && onDeleteRequest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir automação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. A regra será permanentemente removida.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logs Dialog */}
      {logsRuleId && (
        <AlertDialog open={!!logsRuleId} onOpenChange={(o) => !o && onCloseLogsRuleId()}>
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><History className="w-5 h-5 text-primary" />Histórico de Execuções</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma execução registrada</p>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                    {log.success ? <CheckCircle2 className="w-4 h-4 text-success mt-0.5" /> : <XCircle className="w-4 h-4 text-destructive mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.executed_at), { locale: ptBR, addSuffix: true })}</p>
                      <p className="text-xs mt-1">{log.trigger_entity_type}: <span className="text-muted-foreground">{log.trigger_entity_id.slice(0, 8)}...</span></p>
                      {log.error_message && <p className="text-xs text-destructive mt-1">{log.error_message}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Fechar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
