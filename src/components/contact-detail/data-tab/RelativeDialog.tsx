import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { differenceInYears } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

export const RELATIONSHIP_TYPES = ['conjuge', 'filho', 'filha', 'pai', 'mae', 'irmao', 'irma', 'socio', 'assistente', 'outro'];

export type RelativeInput = Partial<Tables<'contact_relatives'>>;

interface RelativeDialogProps {
  onSave: (data: RelativeInput) => void;
  initialData?: Partial<Tables<'contact_relatives'>>;
  trigger: React.ReactNode;
}

export function RelativeDialog({ 
  onSave, 
  initialData, 
  trigger 
}: RelativeDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: initialData?.name || '',
    relationship_type: initialData?.relationship_type || 'conjuge',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    occupation: initialData?.occupation || '',
    company: initialData?.company || '',
    notes: initialData?.notes || '',
    is_decision_influencer: initialData?.is_decision_influencer || false,
    age: initialData?.age?.toString() || '',
    birthday: initialData?.birthday || '',
  });

  const handleBirthdayChange = (dateStr: string) => {
    const updates: { birthday: string; age?: string } = { birthday: dateStr };
    if (dateStr) {
      const birthDate = new Date(dateStr);
      if (!isNaN(birthDate.getTime())) {
        updates.age = differenceInYears(new Date(), birthDate).toString();
      }
    }
    setForm(p => ({ ...p, ...updates }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    
    // Basic validation
    // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      alert('Por favor, insira um e-mail válido');
      return;
    }

    onSave({
      ...form,
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      occupation: form.occupation || null,
      company: form.company || null,
      notes: form.notes || null,
      age: form.age ? parseInt(form.age, 10) : null,
      birthday: form.birthday || null,
    });
    
    if (!initialData) {
      setForm({ name: '', relationship_type: 'conjuge', phone: '', email: '', occupation: '', company: '', notes: '', is_decision_influencer: false, age: '', birthday: '' });
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">
            {initialData ? 'Editar Relacionado' : 'Novo Relacionado'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Input 
            placeholder="Nome *" 
            aria-label="Nome do relacionado" 
            value={form.name} 
            onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} 
          />
          <Select value={form.relationship_type} onValueChange={(v) => setForm(p => ({ ...p, relationship_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RELATIONSHIP_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Telefone" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
            <Input placeholder="Email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Profissão" value={form.occupation} onChange={(e) => setForm(p => ({ ...p, occupation: e.target.value }))} />
            <Input placeholder="Empresa" value={form.company} onChange={(e) => setForm(p => ({ ...p, company: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" placeholder="Idade" min={0} max={150} value={form.age} onChange={(e) => setForm(p => ({ ...p, age: e.target.value }))} />
            <Input 
              type="date" 
              placeholder="Data Nascimento" 
              value={form.birthday} 
              onChange={(e) => handleBirthdayChange(e.target.value)} 
              aria-label="Data de nascimento"
            />
          </div>
          <Input placeholder="Notas" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input 
              type="checkbox" 
              checked={form.is_decision_influencer} 
              onChange={(e) => setForm(p => ({ ...p, is_decision_influencer: e.target.checked }))} 
              className="rounded border-input"
            />
            Influenciador de decisão
          </label>
          <Button size="sm" onClick={handleSubmit} disabled={!form.name.trim()}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
