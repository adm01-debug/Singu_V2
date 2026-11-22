import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useExportCompaniesCsv } from '@/hooks/useCompanyActions';

interface Props {
  filters?: Record<string, unknown>;
}

export function CompaniesExportButton({ filters }: Props) {
  const exportCsv = useExportCompaniesCsv();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={exportCsv.isPending}
      onClick={() => exportCsv.mutate(filters)}
    >
      {exportCsv.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Exportar CSV
    </Button>
  );
}
