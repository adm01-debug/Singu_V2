import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface KeyContact {
  id: string;
  name: string;
  role?: string;
  importance_score: number;
}

export function KeyContactsStrategicCard({ keyContacts }: { keyContacts: KeyContact[] }) {
  if (keyContacts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Contatos Estratégicos
          <Badge variant="outline" className="text-[10px] ml-auto">{keyContacts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {keyContacts.slice(0, 5).map((kc) => (
            <div key={kc.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
              <div>
                <p className="text-sm font-medium">{kc.name}</p>
                {kc.role && <p className="text-[10px] text-muted-foreground">{kc.role}</p>}
              </div>
              <Badge variant={kc.importance_score >= 70 ? 'default' : 'secondary'} className="text-[10px]">
                {kc.importance_score}%
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
