import { UserX, Building2, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrphanContacts } from '@/hooks/useOrphanContacts';

export function OrphanContactsWidget() {
  const { data, isLoading, error } = useOrphanContacts();

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

  const contacts = data.slice(0, 15);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserX className="h-5 w-5 text-warning" />
          Contatos Órfãos
          {contacts.length > 0 && (
            <Badge variant="destructive" className="text-[10px] ml-auto">{contacts.length}</Badge>
          )}
        </CardTitle>
        <CardDescription>Contatos sem empresa vinculada</CardDescription>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Todos os contatos estão vinculados a empresas ✅
          </p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {contacts.map((c, i) => {
              const name = c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Contato';

              return (
                <div key={c.id || c.contact_id || i} className="flex items-center gap-3 p-2 rounded-lg border text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {c.email && (
                        <span className="flex items-center gap-0.5 truncate">
                          <Mail className="h-2.5 w-2.5" /> {c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-0.5">
                          <Phone className="h-2.5 w-2.5" /> {c.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-warning border-warning/40">
                    Sem empresa
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
