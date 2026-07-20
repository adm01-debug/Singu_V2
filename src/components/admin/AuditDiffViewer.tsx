import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface AuditDiffViewerProps {
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  action: string;
}

function getChangedFields(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null
): { added: string[]; removed: string[]; changed: string[]; unchanged: string[] } {
  const allKeys = new Set([
    ...Object.keys(oldData || {}),
    ...Object.keys(newData || {}),
  ]);

  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  const unchanged: string[] = [];

  allKeys.forEach(key => {
    const inOld = oldData && key in oldData;
    const inNew = newData && key in newData;

    if (!inOld && inNew) added.push(key);
    else if (inOld && !inNew) removed.push(key);
    else if (JSON.stringify(oldData?.[key]) !== JSON.stringify(newData?.[key])) changed.push(key);
    else unchanged.push(key);
  });

  return { added, removed, changed, unchanged };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" aria-label="Confirmar" className="h-6 w-6" onClick={handleCopy}>
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
    </Button>
  );
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'object') return JSON.stringify(val, null, 2);
  return String(val);
}

export function AuditDiffViewer({ oldData, newData, action }: AuditDiffViewerProps) {
  const [showUnchanged, setShowUnchanged] = useState(false);
  const { added, removed, changed, unchanged } = getChangedFields(oldData, newData);

  if (action === 'INSERT' && newData) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge className="bg-success/20 text-success">Novo registro</Badge>
          <CopyButton text={JSON.stringify(newData, null, 2)} />
        </div>
        <div className="bg-success/5 border border-success/20 rounded-md p-3 text-xs font-mono max-h-64 overflow-auto">
          {Object.entries(newData).map(([key, val]) => (
            <div key={key} className="text-success">
              <span className="text-muted-foreground">{key}:</span> {formatValue(val)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (action === 'DELETE' && oldData) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="destructive">Registro removido</Badge>
          <CopyButton text={JSON.stringify(oldData, null, 2)} />
        </div>
        <div className="bg-destructive/5 border border-destructive/20 rounded-md p-3 text-xs font-mono max-h-64 overflow-auto">
          {Object.entries(oldData).map(([key, val]) => (
            <div key={key} className="text-destructive">
              <span className="text-muted-foreground">{key}:</span> {formatValue(val)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // UPDATE - side by side diff
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {changed.length > 0 && <Badge variant="secondary">{changed.length} alterado(s)</Badge>}
        {added.length > 0 && <Badge className="bg-success/20 text-success">{added.length} adicionado(s)</Badge>}
        {removed.length > 0 && <Badge variant="destructive">{removed.length} removido(s)</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
          <span>Antes</span>
          {oldData && <CopyButton text={JSON.stringify(oldData, null, 2)} />}
        </div>
        <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
          <span>Depois</span>
          {newData && <CopyButton text={JSON.stringify(newData, null, 2)} />}
        </div>
      </div>

      <div className="border rounded-md overflow-hidden text-xs font-mono max-h-80 overflow-y-auto">
        {changed.map(key => (
          <div key={key} className="grid grid-cols-2 border-b last:border-0">
            <div className="p-2 bg-destructive/5 border-r">
              <span className="text-muted-foreground">{key}: </span>
              <span className="text-destructive">{formatValue(oldData?.[key])}</span>
            </div>
            <div className="p-2 bg-success/5">
              <span className="text-muted-foreground">{key}: </span>
              <span className="text-success">{formatValue(newData?.[key])}</span>
            </div>
          </div>
        ))}
        {added.map(key => (
          <div key={key} className="grid grid-cols-2 border-b last:border-0">
            <div className="p-2 bg-muted/30 border-r text-muted-foreground italic">—</div>
            <div className="p-2 bg-success/5">
              <span className="text-muted-foreground">{key}: </span>
              <span className="text-success">{formatValue(newData?.[key])}</span>
            </div>
          </div>
        ))}
        {removed.map(key => (
          <div key={key} className="grid grid-cols-2 border-b last:border-0">
            <div className="p-2 bg-destructive/5 border-r">
              <span className="text-muted-foreground">{key}: </span>
              <span className="text-destructive">{formatValue(oldData?.[key])}</span>
            </div>
            <div className="p-2 bg-muted/30 text-muted-foreground italic">—</div>
          </div>
        ))}
      </div>

      {unchanged.length > 0 && (
        <button
          onClick={() => setShowUnchanged(!showUnchanged)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showUnchanged ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {unchanged.length} campo(s) inalterado(s)
        </button>
      )}

      {showUnchanged && (
        <div className="border rounded-md text-xs font-mono max-h-40 overflow-y-auto bg-muted/10 p-2">
          {unchanged.map(key => (
            <div key={key} className="text-muted-foreground py-0.5">
              {key}: {formatValue(newData?.[key] ?? oldData?.[key])}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
