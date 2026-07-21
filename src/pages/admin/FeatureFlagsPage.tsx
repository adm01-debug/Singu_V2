import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFeatureFlags } from "@/hooks/useFeatureFlag";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActionToast } from "@/hooks/useActionToast";
import { parseApiError } from "@/lib/errorMessages";
import { EmptyState } from "@/components/ui/empty-state";
import { PageLoadingFallback } from "@/components/feedback/PageLoadingFallback";
import { Flag, Plus } from "lucide-react";

export default function FeatureFlagsPage() {
  const { data: flags, isLoading } = useFeatureFlags();
  const qc = useQueryClient();
  const toast = useActionToast();
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const toggleFlag = useMutation({
    mutationFn: async ({ name, enabled }: { name: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("feature_flags")
        .update({ enabled })
        .eq("name", name);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feature-flags"] });
      qc.invalidateQueries({ queryKey: ["feature-flag"] });
      toast.success("Flag atualizada");
    },
    onError: (e: Error) => toast.error("Falha ao atualizar", parseApiError(e)),
  });

  const createFlag = useMutation({
    mutationFn: async () => {
      if (!newName.trim()) throw new Error("Nome obrigatório");
      const { error } = await supabase.from("feature_flags").insert({
        name: newName.trim(),
        description: newDesc.trim() || null,
        enabled: false,
        refetchOnWindowFocus: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewName("");
      setNewDesc("");
      qc.invalidateQueries({ queryKey: ["feature-flags"] });
      toast.success("Flag criada");
    },
    onError: (e: Error) => toast.error("Falha ao criar", parseApiError(e)),
  });

  if (isLoading) return <PageLoadingFallback />;

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <p className="text-sm text-muted-foreground">
          Ativação gradual de funcionalidades sem necessidade de deploy.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova flag
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="nome_da_flag (snake_case)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Textarea
            placeholder="Descrição (opcional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={2}
          />
          <Button
            onClick={() => createFlag.mutate()}
            disabled={createFlag.isPending || !newName.trim()}
          >
            Criar flag
          </Button>
        </CardContent>
      </Card>

      {!flags || flags.length === 0 ? (
        <EmptyState
          icon={Flag}
          title="Nenhuma flag cadastrada"
          description="Crie sua primeira feature flag acima."
        />
      ) : (
        <div className="space-y-2">
          {flags.map((flag) => (
            <Card key={flag.name}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1">
                  <div className="font-medium">{flag.name}</div>
                  {flag.description && (
                    <div className="text-sm text-muted-foreground">
                      {flag.description}
                    </div>
                  )}
                </div>
                <Switch
                  checked={flag.enabled}
                  disabled={toggleFlag.isPending}
                  onCheckedChange={(enabled) =>
                    toggleFlag.mutate({ name: flag.name, enabled })
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
