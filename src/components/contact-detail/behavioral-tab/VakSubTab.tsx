import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Volume2, Fingerprint, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useContactBehavior } from '@/hooks/useContactBehavior';
import { useState, useEffect } from 'react';

interface Props {
  contactId: string;
}

export function VakSubTab({ contactId }: Props) {
  const { behavior, updateBehavior, isLoading } = useContactBehavior(contactId);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (behavior) setFormData(behavior);
  }, [behavior]);

  if (isLoading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-primary" />
          Perfil VAK (Visual, Auditivo, Cinestésico)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className={`p-4 rounded-lg border-2 transition-all ${formData.vak_primary === 'visual' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <span className="font-bold">Visual</span>
            </div>
            <p className="text-xs text-muted-foreground">Foca em imagens, cores e apresentações visuais.</p>
          </div>
          <div className={`p-4 rounded-lg border-2 transition-all ${formData.vak_primary === 'auditivo' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="h-5 w-5 text-green-500" />
              <span className="font-bold">Auditivo</span>
            </div>
            <p className="text-xs text-muted-foreground">Foca no tom de voz, diálogos e sons.</p>
          </div>
          <div className={`p-4 rounded-lg border-2 transition-all ${formData.vak_primary === 'cinestesico' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Fingerprint className="h-5 w-5 text-orange-500" />
              <span className="font-bold">Cinestésico</span>
            </div>
            <p className="text-xs text-muted-foreground">Foca em sensações, toques e experiências práticas.</p>
          </div>
        </div>

        <div className="space-y-2 max-w-sm">
          <Label>Canal Primário</Label>
          <Select 
            value={formData.vak_primary} 
            onValueChange={(val) => setFormData({ ...formData, vak_primary: val })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visual">Visual</SelectItem>
              <SelectItem value="auditivo">Auditivo</SelectItem>
              <SelectItem value="cinestesico">Cinestésico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="gap-2" onClick={() => updateBehavior(formData)}>
          <Save className="h-4 w-4" />
          Salvar Perfil VAK
        </Button>
      </CardContent>
    </Card>
  );
}
