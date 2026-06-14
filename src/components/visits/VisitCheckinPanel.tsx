import { useState } from 'react';
import { MapPin, Clock, LogIn, LogOut, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVisitCheckins } from '@/hooks/useVisitCheckins';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const VISIT_TYPES: Record<string, string> = {
  presencial: '🏢 Presencial',
  prospeccao: '🔍 Prospecção',
  suporte: '🔧 Suporte',
  entrega: '📦 Entrega',
  outro: '📋 Outro',
};

interface Props {
  contactId?: string;
  companyId?: string;
  entityType?: 'contact' | 'company';
}

export function VisitCheckinPanel({ contactId, companyId, entityType }: Props) {
  const entityId = contactId || companyId;
  const { checkins, checkIn, checkOut } = useVisitCheckins(entityId, entityType || (contactId ? 'contact' : 'company'));
  const [notes, setNotes] = useState('');
  const [visitType, setVisitType] = useState('presencial');

  const activeCheckin = checkins.find(c => !c.check_out_at);

  const handleCheckIn = () => {
    checkIn.mutate({ contactId, companyId, notes: notes || undefined, visitType });
    setNotes('');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          Check-in de Visitas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeCheckin ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-green-500 text-primary-foreground text-[10px]">
                <Navigation className="h-3 w-3 mr-1 animate-pulse" /> Em visita
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                desde {format(new Date(activeCheckin.check_in_at), 'HH:mm', { locale: ptBR })}
              </span>
            </div>
            <Button size="sm" variant="outline" className="w-full h-7 text-xs" onClick={() => checkOut.mutate(activeCheckin.id)} disabled={checkOut.isPending}>
              <LogOut className="h-3 w-3 mr-1" /> Fazer Check-out
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Select value={visitType} onValueChange={setVisitType}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(VISIT_TYPES).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Notas da visita (opcional)" value={notes} onChange={e => setNotes(e.target.value)} className="h-8 text-xs" />
            <Button size="sm" className="w-full h-8 text-xs" onClick={handleCheckIn} disabled={checkIn.isPending}>
              <LogIn className="h-3 w-3 mr-1" /> {checkIn.isPending ? 'Obtendo localização...' : 'Fazer Check-in'}
            </Button>
          </div>
        )}

        {/* History */}
        {checkins.length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {checkins.slice(0, 10).map(c => (
              <div key={c.id} className="flex items-center justify-between px-2 py-1.5 rounded border text-[10px]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span>{VISIT_TYPES[c.visit_type] || c.visit_type}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {c.duration_minutes && (
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{c.duration_minutes}min</span>
                  )}
                  <span>{formatDistanceToNow(new Date(c.check_in_at), { addSuffix: true, locale: ptBR })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
