import { useState, useRef } from 'react';
import { FileText, Upload, Trash2, Download, File, Image, FileSpreadsheet, Presentation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDocuments, DocumentType } from '@/hooks/useDocuments';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  contract: 'Contrato',
  proposal: 'Proposta',
  nda: 'NDA',
  invoice: 'Nota Fiscal',
  report: 'Relatório',
  presentation: 'Apresentação',
  spreadsheet: 'Planilha',
  image: 'Imagem',
  other: 'Outro',
};

const DOC_TYPE_ICONS: Record<string, typeof FileText> = {
  image: Image,
  spreadsheet: FileSpreadsheet,
  presentation: Presentation,
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  entityType: 'contact' | 'company' | 'deal';
  entityId: string;
}

export function DocumentsPanel({ entityType, entityId }: Props) {
  const { documents, isLoading, upload, remove } = useDocuments(entityType, entityId);
  const [docType, setDocType] = useState<DocumentType>('other');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    upload.mutate({ file, docType });
    e.target.value = '';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Documentos ({documents.length})
          </span>
          <div className="flex items-center gap-1.5">
            <Select value={docType} onValueChange={v => setDocType(v as DocumentType)}>
              <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={upload.isPending} className="h-7 text-xs">
              <Upload className="h-3 w-3 mr-1" /> Upload
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>
        ) : documents.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum documento vinculado.</p>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => {
              const Icon = DOC_TYPE_ICONS[doc.document_type] || File;
              return (
                <div key={doc.id} className="flex items-center justify-between border rounded-md px-3 py-2 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px] h-4">{DOC_TYPE_LABELS[doc.document_type]}</Badge>
                        {doc.file_size && <span>{formatFileSize(doc.file_size)}</span>}
                        <span>• {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-3 w-3" /></a>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => remove.mutate(doc.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
