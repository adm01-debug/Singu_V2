import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Loader2, Mail } from 'lucide-react';
import type { CompanyEmail } from '@/hooks/useCompanyRelatedData';

const emailTypes = [
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'nfe', label: 'NF-e' },
  { value: 'marketing', label: 'Marketing' },
];

interface Props {
  companyId: string;
  emails: CompanyEmail[];
  onSave: (email: CompanyEmail) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const emptyEmail = (companyId: string): CompanyEmail => ({
  company_id: companyId,
  email_type: 'corporativo',
  email: '',
  is_primary: false,
  departamento: '',
  observacao: '',
});

export function CompanyEmailsForm({ companyId, emails, onSave, onDelete, isLoading }: Props) {
  const [items, setItems] = useState<CompanyEmail[]>(emails.length > 0 ? emails : [emptyEmail(companyId)]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [deletingIdx, setDeletingIdx] = useState<number | null>(null);

  if (emails.length > 0 && items.length === 1 && !items[0].id && !items[0].email) {
    setItems(emails);
  }

  const updateItem = (idx: number, field: string, value: unknown) => {
    setItems(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const addItem = () => setItems(prev => [...prev, emptyEmail(companyId)]);

  // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSave = async (idx: number) => {
    const item = items[idx];
    if (!item.email?.trim() || !isValidEmail(item.email)) return;
    setSavingIdx(idx);
    try {
      await onSave({ ...item, email_normalizado: item.email.toLowerCase().trim() });
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
    return <div className="flex items-center justify-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando emails...</div>;
  }

  return (
    <div className="space-y-4">
      {items.map((email, idx) => (
        <div key={email.id || idx} className="border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="w-4 h-4 text-primary" />
              Email {idx + 1}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => handleSave(idx)} disabled={savingIdx === idx || !email.email?.trim() || !isValidEmail(email.email || '')}>
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
              <Select value={email.email_type} onValueChange={v => updateItem(idx, 'email_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {emailTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Email *</Label>
              <Input placeholder="contato@empresa.com.br" value={email.email || ''} onChange={e => updateItem(idx, 'email', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Departamento</Label>
              <Input placeholder="Comercial" value={email.departamento || ''} onChange={e => updateItem(idx, 'departamento', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Observação</Label>
              <Input placeholder="Email principal" value={email.observacao || ''} onChange={e => updateItem(idx, 'observacao', e.target.value)} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs">
            <Checkbox checked={email.is_primary ?? false} onCheckedChange={v => updateItem(idx, 'is_primary', v)} />
            Email Principal
          </label>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" className="w-full" onClick={addItem}>
        <Plus className="w-4 h-4 mr-1" /> Adicionar Email
      </Button>
    </div>
  );
}
