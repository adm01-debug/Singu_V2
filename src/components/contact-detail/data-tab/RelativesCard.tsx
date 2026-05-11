import { useState } from 'react';
import {
   Users, Phone, Mail, Building2, AlertTriangle,
   Plus, Trash2, Edit2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { format, differenceInYears } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';

interface Props {
  relatives: Tables<'contact_relatives'>[];
  contactId: string;
   onAdd: (data: any) => void;
   onUpdate: (id: string, updates: any) => void;
   onDelete: (id: string) => void;
}

const RELATIONSHIP_TYPES = ['conjuge', 'filho', 'filha', 'pai', 'mae', 'irmao', 'irma', 'socio', 'assistente', 'outro'];

 function RelativeDialog({ 
   onSave, 
   initialData, 
   trigger 
 }: { 
   onSave: (data: any) => void, 
   initialData?: Partial<Tables<'contact_relatives'>>,
   trigger: React.ReactNode
 }) {
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
      const updates: any = { birthday: dateStr };
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
          <Input placeholder="Nome *" aria-label="Nome do relacionado" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} />
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
            <input type="checkbox" checked={form.is_decision_influencer} onChange={(e) => setForm(p => ({ ...p, is_decision_influencer: e.target.checked }))} className="rounded" />
            Influenciador de decisão
          </label>
          <Button size="sm" onClick={handleSubmit} disabled={!form.name.trim()}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

 export function RelativesCard({ relatives, onAdd, onUpdate, onDelete }: Props) {
   return (
     <Card>
       <CardHeader className="pb-3">
         <CardTitle className="flex items-center justify-between text-sm font-medium">
           <div className="flex items-center gap-2">
             <Users className="h-4 w-4 text-warning" />
             Relacionados ({relatives.length})
           </div>
           <RelativeDialog 
             onSave={onAdd} 
             trigger={
               <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                 <Plus className="h-3 w-3 mr-1" />Adicionar
               </Button>
             } 
           />
         </CardTitle>
       </CardHeader>
      <CardContent className="space-y-2">
         {relatives.length > 0 ? relatives.map((rel) => (
           <div key={rel.id} className="rounded-lg border p-2.5 text-sm space-y-1 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{rel.name}</span>
                {rel.is_decision_influencer && (
                  <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Influenciador
                  </Badge>
                )}
              </div>
               <div className="flex items-center gap-1">
                 <Badge variant="secondary" className="text-[10px] capitalize">{rel.relationship_type}</Badge>
                 <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <RelativeDialog 
                     onSave={(updates) => onUpdate(rel.id, updates)} 
                     initialData={rel}
                     trigger={
                       <button className="rounded p-0.5 text-muted-foreground hover:text-primary transition-colors">
                         <Edit2 className="h-3 w-3" />
                       </button>
                     }
                   />
                   <button
                     onClick={() => onDelete(rel.id)}
                     aria-label={`Remover ${rel.name}`}
                     className="rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                   >
                     <Trash2 className="h-3 w-3" />
                   </button>
                 </div>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {rel.age != null && <span>Idade: {rel.age}</span>}
              {rel.birthday && <span>Nasc: {format(new Date(rel.birthday), 'dd/MM/yyyy')}</span>}
              {rel.occupation && <span>Profissão: {rel.occupation}</span>}
              {rel.company && (
                <span className="flex items-center gap-0.5">
                  <Building2 className="h-2.5 w-2.5" />{rel.company}
                </span>
              )}
              {rel.phone && (
                <a href={`tel:${rel.phone}`} className="flex items-center gap-0.5 hover:text-primary">
                  <Phone className="h-2.5 w-2.5" />{rel.phone}
                </a>
              )}
              {rel.email && (
                <a href={`mailto:${rel.email}`} className="flex items-center gap-0.5 hover:text-primary truncate">
                  <Mail className="h-2.5 w-2.5" />{rel.email}
                </a>
              )}
            </div>
            {rel.notes && <p className="text-[10px] text-muted-foreground italic">{rel.notes}</p>}
          </div>
        )) : (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum relacionado registrado</p>
        )}
      </CardContent>
    </Card>
  );
}
