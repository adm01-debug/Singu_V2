import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Upload, FileJson, ClipboardPaste } from 'lucide-react';
import { parseBundle, type ExportablePreset, type PresetBundle } from '@/lib/searchPresetTransport';
import { useSearchPresets } from '@/hooks/useSearchPresets';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_BYTES = 50 * 1024;

export const ImportPresetsDialog = React.memo(function ImportPresetsDialog({ open, onOpenChange }: Props) {
  const { importPresets, presets } = useSearchPresets('interactions');
  const remaining = Math.max(0, 10 - presets.length);
  const [rawJson, setRawJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [bundle, setBundle] = useState<PresetBundle | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const willOverflow = bundle ? selected.size > remaining : false;
  const existingNames = new Set(presets.map((p) => p.name));

  const reset = useCallback(() => {
    setRawJson('');
    setError(null);
    setBundle(null);
    setSelected(new Set());
  }, []);

  const handleClose = useCallback((next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  }, [onOpenChange, reset]);

  const tryParse = useCallback((raw: string) => {
    if (raw.length > MAX_BYTES) {
      setError(`Arquivo muito grande (${(raw.length / 1024).toFixed(1)} KB, máx. 50 KB)`);
      setBundle(null);
      return;
    }
    const result = parseBundle(raw);
    if (result.ok === false) {
      setError(result.reason);
      setBundle(null);
      return;
    }
    setError(null);
    setBundle(result.bundle);
    setSelected(new Set(result.bundle.presets.map((_, i) => i)));
  }, []);

  const handleFile = useCallback((file: File) => {
    if (file.size > MAX_BYTES) {
      setError(`Arquivo muito grande (${(file.size / 1024).toFixed(1)} KB, máx. 50 KB)`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setRawJson(text);
      tryParse(text);
    };
    reader.onerror = () => setError('Falha ao ler arquivo');
    reader.readAsText(file);
  }, [tryParse]);

  const toggle = useCallback((idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const handleImport = useCallback(() => {
    if (!bundle) return;
    const items: Array<Omit<ExportablePreset, never>> = bundle.presets.filter((_, i) => selected.has(i));
    if (items.length === 0) {
      toast.error('Selecione ao menos uma busca');
      return;
    }
    const total = items.length;
    const { added, skipped, renamed, renamedDetails } = importPresets(items);
    if (added > 0) {
      const descParts: string[] = [];
      if (skipped > 0) {
        descParts.push(
          `${skipped} ignorada${skipped > 1 ? 's' : ''} — limite de 10 atingido`,
        );
      }
      if (renamed > 0) {
        const sample = renamedDetails
          .slice(0, 2)
          .map((r) => `"${r.from}" → "${r.to}"`)
          .join(', ');
        const extra = renamedDetails.length > 2 ? ` +${renamedDetails.length - 2}` : '';
        descParts.push(`${renamed} renomeada${renamed > 1 ? 's' : ''} (${sample}${extra})`);
      }
      toast.success(
        `${added} de ${total} busca${total > 1 ? 's' : ''} importada${added > 1 ? 's' : ''}`,
        descParts.length > 0 ? { description: descParts.join(' · '), duration: 6000 } : undefined,
      );
      handleClose(false);
    } else {
      toast.error('Nenhuma busca importada', {
        description: 'Você já tem 10 buscas salvas. Remova alguma antes de importar.',
        duration: 6000,
      });
    }
  }, [bundle, selected, importPresets, handleClose]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar buscas</DialogTitle>
          <DialogDescription>
            Cole um JSON exportado ou envie um arquivo `.json` com presets de busca.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="paste" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="paste" className="flex-1 gap-1.5">
              <ClipboardPaste className="w-4 h-4" />
              Colar JSON
            </TabsTrigger>
            <TabsTrigger value="file" className="flex-1 gap-1.5">
              <FileJson className="w-4 h-4" />
              Arquivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-2">
            <Textarea
              autoFocus
              placeholder='{"v":1,"kind":"interacoes-search-preset","presets":[…]}'
              value={rawJson}
              onChange={(e) => {
                setRawJson(e.target.value);
                if (e.target.value.trim()) tryParse(e.target.value);
                else { setError(null); setBundle(null); }
              }}
              className="min-h-32 font-mono text-xs"
              maxLength={MAX_BYTES}
            />
          </TabsContent>

          <TabsContent value="file" className="space-y-2">
            <div
              className="border border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleFile(f);
              }}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-foreground">Clique ou arraste um arquivo .json</p>
              <p className="text-xs text-muted-foreground mt-1">Máx. 50 KB</p>
            </div>
            <Input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </TabsContent>
        </Tabs>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {bundle && (
          <>
            <div className="space-y-2 max-h-56 overflow-y-auto border border-border rounded-md p-2">
              <p className="text-xs text-muted-foreground px-1">
                {bundle.presets.length} busca{bundle.presets.length > 1 ? 's' : ''} encontrada{bundle.presets.length > 1 ? 's' : ''}
                {' · '}
                <span className={remaining === 0 ? 'text-destructive font-medium' : ''}>
                  {remaining} vaga{remaining === 1 ? '' : 's'} disponíve{remaining === 1 ? 'l' : 'is'} (máx. 10)
                </span>
              </p>
              {bundle.presets.map((p, i) => {
                const conflict = existingNames.has(p.name);
                return (
                  <label
                    key={i}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/40 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggle(i)}
                      className="accent-primary"
                    />
                    <span className="text-sm text-foreground truncate flex-1">
                      {p.name}
                      {conflict && (
                        <span
                          className="ml-1.5 text-[10px] uppercase tracking-wide text-warning"
                          title="Já existe uma busca com este nome — será renomeada automaticamente"
                        >
                          renomear
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {Object.keys(p.filters).length} filtro{Object.keys(p.filters).length !== 1 ? 's' : ''}
                    </span>
                  </label>
                );
              })}
            </div>
            {willOverflow && (
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-warning/10 border border-warning/30 text-warning text-xs">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Você selecionou {selected.size} busca{selected.size > 1 ? 's' : ''}, mas só
                  cabem {remaining}. As {selected.size - remaining} excedentes serão ignoradas.
                </span>
              </div>
            )}
            {remaining === 0 && (
              <div className="flex items-start gap-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Limite de 10 buscas atingido. Remova alguma antes de importar.</span>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={() => handleClose(false)}>Cancelar</Button>
          <Button onClick={handleImport} disabled={!bundle || selected.size === 0}>
            Importar selecionados ({selected.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
