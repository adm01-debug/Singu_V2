import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { useGeneratePlaybook, SCENARIO_LABELS, type PlaybookScenario } from "@/hooks/usePlaybooks";
import { useNavigate } from "react-router-dom";

export function GeneratePlaybookDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [scenario, setScenario] = useState<PlaybookScenario>("discovery");
  const [industry, setIndustry] = useState("");
  const [persona, setPersona] = useState("");
  const [productContext, setProductContext] = useState("");
  const [prompt, setPrompt] = useState("");
  const generate = useGeneratePlaybook();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (prompt.trim().length < 5) return;
    const result = await generate.mutateAsync({
      scenario, prompt,
      industry: industry || undefined,
      persona: persona || undefined,
      product_context: productContext || undefined,
      save: true,
    });
    setOpen(false);
    if (result?.id) {
      navigate(`/playbooks/${result.id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="gradient"><Sparkles className="size-4" /> Gerar com IA</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Gerar Playbook com IA</DialogTitle>
          <DialogDescription>Descreva o cenário e a IA cria um playbook estruturado em segundos.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cenário *</Label>
              <Select value={scenario} onValueChange={(v) => setScenario(v as PlaybookScenario)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SCENARIO_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Indústria (opcional)</Label>
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="ex: SaaS B2B, varejo" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Persona alvo (opcional)</Label>
            <Input value={persona} onChange={(e) => setPersona(e.target.value)} placeholder="ex: VP de Vendas, Diretor de TI" />
          </div>
          <div className="space-y-2">
            <Label>Contexto do produto (opcional)</Label>
            <Textarea value={productContext} onChange={(e) => setProductContext(e.target.value)} placeholder="Em 1-2 frases, descreva o que vocês vendem" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>O que você quer cobrir? *</Label>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="ex: Como tratar objeção de timing em CFOs cautelosos" rows={3} required />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={generate.isPending}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={generate.isPending || prompt.trim().length < 5}>
            {generate.isPending ? <><Loader2 className="size-4 animate-spin" /> Gerando…</> : <><Sparkles className="size-4" /> Gerar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
