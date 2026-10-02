import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIncomingWebhooks, type WebhookTargetEntity } from '@/hooks/useIncomingWebhooks';
import { Loader2, Save, Info, Sparkles, Wand2 } from 'lucide-react';
import { WEBHOOK_TEMPLATES, getTemplateById } from './webhookTemplates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  webhookId: string | null;
}

const ENTITIES: { value: WebhookTargetEntity; label: string }[] = [
  { value: 'contact', label: 'Contato (contacts)' },
  { value: 'company', label: 'Empresa (companies)' },
  { value: 'deal', label: 'Deal (deals)' },
  { value: 'interaction', label: 'Interação (interactions)' },
  { value: 'note', label: 'Nota (notes)' },
  { value: 'custom', label: 'Custom (apenas log)' },
];

function genWebhookSecret() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function IncomingWebhookFormDialog({ open, onOpenChange, webhookId }: Props) {
  const { webhooks, upsert } = useIncomingWebhooks();
  const existing = webhooks.find(w => w.id === webhookId);

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [targetEntity, setTargetEntity] = useState<WebhookTargetEntity>(existing?.target_entity ?? 'contact');
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);
  const [allowedOrigins, setAllowedOrigins] = useState((existing?.allowed_origins ?? []).join(', '));
  const [fieldMappingRaw, setFieldMappingRaw] = useState(
    JSON.stringify(existing?.field_mapping ?? { first_name: 'name', email: 'email' }, null, 2),
  );
  const [mappingError, setMappingError] = useState<string | null>(null);
  const requireSignature = true;
  const [webhookSecret, setWebhookSecret] = useState(() => existing?.webhook_secret ?? genWebhookSecret());
  const [replayWindow, setReplayWindow] = useState(existing?.replay_window_seconds ?? 300);
  const [examplePayload, setExamplePayload] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiSuggest = async () => {
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(examplePayload); } catch { toast.error('Cole um JSON de exemplo válido'); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-suggest-mapping', {
        body: { example_payload: payload, target_entity: targetEntity, source_hint: name || undefined },
      });
      if (error) throw error;
      const mapping = data?.mapping ?? {};
      setFieldMappingRaw(JSON.stringify(mapping, null, 2));
      const conf = Math.round((data?.overall_confidence ?? 0) * 100);
      toast.success(`Mapping sugerido (confiança ${conf}%)${data?.fallback ? ' · fallback determinístico' : ''}`);
    } catch (e) {
      toast.error(`Falha IA: ${parseApiError(e)}`);
    } finally { setAiLoading(false); }
  };

  const handleSave = async () => {
    let mapping: Record<string, string> = {};
    try {
      mapping = JSON.parse(fieldMappingRaw);
      setMappingError(null);
    } catch {
      setMappingError('JSON inválido no mapeamento');
      return;
    }
    if (webhookSecret.length < 32) {
      toast.error('O webhook secret deve ter ao menos 32 caracteres');
      return;
    }
    await upsert.mutateAsync({
      id: webhookId ?? undefined,
      name: name.trim(),
      description: description.trim() || null,
      target_entity: targetEntity,
      is_active: isActive,
      allowed_origins: allowedOrigins.split(',').map(s => s.trim()).filter(Boolean),
      field_mapping: mapping,
      require_signature: requireSignature,
      webhook_secret: requireSignature ? (webhookSecret || null) : null,
      replay_window_seconds: replayWindow,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{webhookId ? 'Editar' : 'Novo'} webhook entrante</DialogTitle>
          <DialogDescription>
            Outros sistemas chamam este endpoint com POST + JSON. O payload é mapeado e inserido na entidade alvo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!webhookId && (
            <div className="bg-muted/30 border border-border/40 rounded-md p-3">
              <Label className="flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5" /> Usar template (opcional)
              </Label>
              <Select onValueChange={(id) => {
                const t = getTemplateById(id);
                if (!t) return;
                setName(t.name);
                setDescription(t.description);
                setTargetEntity(t.target_entity);
                setFieldMappingRaw(JSON.stringify(t.field_mapping, null, 2));
              }}>
                <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Preencher campos a partir de um preset" /></SelectTrigger>
                <SelectContent>
                  {WEBHOOK_TEMPLATES.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Form Site Lovable" />
            </div>
            <div className="flex items-end gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="wh-active" />
              <Label htmlFor="wh-active">Ativo</Label>
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={description ?? ''} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>

          <div>
            <Label>Entidade Alvo *</Label>
            <Select value={targetEntity} onValueChange={(v) => setTargetEntity(v as WebhookTargetEntity)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENTITIES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Origens permitidas (CSV, opcional)</Label>
            <Input value={allowedOrigins} onChange={e => setAllowedOrigins(e.target.value)} placeholder="lovable.app, meusite.com" />
            <p className="text-xs text-muted-foreground mt-1">Vazio = aceitar de qualquer origem.</p>
          </div>

          <div className="border border-dashed border-border/60 rounded-md p-3 bg-muted/20 space-y-2">
            <Label className="flex items-center gap-1.5 text-xs">
              <Wand2 className="w-3.5 h-3.5" /> Auto-mapeamento por IA (opcional)
            </Label>
            <Textarea
              value={examplePayload}
              onChange={e => setExamplePayload(e.target.value)}
              rows={4} className="font-mono text-xs"
              placeholder='Cole aqui um payload JSON real recebido da origem para a IA sugerir o mapping…'
            />
            <Button type="button" size="sm" variant="outline" onClick={handleAiSuggest} disabled={aiLoading || !examplePayload.trim()}>
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-1" />}
              Sugerir mapping com IA
            </Button>
          </div>

          <div>
            <Label>Mapeamento de campos (JSON)</Label>
            <Textarea
              value={fieldMappingRaw}
              onChange={e => setFieldMappingRaw(e.target.value)}
              rows={6} className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              <code>{'{ "destino": "caminho.no.payload" }'}</code> — ex: <code>{'{ "first_name": "lead.nome" }'}</code>
            </p>
            {mappingError && <p className="text-xs text-destructive mt-1">{mappingError}</p>}
          </div>

          <div className="border-t border-border/40 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Switch checked disabled id="wh-hmac" />
              <Label htmlFor="wh-hmac" className="font-medium">Assinatura HMAC obrigatória</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                <div className="md:col-span-2">
                  <Label>Webhook secret</Label>
                  <Input
                    type="password"
                    value={webhookSecret ?? ''}
                    onChange={e => setWebhookSecret(e.target.value)}
                    placeholder="ex: whk_3f9..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Envie assinatura, timestamp e uma chave de idempotência única por requisição.
                  </p>
                </div>
                <div>
                  <Label>Janela anti-replay (s)</Label>
                  <Input
                    type="number" min={60} max={3600}
                    value={replayWindow}
                    onChange={e => setReplayWindow(Number(e.target.value) || 300)}
                  />
                </div>
            </div>
          </div>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription className="text-xs">
              Após salvar, copie a URL pública do card e configure no sistema de origem.
              Inclua o token na URL (path) ou no header <code>X-Webhook-Token</code>.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={upsert.isPending || !name.trim()}>
            {upsert.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
