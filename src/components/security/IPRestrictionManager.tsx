import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Plus, Trash2, MapPin } from 'lucide-react';
import { useAllowedIPs } from '@/hooks/useAllowedIPs';
import { useIPValidation } from '@/hooks/useIPValidation';
import { IPDisplay } from '@/components/security/IPDisplay';

export function IPRestrictionManager() {
  const { ips, isLoading, addIP, removeIP, toggleIP } = useAllowedIPs();
  const { ipInfo } = useIPValidation();
  const [newIP, setNewIP] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const handleAdd = () => {
    if (!newIP.trim()) return;
    addIP({ ip: newIP.trim(), label: newLabel.trim() || undefined });
    setNewIP('');
    setNewLabel('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />Restrição por IP
        </CardTitle>
        <CardDescription className="text-xs">
          Permita login apenas de IPs confiáveis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ipInfo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded bg-muted/40">
            <MapPin className="h-3.5 w-3.5" />
            Seu IP atual: <Badge variant="outline" className="font-mono text-[10px]"><IPDisplay ip={ipInfo.ip} /></Badge>
          </div>
        )}
        <div className="flex gap-2">
          <Input placeholder="IP (ex: 192.168.1.1)" value={newIP} onChange={e => setNewIP(e.target.value)} className="flex-1" />
          <Input placeholder="Rótulo" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="w-32" />
          <Button size="sm" onClick={handleAdd}><Plus className="h-3.5 w-3.5" /></Button>
        </div>
        {isLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-10" />)}</div>
        ) : ips.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Nenhum IP cadastrado — acesso irrestrito.</p>
        ) : (
          <div className="space-y-2">
            {ips.map(ip => (
              <div key={ip.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                <div className="flex items-center gap-3">
                  <Switch checked={ip.is_active} onCheckedChange={active => toggleIP({ id: ip.id, active })} />
                  <div>
                    <IPDisplay ip={ip.ip_address} className="text-sm font-mono" />
                    {ip.label && <p className="text-[10px] text-muted-foreground">{ip.label}</p>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeIP(ip.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
