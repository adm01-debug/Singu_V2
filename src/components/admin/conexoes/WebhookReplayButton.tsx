import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  webhookToken: string;
  payload: Record<string, unknown> | null;
}

export function WebhookReplayButton({ webhookToken, payload }: Props) {
  const [busyDry, setBusyDry] = useState(false);
  const [busyReal, setBusyReal] = useState(false);

  async function send(dryRun: boolean) {
    if (!payload) return;
    const setBusy = dryRun ? setBusyDry : setBusyReal;
    setBusy(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/incoming-webhook/${webhookToken}${dryRun ? '?dry_run=true' : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      toast.success(dryRun ? 'Dry-run executado com sucesso' : 'Replay persistido com sucesso');
    } catch (e) {
      toast.error(`Falha: ${e instanceof Error ? e.message : 'erro desconhecido'}`);
    } finally {
      setBusy(false);
    }
  }

  if (!payload) return null;

  return (
    <div className="flex gap-2 mt-2">
      <Button size="sm" variant="outline" disabled={busyDry} onClick={() => send(true)}>
        <FlaskConical className="w-3.5 h-3.5 mr-1.5" />
        {busyDry ? 'Testando…' : 'Testar (dry-run)'}
      </Button>
      <Button size="sm" variant="secondary" disabled={busyReal} onClick={() => send(false)}>
        <Play className="w-3.5 h-3.5 mr-1.5" />
        {busyReal ? 'Replay…' : 'Replay real'}
      </Button>
    </div>
  );
}
