import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Heading as HeadingIcon, Type, MousePointer2, Image as ImageIcon,
  Minus, Move, Trash2, ArrowUp, ArrowDown,
} from 'lucide-react';
import { createBlock, type EmailBlock, type EmailBlockType } from './types';
import { renderBlocksToHtml } from '@/lib/emailBuilderRenderer';

const PALETTE: { type: EmailBlockType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'heading', label: 'Título', icon: HeadingIcon },
  { type: 'text', label: 'Parágrafo', icon: Type },
  { type: 'button', label: 'Botão', icon: MousePointer2 },
  { type: 'image', label: 'Imagem', icon: ImageIcon },
  { type: 'divider', label: 'Divisor', icon: Minus },
  { type: 'spacer', label: 'Espaço', icon: Move },
];

interface Props {
  blocks: EmailBlock[];
  onBlocksChange: (b: EmailBlock[]) => void;
}

export function EmailBuilder({ blocks, onBlocksChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const html = useMemo(() => renderBlocksToHtml(blocks), [blocks]);
  const selected = blocks.find(b => b.id === selectedId) ?? null;

  const update = (next: EmailBlock[]) => onBlocksChange(next);
  const add = (type: EmailBlockType) => {
    const block = createBlock(type);
    update([...blocks, block]);
    setSelectedId(block.id);
  };
  const remove = (id: string) => {
    update(blocks.filter(b => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  };
  const move = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex(b => b.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };
  const patch = <K extends keyof EmailBlock>(id: string, key: K, value: EmailBlock[K]) => {
    update(blocks.map(b => (b.id === id ? { ...b, [key]: value } as EmailBlock : b)));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_280px] gap-3">
      {/* Palette */}
      <Card className="p-2 h-fit">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2 px-1">Blocos</p>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
          {PALETTE.map(p => (
            <Button
              key={p.type}
              variant="ghost"
              size="sm"
              className="justify-start h-8 text-xs"
              onClick={() => add(p.type)}
            >
              <p.icon className="w-3.5 h-3.5 mr-1.5" />
              {p.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Canvas */}
      <Card className="overflow-hidden">
        <Tabs defaultValue="visual">
          <div className="flex items-center justify-between border-b px-3 py-1.5">
            <TabsList className="h-7">
              <TabsTrigger value="visual" className="text-xs h-6">Visual</TabsTrigger>
              <TabsTrigger value="preview" className="text-xs h-6">Preview</TabsTrigger>
              <TabsTrigger value="html" className="text-xs h-6">HTML</TabsTrigger>
            </TabsList>
            <span className="text-[10px] text-muted-foreground">{blocks.length} blocos</span>
          </div>

          <TabsContent value="visual" className="m-0 p-3 bg-muted/30 min-h-[400px]">
            {blocks.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                Adicione blocos pela paleta à esquerda para começar.
              </div>
            ) : (
              <div className="space-y-1">
                {blocks.map(b => (
                  <div
                    key={b.id}
                    onClick={() => setSelectedId(b.id)}
                    className={`group relative bg-background border rounded p-2 cursor-pointer transition ${
                      selectedId === b.id ? 'border-primary ring-1 ring-primary/30' : 'border-border'
                    }`}
                  >
                    <BlockPreview block={b} />
                    <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                      <Button size="icon" aria-label="Mover para cima" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); move(b.id, -1); }}>
                        <ArrowUp className="w-3 h-3" />
                      </B<Button size="icon" aria-label="Mover para baixo" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); move(b.id, 1); }}>
                        <ArrowDown className="w-3 h-3" />
                      </<Button size="icon" aria-label="Remover" variant="ghost" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); remove(b.id); }}>
                        <Trash2 className="w-3 h-3" />
                      </Button>ash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="m-0 p-0">
            <iframe title="Preview" srcDoc={html} className="w-full h-[500px] border-0 bg-muted/30" sandbox="" />
          </TabsContent>

          <TabsContent value="html" className="m-0 p-0">
            <pre className="text-[10px] p-3 bg-muted/40 overflow-auto max-h-[500px] whitespace-pre-wrap">{html}</pre>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Inspector */}
      <Card className="p-3 h-fit">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Propriedades</p>
        {!selected ? (
          <p className="text-xs text-muted-foreground">Selecione um bloco para editar.</p>
        ) : (
          <Inspector block={selected} onChange={(k, v) => patch(selected.id, k as keyof EmailBlock, v as never)} />
        )}
      </Card>
    </div>
  );
}

