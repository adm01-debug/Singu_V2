import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { EntityPicker } from './EntityPicker';
import {
  useCreateEntityRelationship,
  ROLE_LABELS,
  type EntityType,
  type EntityRelationshipRole,
} from '@/hooks/useEntityRelationships';
import { toast } from 'sonner';

type Selected = { id: string; label: string } | null;

export function VinculoForm() {
  const [fromType, setFromType] = useState<EntityType>('contact');
  const [toType, setToType] = useState<EntityType>('company');
  const [from, setFrom] = useState<Selected>(null);
  const [to, setTo] = useState<Selected>(null);
  const [role, setRole] = useState<EntityRelationshipRole>('buyer');
  const [isPrimary, setIsPrimary] = useState(false);
  const [startedAt, setStartedAt] = useState('');
  const [endedAt, setEndedAt] = useState('');
  const [notes, setNotes] = useState('');

  const create = useCreateEntityRelationship();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) return toast.error('Selecione as duas entidades');
    if (fromType === toType && from.id === to.id) return toast.error('Não é possível vincular a mesma entidade');
    await create.mutateAsync({
      from_type: fromType,
      from_id: from.id,
      to_type: toType,
      to_id: to.id,
      role,
      is_primary: isPrimary,
      started_at: startedAt || null,
      ended_at: endedAt || null,
      notes: notes.trim() || null,
    });
    setFrom(null); setTo(null); setNotes(''); setIsPrimary(false); setStartedAt(''); setEndedAt('');
  };

  const disabledIds = from && fromType === toType ? [from.id] : [];

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <Label>Tipo da origem</Label>
          <Tabs value={fromType} onValueChange={(v) => { setFromType(v as EntityType); setFrom(null); }}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="contact">Pessoa</TabsTrigger>
              <TabsTrigger value="company">Empresa</TabsTrigger>
            </TabsList>
            <TabsContent value={fromType} className="mt-3">
              <EntityPicker label="Origem" entityType={fromType} value={from} onChange={setFrom} />
            </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-3">
          <Label>Tipo do destino</Label>
          <Tabs value={toType} onValueChange={(v) => { setToType(v as EntityType); setTo(null); }}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="company">Empresa</TabsTrigger>
              <TabsTrigger value="contact">Pessoa</TabsTrigger>
            </TabsList>
            <TabsContent value={toType} className="mt-3">
              <EntityPicker label="Destino" entityType={toType} value={to} onChange={setTo} disabledIds={disabledIds} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Papel</Label>
          <Select value={role} onValueChange={(v) => setRole(v as EntityRelationshipRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.entries(ROLE_LABELS) as [EntityRelationshipRole, string][]).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-3 pb-1">
          <Switch id="primary" checked={isPrimary} onCheckedChange={setIsPrimary} />
          <Label htmlFor="primary" className="cursor-pointer">Marcar como vínculo principal</Label>
        </div>
        <div className="space-y-1.5">
          <Label>Início</Label>
          <Input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Fim</Label>
          <Input type="date" value={endedAt} onChange={(e) => setEndedAt(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Observações</Label>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar vínculo
        </Button>
      </div>
    </form>
  );
}