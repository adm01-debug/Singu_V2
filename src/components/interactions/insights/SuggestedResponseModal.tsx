import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Copy, Check, FileText, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppliedResponses } from "@/hooks/useAppliedResponses";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objection: string;
  category: string;
  suggestedResponse: string;
}

const DRAFT_KEY = "relateiq-draft-interaction-new";

function SuggestedResponseModalImpl({
  open,
  onOpenChange,
  objection,
  category,
  suggestedResponse,
}: Props) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<string>(suggestedResponse);
  const [copied, setCopied] = useState(false);
  const { markApplied, getByObjection } = useAppliedResponses();
  const previousApplications = getByObjection(objection);
  const alreadyAppliedCount = previousApplications.length;

  // Sincroniza o draft quando o modal reabre com nova objeção.
  // useState com prop inicial não atualiza; reset via key no parent garante remontagem.
  // Mantemos sincronia leve via efeito implícito do remount.

  const handleCopy = useCallback(async () => {
    if (!draft.trim()) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      toast.success("Resposta copiada para a área de transferência");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }, [draft]);

  const handleSendToNote = useCallback(() => {
    if (!draft.trim()) {
      toast.error("Resposta vazia");
      return;
    }
    try {
      // Pré-popula o rascunho do formulário de nova interação (tipo nota).
      const draftPayload = {
        type: "note" as const,
        title: `Resposta à objeção: ${objection.slice(0, 80)}${objection.length > 80 ? "…" : ""}`,
        content: draft,
        sentiment: "neutral" as const,
        initiated_by: "us" as const,
        follow_up_required: false,
      };
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draftPayload));
      toast.success("Rascunho criado", {
        description: "Abrindo formulário de nova interação…",
      });
      onOpenChange(false);
      // Navega para /interacoes; o usuário abre o formulário via "Nova Interação"
      // e o draft é restaurado automaticamente pelo useFormDraft.
      navigate("/interacoes?tab=lista&novo=1");
    } catch {
      toast.error("Não foi possível salvar o rascunho");
    }
  }, [draft, objection, navigate, onOpenChange]);

  const handleMarkApplied = useCallback(() => {
    if (!draft.trim()) {
      toast.error("Resposta vazia");
      return;
    }
    markApplied.mutate(
      {
        objection,
        category,
        responseText: draft,
      },
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  }, [draft, objection, category, markApplied, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            Resposta sugerida
          </DialogTitle>
          <DialogDescription className="space-y-1.5">
            <span className="block text-xs text-muted-foreground">
              Edite o texto abaixo antes de copiar ou enviar para uma nota.
            </span>
            <span className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                {category}
              </Badge>
              {alreadyAppliedCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-4 px-1.5 gap-1 border-success/40 text-success"
                  title={`Você já marcou esta resposta como aplicada ${alreadyAppliedCount}× anteriormente`}
                >
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Aplicada {alreadyAppliedCount}×
                </Badge>
              )}
              <span className="text-xs text-foreground line-clamp-2" title={objection}>
                {objection}
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            className="text-sm resize-y"
            aria-label="Texto da resposta sugerida"
            placeholder="Escreva ou edite a resposta sugerida…"
          />
          <p className="text-[11px] text-muted-foreground">
            {draft.length} caracteres
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            disabled={!draft.trim()}
            className="gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleMarkApplied}
            disabled={!draft.trim() || markApplied.isPending}
            className="gap-1.5"
            title="Registrar que você usou esta resposta numa negociação"
          >
            {markApplied.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Marcando…
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                Marcar como aplicada
              </>
            )}
          </Button>
          <Button
            type="button"
            onClick={handleSendToNote}
            disabled={!draft.trim()}
            className="gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" />
            Criar nota
            <ExternalLink className="h-3 w-3 opacity-70" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const SuggestedResponseModal = memo(SuggestedResponseModalImpl);
