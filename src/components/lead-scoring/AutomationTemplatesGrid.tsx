import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { AUTOMATION_TEMPLATES, type AutomationTemplate } from './automation-templates';

interface Props {
  onUse: (t: AutomationTemplate) => void;
}

export function AutomationTemplatesGrid({ onUse }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {AUTOMATION_TEMPLATES.map((t) => (
        <Card key={t.key} className="hover:border-primary/40 transition-colors">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">{t.name}</h4>
            </div>
            <p className="text-xs text-muted-foreground">{t.description}</p>
            <Button size="sm" variant="outline" onClick={() => onUse(t)} className="w-full">
              Usar template
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