function BlockPreview({ block }: { block: EmailBlock }) {
  switch (block.type) {
    case 'heading': {
      const cls = block.level === 1 ? 'text-2xl' : block.level === 2 ? 'text-lg' : 'text-base';
      return <p className={`${cls} font-bold`} style={{ textAlign: block.align }}>{block.text}</p>;
    }
    case 'text':
      return <p className="text-xs whitespace-pre-wrap" style={{ textAlign: block.align }}>{block.text}</p>;
    case 'button':
      return <div style={{ textAlign: block.align }}><span className="inline-block bg-primary text-primary-foreground px-3 py-1 text-xs rounded">{block.label}</span></div>;
    case 'image':
      return <img src={block.src} alt={block.alt} className="max-w-full h-auto rounded" />;
    case 'divider':
      return <hr className="border-t border-border" />;
    case 'spacer':
      return <div className="text-[10px] text-muted-foreground italic">↕ {block.height}px</div>;
  }
}

function Inspector({ block, onChange }: { block: EmailBlock; onChange: (k: string, v: unknown) => void }) {
  const alignBtns = (current: string, key = 'align') => (
    <div className="flex gap-1">
      {(['left', 'center', 'right'] as const).map(a => (
        <Button
          key={a}
          size="sm"
          variant={current === a ? 'default' : 'outline'}
          className="h-7 text-[10px] flex-1"
          onClick={() => onChange(key, a)}
        >
          {a === 'left' ? 'Esq' : a === 'center' ? 'Centro' : 'Dir'}
        </Button>
      ))}
    </div>
  );

  switch (block.type) {
    case 'heading':
      return (
        <div className="space-y-2">
          <div><Label className="text-[10px]">Texto</Label><Input value={block.text} onChange={e => onChange('text', e.target.value)} className="h-7 text-xs" /></div>
          <div><Label className="text-[10px]">Nível</Label>
            <div className="flex gap-1">
              {[1, 2, 3].map(l => (
                <Button key={l} size="sm" variant={block.level === l ? 'default' : 'outline'} className="h-7 text-[10px] flex-1" onClick={() => onChange('level', l)}>H{l}</Button>
              ))}
            </div>
          </div>
          <div><Label className="text-[10px]">Alinhamento</Label>{alignBtns(block.align)}</div>
        </div>
      );
    case 'text':
      return (
        <div className="space-y-2">
          <div><Label className="text-[10px]">Conteúdo</Label><Textarea value={block.text} onChange={e => onChange('text', e.target.value)} className="text-xs min-h-[100px]" /></div>
          <div><Label className="text-[10px]">Alinhamento</Label>{alignBtns(block.align)}</div>
        </div>
      );
    case 'button':
      return (
        <div className="space-y-2">
          <div><Label className="text-[10px]">Rótulo</Label><Input value={block.label} onChange={e => onChange('label', e.target.value)} className="h-7 text-xs" /></div>
          <div><Label className="text-[10px]">URL</Label><Input value={block.href} onChange={e => onChange('href', e.target.value)} className="h-7 text-xs" /></div>
          <div><Label className="text-[10px]">Alinhamento</Label>{alignBtns(block.align)}</div>
        </div>
      );
    case 'image':
      return (
        <div className="space-y-2">
          <div><Label className="text-[10px]">URL da imagem</Label><Input value={block.src} onChange={e => onChange('src', e.target.value)} className="h-7 text-xs" /></div>
          <div><Label className="text-[10px]">Texto alternativo</Label><Input value={block.alt} onChange={e => onChange('alt', e.target.value)} className="h-7 text-xs" /></div>
          <div><Label className="text-[10px]">Largura (px)</Label><Input type="number" value={block.width ?? ''} onChange={e => onChange('width', e.target.value ? Number(e.target.value) : undefined)} className="h-7 text-xs" /></div>
        </div>
      );
    case 'spacer':
      return (
        <div><Label className="text-[10px]">Altura (px)</Label><Input type="number" value={block.height} onChange={e => onChange('height', Number(e.target.value) || 0)} className="h-7 text-xs" /></div>
      );
    case 'divider':
      return <p className="text-[10px] text-muted-foreground">Sem propriedades.</p>;
  }
}
