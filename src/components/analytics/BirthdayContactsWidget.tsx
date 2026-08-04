import { Cake, Gift, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBirthdayContacts } from '@/hooks/useBirthdayContacts';
import { cn } from '@/lib/utils';

export function BirthdayContactsWidget() {
  const { data, isLoading, error } = useBirthdayContacts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}
        </CardContent>
      </Card>
    );
  }

  if (error || !data) return null;

  const contacts = data.slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Cake className="h-5 w-5 text-primary" />
          Aniversariantes
          {contacts.length > 0 && (
            <Badge variant="secondary" className="text-[10px] ml-auto">{contacts.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>Contatos com aniversário próximo</CardDescription>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhum aniversário próximo 🎂
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {contacts.map((c, i) => {
              const name = c.full_name || c.contact_name || c.nome || [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Contato';
              const birthday = c.birthday || c.data_nascimento;
              const daysUntil = c.days_until;

              return (
                <div key={c.id || c.contact_id || i} className="flex items-center gap-3 p-2 rounded-lg border text-sm">
                  <Gift className={cn('h-4 w-4 shrink-0',
                    daysUntil === 0 ? 'text-success' :
                    daysUntil !== undefined && daysUntil <= 7 ? 'text-warning' : 'text-muted-foreground'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{name}</p>
                    {(c.company_name || c.empresa) && (
                      <p className="text-[10px] text-muted-foreground truncate">{c.company_name || c.empresa}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {birthday && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Calendar className="h-2.5 w-2.5" />
                        {new Date(birthday).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    )}
                    {daysUntil !== undefined && (
                      <Badge
                        variant="outline"
                        className={cn('text-[10px]',
                          daysUntil === 0 ? 'border-success/40 text-success bg-success/10' :
                          daysUntil <= 7 ? 'border-warning/40 text-warning bg-warning/10' : ''
                        )}
                      >
                        {daysUntil === 0 ? 'Hoje! 🎉' : `${daysUntil}d`}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
