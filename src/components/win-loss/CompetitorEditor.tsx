import { useState } from 'react';
import { useCompetitors, useUpsertCompetitor, useDeleteCompetitor } from '@/hooks/useWinLoss';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function CompetitorEditor() {
  const { data: competitors } = useCompetitors();
  const upsert = useUpsertCompetitor();
  const del = useDeleteCompetitor();

  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await upsert.mutateAsync({
        name: name.trim(),
        website: website || null,
        strengths: strengths.split(',').map(s => s.trim()).filter(Boolean),
        weaknesses: weaknesses.split(',').map(s => s.trim()).filter(Boolean),
        typical_price_range: priceRange || null,
      });
      setName(''); setWebsite(''); setStrengths(''); setWeaknesses(''); setPriceRange('');
      toast.success('Concorrente adicionado');
    } catch {
      toast.error('Erro ao adicionar');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Concorrentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Nome*</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" />
          </div>
          <div>
            <Label>Website</Label>
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Pontos fortes (vírgula)</Label>
            <Input value={strengths} onChange={(e) => setStrengths(e.target.value)} placeholder="UX, marca, suporte" />
          </div>
          <div>
            <Label>Pontos fracos (vírgula)</Label>
            <Input value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} placeholder="Preço, integração" />
          </div>
          <div className="md:col-span-2">
            <Label>Faixa de preço típica</Label>
            <Input value={priceRange} onChange={(e) => setPriceRange(e.target.value)} placeholder="R$ 5k–15k/mês" />
          </div>
        </div>
        <Button onClick={handleAdd} disabled={!name.trim() || upsert.isPending}>
          <Plus className="h-4 w-4 mr-1.5" />Adicionar concorrente
        </Button>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {(competitors ?? []).map(c => (
            <div key={c.id} className="p-3 rounded-md border bg-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{c.name}</h4>
                    {c.website && (
                      <a href={c.website} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {c.typical_price_range && (
                    <p className="text-xs text-muted-foreground mt-0.5">{c.typical_price_range}</p>
                  )}
                  {c.strengths.length > 0 && (
                    <p className="text-xs mt-1"><span className="text-emerald-600 dark:text-emerald-400">+</span> {c.strengths.join(', ')}</p>
                  )}
                  {c.weaknesses.length > 0 && (
                    <p className="text-xs"><span className="text-rose-600 dark:text-rose-400">−</span> {c.weaknesses.join(', ')}</p>
                  )}
                </div>
                <Button
                  size="icon" variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => del.mutate(c.id)}
                  aria-label="Remover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          {(!competitors || competitors.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum concorrente cadastrado.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
