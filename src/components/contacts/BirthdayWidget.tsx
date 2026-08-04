import { Cake, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBirthdayContacts } from '@/hooks/useBirthdayContacts';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export function BirthdayWidget() {
  const { data: birthdays, isLoading } = useBirthdayContacts();

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cake className="h-4 w-4 text-primary" /> Aniversários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!birthdays || birthdays.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Cake className="h-4 w-4 text-primary" /> 
          Próximos Aniversários
          <Badge variant="secondary" className="ml-auto text-[10px]">{birthdays.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {birthdays.map((contact, i) => {
            const date = contact.birthday || contact.data_nascimento;
            return (
              <Link 
                key={i} 
                to={`/contatos/${contact.id || contact.contact_id}`}
                className="flex-shrink-0 flex items-center gap-3 p-2 rounded-lg bg-background border border-border/50 hover:border-primary/50 transition-colors group min-w-[200px]"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Gift className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{contact.full_name || contact.contact_name || contact.nome || `${contact.first_name} ${contact.last_name}`}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {date ? format(new Date(date), "dd 'de' MMMM", { locale: ptBR }) : '—'}
                    {(contact.company_name || contact.empresa) ? ` · ${contact.company_name || contact.empresa}` : ''}
                  </p>
                  {contact.days_until === 0 ? (
                    <Badge variant="default" className="mt-1 h-4 text-[8px] bg-green-500">HOJE!</Badge>
                  ) : (
                    <p className="text-[9px] text-primary font-medium mt-0.5">Em {contact.days_until ?? contact.days_ahead} dias</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
