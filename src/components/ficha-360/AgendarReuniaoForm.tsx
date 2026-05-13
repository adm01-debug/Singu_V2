import { memo, useMemo, useState } from 'react';
import { Loader2, Calendar as CalIcon, Clock, Check, Copy, Video, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useCreateMeeting, type MeetingModality } from '@/hooks/useCreateMeeting';
import { generateMeetingInvite, type SentimentTone } from '@/lib/scriptGenerator';
import type { ProximoPasso } from '@/domain/nextStepLogic';
import type { BestTimeHint } from '@/lib/proximoPassoDefaults';

interface Props {
  passo: ProximoPasso;
  contactId: string;
  companyId?: string | null;
  firstName: string;
  sentiment?: SentimentTone;
  bestTime?: BestTimeHint | null;
  onCreated: () => void;
  onCancel: () => void;
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90];

const MODALITY_OPTIONS: Array<{ value: MeetingModality; label: string; icon: typeof Video }> = [
  { value: 'video', label: 'Vídeo', icon: Video },
  { value: 'presencial', label: 'Presencial', icon: MapPin },
  { value: 'phone', label: 'Telefone', icon: Phone },
];

function nextBusinessDay(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatPtBr(d: Date): string {
  const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dias[d.getDay()]}, ${dd}/${mm} às ${hh}:${mi}`;
}

function AgendarReuniaoFormComponent({
  passo,
  contactId,
  companyId,
  firstName,
  sentiment,
  bestTime,
  onCreated,
  onCancel,
}: Props) {
  const createMeeting = useCreateMeeting();

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const defaultTime = useMemo(() => {
    if (bestTime?.hour_of_day != null && bestTime.hour_of_day >= 7 && bestTime.hour_of_day <= 19) {
      return `${String(bestTime.hour_of_day).padStart(2, '0')}:00`;
    }
    return '10:00';
  }, [bestTime]);

  const [date, setDate] = useState<string>(nextBusinessDay());
  const [time, setTime] = useState<string>(defaultTime);
  const [duration, setDuration] = useState<number>(30);
  const [modality, setModality] = useState<MeetingModality>('video');
  const [meetingUrl, setMeetingUrl] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [createdAt, setCreatedAt] = useState<{ scheduledAt: Date; duration: number; modality: MeetingModality; url: string } | null>(null);

  const scheduledIso = useMemo(() => {
    const [y, m, d] = date.split('-').map((x) => parseInt(x, 10));
    const [hh, mm] = time.split(':').map((x) => parseInt(x, 10));
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  }, [date, time]);

  const hint = useMemo(() => {
    return `Reunião com ${firstName} em ${formatPtBr(scheduledIso)} • ${duration} min`;
  }, [firstName, scheduledIso, duration]);

  const handleSubmit = () => {
    if (!date || !time) {
      toast.error('Informe data e hora');
      return;
    }
    if (scheduledIso.getTime() < Date.now() - 60_000) {
      toast.error('A data/hora deve ser no futuro');
      return;
    }
    createMeeting.mutate(
      {
        contactId,
        companyId,
        title: `Reunião com ${firstName}`,
        scheduledAt: scheduledIso.toISOString(),
        durationMinutes: duration,
        meetingType: modality,
        meetingUrl: meetingUrl.trim() || null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success(`Reunião agendada para ${formatPtBr(scheduledIso)}`);
          setCreatedAt({
            scheduledAt: scheduledIso,
            duration,
            modality,
            url: meetingUrl.trim(),
          });
        },
      },
    );
  };

  // ===== Pós-criação: convite =====
  if (createdAt) {
    const invite = generateMeetingInvite({
      firstName,
      scheduledAt: createdAt.scheduledAt,
      durationMinutes: createdAt.duration,
      modality: createdAt.modality,
      meetingUrl: createdAt.url || null,
      sentiment,
    });

    const copyWhatsapp = async () => {
      await navigator.clipboard.writeText(invite.whatsapp);
      toast.success('Convite de WhatsApp copiado');
    };
    const copyEmail = async () => {
      await navigator.clipboard.writeText(`Assunto: ${invite.email.subject}\n\n${invite.email.body}`);
      toast.success('Convite de e-mail copiado');
    };

    return (
      <div className="mt-3 rounded-md border border-success/40 bg-success/5 p-3 space-y-3">
        <div className="flex items-start gap-2">
          <div className="rounded-full bg-success/15 p-1.5 mt-0.5 shrink-0">
            <Check className="h-3.5 w-3.5 text-success" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Reunião agendada</p>
            <p className="text-xs text-muted-foreground">
              {formatPtBr(createdAt.scheduledAt)} • {createdAt.duration} min
            </p>
          </div>
        </div>

        <Tabs defaultValue="whatsapp" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="email">E-mail</TabsTrigger>
          </TabsList>
          <TabsContent value="whatsapp" className="space-y-2">
            <Textarea
              readOnly
              value={invite.whatsapp}
              className="min-h-[120px] text-xs font-mono bg-background"
            />
            <Button size="sm" onClick={copyWhatsapp} className="w-full">
              <Copy className="h-3.5 w-3.5" />
              Copiar mensagem
            </Button>
          </TabsContent>
          <TabsContent value="email" className="space-y-2">
            <Input
              readOnly
              value={invite.email.subject}
              className="text-xs font-medium bg-background"
            />
            <Textarea
              readOnly
              value={invite.email.body}
              className="min-h-[140px] text-xs font-mono bg-background"
            />
            <Button size="sm" onClick={copyEmail} className="w-full">
              <Copy className="h-3.5 w-3.5" />
              Copiar mensagem
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={onCreated}>
            Concluído
          </Button>
        </div>
      </div>
    );
  }

  // ===== Form inicial =====
  return (
    <div className="mt-3 rounded-md border border-border bg-muted/20 p-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`mt-date-${passo.id}`} className="text-xs flex items-center gap-1.5">
            <CalIcon className="h-3 w-3" /> Data
          </Label>
          <Input
            id={`mt-date-${passo.id}`}
            type="date"
            min={todayStr}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`mt-time-${passo.id}`} className="text-xs flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Hora
          </Label>
          <Input
            id={`mt-time-${passo.id}`}
            type="time"
            step={900}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Duração</Label>
          <Select value={String(duration)} onValueChange={(v) => setDuration(parseInt(v, 10))}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Modalidade</Label>
          <Select value={modality} onValueChange={(v) => setModality(v as MeetingModality)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODALITY_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {modality === 'video' && (
        <div className="space-y-1.5">
          <Label htmlFor={`mt-url-${passo.id}`} className="text-xs">
            Link da reunião (Meet/Zoom)
          </Label>
          <Input
            id={`mt-url-${passo.id}`}
            type="url"
            placeholder="Cole após criar (opcional)"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`mt-notes-${passo.id}`} className="text-xs">
          Notas internas
        </Label>
        <Textarea
          id={`mt-notes-${passo.id}`}
          placeholder="Pauta, contexto..."
          value={notes}
          maxLength={200}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[60px] text-sm"
        />
      </div>

      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <CalIcon className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
        <span>{hint}</span>
      </p>

      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={createMeeting.isPending}>
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={createMeeting.isPending}>
          {createMeeting.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Confirmar agendamento
        </Button>
      </div>
    </div>
  );
}

export const AgendarReuniaoForm = memo(AgendarReuniaoFormComponent);
