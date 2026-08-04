import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useBulkImport, type ImportEntityType } from '@/hooks/useBulkImport';
import { cn } from '@/lib/utils';

interface BulkImportDialogProps {
  entityType: ImportEntityType;
  trigger?: React.ReactNode;
}

export function BulkImportDialog({ entityType, trigger }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { parseFile, preview, headers, file, validFields, importMutation, reset, isImporting } = useBulkImport(entityType);

  const label = entityType === 'contacts' ? 'Contatos' : 'Empresas';

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) parseFile(f);
  };

  const handleImport = async () => {
    const result = await importMutation.mutateAsync();
    if (result.errors.length === 0) {
      setTimeout(() => { reset(); setOpen(false); }, 1500);
    }
  };

  const handleClose = () => {
    reset();
    setOpen(false);
  };

  const matchedHeaders = headers.filter(h => validFields.includes(h));
  const unmatchedHeaders = headers.filter(h => !validFields.includes(h) && h !== 'user_id');

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar {label}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar {label} via CSV
          </DialogTitle>
        </DialogHeader>

        {!file ? (
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium text-foreground">Clique para selecionar um arquivo CSV</p>
            <p className="text-xs text-muted-foreground mt-1">
              Colunas aceitas: {validFields.slice(0, 6).join(', ')}...
            </p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <Button variant="ghost" size="icon" aria-label="Fechar" onClick={reset} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Column mapping */}
            <div>
              <p className="text-sm font-medium mb-2">Mapeamento de colunas</p>
              <div className="flex flex-wrap gap-1.5">
                {matchedHeaders.map(h => (
                  <Badge key={h} variant="default" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> {h}
                  </Badge>
                ))}
                {unmatchedHeaders.map(h => (
                  <Badge key={h} variant="outline" className="text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 mr-1" /> {h} (ignorado)
                  </Badge>
                ))}
              </div>
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Pré-visualização ({preview.length} linhas)</p>
                <ScrollArea className="max-h-[200px] border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        {matchedHeaders.map(h => (
                          <th key={h} className="p-2 text-left font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b">
                          {matchedHeaders.map(h => (
                            <td key={h} className="p-2 truncate max-w-[150px]">{row[h] ?? ''}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            )}

            {/* Import result */}
            {importMutation.isSuccess && importMutation.data && (
              <div className={cn(
                'p-3 rounded-lg text-sm',
                importMutation.data.errors.length === 0 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              )}>
                <p className="font-medium">
                  {importMutation.data.success}/{importMutation.data.total} importados com sucesso
                </p>
                {importMutation.data.errors.length > 0 && (
                  <ScrollArea className="max-h-[100px] mt-2">
                    {importMutation.data.errors.slice(0, 10).map((e, i) => (
                      <p key={i} className="text-xs">Linha {e.row}: {e.message}</p>
                    ))}
                  </ScrollArea>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || matchedHeaders.length === 0}
              >
                {isImporting ? 'Importando...' : `Importar ${label}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
