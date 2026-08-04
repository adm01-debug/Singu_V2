import { useState } from "react";
import { RefreshCcw, Loader2, Mail, Phone, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useBulkRevalidate,
  useBulkRevalidatePreview,
  type BulkRevalidateKind,
  type BulkRevalidateStatus,
} from "@/hooks/useBulkRevalidate";

const STATUS_OPTIONS: { value: BulkRevalidateStatus; label: string; cls: string }[] = [
  { value: "valid", label: "Válidos", cls: "border-success/40 text-success" },
  { value: "risky", label: "Arriscados", cls: "border-warning/40 text-warning" },
  { value: "invalid", label: "Inválidos", cls: "border-destructive/40 text-destructive" },
  { value: "unknown", label: "Desconhecidos", cls: "border-muted-foreground/40 text-muted-foreground" },
  { value: "never", label: "Nunca verificados", cls: "border-primary/40 text-primary" },
];

const LIMIT_OPTIONS = [50, 200, 500, 1000];

export function BulkRevalidateCard() {
  const [kind, setKind] = useState<BulkRevalidateKind>("both");
  const [statuses, setStatuses] = useState<BulkRevalidateStatus[]>(["invalid", "never"]);
  const [olderThanDays, setOlderThanDays] = useState(30);
  const [limit, setLimit] = useState(200);

  const filters = { kind, statuses, olderThanDays, limit };
  const preview = useBulkRevalidatePreview(filters, statuses.length > 0);
  const mutate = useBulkRevalidate();

  const toggleStatus = (s: BulkRevalidateStatus) => {
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const totalPreview = preview.data?.total ?? 0;
  const canRun = statuses.length > 0 && totalPreview > 0 && !mutate.isPending;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <RefreshCcw className="h-4 w-4 text-primary" />
          Revalidar em massa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo */}
        <div className="space-y-1.5">
          <Label className="text-xs">Tipo de validação</Label>
          <div className="flex gap-1.5">
            <Button size="sm" variant={kind === "email" ? "default" : "outline"} onClick={() => setKind("email")} className="gap-1.5 flex-1">
              <Mail className="h-3.5 w-3.5" /> Emails
            </Button>
            <Button size="sm" variant={kind === "phone" ? "default" : "outline"} onClick={() => setKind("phone")} className="gap-1.5 flex-1">
              <Phone className="h-3.5 w-3.5" /> Telefones
            </Button>
            <Button size="sm" variant={kind === "both" ? "default" : "outline"} onClick={() => setKind("both")} className="gap-1.5 flex-1">
              <Layers className="h-3.5 w-3.5" /> Ambos
            </Button>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label className="text-xs">Status atual (multi-seleção)</Label>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((s) => {
              const active = statuses.includes(s.value);
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => toggleStatus(s.value)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    active ? `${s.cls} bg-muted/40` : "border-border text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Idade */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Não verificados há mais de</Label>
            <span className="text-xs font-medium">{olderThanDays} dias</span>
          </div>
          <Slider
            value={[olderThanDays]}
            min={0}
            max={180}
            step={1}
            onValueChange={(v) => setOlderThanDays(v[0])}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0d</span><span>30d</span><span>90d</span><span>180d</span>
          </div>
        </div>

        {/* Limite */}
        <div className="space-y-1.5">
          <Label className="text-xs">Limite por execução</Label>
          <div className="flex gap-1.5">
            {LIMIT_OPTIONS.map((n) => (
              <Button
                key={n}
                size="sm"
                variant={limit === n ? "default" : "outline"}
                onClick={() => setLimit(n)}
                className="flex-1"
              >
                {n}
              </Button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 flex items-center justify-between">
          <div className="text-xs">
            {preview.isFetching ? (
              <span className="text-muted-foreground">Calculando…</span>
            ) : statuses.length === 0 ? (
              <span className="text-muted-foreground">Selecione ao menos 1 status</span>
            ) : (
              <span>
                <strong className="text-foreground">{totalPreview}</strong>{" "}
                <span className="text-muted-foreground">
                  contato(s) serão enfileirado(s)
                  {preview.data && (preview.data.emails + preview.data.phones > totalPreview) && (
                    <> (limitado a {preview.data.cappedAt})</>
                  )}
                </span>
              </span>
            )}
          </div>
          {preview.data && (
            <div className="flex gap-1">
              <Badge variant="outline" className="text-[10px]">{preview.data.emails} emails</Badge>
              <Badge variant="outline" className="text-[10px]">{preview.data.phones} fones</Badge>
            </div>
          )}
        </div>

        {/* Ação */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={!canRun} className="w-full gap-2">
              {mutate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              Enfileirar revalidação
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enfileirar {totalPreview} validação(ões)?</AlertDialogTitle>
              <AlertDialogDescription>
                Os itens serão adicionados à fila de validação e processados pelo worker em até 5 minutos
                (ou imediatamente via "Processar agora", se você for admin). Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => mutate.mutate(filters)}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
