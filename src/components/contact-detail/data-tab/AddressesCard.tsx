import { memo, useState } from 'react';
import { MapPin, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import type { ExternalAddress } from '@/hooks/useContactRelationalData';
import { PrimaryBadge, SourceBadge } from './shared-badges';

const ADDRESS_TYPES = ['residencial', 'comercial', 'correspondencia', 'outro'];

function AddAddressDialog({ onAdd }: { onAdd: (data: Record<string, unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: 'comercial', logradouro: '', numero: '', complemento: '', bairro: '',
    cidade: '', estado: '', cep: '', pais: 'Brasil', is_primary: false, ponto_referencia: '',
  });

  const handleSubmit = () => {
    if (!form.logradouro.trim() && !form.cidade.trim()) return;
    const data: Record<string, unknown> = { tipo: form.tipo, is_primary: form.is_primary, pais: form.pais };
    if (form.logradouro) data.logradouro = form.logradouro.trim();
    if (form.numero) data.numero = form.numero.trim();
    if (form.complemento) data.complemento = form.complemento.trim();
    if (form.bairro) data.bairro = form.bairro.trim();
    if (form.cidade) data.cidade = form.cidade.trim();
    if (form.estado) data.estado = form.estado.trim();
    if (form.cep) data.cep = form.cep.trim();
    if (form.ponto_referencia) data.ponto_referencia = form.ponto_referencia.trim();
    onAdd(data);
    setForm({ tipo: 'comercial', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', cep: '', pais: 'Brasil', is_primary: false, ponto_referencia: '' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          <Plus className="h-3 w-3 mr-1" />Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="text-sm">Novo Endereço</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <Select value={form.tipo} onValueChange={(v) => setForm(p => ({ ...p, tipo: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ADDRESS_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-3 gap-2">
            <Input className="col-span-2" placeholder="Logradouro *" value={form.logradouro} onChange={(e) => setForm(p => ({ ...p, logradouro: e.target.value }))} />
            <Input placeholder="Número" value={form.numero} onChange={(e) => setForm(p => ({ ...p, numero: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Complemento" value={form.complemento} onChange={(e) => setForm(p => ({ ...p, complemento: e.target.value }))} />
            <Input placeholder="Bairro" value={form.bairro} onChange={(e) => setForm(p => ({ ...p, bairro: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input placeholder="Cidade *" value={form.cidade} onChange={(e) => setForm(p => ({ ...p, cidade: e.target.value }))} />
            <Input placeholder="Estado" value={form.estado} onChange={(e) => setForm(p => ({ ...p, estado: e.target.value }))} />
            <Input placeholder="CEP" value={form.cep} onChange={(e) => setForm(p => ({ ...p, cep: e.target.value }))} />
          </div>
          <Input placeholder="Ponto de referência" value={form.ponto_referencia} onChange={(e) => setForm(p => ({ ...p, ponto_referencia: e.target.value }))} />
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <Checkbox checked={form.is_primary} onCheckedChange={(v) => setForm(p => ({ ...p, is_primary: !!v }))} />
            Endereço primário
          </label>
          <Button size="sm" onClick={handleSubmit} disabled={!form.logradouro.trim() && !form.cidade.trim()}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  addresses: ExternalAddress[];
  onAdd?: (data: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
}

export const AddressesCard = memo(function AddressesCard({ addresses, onAdd, onDelete }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            Endereços ({addresses.length})
          </span>
          {onAdd && <AddAddressDialog onAdd={onAdd} />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {addresses.length > 0 ? addresses.map((a) => {
          const fullAddress = [a.logradouro, a.numero, a.complemento, a.bairro].filter(Boolean).join(', ');
          const cityState = [a.cidade, a.estado].filter(Boolean).join(' - ');
          return (
            <div key={a.id} className="rounded-lg border p-2.5 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <PrimaryBadge isPrimary={a.is_primary} />
                  {a.tipo_logradouro && <Badge variant="outline" className="text-[10px]">{a.tipo_logradouro}</Badge>}
                  {a.tipo && <Badge variant="secondary" className="text-[10px] capitalize">{a.tipo}</Badge>}
                  <SourceBadge fonte={a.fonte || a.origem} />
                </div>
                {onDelete && (
                  <button
                    onClick={() => onDelete(a.id)}
                    aria-label="Remover endereço"
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              {fullAddress && <p className="text-foreground text-xs">{fullAddress}</p>}
              {cityState && <p className="text-xs text-muted-foreground">{cityState}{a.pais && a.pais !== 'Brasil' ? ` - ${a.pais}` : ''}</p>}
              {a.cep && <p className="text-[10px] text-muted-foreground">CEP: {a.cep}</p>}
              {a.ponto_referencia && <p className="text-[10px] text-muted-foreground italic">Ref: {a.ponto_referencia}</p>}
              {a.cidade_ibge && <p className="text-[10px] text-muted-foreground">IBGE: {a.cidade_ibge}</p>}
              <div className="flex items-center gap-2 mt-1">
                {a.latitude && a.longitude && (
                  <a href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />Mapa
                  </a>
                )}
                {a.google_maps_url && (
                  <a href={a.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    <ExternalLink className="h-2.5 w-2.5" />Google Maps
                  </a>
                )}
                {a.google_place_id && (
                  <span className="text-[10px] text-muted-foreground">Place: {a.google_place_id.substring(0, 12)}…</span>
                )}
              </div>
            </div>
          );
        }) : (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum endereço registrado</p>
        )}
      </CardContent>
    </Card>
  );
});
