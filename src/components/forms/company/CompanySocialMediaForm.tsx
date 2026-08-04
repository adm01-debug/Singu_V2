import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Loader2, Share2 } from 'lucide-react';
import type { CompanySocialMedia } from '@/hooks/useCompanyRelatedData';

const platforms = [
  { value: 'website', label: '🌐 Website' },
  { value: 'instagram', label: '📸 Instagram' },
  { value: 'linkedin', label: '💼 LinkedIn' },
  { value: 'facebook', label: '📘 Facebook' },
  { value: 'youtube', label: '🎬 YouTube' },
  { value: 'x', label: '𝕏 X (Twitter)' },
  { value: 'tiktok', label: '🎵 TikTok' },
  { value: 'whatsapp', label: '💬 WhatsApp' },
];

interface Props {
  companyId: string;
  socialMedia: CompanySocialMedia[];
  onSave: (item: CompanySocialMedia) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const emptyItem = (companyId: string): CompanySocialMedia => ({
  company_id: companyId,
  plataforma: 'instagram',
  handle: '',
  url: '',
  nome_perfil: '',
  is_active: true,
});

export function CompanySocialMediaForm({ companyId, socialMedia, onSave, onDelete, isLoading }: Props) {
  const [items, setItems] = useState<CompanySocialMedia[]>(socialMedia.length > 0 ? socialMedia : [emptyItem(companyId)]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);

  if (socialMedia.length > 0 && items.length === 1 && !items[0].id && !items[0].handle && !items[0].url) {
    setItems(socialMedia);
  }

  const updateItem = (idx: number, field: string, value: unknown) => {
    setItems(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const addItem = () => setItems(prev => [...prev, emptyItem(companyId)]);

  const handleSave = async (idx: number) => {
    const item = items[idx];
    if (!item.url?.trim() && !item.handle?.trim()) return;
    setSavingIdx(idx);
    try {
      await onSave(item);
    } finally {
      setSavingIdx(null);
    }
  };

  const handleDelete = async (idx: number) => {
    const item = items[idx];
    if (item.id) {
      setDeletingIdx(idx);
      try {
        await onDelete(item.id);
        setItems(prev => prev.filter((_, i) => i !== idx));
      } finally {
        setDeletingIdx(null);
      }
    } else {
      setItems(prev => prev.filter((_, i) => i !== idx));
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando redes sociais...</div>;
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={item.id || idx} className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Share2 className="w-4 h-4 text-primary" />
              Rede Social {idx + 1}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => handleSave(idx)} disabled={savingIdx === idx || (!item.url?.trim() && !item.handle?.trim())}>
                {savingIdx === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar'}
              </Button>
              {items.length > 1 && (
                <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(idx)} disabled={deletingIdx === idx}>
                  {deletingIdx === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Plataforma</Label>
              <Select value={item.plataforma} onValueChange={v => updateItem(idx, 'plataforma', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Handle / @</Label>
              <Input placeholder="@empresa" value={item.handle || ''} onChange={e => updateItem(idx, 'handle', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">URL</Label>
              <Input placeholder="https://..." value={item.url || ''} onChange={e => updateItem(idx, 'url', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome do Perfil</Label>
              <Input placeholder="Empresa Oficial" value={item.nome_perfil || ''} onChange={e => updateItem(idx, 'nome_perfil', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Observações</Label>
              <Input placeholder="Perfil ativo desde 2020" value={item.observacoes || ''} onChange={e => updateItem(idx, 'observacoes', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-xs">
              <Checkbox checked={item.is_active ?? true} onCheckedChange={v => updateItem(idx, 'is_active', v)} />
              Ativo
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Checkbox checked={item.is_verified ?? false} onCheckedChange={v => updateItem(idx, 'is_verified', v)} />
              Verificado
            </label>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={addItem}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar Rede Social
      </Button>
    </div>
  );
}
