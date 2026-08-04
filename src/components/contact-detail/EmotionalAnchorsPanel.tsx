import { Anchor, Trash2, Plus, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmotionalAnchors } from '@/hooks/useEmotionalAnchors';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const ANCHOR_TYPES = [
  { value: 'positive', label: 'Positiva', color: 'bg-success/10 text-success' },
  { value: 'negative', label: 'Negativa', color: 'bg-destructive/10 text-destructive' },
  { value: 'neutral', label: 'Neutra', color: 'bg-muted text-muted-foreground' },
];

const EMOTIONAL_STATES = [
  'Entusiasmo', 'Confiança', 'Curiosidade', 'Ansiedade', 'Frustração',
  'Nostalgia', 'Orgulho', 'Medo', 'Esperança', 'Surpresa',
];

export function EmotionalAnchorsPanel({ contactId }: Props) {
  const { anchors, loading, createAnchor, deleteAnchor } = useEmotionalAnchors(contactId);
  const [showForm, setShowForm] = useState(false);
  const [triggerWord, setTriggerWord] = useState('');
  const [anchorType, setAnchorType] = useState('positive');
  const [emotionalState, setEmotionalState] = useState('');
  const [context, setContext] = useState('');

  const handleCreate = async () => {
    if (!triggerWord || !emotionalState) return;
    await createAnchor({
      contact_id: contactId,
      trigger_word: triggerWord,
      anchor_type: anchorType,
      emotional_state: emotionalState,
      context: context || undefined,
      strength: 5,
    });
    setTriggerWord('');
    setContext('');
    setShowForm(false);
  };

  const strengthColor = (s: number | null) => {
    const v = s || 0;
    if (v >= 8) return 'text-success';
    if (v >= 5) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Anchor className="h-4 w-4 text-primary" />
            Âncoras Emocionais ({anchors.length})
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && anchors.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-xs gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando âncoras...
          </div>
        ) : (<>
        {showForm && (
          <div className="space-y-2 mb-3 p-3 rounded-lg border bg-muted/30">
            <Input placeholder="Palavra-gatilho" value={triggerWord} onChange={e => setTriggerWord(e.target.value)} className="text-sm" />
            <div className="flex gap-2">
              <Select value={anchorType} onValueChange={setAnchorType}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANCHOR_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={emotionalState} onValueChange={setEmotionalState}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="Estado emocional" /></SelectTrigger>
                <SelectContent>
                  {EMOTIONAL_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Contexto (opcional)" value={context} onChange={e => setContext(e.target.value)} className="text-sm" />
            <Button size="sm" onClick={handleCreate} disabled={!triggerWord || !emotionalState} className="w-full">Salvar</Button>
          </div>
        )}
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : anchors.length > 0 ? (
          <div className="space-y-2">
            {anchors.map(a => {
              const typeConfig = ANCHOR_TYPES.find(t => t.value === a.anchor_type);
              return (
                <div key={a.id} className="flex items-center justify-between rounded-lg border p-2 text-sm group">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className={cn('h-3.5 w-3.5 shrink-0', strengthColor(a.strength))} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground truncate">"{a.trigger_word}"</span>
                        <Badge className={cn('text-[10px]', typeConfig?.color)}>{a.emotional_state}</Badge>
                      </div>
                      {a.context && <p className="text-xs text-muted-foreground truncate">{a.context}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={cn('text-xs font-medium', strengthColor(a.strength))}>{a.strength}/10</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={() => deleteAnchor(a.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Nenhuma âncora emocional registrada</p>
        )}
        </>)}
      </CardContent>
    </Card>
  );
}
