import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Check } from "lucide-react";
import { useIntentPixels, useCreatePixel, useTogglePixel, useDeletePixel } from "@/hooks/useIntent";
import { toast } from "sonner";

const PROJECT_REF = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export function PixelSetupCard() {
  const { data: pixels = [] } = useIntentPixels();
  const create = useCreatePixel();
  const toggle = useTogglePixel();
  const remove = useDeletePixel();
  const [domain, setDomain] = useState("");
  const [label, setLabel] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function snippet(key: string) {
    return `<script async src="https://${PROJECT_REF}.supabase.co/functions/v1/intent-pixel-snippet?k=${key}"></script>`;
  }

  function copy(key: string) {
    navigator.clipboard.writeText(snippet(key));
    setCopiedKey(key);
    toast.success("Snippet copiado");
    setTimeout(() => setCopiedKey(null), 2000);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Novo pixel</CardTitle>
          <CardDescription>Adicione o domínio do site que vai enviar sinais de intenção.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="domain">Domínio</Label>
              <Input id="domain" placeholder="exemplo.com.br" value={domain} onChange={(e) => setDomain(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="label">Rótulo (opcional)</Label>
              <Input id="label" placeholder="Site principal" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
          </div>
          <Button
            onClick={() => {
              if (!domain.trim()) { toast.error("Informe o domínio"); return; }
              create.mutate({ domain: domain.trim(), label: label.trim() || undefined }, {
                onSuccess: () => { setDomain(""); setLabel(""); },
              });
            }}
            disabled={create.isPending}
          >
            {create.isPending ? "Criando…" : "Gerar pixel"}
          </Button>
        </CardContent>
      </Card>

      {pixels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pixels ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pixels.map((p) => (
              <div key={p.id} className="border border-border/60 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{p.domain}</span>
                      {p.label && <Badge variant="secondary" className="text-xs">{p.label}</Badge>}
                      <Badge variant={p.active ? "default" : "outline"} className="text-xs">
                        {p.active ? "Ativo" : "Pausado"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.signal_count} sinais registrados
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={p.active} onCheckedChange={(v) => toggle.mutate({ id: p.id, active: v })} />
                    <Button variant="ghost" size="icon" aria-label="Remover" onClick={() => remove.mutate(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-stretch gap-2">
                  <code className="flex-1 text-xs bg-muted/40 rounded px-2 py-1.5 truncate">
                    {snippet(p.pixel_key)}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => copy(p.pixel_key)}>
                    {copiedKey === p.pixel_key ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
