import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEnrichmentExport, type EmailFilter, type PhoneFilter } from "@/hooks/useEnrichmentExport";

export function EnrichmentExportButton() {
  const [open, setOpen] = useState(false);
  const [emailFilter, setEmailFilter] = useState<EmailFilter>("any");
  const [phoneFilter, setPhoneFilter] = useState<PhoneFilter>("any");
  const [intelOnly, setIntelOnly] = useState(false);
  const [limit, setLimit] = useState<"1000" | "5000" | "10000">("1000");
  const exportMut = useEnrichmentExport();

  const handleExport = async () => {
    await exportMut.mutateAsync({
      emailFilter,
      phoneFilter,
      intelOnly,
      limit: Number(limit) as 1000 | 5000 | 10000,
    });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-1">Exportar contatos enriquecidos</h4>
            <p className="text-xs text-muted-foreground">Filtre antes de baixar o CSV (UTF-8).</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Status de email</Label>
            <Select value={emailFilter} onValueChange={(v) => setEmailFilter(v as EmailFilter)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Qualquer</SelectItem>
                <SelectItem value="valid">Apenas válidos</SelectItem>
                <SelectItem value="invalid">Apenas inválidos/sem verificação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Status de telefone</Label>
            <Select value={phoneFilter} onValueChange={(v) => setPhoneFilter(v as PhoneFilter)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Qualquer</SelectItem>
                <SelectItem value="valid">Apenas válidos</SelectItem>
                <SelectItem value="invalid">Apenas inválidos/sem verificação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="intel-only" className="text-xs cursor-pointer">Somente com People Intel</Label>
            <Switch id="intel-only" checked={intelOnly} onCheckedChange={setIntelOnly} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Limite</Label>
            <Select value={limit} onValueChange={(v) => setLimit(v as "1000" | "5000" | "10000")}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1000">1.000 contatos</SelectItem>
                <SelectItem value="5000">5.000 contatos</SelectItem>
                <SelectItem value="10000">10.000 contatos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleExport} disabled={exportMut.isPending} className="w-full gap-2">
            {exportMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Baixar CSV
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
