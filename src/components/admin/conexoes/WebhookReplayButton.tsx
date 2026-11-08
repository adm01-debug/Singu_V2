import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  webhookToken: string;
  payload: Record<string, unknown> | null;
}

export function WebhookReplayButton({ webhookToken, payload }: Props) {
  const [busyDry, setBusyDry] = useState(false);
  const [busyReal, setBusyReal] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { controllerRef.current?.abort(); };
  }, []);

  async function send(dryRun: boolean) {
    if (!payload) return;
    const setBusy = dryRun ? setBusyDry : setBusyReal;
    setBusy(true);
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada');

      const params = new URLSearchParams({ admin_replay: 'true' });
      if (dryRun) params.set('dry_run', 'true');
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/incoming-webhook/${webhookToken}?${params}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      toast.success(dryRun ? 'Dry-run executado com sucesso' : 'Replay persistido com sucesso');
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      toast.error(`Falha: ${parseApiError(e)}`);
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
