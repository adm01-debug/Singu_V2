import { Users, Building2, MessageSquare, Phone, Calendar, ArrowRight } from 'lucide-react';
import { CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  id: string;
  type: 'contact' | 'company' | 'interaction';
  title: string;
  subtitle?: string;
  meta?: string;
}

interface Props {
  results: {
    contacts: SearchResult[];
    companies: SearchResult[];
    interactions: SearchResult[];
  };
  onSelect: (result: SearchResult) => void;
}

export function SearchResultGroups({ results, onSelect }: Props) {
  return (
    <>
      {results.contacts.length > 0 && (
        <CommandGroup heading={<div className="flex items-center gap-2"><Users className="w-3 h-3" /><span>Contatos</span><Badge variant="secondary" className="text-[10px] ml-auto">{results.contacts.length}</Badge></div>}>
          {results.contacts.map((result) => (
            <CommandItem key={result.id} onSelect={() => onSelect(result)} className="gap-3 py-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{result.title}</p>
                {result.subtitle && <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>}
              </div>
              {result.meta && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" /><span className="truncate max-w-[100px]">{result.meta}</span></div>}
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup>
      )}
      {results.companies.length > 0 && (
        <><CommandSeparator /><CommandGroup heading={<div className="flex items-center gap-2"><Building2 className="w-3 h-3" /><span>Empresas</span><Badge variant="secondary" className="text-[10px] ml-auto">{results.companies.length}</Badge></div>}>
          {results.companies.map((result) => (
            <CommandItem key={result.id} onSelect={() => onSelect(result)} className="gap-3 py-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10"><Building2 className="w-5 h-5 text-accent" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{result.title}</p>
                {result.subtitle && <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>}
              </div>
              {result.meta && <span className="text-xs text-muted-foreground">{result.meta}</span>}
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup></>
      )}
      {results.interactions.length > 0 && (
        <><CommandSeparator /><CommandGroup heading={<div className="flex items-center gap-2"><MessageSquare className="w-3 h-3" /><span>Interações</span><Badge variant="secondary" className="text-[10px] ml-auto">{results.interactions.length}</Badge></div>}>
          {results.interactions.map((result) => (
            <CommandItem key={result.id} onSelect={() => onSelect(result)} className="gap-3 py-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-warning/10"><MessageSquare className="w-5 h-5 text-warning" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{result.title}</p>
                {result.subtitle && <Badge variant="secondary" className="text-xs capitalize">{result.subtitle}</Badge>}
              </div>
              {result.meta && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" /><span>{result.meta}</span></div>}
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup></>
      )}
    </>
  );
}
