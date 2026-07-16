import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Timer, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useMttaSlaThreshold } from "@/hooks/useMttaSlaThreshold";
import { useActionToast } from "@/hooks/useActionToast";

const KEY = "mtta_critical_sla_min";

/**
 * Editor inline do SLA de MTTA crítico (`system_config.mtta_critical_sla_min`).
 * Visível apenas para admins. Atualização propaga em ≤5 min (staleTime do hook).
 */
export function MttaSlaThresholdEditor() {
  const { isAdmin } = useIsAdmin();
  const current = useMttaSlaThreshold();
  const [value, setValue] = useState<string>(String(current));
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const toast = useActionToast();

  if (!isAdmin) return null;

  const parsed = Number(value);
  const valid = Number.isFinite(parsed) && parsed > 0 && parsed <= 24 * 60;
  const dirty = valid && parsed !== current;

  const save = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("system_config")
        .update({ value: parsed })
        .eq("key", KEY);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["system-config", KEY] });
      toast.success(`SLA atualizado para ${parsed} min`);
    } catch (e) {
      toast.error(`Falha ao salvar: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="w-4 h-4" /> SLA MTTA crítico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1.5">
            <Label htmlFor="sla-min" className="text-xs">
              Minutos (1–1440) — valor atual: <strong>{current}</strong>
            </Label>
            <Input
              id="sla-min"
              type="number"
              min={1}
              max={1440}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-32"
            />
          </div>
          <Button onClick={save} disabled={!dirty || saving} size="sm">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Aplica-se ao card de MTTA em BehavioralRegenAlertsStats e ao trigger de breach. Propaga
          em até 5 min sem redeploy.
        </p>
      </CardContent>
    </Card>
  );
}