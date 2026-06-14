import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileSpreadsheet, FileJson, FileText, Loader2, Settings, Calendar, Filter, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from "@/lib/logger";
import { entityConfigs, EntityType, ColumnConfig } from '@/data/exporterConfigs';

type ExportFormat = 'csv' | 'json';

interface AdvancedDataExporterProps {
  entityType: EntityType;
  className?: string;
}

export function AdvancedDataExporter({ entityType, className }: AdvancedDataExporterProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [columns, setColumns] = useState<ColumnConfig[]>(entityConfigs[entityType].columns);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const toggleColumn = useCallback((key: string) => { setColumns(prev => prev.map(col => col.key === key ? { ...col, selected: !col.selected } : col)); }, []);
  const selectAllColumns = useCallback(() => { setColumns(prev => prev.map(col => ({ ...col, selected: true }))); }, []);
  const deselectAllColumns = useCallback(() => { setColumns(prev => prev.map(col => ({ ...col, selected: false }))); }, []);

  const handleExport = async () => {
    setIsExporting(true); setExportComplete(false);
    try {
      const selectedColumns = columns.filter(col => col.selected).map(col => col.key);
      if (selectedColumns.length === 0) { toast.error('Selecione pelo menos uma coluna para exportar'); setIsExporting(false); return; }
      let query = supabase.from(entityType).select(selectedColumns.join(','));
      if (dateRange.from) query = query.gte('created_at', dateRange.from.toISOString());
      if (dateRange.to) query = query.lte('created_at', dateRange.to.toISOString());
      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) { toast.warning('Nenhum dado para exportar'); setIsExporting(false); return; }

      let content: string, mimeType: string, filename: string;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      if (format === 'json') {
        content = JSON.stringify(data, null, 2); mimeType = 'application/json'; filename = `${entityType}_${timestamp}.json`;
      } else {
        const headers = selectedColumns.join(',');
        const rows = data.map(row => selectedColumns.map(col => {
          const value = row[col];
          if (value === null || value === undefined) { return ''; }
          if (Array.isArray(value)) { return `"${value.join('; ')}"`; }
          if (typeof value === 'object') { return `"${JSON.stringify(value)}"`; }
          if (typeof value === 'string' && value.includes(',')) { return `"${value}"`; }
          return String(value);
        }).join(',')).join('\n');
        content = `${headers}\n${rows}`; mimeType = 'text/csv'; filename = `${entityType}_${timestamp}.csv`;
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = filename;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      setExportComplete(true); toast.success(`${data.length} registros exportados com sucesso!`);
      setTimeout(() => { setExportComplete(false); setOpen(false); }, 2000);
    } catch (error) { 
      const msg = error instanceof Error ? error.message : 'Erro ao exportar dados';
      logger.error('Export error:', { error: msg }); 
      toast.error(msg); 
    }
    finally { setIsExporting(false); }
  };

  const formatIcons: Record<ExportFormat, React.ComponentType<{ className?: string }>> = { csv: FileSpreadsheet, json: FileJson };
  const config = entityConfigs[entityType];
  const selectedCount = columns.filter(c => c.selected).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className={cn("gap-2", className)}><Download className="w-4 h-4" />Exportar</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Download className="w-5 h-5 text-primary" />Exportar {config.label}</DialogTitle></DialogHeader>
        <AnimatePresence mode="wait">
          {exportComplete ? (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="py-12 flex flex-col items-center gap-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}><CheckCircle className="w-16 h-16 text-success" /></motion.div>
              <p className="text-lg font-medium">Exportação concluída!</p>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Tabs defaultValue="columns" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="columns" className="gap-2"><Settings className="w-4 h-4" />Colunas</TabsTrigger>
                  <TabsTrigger value="filters" className="gap-2"><Filter className="w-4 h-4" />Filtros</TabsTrigger>
                  <TabsTrigger value="format" className="gap-2"><FileText className="w-4 h-4" />Formato</TabsTrigger>
                </TabsList>
                <TabsContent value="columns" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{selectedCount} de {columns.length} colunas selecionadas</p>
                    <div className="flex gap-2"><Button variant="ghost" size="sm" onClick={selectAllColumns}>Selecionar Tudo</Button><Button variant="ghost" size="sm" onClick={deselectAllColumns}>Limpar</Button></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                    {columns.map((col) => (
                      <motion.label key={col.key} className={cn("flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors", col.selected ? "bg-primary/10" : "hover:bg-muted")} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Checkbox checked={col.selected} onCheckedChange={() => toggleColumn(col.key)} /><span className="text-sm">{col.label}</span>
                      </motion.label>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="filters" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Período de Criação</Label>
                      <div className="flex gap-2">
                        {(['from', 'to'] as const).map(key => (
                          <Popover key={key}>
                            <PopoverTrigger asChild><Button variant="outline" className="flex-1 justify-start"><Calendar className="w-4 h-4 mr-2" />{dateRange[key] ? formatDate(dateRange[key]!, 'dd/MM/yyyy', { locale: ptBR }) : key === 'from' ? 'Data inicial' : 'Data final'}</Button></PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><CalendarComponent mode="single" selected={dateRange[key]} onSelect={(date) => setDateRange(prev => ({ ...prev, [key]: date }))} locale={ptBR} /></PopoverContent>
                          </Popover>
                        ))}
                      </div>
                    </div>
                    {(dateRange.from || dateRange.to) && <Button variant="ghost" size="sm" onClick={() => setDateRange({})}>Limpar filtros de data</Button>}
                  </div>
                </TabsContent>
                <TabsContent value="format" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {(['csv', 'json'] as ExportFormat[]).map((f) => { const Icon = formatIcons[f]; return (
                      <motion.button key={f} onClick={() => setFormat(f)} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all", format === f ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Icon className={cn("w-8 h-8", format === f ? "text-primary" : "text-muted-foreground")} /><span className="font-medium uppercase">{f}</span><span className="text-xs text-muted-foreground">{f === 'csv' ? 'Compatível com Excel' : 'Formato estruturado'}</span>
                      </motion.button>
                    ); })}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
        {!exportComplete && (
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleExport} disabled={isExporting || selectedCount === 0} className="gap-2">
              {isExporting ? <><Loader2 className="w-4 h-4 animate-spin" />Exportando...</> : <><Download className="w-4 h-4" />Exportar {selectedCount > 0 && `(${selectedCount} colunas)`}</>}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AdvancedDataExporter;
