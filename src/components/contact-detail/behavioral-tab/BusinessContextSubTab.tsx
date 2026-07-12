import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, AlertTriangle, Save, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useContactBehavior } from '@/hooks/useContactBehavior';
import type { ContactBehavior } from '@/hooks/useContactBehavior';
import { useState, useEffect } from 'react';

interface Props {
  contactId: string;
}

export function BusinessContextSubTab({ contactId }: Props) {
  const { businessContext, updateBusiness, isLoading } = useContactBehavior(contactId);
  const [formData, setFormData] = useState<Partial<ContactBehavior>>({});

  useEffect(() => {
    if (businessContext) setFormData(businessContext);
  }, [businessContext]);

  if (isLoading) return <div className="p-4 text-center">Carregando contexto empresarial...</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Saúde & Desafios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Saúde Financeira</Label>
            <Input 
              value={formData.financial_health || ""} 
              onChange={(e) => setFormData({ ...formData, financial_health: e.target.value })}
              placeholder="Ex: Em IPO, Estável..."
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Desafios Atuais (vírgula)</Label>
            <Textarea 
              value={formData.current_challenges?.join(", ") || ""} 
              onChange={(e) => setFormData({ ...formData, current_challenges: e.target.value.split(",").map(i => i.trim()).filter(i => i) })}
              placeholder="Desafios que a empresa enfrenta..."
              className="min-h-[60px] text-xs"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Timing & Concorrência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Melhor Momento p/ Abordagem</Label>
            <Input 
              value={formData.best_moment_to_approach || ""} 
              onChange={(e) => setFormData({ ...formData, best_moment_to_approach: e.target.value })}
              placeholder="Ex: Início do budget anual..."
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Concorrentes Atuais (vírgula)</Label>
            <Input 
              value={formData.competitors_used?.join(", ") || ""} 
              onChange={(e) => setFormData({ ...formData, competitors_used: e.target.value.split(",").map(i => i.trim()).filter(i => i) })}
              placeholder="Empresas que já utilizam..."
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 text-warning" />
              Notas Sazonais
            </Label>
            <Textarea 
              value={formData.seasonal_notes || ""} 
              onChange={(e) => setFormData({ ...formData, seasonal_notes: e.target.value })}
              placeholder="Ex: Fecha o ano fiscal em Outubro..."
              className="min-h-[60px] text-xs"
            />
          </div>
          <Button className="w-full gap-2 mt-4 h-9 text-xs" onClick={() => updateBusiness(formData)}>
            <Save className="h-4 w-4" />
            Salvar Contexto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
