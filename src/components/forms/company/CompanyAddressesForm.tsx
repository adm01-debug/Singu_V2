import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, MapPin } from 'lucide-react';
import type { CompanyAddress } from '@/hooks/useCompanyRelatedData';

const addressTypes = [
  { value: 'comercial', label: 'Comercial' },
  { value: 'entrega', label: 'Entrega' },
  { value: 'cobranca', label: 'Cobrança' },
  { value: 'filial', label: 'Filial' },
  { value: 'deposito', label: 'Depósito' },
];

interface Props {
  companyId: string;
  addresses: CompanyAddress[];
  onSave: (address: CompanyAddress) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const emptyAddress = (companyId: string): CompanyAddress => ({
  company_id: companyId,
  tipo: 'comercial',
  is_primary: false,
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  pais: 'Brasil',
  ponto_referencia: '',
  instrucoes_entrega: '',
  horario_funcionamento: '',
});

export function CompanyAddressesForm({ companyId, addresses, onSave, onDelete, isLoading }: Props) {
  const [items, setItems] = useState<CompanyAddress[]>(addresses.length > 0 ? addresses : [emptyAddress(companyId)]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);

  if (addresses.length > 0 && items.length === 1 && !items[0].id && !items[0].logradouro) {
    setItems(addresses);
  }

  const updateItem = (idx: number, field: string, value: unknown) => {
    setItems(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const addItem = () => setItems(prev => [...prev, emptyAddress(companyId)]);

  const handleSave = async (idx: number) => {
    setSavingIdx(idx);
    try {
      await onSave(items[idx]);
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
    return <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando endereços...</div>;
  }

  return (
    <div className="space-y-4">
      {items.map((addr, idx) => (
        <div key={addr.id || idx} className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="w-4 h-4 text-primary" />
              Endereço {idx + 1}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => handleSave(idx)} disabled={savingIdx === idx}>
                {savingIdx === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Salvar'}
              </Button>
              {items.length > 1 && (
                <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(idx)} disabled={deletingIdx === idx}>
                  {deletingIdx === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo</Label>
              <Select value={addr.tipo || 'comercial'} onValueChange={v => updateItem(idx, 'tipo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {addressTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CEP</Label>
              <Input placeholder="01310-100" value={addr.cep || ''} onChange={e => updateItem(idx, 'cep', e.target.value)} maxLength={10} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Logradouro</Label>
              <Input placeholder="Av. Paulista" value={addr.logradouro || ''} onChange={e => updateItem(idx, 'logradouro', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Número</Label>
              <Input placeholder="1000" value={addr.numero || ''} onChange={e => updateItem(idx, 'numero', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Complemento</Label>
              <Input placeholder="Sala 101" value={addr.complemento || ''} onChange={e => updateItem(idx, 'complemento', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bairro</Label>
              <Input placeholder="Bela Vista" value={addr.bairro || ''} onChange={e => updateItem(idx, 'bairro', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cidade</Label>
              <Input placeholder="São Paulo" value={addr.cidade || ''} onChange={e => updateItem(idx, 'cidade', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Estado</Label>
              <Input placeholder="SP" maxLength={2} value={addr.estado || ''} onChange={e => updateItem(idx, 'estado', e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">País</Label>
              <Input placeholder="Brasil" value={addr.pais || 'Brasil'} onChange={e => updateItem(idx, 'pais', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Horário Funcionamento</Label>
              <Input placeholder="08:00-18:00" value={addr.horario_funcionamento || ''} onChange={e => updateItem(idx, 'horario_funcionamento', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ponto de Referência</Label>
              <Input placeholder="Próximo ao metrô" value={addr.ponto_referencia || ''} onChange={e => updateItem(idx, 'ponto_referencia', e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Instruções de Entrega</Label>
            <Textarea placeholder="Observações para entrega..." className="min-h-[60px]" value={addr.instrucoes_entrega || ''} onChange={e => updateItem(idx, 'instrucoes_entrega', e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-xs">
            <Checkbox checked={addr.is_primary ?? false} onCheckedChange={v => updateItem(idx, 'is_primary', v)} />
            Endereço Principal
          </label>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={addItem}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar Endereço
      </Button>
    </div>
  );
}
