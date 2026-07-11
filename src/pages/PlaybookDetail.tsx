import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Trash2, Copy, Loader2 } from "lucide-react";
import { SmartBackButton } from "@/components/navigation/SmartBackButton";
import { usePlaybook, useDeletePlaybook, useLogPlaybookUsage, SCENARIO_LABELS } from "@/hooks/usePlaybooks";
import { PlaybookSectionRenderer } from "@/components/playbooks/PlaybookSectionRenderer";
import { toast } from "sonner";
import { useEffect } from "react";

export default function PlaybookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: playbook, isLoading } = usePlaybook(id);
  const del = useDeletePlaybook();
  const log = useLogPlaybookUsage();

  useEffect(() => {
    if (playbook?.id) log.mutate({ playbook_id: playbook.id, action: "opened" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playbook?.id]);

  const handleCopyAll = async () => {
    if (!playbook) return;
    const text = [
      `# ${playbook.name}`,
      playbook.description || "",
      "",
      ...playbook.content.sections.map((s) => {
        const itemsList = s.items.map((i) => `• ${i}`).join("\n");
        return `## ${s.title}\n\n${s.body}\n${itemsList}`;
      }),
    ].join("\n\n");
    await navigator.clipboard.writeText(text);
    toast.success("Playbook completo copiado");
    log.mutate({ playbook_id: playbook.id, action: "copied" });
  };

  const handleDelete = async () => {
    if (!playbook) return;
    if (!confirm(`Remover playbook "${playbook.name}"?`)) return;
    await del.mutateAsync(playbook.id);
    navigate("/playbooks");
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-12 flex justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!playbook) {
    return <div className="container mx-auto px-4 py-12 text-center">
      <p className="text-muted-foreground mb-4">Playbook não encontrado</p>
      <SmartBackButton fallback="/playbooks" label="Voltar para Playbooks" />
    </div>;
  }

  return (
    <>
      <Helmet><title>{playbook.name} | Playbooks</title></Helmet>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <SmartBackButton fallback="/playbooks" label="Playbooks" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyAll}><Copy className="size-4" /> Copiar tudo</Button>
            <Button variant="ghost" size="sm" onClick={handleDelete}><Trash2 className="size-4 text-destructive" /></Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{SCENARIO_LABELS[playbook.scenario]}</Badge>
              {playbook.stage_target && <Badge variant="outline">Estágio: {playbook.stage_target}</Badge>}
              {playbook.industry_target && <Badge variant="outline">{playbook.industry_target}</Badge>}
              {playbook.persona_target && <Badge variant="outline">{playbook.persona_target}</Badge>}
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="size-6 text-primary" /> {playbook.name}
            </h1>
            {playbook.description && <p className="text-muted-foreground">{playbook.description}</p>}
            <div className="flex flex-wrap gap-1 pt-2">
              {playbook.tags.map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              {playbook.content.sections.length} seções · usado {playbook.usage_count} vez(es)
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {playbook.content.sections.map((s, i) => (
            <PlaybookSectionRenderer key={i} section={s} />
          ))}
        </div>
      </div>
    </>
  );
}
