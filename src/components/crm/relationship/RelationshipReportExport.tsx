import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, FileSpreadsheet, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';
import { exportToCSV } from '@/lib/export-utils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactId: string;
  contactName: string;
}

export function RelationshipReportExport({ contactId, contactName }: Props) {
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      // Fetch timeline data for CSV
      const { data: interactions, error } = await supabase
        .from('interactions')
        .select('id, created_at, title, type, content, sentiment')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const exportData = interactions.map(i => ({
        Data: format(new Date(i.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        Titulo: i.title,
        Tipo: i.type,
        Conteudo: i.content || '',
        Sentimento: i.sentiment || 'neutral'
      }));

      exportToCSV(exportData, `Relatorio_Timeline_${contactName.replace(/\s+/g, '_')}`);
      toast.success('CSV exportado com sucesso');
    } catch (err) {
      toast.error('Erro ao exportar CSV: ' + parseApiError(err));
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      toast.info('Abrindo a impressão do relatório...');
      window.print();
    } catch (err) {
      toast.error('Erro ao abrir a impressão: ' + parseApiError(err));
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-sm">Exportar Relatório Consolidado</CardTitle>
            <CardDescription className="text-xs">Timeline, insights de neuromarketing e recomendações estratégicas</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 text-xs"
          onClick={handleExportCSV}
          disabled={isExportingCSV}
        >
          {isExportingCSV ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
          Exportar CSV
        </Button>
        <Button
          variant="default"
          size="sm"
          className="h-9 gap-2 text-xs"
          onClick={handleExportPDF}
          disabled={isExportingPDF}
        >
          {isExportingPDF ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Exportar PDF
        </Button>

        <div className="col-span-2 mt-2 pt-2 border-t border-primary/10 flex items-start gap-2">
          <Sparkles className="h-3 w-3 text-primary mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            O relatório PDF inclui análise de sentimentos por etapa, evolução da dominância cognitiva e sugestões de "Próxima Melhor Ação" baseadas em neuromarketing.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}