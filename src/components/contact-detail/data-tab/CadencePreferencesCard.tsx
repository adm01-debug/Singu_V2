import { memo, useState } from 'react';
import { Clock, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tables, Json } from '@/integrations/supabase/types';

function ResponseRateChart({ rates }: { rates: Json }) {
  if (!rates || typeof rates !== 'object' || Array.isArray(rates)) return null;
  const entries = Object.entries(rates as Record<string, number>).filter(([, v]) => typeof v === 'number' && v > 0);
  if (entries.length === 0) return null;
  const maxRate = Math.max(...entries.map(([, v]) => v));

  return (
    <div className="space-y-1.5">
      <span className="text-xs text-muted-foreground font-medium">Taxa de resposta por canal</span>
      {entries.map(([channel, rate]) => (
        <div key={channel} className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-16 capitalize truncate">{channel}</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(rate / maxRate) * 100}%` }} />
          </div>
          <span className="text-[10px] text-foreground font-medium w-8 text-right">{rate}%</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  cadence: Tables<'contact_cadence'> | null;
  preferences: Tables<'contact_preferences'> | null;
  commPreferences: Tables<'communication_preferences'> | null;
  contactId?: string;
  onSaveCadence?: (data: Record<string, unknown>) => void;
  onSavePreferences?: (data: Record<string, unknown>) => void;
}

export const CadencePreferencesCard = memo(function CadencePreferencesCard({ cadence, preferences, commPreferences, onSaveCadence, onSavePreferences }: Props) {
  const [editingCadence, setEditingCadence] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [cadenceForm, setCadenceForm] = useState({
    cadence_days: cadence?.cadence_days ?? 14,
    priority: cadence?.priority ?? 'medium',
    auto_remind: cadence?.auto_remind ?? true,
    notes: cadence?.notes ?? '',
  });

  const [prefsForm, setPrefsForm] = useState({
    preferred_channel: preferences?.preferred_channel ?? 'whatsapp',
    preferred_days: preferences?.preferred_days ?? [],
    avoid_days: preferences?.avoid_days ?? [],
     communication_tips: preferences?.communication_tips ?? '',
     personal_notes: preferences?.personal_notes ?? '',
     restrictions: preferences?.restrictions ?? '',
     preferred_times: preferences?.preferred_times ?? [],
     avoid_times: preferences?.avoid_times ?? [],
   });

  const DAYS_LIST = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const DAY_LABELS: Record<string, string> = { monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui', friday: 'Sex', saturday: 'Sáb', sunday: 'Dom' };

  const toggleDayInList = (day: string, list: string[]) =>
    list.includes(day) ? list.filter(d => d !== day) : [...list, day];

  const handleSaveCadence = () => {
    if (onSaveCadence) {
      onSaveCadence({
        cadence_days: cadenceForm.cadence_days,
        priority: cadenceForm.priority,
        auto_remind: cadenceForm.auto_remind,
        notes: cadenceForm.notes || null,
      });
    }
    setEditingCadence(false);
  };

  const handleSavePrefs = () => {
    if (onSavePreferences) {
      onSavePreferences({
        preferred_channel: prefsForm.preferred_channel || null,
        preferred_days: prefsForm.preferred_days.length ? prefsForm.preferred_days : null,
        avoid_days: prefsForm.avoid_days.length ? prefsForm.avoid_days : null,
         communication_tips: prefsForm.communication_tips || null,
         personal_notes: prefsForm.personal_notes || null,
         restrictions: prefsForm.restrictions || null,
         preferred_times: prefsForm.preferred_times.length ? prefsForm.preferred_times : null,
         avoid_times: prefsForm.avoid_times.length ? prefsForm.avoid_times : null,
       });
    }
    setEditingPrefs(false);
  };

  const startEditingPrefs = () => {
    setPrefsForm({
      preferred_channel: preferences?.preferred_channel ?? 'whatsapp',
      preferred_days: preferences?.preferred_days ?? [],
      avoid_days: preferences?.avoid_days ?? [],
       communication_tips: preferences?.communication_tips ?? '',
       personal_notes: preferences?.personal_notes ?? '',
       restrictions: preferences?.restrictions ?? '',
       preferred_times: preferences?.preferred_times ?? [],
       avoid_times: preferences?.avoid_times ?? [],
     });
             <div className="grid grid-cols-2 gap-2">
               <div>
                 <label className="text-[10px] text-muted-foreground">Horários preferidos</label>
                 <Input 
                   placeholder="Ex: Manhã, 14:00 (separe por vírgula)" 
                   value={prefsForm.preferred_times.join(', ')} 
                   onChange={e => setPrefsForm(p => ({ ...p, preferred_times: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} 
                   className="h-7 text-xs" 
                 />
               </div>
               <div>
                 <label className="text-[10px] text-muted-foreground">Horários a evitar</label>
                 <Input 
                   placeholder="Ex: Noite, 18:00+" 
                   value={prefsForm.avoid_times.join(', ')} 
                   onChange={e => setPrefsForm(p => ({ ...p, avoid_times: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} 
                   className="h-7 text-xs" 
                 />
               </div>
             </div>
    setEditingPrefs(true);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-info" />
            Cadência & Preferências
          </span>
          {onSaveCadence && !editingCadence && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => {
              setCadenceForm({
                cadence_days: cadence?.cadence_days ?? 14,
                priority: cadence?.priority ?? 'medium',
                auto_remind: cadence?.auto_remind ?? true,
                notes: cadence?.notes ?? '',
              });
              setEditingCadence(true);
            }}>
              <Edit2 className="h-3 w-3 mr-1" />{cadence ? 'Editar' : 'Criar'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {editingCadence ? (
          <div className="space-y-3 p-2 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">Frequência (dias)</label>
                <Input type="number" min={1} max={365} value={cadenceForm.cadence_days} onChange={(e) => setCadenceForm(p => ({ ...p, cadence_days: parseInt(e.target.value) || 14 }))} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Prioridade</label>
                <Select value={cadenceForm.priority} onValueChange={(v) => setCadenceForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox checked={cadenceForm.auto_remind} onCheckedChange={(v) => setCadenceForm(p => ({ ...p, auto_remind: !!v }))} />
              Auto-lembrete
            </label>
            <Input placeholder="Notas" value={cadenceForm.notes} onChange={(e) => setCadenceForm(p => ({ ...p, notes: e.target.value }))} className="h-8 text-xs" />
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSaveCadence}>
                <Save className="h-3 w-3 mr-1" />Salvar
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setEditingCadence(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : cadence ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Frequência</span>
              <span className="font-medium">A cada {cadence.cadence_days} dias</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prioridade</span>
              <Badge variant="outline" className="text-xs capitalize">{cadence.priority || 'medium'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Auto-lembrete</span>
              <Badge variant={cadence.auto_remind ? 'default' : 'secondary'} className="text-xs">
                {cadence.auto_remind ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            {cadence.next_contact_due && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Próximo contato</span>
                <span className="text-xs">{format(new Date(cadence.next_contact_due), 'dd/MM/yyyy')}</span>
              </div>
            )}
            {cadence.last_contact_at && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Último contato</span>
                <span className="text-xs">{formatDistanceToNow(new Date(cadence.last_contact_at), { addSuffix: true, locale: ptBR })}</span>
              </div>
            )}
            {cadence.notes && <p className="text-xs text-muted-foreground italic border-t pt-2">{cadence.notes}</p>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">Sem cadência configurada</p>
        )}

        {/* Preferences Section */}
        <Separator />
        {editingPrefs ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Preferências do Contato</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingPrefs(false)}>
                  <X className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-primary" onClick={handleSavePrefs}>
                  <Save className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Canal preferido</label>
              <Select value={prefsForm.preferred_channel} onValueChange={v => setPrefsForm(p => ({ ...p, preferred_channel: v }))}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['whatsapp', 'email', 'phone', 'linkedin', 'instagram', 'meeting'].map(ch => (
                    <SelectItem key={ch} value={ch} className="text-xs capitalize">{ch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Dias preferidos</label>
              <div className="flex gap-1 flex-wrap mt-1">
                {DAYS_LIST.map(d => (
                  <Badge
                    key={d}
                    variant={prefsForm.preferred_days.includes(d) ? 'default' : 'outline'}
                    className="cursor-pointer text-[10px]"
                    onClick={() => setPrefsForm(p => ({ ...p, preferred_days: toggleDayInList(d, p.preferred_days) }))}
                  >
                    {DAY_LABELS[d]}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Dias a evitar</label>
              <div className="flex gap-1 flex-wrap mt-1">
                {DAYS_LIST.map(d => (
                  <Badge
                    key={d}
                    variant={prefsForm.avoid_days.includes(d) ? 'destructive' : 'outline'}
                    className="cursor-pointer text-[10px]"
                    onClick={() => setPrefsForm(p => ({ ...p, avoid_days: toggleDayInList(d, p.avoid_days) }))}
                  >
                    {DAY_LABELS[d]}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Dicas de comunicação</label>
              <Input
                value={prefsForm.communication_tips}
                onChange={e => setPrefsForm(p => ({ ...p, communication_tips: e.target.value }))}
                className="h-7 text-xs"
                placeholder="Ex: Prefere ligações breves"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Restrições</label>
              <Input
                value={prefsForm.restrictions}
                onChange={e => setPrefsForm(p => ({ ...p, restrictions: e.target.value }))}
                className="h-7 text-xs"
                placeholder="Ex: Não ligar após 18h"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Notas pessoais</label>
              <Input
                value={prefsForm.personal_notes}
                onChange={e => setPrefsForm(p => ({ ...p, personal_notes: e.target.value }))}
                className="h-7 text-xs"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Preferências do Contato</span>
              {onSavePreferences && (
                <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={startEditingPrefs}>
                  <Edit2 className="h-3 w-3 mr-0.5" />{preferences ? 'Editar' : 'Definir'}
                </Button>
              )}
            </div>
            {preferences ? (
              <>
                {preferences.preferred_channel && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Canal preferido</span>
                    <Badge variant="outline" className="text-xs capitalize">{preferences.preferred_channel}</Badge>
                  </div>
                )}
                {(preferences.preferred_days?.length ?? 0) > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Dias preferidos</span>
                    <div className="mt-0.5 flex gap-1 flex-wrap">
                      {preferences.preferred_days?.map((d: string) => (
                        <Badge key={d} variant="secondary" className="text-[10px]">{DAY_LABELS[d] || d}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(preferences.avoid_days?.length ?? 0) > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">Dias a evitar</span>
                    <div className="mt-0.5 flex gap-1 flex-wrap">
                      {preferences.avoid_days?.map((d: string) => (
                        <Badge key={d} variant="outline" className="text-[10px] border-destructive/30 text-destructive">{DAY_LABELS[d] || d}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {preferences.restrictions && (
                  <div>
                    <span className="text-xs text-muted-foreground">Restrições</span>
                    <p className="text-xs text-foreground">{preferences.restrictions}</p>
                  </div>
                )}
                {preferences.communication_tips && (
                  <div>
                    <span className="text-xs text-muted-foreground">Dicas de comunicação</span>
                    <p className="text-xs text-foreground">{preferences.communication_tips}</p>
                  </div>
                )}
                {preferences.personal_notes && (
                  <div>
                    <span className="text-xs text-muted-foreground">Notas pessoais</span>
                    <p className="text-xs text-foreground italic">{preferences.personal_notes}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-1">Sem preferências definidas</p>
            )}
          </div>
        )}

        {commPreferences && (
          <>
            <Separator />
            <div className="space-y-2">
              {commPreferences.contact_frequency && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Frequência de contato</span>
                  <Badge variant="outline" className="text-xs capitalize">{commPreferences.contact_frequency}</Badge>
                </div>
              )}
              {commPreferences.preferred_time_start && commPreferences.preferred_time_end && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Janela horária</span>
                  <span className="text-xs">{commPreferences.preferred_time_start} – {commPreferences.preferred_time_end}</span>
                </div>
              )}
              {commPreferences.notes && (
                <div>
                  <span className="text-xs text-muted-foreground">Observações</span>
                  <p className="text-xs text-foreground italic">{commPreferences.notes}</p>
                </div>
              )}
              <ResponseRateChart rates={commPreferences.response_rate_by_channel} />
            </div>
          </>
        )}

        {!cadence && !preferences && !commPreferences && !editingCadence && (
          <p className="text-xs text-muted-foreground text-center py-2">Sem preferências configuradas</p>
        )}
      </CardContent>
    </Card>
  );
});
