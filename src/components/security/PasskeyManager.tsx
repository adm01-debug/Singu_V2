import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Key, Plus, Trash2, Fingerprint } from 'lucide-react';
import { useWebAuthn } from '@/hooks/useWebAuthn';

export function PasskeyManager() {
  const { isSupported, credentials, isLoading, isRegistering, register, remove } = useWebAuthn();
  const [label, setLabel] = useState('');

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          <Fingerprint className="h-8 w-8 mx-auto mb-2 opacity-50" />
          WebAuthn não é suportado neste navegador.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" />Passkeys / WebAuthn
        </CardTitle>
        <CardDescription className="text-xs">Faça login com biometria ou chave de segurança</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Nome da passkey (ex: MacBook)"
            value={label}
            onChange={e => setLabel(e.target.value)}
            className="flex-1"
          />
          <Button onClick={() => register(label || undefined)} disabled={isRegistering} size="sm">
            <Plus className="h-3.5 w-3.5 mr-1" />
            {isRegistering ? 'Registrando...' : 'Adicionar'}
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-12" />)}</div>
        ) : credentials.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Nenhuma passkey cadastrada.</p>
        ) : (
          <div className="space-y-2">
            {credentials.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
                <div className="flex items-center gap-2 min-w-0">
                  <Fingerprint className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.label}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(c.id)}>
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
