import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Plus, Trash2, Flag } from 'lucide-react';
import { useGeoBlocking } from '@/hooks/useGeoBlocking';

const COMMON_COUNTRIES = [
  { code: 'BR', name: 'Brasil' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colômbia' },
  { code: 'MX', name: 'México' },
  { code: 'DE', name: 'Alemanha' },
  { code: 'FR', name: 'França' },
  { code: 'GB', name: 'Reino Unido' },
];

export function GeoBlockingManager() {
  const { countries, isLoading, addCountry, removeCountry } = useGeoBlocking();
  const [search, setSearch] = useState('');

  const filtered = COMMON_COUNTRIES.filter(c =>
    !countries.some(ec => ec.country_code === c.code) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />Geo-Blocking
        </CardTitle>
        <CardDescription className="text-xs">Restrinja acesso por localização geográfica</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-20" />
        ) : countries.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {countries.map(c => (
              <Badge key={c.id} variant="secondary" className="gap-1 pl-2">
                <Flag className="h-3 w-3" />{c.country_name}
                <button onClick={() => removeCountry(c.id)} className="ml-1 hover:text-destructive" aria-label={`Remover ${c.country_name} do bloqueio geográfico`}>
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">Sem restrições geográficas — acesso de qualquer país.</p>
        )}
        <div className="space-y-2">
          <Input placeholder="Buscar país..." value={search} onChange={e => setSearch(e.target.value)} className="h-8" />
          <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto">
            {filtered.map(c => (
              <Button
                key={c.code}
                variant="outline"
                size="sm"
                className="justify-start text-xs h-7"
                onClick={() => addCountry({ code: c.code, name: c.name })}
              >
                <Plus className="h-3 w-3 mr-1" />{c.name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
