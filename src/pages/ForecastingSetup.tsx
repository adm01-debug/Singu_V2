import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useQuotaSettings, useUpsertQuotaSettings } from "@/hooks/useForecasting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Save, Loader2 } from "lucide-react";

export default function ForecastingSetup() {
  const { data: settings, isLoading } = useQuotaSettings();
  const upsert = useUpsertQuotaSettings();

  const [form, setForm] = useState({
    default_monthly_quota: 0,
    default_quarterly_quota: 0,
    health_weight_activity: 30,
    health_weight_stage_age: 25,
    health_weight_engagement: 25,
    health_weight_relationship: 20,
    inactivity_threshold_days: 14,
    slip_threshold_days: 7,
  });

  useEffect(() => { if (settings) setForm(prev => ({ ...prev, ...settings })); }, [settings]);

  const totalWeight = form.health_weight_activity + form.health_weight_stage_age + form.health_weight_engagement + form.health_weight_relationship;

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6">
      <Helmet><title>Setup Forecasting | SINGU CRM</title></Helmet>
      <div>
        <h1 className="text-2xl font-bold">Setup Forecasting</h1>
        <p className="text-sm text-muted-foreground">Defina quotas padrão e pesos do health score</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Quotas Padrão</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Quota Mensal (R$)</Label><Input type="number" value={form.default_monthly_quota} onChange={e => setForm({ ...form, default_monthly_quota: Number(e.target.value) })} /></div>
          <div><Label>Quota Trimestral (R$)</Label><Input type="number" value={form.default_quarterly_quota} onChange={e => setForm({ ...form, default_quarterly_quota: Number(e.target.value) })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pesos do Health Score (total: {totalWeight}%)</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {[
            { key: "health_weight_activity" as const, label: "Atividade Recente" },
            { key: "health_weight_stage_age" as const, label: "Idade do Stage / Data Prevista" },
            { key: "health_weight_engagement" as const, label: "Engajamento" },
            { key: "health_weight_relationship" as const, label: "Relacionamento" },
          ].map(w => (
            <div key={w.key} className="space-y-2">
              <div className="flex justify-between text-sm"><Label>{w.label}</Label><span className="font-mono">{form[w.key]}%</span></div>
              <Slider value={[form[w.key]]} onValueChange={(v) => setForm({ ...form, [w.key]: v[0] })} min={0} max={100} step={5} />
            </div>
          ))}
          {totalWeight !== 100 && <p className="text-xs text-warning">⚠ Soma deveria ser 100% (atual: {totalWeight}%)</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Limiares de Risco</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Dias para considerar inatividade</Label><Input type="number" value={form.inactivity_threshold_days} onChange={e => setForm({ ...form, inactivity_threshold_days: Number(e.target.value) })} /></div>
          <div><Label>Dias para considerar slip de fechamento</Label><Input type="number" value={form.slip_threshold_days} onChange={e => setForm({ ...form, slip_threshold_days: Number(e.target.value) })} /></div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending || isLoading}>
          {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}
