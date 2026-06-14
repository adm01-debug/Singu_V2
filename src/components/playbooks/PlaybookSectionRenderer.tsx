import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, HelpCircle, Shield, ListChecks, Library, Copy, Check } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";
import { toast } from "sonner";
import { SECTION_LABELS, type PlaybookSection } from "@/hooks/usePlaybooks";

const ICONS = {
  talktrack: MessageSquare,
  questions: HelpCircle,
  objections: Shield,
  next_steps: ListChecks,
  resources: Library,
};

export function PlaybookSectionRenderer({ section }: { section: PlaybookSection }) {
  const [copied, setCopied] = useState(false);
  const Icon = ICONS[section.type] || MessageSquare;

  const handleCopy = async () => {
    const itemsList = section.items?.map((i) => `• ${i}`).join("\n") || "";
    const text = `${section.title}\n\n${section.body}\n\n${itemsList}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Bloco copiado");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary mt-0.5">
            <Icon className="size-4" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold leading-tight">{section.title}</h3>
            <Badge variant="outline" className="text-xs">{SECTION_LABELS[section.type]}</Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCopy}>
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          <span className="ml-1.5">Copiar</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {section.body && <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">{section.body}</p>}
        {section.items && section.items.length > 0 && (
          <ul className="space-y-1.5">
            {section.items.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="text-primary font-semibold mt-0.5 shrink-0">{i + 1}.</span>
                <span 
                  className="text-foreground/90 whitespace-pre-line" 
                  dangerouslySetInnerHTML={{ 
                    __html: sanitizeHtml(item.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")) 
                  }} 
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
