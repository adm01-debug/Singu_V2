import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Loader2, Phone } from 'lucide-react';
import type { CompanyPhone } from '@/hooks/useCompanyRelatedData';

const phoneTypes = [
  { value: 'fixo_comercial', label: 'Fixo Comercial' },
  { value: 'celular_corporativo', label: 'Celular Corporativo' },
  { value: 'celular_pessoal', label: 'Celular Pessoal' },
];

interface Props {
  companyId: string;
  phones: CompanyPhone[];
  onSave: (phone: CompanyPhone) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const emptyPhone = (companyId: string): CompanyPhone => ({
  company_id: companyId,
  phone_type: 'fixo_comercial',
  numero: '',
  is_primary: false,
  is_whatsapp: false,
  ramal: '',
  departamento: '',
  observacao: '',
});

export function CompanyPhonesForm({ companyId, phones, onSave, onDelete, isLoading }: Props) {
  const [items, setItems] = useState<CompanyPhone[]>(phones.length > 0 ? phones : [emptyPhone(companyId)]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);

  // Sync when phones load from server
  if (phones.length > 0 && items.length === 1 && !items[0].id && !items[0].numero) {
    setItems(phones);
  }

  const updateItem = (idx: number, field: string, value: unknown) => {
    setItems(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const addItem = () => setItems(prev => [...prev, emptyPhone(companyId)]);

  const isValidPhone = (num: string) => num.replace(/\D/g, '').length >= 8;

  const handleSave = async (idx: number) => {
    const item = items[idx];
    if (!item.numero?.trim() || !isValidPhone(item.numero)) return;
    setSavingIdx(idx);
    try {
      await onSave({
        ...item,
        numero_normalizado: item.numero.replace(/\D/g, ''),
      });
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
    return <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando telefones...</div>;
  }

  return (
    <div className="space-y-4">
      {items.map((phone, idx) => (
        <div key={phone.id || idx} className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Phone className="w-4 h-4 text-primary" />
              Telefone {idx + 1}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => handleSave(idx)} disabled={savingIdx === idx || !phone.numero?.trim()}>
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
              <Label className="text-xs">Tipo</Label>
              <Select value={phone.phone_type} onValueChange={v => updateItem(idx, 'phone_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {phoneTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Número *</Label>
              <Input placeholder="(11) 3333-4444" value={phone.numero || ''} onChange={e => updateItem(idx, 'numero', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ramal</Label>
              <Input placeholder="1234" value={phone.ramal || ''} onChange={e => updateItem(idx, 'ramal', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Departamento</Label>
              <Input placeholder="Comercial" value={phone.departamento || ''} onChange={e => updateItem(idx, 'departamento', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Observação</Label>
              <Input placeholder="Horário comercial" value={phone.observacao || ''} onChange={e => updateItem(idx, 'observacao', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-xs">
              <Checkbox checked={phone.is_primary ?? false} onCheckedChange={v => updateItem(idx, 'is_primary', v)} />
              Principal
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Checkbox checked={phone.is_whatsapp ?? false} onCheckedChange={v => updateItem(idx, 'is_whatsapp', v)} />
              WhatsApp
            </label>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={addItem}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar Telefone
      </Button>
    </div>
  );
}
