import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { queryExternalData } from '@/lib/externalData';
import { Search, Loader2, UserPlus, Globe, Building2, Mail, Phone } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useContacts } from '@/hooks/useContacts';

interface ExternalContactRow {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  cargo?: string | null;
}

export function ExternalContactLookupDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ExternalContactRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const { createContact } = useContacts();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      const { data, error } = await queryExternalData<ExternalContactRow>({
        table: 'contacts',
        filters: [{ type: 'eq', column: 'user_id', value: user?.id ?? '' }],
        search: {
          term: searchTerm,
          columns: ['first_name', 'last_name', 'email', 'cargo']
        },
        range: { from: 0, to: 10 }
      });

      if (error) throw error;
      setResults(data || []);
    } catch {
      toast.error('Falha ao buscar na base externa');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (externalContact: ExternalContactRow) => {
    try {
      const contactToCreate = {
        first_name: externalContact.first_name ?? '',
        last_name: externalContact.last_name ?? '',
        email: externalContact.email,
        phone: externalContact.phone,
        role_title: externalContact.cargo,
        notes: `Importado da base externa via Busca Global.`,
      };

      await createContact(contactToCreate);
      toast.success('Contato importado com sucesso!');
      onOpenChange(false);
    } catch {
      toast.error('Erro ao importar contato');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Busca Externa Global
          </DialogTitle>
          <DialogDescription>
            Pesquise contatos em bases de dados externas e importe-os para o seu CRM local.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Input 
            placeholder="Nome, e-mail ou cargo..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Buscar
          </Button>
        </div>

        <ScrollArea className="h-[350px] rounded-md border p-4">
          {results.length > 0 ? (
            <div className="space-y-3">
              {results.map((result, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{result.first_name} {result.last_name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-muted-foreground">
                      {result.cargo && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {result.cargo}
                        </span>
                      )}
                      {result.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {result.email}
                        </span>
                      )}
                      {result.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {result.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 px-2 gap-1.5" onClick={() => handleImport(result)}>
                    <UserPlus className="h-3.5 w-3.5" />
                    Importar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Globe className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Nenhum resultado encontrado.' : 'Digite algo para pesquisar em bases externas.'}
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
