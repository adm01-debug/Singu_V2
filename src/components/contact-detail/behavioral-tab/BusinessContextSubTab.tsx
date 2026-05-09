import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, TrendingUp, AlertTriangle, Save, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useContactBehavior } from '@/hooks/useContactBehavior';
import { useState, useEffect } from 'react';

interface Props {
  contactId: string;
}

export function BusinessContextSubTab({ contactId }: Props) {
  const { businessContext, updateBusiness, isLoading } = useContactBehavior(contactId);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (businessContext) setFormData(businessContext);
  }, [businessContext]);

  if (isLoading) return <div>Carregando...</div>;

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
            <Label>Saúde Financeira</Label>
            <Input 
              value={formData.financial_health || ""} 
              onChange={(e) => setFormData({ ...formData, financial_health: e.target.value })}
              placeholder="Ex: Em IPO, Estável..."
            />
          </div>
          <div className="space-y-2">
            <Label>Desafios Atuais</Label>
            <Textarea 
              value={formData.current_challenges?.join(", ") || ""} 
              onChange={(e) => setFormData({ ...formData, current_challenges: e.target.value.split(",").map(i => i.trim()).filter(i => i) })}
              placeholder="Desafios que a empresa enfrenta..."
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
            <Label>Melhor Momento p/ Abordagem</Label>
            <Input 
              value={formData.best_moment_to_approach || ""} 
              onChange={(e) => setFormData({ ...formData, best_moment_to_approach: e.target.value })}
              placeholder="Ex: Início do budget anual..."
            />
          </div>
          <div className="space-y-2">
            <Label>Concorrentes</Label>
            <Input 
              value={formData.competitors_used?.join(", ") || ""} 
              onChange={(e) => setFormData({ ...formData, competitors_used: e.target.value.split(",").map(i => i.trim()).filter(i => i) })}
              placeholder="Empresas que já utilizam..."
            />
          </div>
          <Button className="w-full gap-2 mt-4" onClick={() => updateBusiness(formData)}>
            <Save className="h-4 w-4" />
            Salvar Contexto
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
