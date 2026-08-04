import React, { useState } from 'react';
import { Check, Copy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { Contact } from '@/types';

export interface SuggestedTemplate {
  id: string;
  title: string;
  category: 'vak' | 'metaprogram' | 'combined';
  scenario: string;
  message: string;
  variables: string[];
  matchScore: number;
  matchReasons: string[];
  tips: string[];
  source: 'VAK' | 'Metaprograma' | 'Combinado';
}

interface TemplatePreviewDialogProps {
  template: SuggestedTemplate;
  contact: Contact;
  onCopy: () => void;
}

export function TemplatePreviewDialog({ template, contact, onCopy }: TemplatePreviewDialogProps) {
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.variables.forEach((v) => {
      if (v === 'nome') initial[v] = contact.firstName;
      else if (v === 'empresa' || v === 'empresa_cliente') initial[v] = contact.companyName || '';
      else initial[v] = '';
    });
    return initial;
  });

  const [copied, setCopied] = useState(false);
  const filledTemplate = template.message.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
  const allFilled = template.variables.every((v) => variables[v]?.trim());

  const handleCopy = () => {
    navigator.clipboard.writeText(filledTemplate)
      .then(() => { setCopied(true); toast.success('Mensagem copiada!'); onCopy(); setTimeout(() => setCopied(false), 2000); })
      .catch(() => toast.error('Não foi possível copiar'));
  };

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Por que este template?</span>
        </div>
        <ul className="space-y-1">
          {template.matchReasons.map((reason, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Check className="w-3 h-3 text-primary mt-0.5 shrink-0" />{reason}
            </li>
          ))}
        </ul>
      </div>

      {template.variables.length > 0 && (
        <div className="grid gap-3">
          {template.variables.map((variable) => (
            <div key={variable}>
              <Label htmlFor={variable} className="text-sm capitalize">{variable.replace(/_/g, ' ')}</Label>
              <Input id={variable} value={variables[variable] || ''} onChange={(e) => setVariables((prev) => ({ ...prev, [variable]: e.target.value }))} placeholder={`Digite ${variable.replace(/_/g, ' ')}`} className="mt-1" />
            </div>
          ))}
        </div>
      )}

      <div>
        <Label className="text-sm">Prévia da mensagem:</Label>
        <Textarea value={filledTemplate} readOnly className="mt-1 h-32 bg-secondary/30" />
      </div>

      {template.tips.length > 0 && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-xs font-medium text-warning mb-2">💡 Dicas de comunicação:</p>
          <ul className="space-y-1">
            {template.tips.map((tip, i) => <li key={i} className="text-xs text-muted-foreground">• {tip}</li>)}
          </ul>
        </div>
      )}

      <Button onClick={handleCopy} disabled={!allFilled && template.variables.length > 0} className="w-full gap-2">
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copiado!' : 'Copiar Mensagem'}
      </Button>
    </div>
  );
}
