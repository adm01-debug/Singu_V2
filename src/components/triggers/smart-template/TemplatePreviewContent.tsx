import { useState } from 'react';
import { TrendingUp, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PersuasionTemplate } from '@/types/triggers';
import { Contact } from '@/types';
import { toast } from 'sonner';

interface SmartSuggestion {
  template: PersuasionTemplate;
  reason: string;
  score: number;
  successData: { totalUsages: number; successRate: number; avgRating: number } | null;
  isPersonalized: boolean;
  tag: string;
}

interface TemplatePreviewProps {
  suggestion: SmartSuggestion;
  contact: Contact;
  onUse: (template: PersuasionTemplate) => void;
}

export function TemplatePreviewContent({ suggestion, contact, onUse }: TemplatePreviewProps) {
  const { template, successData } = suggestion;
  const [variables, setVariables] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template.variables.forEach(v => {
      if (v === 'nome') initial[v] = contact.firstName;
      else if (v === 'empresa_cliente') initial[v] = contact.companyName || '';
      else initial[v] = '';
    });
    return initial;
  });
  const [copied, setCopied] = useState(false);

  const filledTemplate = template.template.replace(/\{(\w+)\}/g, (match, key) => variables[key] || match);
  const allFilled = template.variables.every(v => variables[v]?.trim());

  const handleCopy = () => {
    navigator.clipboard.writeText(filledTemplate);
    setCopied(true);
    toast.success('Mensagem copiada!');
    onUse(template);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {successData && successData.totalUsages > 0 && (
        <div className="p-3 rounded-lg bg-success/5 border border-success/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-success">Histórico de Sucesso</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-lg font-bold text-success">{successData.totalUsages}</p><p className="text-xs text-muted-foreground">Usos</p></div>
            <div><p className="text-lg font-bold text-success">{successData.successRate.toFixed(0)}%</p><p className="text-xs text-muted-foreground">Sucesso</p></div>
            <div><p className="text-lg font-bold text-warning">{successData.avgRating > 0 ? successData.avgRating.toFixed(1) : '-'}</p><p className="text-xs text-muted-foreground">Nota</p></div>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {template.variables.map(variable => (
          <div key={variable}>
            <Label htmlFor={variable} className="text-sm capitalize">{variable.replace(/_/g, ' ')}</Label>
            <Input id={variable} value={variables[variable] || ''} onChange={(e) => setVariables(prev => ({ ...prev, [variable]: e.target.value }))} placeholder={`Digite ${variable.replace(/_/g, ' ')}`} className="mt-1" />
          </div>
        ))}
      </div>

      <div>
        <Label className="text-sm">Prévia da mensagem:</Label>
        <Textarea value={filledTemplate} readOnly className="mt-1 h-32 bg-secondary/30" />
      </div>

      {template.tips.length > 0 && (
        <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-xs font-medium text-warning mb-2">💡 Dicas:</p>
          <ul className="space-y-1">{template.tips.map((tip, i) => <li key={i} className="text-xs text-muted-foreground">• {tip}</li>)}</ul>
        </div>
      )}

      <Button onClick={handleCopy} disabled={!allFilled} className="w-full gap-2">
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copiado!' : 'Copiar Mensagem'}
      </Button>
    </div>
  );
}
